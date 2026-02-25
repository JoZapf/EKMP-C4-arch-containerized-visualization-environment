#!/usr/bin/env python3
"""
PlantUML Real-Time Collaboration Server
Synchronizes PlantUML diagram text between multiple clients via WebSocket
"""

import eventlet
eventlet.monkey_patch()  # Muss VOR allen anderen Imports stehen - patcht stdlib fuer async WebSocket

from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room, Namespace
import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config['SECRET_KEY'] = 'plantuml-collab-secret-2026'
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='eventlet',
    logger=True,
    engineio_logger=False  # Too verbose
)

# Store diagram state per room
# Structure: {room_id: {'text': str, 'users': set}}
rooms_data = {}


# ============================================================================
# Shared handler logic (used by both namespaces)
# ============================================================================

def _on_connect():
    logger.info(f"Client connected: {request.sid}")
    emit('connected', {'sid': request.sid})

def _on_disconnect():
    logger.info(f"Client disconnected: {request.sid}")
    for room_id, room_data in list(rooms_data.items()):
        if request.sid in room_data.get('users', set()):
            room_data['users'].discard(request.sid)
            logger.info(f"Removed {request.sid} from room {room_id}")
            emit('user_left', {'sid': request.sid}, room=room_id)
            if len(room_data['users']) == 0:
                del rooms_data[room_id]
                logger.info(f"Removed empty room: {room_id}")

def _on_join(data):
    room = data.get('room', 'default')
    join_room(room)
    if room not in rooms_data:
        rooms_data[room] = {'text': '', 'users': set()}
    rooms_data[room]['users'].add(request.sid)
    logger.info(f"Client {request.sid} joined room: {room} ({len(rooms_data[room]['users'])} users)")
    if rooms_data[room]['text']:
        emit('diagram_update', {'text': rooms_data[room]['text'], 'cursor': None})
    emit('user_joined', {
        'sid': request.sid,
        'users_count': len(rooms_data[room]['users'])
    }, room=room, skip_sid=request.sid)

def _on_leave(data):
    room = data.get('room', 'default')
    leave_room(room)
    if room in rooms_data:
        rooms_data[room]['users'].discard(request.sid)
        users_remaining = len(rooms_data[room]['users'])
        logger.info(f"Client {request.sid} left room: {room} ({users_remaining} users remaining)")
        emit('user_left', {'sid': request.sid, 'users_count': users_remaining}, room=room)
        if users_remaining == 0:
            del rooms_data[room]
            logger.info(f"Removed empty room: {room}")

def _on_diagram_update(data):
    room = data.get('room', 'default')
    text = data.get('text', '')
    cursor = data.get('cursor')
    if room not in rooms_data:
        rooms_data[room] = {'text': '', 'users': set()}
    rooms_data[room]['text'] = text
    logger.info(f"Room {room} update from {request.sid}: {len(text)} chars")
    emit('diagram_update', {
        'text': text,
        'cursor': cursor,
        'from_sid': request.sid
    }, room=room, skip_sid=request.sid)

def _on_cursor_update(data):
    room = data.get('room', 'default')
    cursor = data.get('cursor')
    emit('cursor_update', {'cursor': cursor, 'from_sid': request.sid}, room=room, skip_sid=request.sid)


# ============================================================================
# Default namespace /
# ============================================================================

@socketio.on('connect')
def handle_connect():
    _on_connect()

@socketio.on('disconnect')
def handle_disconnect():
    _on_disconnect()

@socketio.on('join')
def handle_join(data):
    _on_join(data)

@socketio.on('leave')
def handle_leave(data):
    _on_leave(data)

@socketio.on('diagram_update')
def handle_diagram_update(data):
    _on_diagram_update(data)

@socketio.on('cursor_update')
def handle_cursor_update(data):
    _on_cursor_update(data)


# ============================================================================
# /plantuml-sync namespace - sync.js verbindet hierher
# ============================================================================

