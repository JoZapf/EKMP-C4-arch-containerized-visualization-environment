#!/usr/bin/env python3
"""
PlantUML Real-Time Collaboration Server
Synchronizes PlantUML diagram text between multiple clients via WebSocket
"""

import eventlet
eventlet.monkey_patch()  # Muss VOR allen anderen Imports stehen - patcht stdlib fuer async WebSocket

from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room, leave_room
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
    engineio_logger=False,  # Too verbose
    # Alle Namespaces akzeptieren - sync.js nutzt /plantuml-sync als Namespace
    namespaces='*'
)

# Store diagram state per room
# Structure: {room_id: {'text': str, 'users': set}}
rooms_data = {}

@app.route('/health', methods=['GET', 'HEAD'])
def health():
    """Health check endpoint for Docker (supports GET & HEAD)"""
    return {
        'status': 'ok',
        'active_rooms': len(rooms_data),
        'total_users': sum(len(room['users']) for room in rooms_data.values())
    }, 200

@app.route('/ping', methods=['GET', 'HEAD'])
def ping():
    """Ping endpoint for Traefik health checks"""
    return 'pong', 200

@app.route('/')
def index():
    """Basic info endpoint"""
    return {
        'service': 'PlantUML Collaboration Server',
        'version': '1.0.0',
        'status': 'running'
    }, 200

@socketio.on('connect')
def handle_connect():
    """Client connected"""
    logger.info(f"Client connected: {request.sid}")
    emit('connected', {'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    """Client disconnected - cleanup rooms"""
    logger.info(f"Client disconnected: {request.sid}")
    
    # Remove user from all rooms
    for room_id, room_data in list(rooms_data.items()):
        if request.sid in room_data.get('users', set()):
            room_data['users'].discard(request.sid)
            logger.info(f"Removed {request.sid} from room {room_id}")
            
            # Notify others
            emit('user_left', {'sid': request.sid}, room=room_id)
            
            # Cleanup empty rooms
            if len(room_data['users']) == 0:
                del rooms_data[room_id]
                logger.info(f"Removed empty room: {room_id}")

@socketio.on('join')
def handle_join(data):
    """
    Client joins a collaboration room
    data = {'room': 'room-id'}
    """
    room = data.get('room', 'default')
    join_room(room)
    
    # Initialize room if needed
    if room not in rooms_data:
        rooms_data[room] = {'text': '', 'users': set()}
    
    # Add user to room
    rooms_data[room]['users'].add(request.sid)
    
    logger.info(f"Client {request.sid} joined room: {room} (total users: {len(rooms_data[room]['users'])})")
    
    # Send current diagram state if available
    if rooms_data[room]['text']:
        emit('diagram_update', {
            'text': rooms_data[room]['text'],
            'cursor': None
        })
        logger.debug(f"Sent current state to {request.sid}: {len(rooms_data[room]['text'])} chars")
    
    # Notify others in room
    emit('user_joined', {
        'sid': request.sid,
        'users_count': len(rooms_data[room]['users'])
    }, room=room, skip_sid=request.sid)

@socketio.on('leave')
def handle_leave(data):
    """Client leaves a collaboration room"""
    room = data.get('room', 'default')
    leave_room(room)
    
    # Remove user from room
    if room in rooms_data:
        rooms_data[room]['users'].discard(request.sid)
        users_remaining = len(rooms_data[room]['users'])
        
        logger.info(f"Client {request.sid} left room: {room} ({users_remaining} users remaining)")
        
        # Notify others
        emit('user_left', {
            'sid': request.sid,
            'users_count': users_remaining
        }, room=room)
        
        # Cleanup empty room
        if users_remaining == 0:
            del rooms_data[room]
            logger.info(f"Removed empty room: {room}")

@socketio.on('diagram_update')
def handle_diagram_update(data):
    """
    Client sends diagram update
    data = {
        'room': 'room-id',
        'text': 'PlantUML code',
        'cursor': 123  # Optional cursor position
    }
    """
    room = data.get('room', 'default')
    text = data.get('text', '')
    cursor = data.get('cursor')
    
    # Store state
    if room not in rooms_data:
        rooms_data[room] = {'text': '', 'users': set()}
    
    rooms_data[room]['text'] = text
    
    logger.debug(f"Room {room} update from {request.sid}: {len(text)} chars")
    
    # Broadcast to all clients in room except sender
    emit('diagram_update', {
        'text': text,
        'cursor': cursor,
        'from_sid': request.sid
    }, room=room, skip_sid=request.sid)

@socketio.on('cursor_update')
def handle_cursor_update(data):
    """
    Client sends cursor position (for future multi-cursor feature)
    data = {'room': 'room-id', 'cursor': 123}
    """
    room = data.get('room', 'default')
    cursor = data.get('cursor')
    
    # Broadcast cursor position to others
    emit('cursor_update', {
        'cursor': cursor,
        'from_sid': request.sid
    }, room=room, skip_sid=request.sid)

@socketio.on_error_default
def default_error_handler(e):
    """Default error handler"""
    logger.error(f"WebSocket error: {e}", exc_info=True)
    emit('error', {'message': 'Internal server error'})

if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("PlantUML Collaboration Server")
    logger.info("=" * 60)
    logger.info("Starting on 0.0.0.0:5001")
    logger.info("CORS: Enabled (all origins)")
    logger.info("Transport: WebSocket + Polling")
    logger.info("=" * 60)
    
    socketio.run(
        app,
        host='0.0.0.0',
        port=5001,
        debug=False,
        use_reloader=False,
        log_output=True
    )
