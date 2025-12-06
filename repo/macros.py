"""
MkDocs Macros Plugin - Custom Macros für EKMP-C4

WICHTIG: Macros die auf page.meta zugreifen verursachen Rekursion!
Lösung: Wir verwenden KEINE Macros für Header, sondern nur für File-Operationen.

Verfügbare Macros:
    - file_modified_date(path): Bearbeitungsdatum einer beliebigen Datei
    - file_size(path): Größe einer Datei
"""

import os
from datetime import datetime


def define_env(env):
    """
    MkDocs Macros Plugin Hook
    
    Diese Funktion wird beim Build-Prozess aufgerufen und registriert
    alle Custom-Macros für die Verwendung in Markdown-Dateien.
    """
    
    @env.macro
    def file_modified_date(relative_path, format='%d.%m.%Y'):
        """
        Bearbeitungsdatum einer beliebigen Datei.
        
        Args:
            relative_path (str): Relativer Pfad zur Datei (ab docs/)
            format (str): Datums-Format (Standard: DD.MM.YYYY)
            
        Returns:
            str: Formatiertes Datum oder "Unbekannt"
            
        Beispiel:
            {{ file_modified_date('setup/docker-befehle.md') }}
        """
        try:
            docs_dir = env.conf.get('docs_dir', 'docs')
            file_path = os.path.join(docs_dir, relative_path)
            
            if not os.path.exists(file_path):
                return "Unbekannt"
            
            mtime = os.path.getmtime(file_path)
            return datetime.fromtimestamp(mtime).strftime(format)
            
        except Exception as e:
            return "Unbekannt"
    
    
    @env.macro
    def file_size(relative_path):
        """
        Dateigröße einer beliebigen Datei (in KB).
        
        Args:
            relative_path (str): Relativer Pfad zur Datei (ab docs/)
            
        Returns:
            str: Formatierte Dateigröße oder "Unbekannt"
            
        Beispiel:
            {{ file_size('setup/docker-befehle.md') }}
        """
        try:
            docs_dir = env.conf.get('docs_dir', 'docs')
            file_path = os.path.join(docs_dir, relative_path)
            
            if not os.path.exists(file_path):
                return "Unbekannt"
            
            size_bytes = os.path.getsize(file_path)
            size_kb = size_bytes / 1024
            
            if size_kb < 1:
                return f"{size_bytes} Bytes"
            elif size_kb < 1024:
                return f"{size_kb:.1f} KB"
            else:
                size_mb = size_kb / 1024
                return f"{size_mb:.1f} MB"
                
        except Exception as e:
            return "Unbekannt"
