#!/usr/bin/env python3
"""
empc4_port_check.py

Pre-Flight Port-Check für EMPC4 VIS Stack.
Prüft, ob die konfigurierten Ports verfügbar sind, bevor Container gestartet werden.

Version: 1.0.0

Usage:
    python scripts/empc4_port_check.py [--fix] [--verbose]

Features:
    - Lädt Port-Konfiguration aus .env
    - Prüft Host-Port-Verfügbarkeit
    - Erkennt Port-Konflikte mit laufenden Prozessen
    - Optional: Docker-Integration (zeigt belegende Container)
    - Exit-Code 0 = Alle Ports frei, 1 = Konflikte gefunden

Credits:
    - Basiert auf port_usage_report.py (Home Lab Infra Monitor)
    - Author: Jo Zapf
    - Project: EKMP-C4 Architektur-Visualisierungs Stack
"""

from __future__ import annotations

import argparse
import socket
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    import psutil
except ImportError:
    print("❌ Fehler: psutil ist nicht installiert!")
    print("   Installiere mit: pip install psutil")
    sys.exit(2)

__version__ = "1.0.0"


def get_project_root() -> Path:
    """
    Findet das Projekt-Root-Verzeichnis (dort wo .env liegt).
    """
    script_path = Path(__file__).resolve()
    # Annahme: Script liegt in scripts/ oder project root
    if script_path.parent.name == "scripts":
        return script_path.parent.parent
    return script_path.parent


def load_env_file(env_path: Path) -> Dict[str, str]:
    """
    Lädt .env-Datei und gibt Dictionary zurück.
    Kommentare und leere Zeilen werden ignoriert.
    """
    if not env_path.exists():
        return {}
    
    env_vars = {}
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        
        if "=" in line:
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip()
            # Entferne Quotes falls vorhanden
            if value.startswith('"') and value.endswith('"'):
                value = value[1:-1]
            elif value.startswith("'") and value.endswith("'"):
                value = value[1:-1]
            env_vars[key] = value
    
    return env_vars


def check_port_available(host: str, port: int, timeout: float = 0.5) -> bool:
    """
    Prüft, ob ein TCP-Port verfügbar ist (nicht belegt).
    
    Returns:
        True  = Port ist frei
        False = Port ist belegt
    """
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(timeout)
        try:
            result = sock.connect_ex((host, port))
            return result != 0  # 0 = Verbindung erfolgreich = Port belegt
        except OSError:
            # Konservativ: Bei Fehler nehmen wir an, Port ist nicht sicher frei
            return False


def get_port_process_info(port: int) -> Optional[Dict[str, any]]:
    """
    Findet den Prozess, der einen Port belegt.
    
    Returns:
        Dictionary mit PID, Name, User, Cmdline oder None
    """
    try:
        connections = psutil.net_connections(kind="inet")
        for conn in connections:
            if conn.status != psutil.CONN_LISTEN:
                continue
            
            laddr = conn.laddr
            if laddr.port == port:
                if conn.pid:
                    try:
                        proc = psutil.Process(conn.pid)
                        return {
                            "pid": conn.pid,
                            "name": proc.name(),
                            "user": proc.username(),
                            "cmdline": " ".join(proc.cmdline()),
                            "ip": laddr.ip,
                        }
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        return {
                            "pid": conn.pid,
                            "name": "unknown",
                            "user": "unknown",
                            "cmdline": "",
                            "ip": laddr.ip,
                        }
    except Exception:
        pass
    
    return None


def get_docker_port_owner(port: int) -> Optional[Dict[str, str]]:
    """
    Prüft, ob ein Port von einem Docker-Container belegt ist.
    
    Returns:
        Dictionary mit container_name, container_id, image oder None
    """
    try:
        cmd = [
            "docker", "ps",
            "--format", "{{.Names}}\t{{.ID}}\t{{.Image}}\t{{.Ports}}"
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True,
            timeout=5,
        )
        
        for line in result.stdout.splitlines():
            if not line.strip():
                continue
            
            parts = line.split("\t")
            if len(parts) < 4:
                continue
            
            name, cid, image, ports_str = parts
            
            # Suche nach Port-Mapping wie "0.0.0.0:80->80/tcp"
            if f":{port}->" in ports_str or f":{port}/" in ports_str:
                return {
                    "container_name": name,
                    "container_id": cid[:12],  # Short ID
                    "image": image,
                }
    
    except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
        pass
    
    return None


