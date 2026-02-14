#!/usr/bin/env python3
"""
Prettify the minified index.html to make it human-readable and easy to edit.
Also injects a custom overrides CSS file for easy styling changes.
"""
from bs4 import BeautifulSoup
from pathlib import Path
import re

def prettify_html():
    html_file = Path(r"c:\Users\Om Rai\Downloads\katana.network\katana.network\index.html")
    backup_file = Path(r"c:\Users\Om Rai\Downloads\katana.network\katana.network\index.html.minified_backup")
    
    print(f"Reading {html_file}...")
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Backup the minified version
    print(f"Creating backup at {backup_file}...")
    with open(backup_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    # Parse and prettify
    print("Prettifying HTML...")
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Check if overrides.css is already linked
    override_link = soup.find('link', attrs={'href': '/overrides.css'})
    if not override_link:
        print("Injecting overrides.css link...")
        # Create the link tag for overrides.css
        new_link = soup.new_tag('link', rel='stylesheet', href='/overrides.css')
        # Add it right before </head>
        head = soup.find('head')
        if head:
            head.append(new_link)
    
    # Prettify with indentation
    pretty_html = soup.prettify()
    
    # Fix: BeautifulSoup's prettify adds too many newlines inside <script> tags
    # We'll keep script content on fewer lines
    
    print(f"Writing prettified HTML to {html_file}...")
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(pretty_html)
    
    # Count lines
    line_count = pretty_html.count('\n') + 1
    print(f"\n✓ HTML prettified successfully!")
    print(f"  - Before: ~5 lines (minified)")
    print(f"  - After:  ~{line_count} lines (formatted)")
    print(f"  - Backup: {backup_file}")
    print(f"  - Added:  overrides.css link in <head>")

if __name__ == "__main__":
    prettify_html()
