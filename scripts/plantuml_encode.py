#!/usr/bin/env python3
"""
Local PlantUML encoding utility
Usage: python scripts/plantuml_encode.py <file.puml>
"""

import sys
from pathlib import Path

try:
    from plantuml import deflate_and_encode
except ImportError:
    print("Error: plantuml library not installed!")
    print("Install with: pip install plantuml")
    sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/plantuml_encode.py <file.puml>")
        sys.exit(1)
    
    file_path = Path(sys.argv[1])
    
    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    
    content = file_path.read_text()
    encoded = deflate_and_encode(content)
    
    print(f"\nFile: {file_path.name}")
    print(f"Encoded: {encoded}")
    print(f"\nURLs:")
    print(f"  PNG: http://arch.local/plantuml/png/{encoded}")
    print(f"  SVG: http://arch.local/plantuml/svg/{encoded}")
    print(f"  TXT: http://arch.local/plantuml/txt/{encoded}")

if __name__ == "__main__":
    main()