def suggest_alternative_port(base_port: int, used_ports: set) -> int:
    """
    Schlägt einen alternativen freien Port vor.
    """
    # Versuche Ports in der Nähe (±10)
    for offset in range(1, 20):
        for direction in [1, -1]:
            candidate = base_port + (offset * direction)
            if candidate < 1 or candidate > 65535:
                continue
            if candidate not in used_ports:
                if check_port_available("0.0.0.0", candidate, timeout=0.2):
                    return candidate
    
    # Fallback: 8000-9000 Range
    for candidate in range(8000, 9000):
        if candidate not in used_ports:
            if check_port_available("0.0.0.0", candidate, timeout=0.2):
                return candidate
    
    return 0  # Kein freier Port gefunden


class PortConflict:
    """Repräsentiert einen Port-Konflikt."""
    
    def __init__(
        self,
        port: int,
        service_name: str,
        process_info: Optional[Dict] = None,
        docker_info: Optional[Dict] = None,
    ):
        self.port = port
        self.service_name = service_name
        self.process_info = process_info
        self.docker_info = docker_info


def check_empc4_ports(env_vars: Dict[str, str], verbose: bool = False) -> List[PortConflict]:
    """
    Prüft alle EMPC4-relevanten Ports.
    
    Returns:
        Liste von PortConflict-Objekten (leer = alles OK)
    """
    # Port-Definitionen aus .env
    ports_to_check = {
        "HTTP (Traefik Reverse Proxy)": int(env_vars.get("HTTP_PORT", "80")),
        "Traefik Dashboard": int(env_vars.get("TRAEFIK_DASHBOARD_PORT", "8090")),
    }
    
    conflicts: List[PortConflict] = []
    
    for service_name, port in ports_to_check.items():
        if verbose:
            print(f"[INFO] Prüfe {service_name} (Port {port})...")
        
        if not check_port_available("0.0.0.0", port):
            # Port ist belegt - sammle Informationen
            process_info = get_port_process_info(port)
            docker_info = get_docker_port_owner(port)
            
            conflict = PortConflict(
                port=port,
                service_name=service_name,
                process_info=process_info,
                docker_info=docker_info,
            )
            conflicts.append(conflict)
            
            if verbose:
                print(f"  ⚠️  Port {port} ist belegt!")
        else:
            if verbose:
                print(f"  ✅ Port {port} ist verfügbar")
    
    return conflicts


def print_conflicts(conflicts: List[PortConflict]) -> None:
    """
    Gibt Konflikte formatiert aus.
    """
    print("\n" + "="*70)
    print("⚠️  PORT-KONFLIKTE GEFUNDEN")
    print("="*70 + "\n")
    
    for conflict in conflicts:
        print(f"Service: {conflict.service_name}")
        print(f"Port:    {conflict.port}")
        
        if conflict.docker_info:
            docker = conflict.docker_info
            print(f"Belegt von: Docker-Container")
            print(f"  Container: {docker['container_name']} ({docker['container_id']})")
            print(f"  Image:     {docker['image']}")
        elif conflict.process_info:
            proc = conflict.process_info
            print(f"Belegt von: Prozess")
            print(f"  PID:       {proc['pid']}")
            print(f"  Name:      {proc['name']}")
            print(f"  User:      {proc['user']}")
            if proc['cmdline']:
                # Kürze Command-Line falls sehr lang
                cmdline = proc['cmdline']
                if len(cmdline) > 60:
                    cmdline = cmdline[:57] + "..."
                print(f"  Command:   {cmdline}")
        else:
            print(f"Belegt von: Unbekannt (Permission denied?)")
        
        print()


