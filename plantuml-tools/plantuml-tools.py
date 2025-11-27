#!/usr/bin/env python3
"""
PlantUML Tools - Batch processing and encoding utilities
Usage:
    plantuml-tools encode <file>           # Encode PlantUML file for URL
    plantuml-tools render <file> [--out]   # Render diagram to PNG/SVG
    plantuml-tools batch <dir>             # Render all .puml files in directory
"""

import sys
import click
import requests
from pathlib import Path
from plantuml import PlantUML, deflate_and_encode

# PlantUML Server URL (from environment or default)
import os
PLANTUML_URL = os.getenv('PLANTUML_URL', 'http://empc4_plantuml_backend:8080')


@click.group()
def cli():
    """PlantUML command-line tools for EMPC4 VIS Stack"""
    pass


@cli.command()
@click.argument('file', type=click.Path(exists=True))
def encode(file):
    """Encode a PlantUML file for URL usage"""
    content = Path(file).read_text()
    encoded = deflate_and_encode(content)
    
    # PlantUML läuft auf /uml/ Context
    base_url = f"{PLANTUML_URL}/uml"
    
    click.echo(f"\nEncoded string:")
    click.echo(encoded)
    click.echo(f"\nPNG URL:")
    click.echo(f"{base_url}/png/{encoded}")
    click.echo(f"\nSVG URL:")
    click.echo(f"{base_url}/svg/{encoded}")


@cli.command()
@click.argument('file', type=click.Path(exists=True))
@click.option('--format', '-f', default='png', type=click.Choice(['png', 'svg', 'txt']), help='Output format')
@click.option('--out', '-o', type=click.Path(), help='Output file (default: same name with new extension)')
def render(file, format, out):
    """Render a PlantUML diagram"""
    file_path = Path(file)
    content = file_path.read_text()
    
    # Create PlantUML instance with /uml base path
    plantuml = PlantUML(url=f"{PLANTUML_URL}/uml")
    
    # Determine output filename
    if not out:
        out = file_path.with_suffix(f'.{format}')
    else:
        out = Path(out)
    
    click.echo(f"Rendering {file_path.name} → {out.name} ({format})...")
    
    try:
        # Render diagram
        if format == 'txt':
            result = plantuml.get_url(content).replace('/png/', '/txt/')
            response = requests.get(result)
            out.write_text(response.text)
        else:
            result = plantuml.processes_file(str(file_path), outfile=str(out))
            
        click.echo(f"✓ Successfully rendered: {out}")
        
    except Exception as e:
        click.echo(f"✗ Error rendering: {e}", err=True)
        sys.exit(1)


@cli.command()
@click.argument('directory', type=click.Path(exists=True))
@click.option('--format', '-f', default='png', type=click.Choice(['png', 'svg']), help='Output format')
@click.option('--out-dir', '-o', type=click.Path(), help='Output directory (default: same as input)')
@click.option('--recursive', '-r', is_flag=True, help='Process subdirectories')
def batch(directory, format, out_dir, recursive):
    """Render all .puml files in a directory"""
    dir_path = Path(directory)
    
    if not out_dir:
        out_dir = dir_path
    else:
        out_dir = Path(out_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
    
    # Find all .puml files
    pattern = '**/*.puml' if recursive else '*.puml'
    puml_files = list(dir_path.glob(pattern))
    
    if not puml_files:
        click.echo(f"No .puml files found in {directory}")
        return
    
    click.echo(f"Found {len(puml_files)} PlantUML file(s)")
    
    plantuml = PlantUML(url=f"{PLANTUML_URL}/uml")
    success = 0
    failed = 0
    
    for puml_file in puml_files:
        try:
            # Determine output path
            rel_path = puml_file.relative_to(dir_path)
            out_file = out_dir / rel_path.with_suffix(f'.{format}')
            out_file.parent.mkdir(parents=True, exist_ok=True)
            
            click.echo(f"  {puml_file.name} → {out_file.name}...", nl=False)
            
            # Render
            plantuml.processes_file(str(puml_file), outfile=str(out_file))
            
            click.echo(" ✓")
            success += 1
            
        except Exception as e:
            click.echo(f" ✗ Error: {e}")
            failed += 1
    
    click.echo(f"\nCompleted: {success} successful, {failed} failed")


@cli.command()
def test():
    """Test connection to PlantUML server"""
    click.echo(f"Testing connection to {PLANTUML_URL}...")
    
    try:
        # PlantUML läuft auf /uml/ Context, teste mit einem einfachen Diagramm
        # Nutze den /uml/png/ Endpoint mit einem minimalen encoded Diagramm
        test_url = f"{PLANTUML_URL}/uml/png/SyfFKj2rKt3CoKnELR1Io4ZDoSa70000"
        response = requests.get(test_url, timeout=5)
        if response.status_code == 200:
            click.echo("✓ PlantUML server is reachable")
            click.echo(f"  Status: {response.status_code}")
            click.echo(f"  Content-Type: {response.headers.get('Content-Type')}")
            click.echo(f"  Image size: {len(response.content)} bytes")
        else:
            click.echo(f"✗ Server returned status {response.status_code}", err=True)
            sys.exit(1)
    except Exception as e:
        click.echo(f"✗ Connection failed: {e}", err=True)
        sys.exit(1)


if __name__ == '__main__':
    cli()
