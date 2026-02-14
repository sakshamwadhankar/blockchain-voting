#!/usr/bin/env python3
"""
Script to remove all navigation items except 'enter the app' button from katana.network
"""
import re
from pathlib import Path

def clean_navigation(html_content):
    """Remove navigation items except 'enter the app' button"""
    
    # Pattern to match the entire nav section with all its links
    # We'll keep only the "enter the app" button
    
    # Remove the social media icons (X/Twitter and Discord) from the nav
    html_content = re.sub(
        r'<a href="https://x\.com/katana"[^>]*>.*?</a>',
        '',
        html_content,
        flags=re.DOTALL
    )
    
    html_content = re.sub(
        r'<a href="https://discord\.gg/katananetwork"[^>]*class="iconLink_iconLink__K8Cxz iconLink_discord__YuPjy[^>]*>.*?</a>',
        '',
        html_content,
        flags=re.DOTALL
    )
    
    return html_content

def main():
    # File paths
    html_file = Path(r"c:\Users\Om Rai\Downloads\katana.network\katana.network\index.html")
    backup_file = Path(r"c:\Users\Om Rai\Downloads\katana.network\katana.network\index.html.nav_backup")
    
    # Read the HTML file
    print(f"Reading {html_file}...")
    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Create backup
    print(f"Creating backup at {backup_file}...")
    with open(backup_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    # Clean the navigation
    print("Cleaning navigation...")
    cleaned_html = clean_navigation(html_content)
    
    # Write the cleaned HTML
    print(f"Writing cleaned HTML to {html_file}...")
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(cleaned_html)
    
    print("✓ Navigation cleaned successfully!")
    print("  - Removed social media icons")
    print("  - Kept 'enter the app' button")
    print(f"  - Backup saved to: {backup_file}")

if __name__ == "__main__":
    main()