def suggest_fixes(conflicts: List[PortConflict], env_vars: Dict[str, str]) -> None:
    """
    Schlägt Lösungen für Konflikte vor.
    """
    print("="*70)
    print("🔧 LÖSUNGSVORSCHLÄGE")
    print("="*70 + "\n")
    
    used_ports = {c.port for c in conflicts}
    
    for conflict in conflicts:
        print(f"Problem: {conflict.service_name} (Port {conflict.port})")
        
        # Bestimme .env-Variable
        if "HTTP" in conflict.service_name and "Dashboard" not in conflict.service_name:
            env_var = "HTTP_PORT"
        elif "Traefik Dashboard" in conflict.service_name:
            env_var = "TRAEFIK_DASHBOARD_PORT"
        else:
            env_var = "UNKNOWN"
        
        # Schlage alternativen Port vor
        alt_port = suggest_alternative_port(conflict.port, used_ports)
        
        if alt_port:
            print(f"  Lösung 1: Ändere Port in .env")
            print(f"    {env_var}={alt_port}")
            print()
            used_ports.add(alt_port)  # Für nächsten Vorschlag
        
        if conflict.docker_info:
            print(f"  Lösung 2: Stoppe Docker-Container")
            print(f"    docker stop {conflict.docker_info['container_name']}")
            print()
        elif conflict.process_info:
            print(f"  Lösung 2: Stoppe Prozess")
            print(f"    kill {conflict.process_info['pid']}")
            print(f"    # oder finde und stoppe die Anwendung manuell")
            print()
        
        print()


def main() -> int:
    """
    Main-Funktion.
    
    Returns:
        0 = Erfolg (alle Ports frei)
        1 = Konflikte gefunden
        2 = Fehler (z.B. .env nicht gefunden)
    """
    parser = argparse.ArgumentParser(
        description="Pre-Flight Port-Check für EMPC4 VIS Stack",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Beispiele:
    python scripts/empc4_port_check.py
    python scripts/empc4_port_check.py --verbose
    python scripts/empc4_port_check.py --suggest-fixes
        """
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Zeige ausführliche Ausgabe"
    )
    parser.add_argument(
        "--suggest-fixes",
        action="store_true",
        help="Zeige Lösungsvorschläge bei Konflikten"
    )
    
    args = parser.parse_args()
    
    # Finde Projekt-Root
    project_root = get_project_root()
    env_file = project_root / ".env"
    
    if args.verbose:
        print(f"[INFO] Projekt-Root: {project_root}")
        print(f"[INFO] .env-Datei: {env_file}")
    
    # Prüfe ob .env existiert
    if not env_file.exists():
        print(f"❌ Fehler: .env-Datei nicht gefunden!")
        print(f"   Erwartet in: {env_file}")
        print(f"\nTipp: Kopiere .env.example zu .env:")
        print(f"   cp .env.example .env")
        return 2
    
    # Lade .env
    env_vars = load_env_file(env_file)
    
    if args.verbose:
        print(f"[INFO] Geladene Variablen: {len(env_vars)}")
        print(f"  HTTP_PORT={env_vars.get('HTTP_PORT', 'nicht gesetzt')}")
        print(f"  TRAEFIK_DASHBOARD_PORT={env_vars.get('TRAEFIK_DASHBOARD_PORT', 'nicht gesetzt')}")
        print()
    
    # Prüfe Ports
    print("Prüfe Port-Verfügbarkeit...\n")
    conflicts = check_empc4_ports(env_vars, verbose=args.verbose)
    
    if not conflicts:
        print("="*70)
        print("✅ ALLE PORTS VERFÜGBAR")
        print("="*70)
        print("\nDu kannst jetzt die Container starten:")
        print("  docker compose up -d")
        print()
        return 0
    
    # Konflikte gefunden
    print_conflicts(conflicts)
    
    if args.suggest_fixes:
        suggest_fixes(conflicts, env_vars)
    else:
        print("Tipp: Führe aus mit --suggest-fixes für Lösungsvorschläge")
        print()
    
    return 1


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Abgebrochen durch Benutzer")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Unerwarteter Fehler: {e}")
        sys.exit(1)