class PlantUMLSyncNamespace(Namespace):
    def on_connect(self):
        logger.info(f"[/plantuml-sync] Client connected: {request.sid}")
        # Sofort in Room joinen basierend auf aktuellem State
        # sync.js sendet 'join' nach 'connected' Event - aber falls das nicht kommt,
        # auto-join als Fallback (Room wird spaeter durch diagram_update korrekt gesetzt)
        emit('connected', {'sid': request.sid})

    def on_disconnect(self):
        logger.info(f"[/plantuml-sync] Client disconnected: {request.sid}")
        _on_disconnect()

    def on_join(self, data):
        logger.info(f"[/plantuml-sync] Join from {request.sid}: {data}")
        room = data.get('room', 'default')
        join_room(room)
        if room not in rooms_data:
            rooms_data[room] = {'text': '', 'users': set()}
        rooms_data[room]['users'].add(request.sid)
        logger.info(f"[/plantuml-sync] {request.sid} joined room '{room}' ({len(rooms_data[room]['users'])} users)")
        if rooms_data[room]['text']:
            self.emit('diagram_update', {'text': rooms_data[room]['text'], 'cursor': None})
        self.emit('user_joined', {
            'sid': request.sid,
            'users_count': len(rooms_data[room]['users'])
        }, room=room, skip_sid=request.sid)

    def on_leave(self, data):
        _on_leave(data)

    def on_diagram_update(self, data):
        room = data.get('room', 'default')
        text = data.get('text', '')
        cursor = data.get('cursor')
        # Auto-join falls Client keinen join gesendet hat
        if room not in rooms_data:
            rooms_data[room] = {'text': '', 'users': set()}
        if request.sid not in rooms_data[room]['users']:
            logger.warning(f"[/plantuml-sync] Auto-join {request.sid} into room '{room}' (missed join event)")
            join_room(room)
            rooms_data[room]['users'].add(request.sid)
        rooms_data[room]['text'] = text
        logger.info(f"[/plantuml-sync] diagram_update from {request.sid} in room '{room}': {len(text)} chars, {len(rooms_data[room]['users'])} users")
        self.emit('diagram_update', {
            'text': text,
            'cursor': cursor,
            'from_sid': request.sid
        }, room=room, skip_sid=request.sid)

    def on_cursor_update(self, data):
        room = data.get('room', 'default')
        cursor = data.get('cursor')
        self.emit('cursor_update', {'cursor': cursor, 'from_sid': request.sid}, room=room, skip_sid=request.sid)

socketio.on_namespace(PlantUMLSyncNamespace('/plantuml-sync'))


# ============================================================================
# HTTP Endpoints
# ============================================================================

@app.route('/health', methods=['GET', 'HEAD'])
def health():
    return {
        'status': 'ok',
        'active_rooms': len(rooms_data),
        'total_users': sum(len(room['users']) for room in rooms_data.values())
    }, 200

@app.route('/ping', methods=['GET', 'HEAD'])
def ping():
    return 'pong', 200

@app.route('/')
def index():
    return {
        'service': 'PlantUML Collaboration Server',
        'version': '1.0.0',
        'status': 'running'
    }, 200


# ============================================================================
# Error handler
# ============================================================================

@socketio.on_error_default
def default_error_handler(e):
    logger.error(f"WebSocket error: {e}", exc_info=True)
    emit('error', {'message': 'Internal server error'})


if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("PlantUML Collaboration Server")
    logger.info("=" * 60)
    logger.info("Starting on 0.0.0.0:5001")
    logger.info("CORS: Enabled (all origins)")
    logger.info("Transport: WebSocket + Polling")
    logger.info("Namespaces: / and /plantuml-sync")
    logger.info("=" * 60)

    socketio.run(
        app,
        host='0.0.0.0',
        port=5001,
        debug=False,
        use_reloader=False,
        log_output=True
    )
