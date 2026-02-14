#!/usr/bin/env python3
"""
Localize katana.network site - Download all external assets and update references.
This script handles:
1. Google Fonts woff2 files (from fonts.gstatic.com)
2. MP4 video files (from katana.network CDN)
3. Storyblok CDN images (from a.storyblok.com)
4. _next/image optimized images
5. Google Fonts CSS (update to local font paths)
6. Update index.html references
7. API/turtle.xyz endpoints
"""

import os
import re
import sys
import hashlib
import subprocess
import urllib.parse
from pathlib import Path

# === CONFIGURATION ===
BASE_DIR = Path(r"c:\Users\Om Rai\Downloads\katana.network\katana.network")
SITE_ASSETS_DIR = BASE_DIR / "site_assets"
FONTS_DIR = SITE_ASSETS_DIR / "fonts"
IMAGES_DIR = SITE_ASSETS_DIR / "images"
VIDEOS_DIR = SITE_ASSETS_DIR / "videos"
GOOGLE_FONTS_CSS_DIR = Path(r"c:\Users\Om Rai\Downloads\katana.network\fonts.googleapis.com")

def ensure_dirs():
    """Create asset directories if they don't exist."""
    for d in [SITE_ASSETS_DIR, FONTS_DIR, IMAGES_DIR, VIDEOS_DIR]:
        d.mkdir(parents=True, exist_ok=True)
    print(f"[OK] Asset directories created")

def download_file(url, dest_path, desc=""):
    """Download a file using curl. Returns True on success."""
    dest_path = Path(dest_path)
    dest_path.parent.mkdir(parents=True, exist_ok=True)

    if dest_path.exists() and dest_path.stat().st_size > 200:
        print(f"  [SKIP] Already exists: {dest_path.name} ({dest_path.stat().st_size} bytes)")
        return True

    print(f"  [DL] {desc or url[:80]}...")
    try:
        result = subprocess.run(
            ["curl", "-L", "-s", "-o", str(dest_path),
             "-H", "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
             "--connect-timeout", "15",
             "--max-time", "60",
             url],
            capture_output=True, text=True, timeout=90
        )
        if dest_path.exists() and dest_path.stat().st_size > 0:
            print(f"  [OK] Downloaded: {dest_path.name} ({dest_path.stat().st_size} bytes)")
            return True
        else:
            print(f"  [FAIL] Download failed or empty: {dest_path.name}")
            return False
    except Exception as e:
        print(f"  [ERROR] {e}")
        return False


def step1_download_google_fonts():
    """Download woff2 font files from Google Fonts and update CSS."""
    print("\n" + "="*60)
    print("STEP 1: Downloading Google Fonts (woff2 files)")
    print("="*60)

    css_files = list(GOOGLE_FONTS_CSS_DIR.glob("*.css"))
    font_urls = set()

    for css_file in css_files:
        content = css_file.read_text(encoding="utf-8")
        urls = re.findall(r'url\((https://fonts\.gstatic\.com/[^)]+)\)', content)
        font_urls.update(urls)

    print(f"Found {len(font_urls)} unique font URLs across {len(css_files)} CSS files")

    downloaded = {}
    for url in sorted(font_urls):
        # Create filename from URL
        url_path = urllib.parse.urlparse(url).path
        filename = url_path.split("/")[-1]
        dest = FONTS_DIR / filename
        if download_file(url, dest, f"Font: {filename}"):
            downloaded[url] = filename

    # Update CSS files to use local paths
    print("\nUpdating CSS files to use local font paths...")
    for css_file in css_files:
        content = css_file.read_text(encoding="utf-8")
        modified = content
        for url, filename in downloaded.items():
            local_path = f"/site_assets/fonts/{filename}"
            modified = modified.replace(url, local_path)
        if modified != content:
            css_file.write_text(modified, encoding="utf-8")
            print(f"  [OK] Updated: {css_file.name}")

    return downloaded


def step2_download_videos():
    """Download MP4 video files from katana.network."""
    print("\n" + "="*60)
    print("STEP 2: Downloading video files")
    print("="*60)

    video_files = [
        "feature-ausd.mp4",
        "feature-col.mp4",
        "feature-core-apps.mp4",
        "feature-vaultbridge.mp4",
        "feature-vbtokens.mp4",
    ]

    videos_dir = BASE_DIR / "assets" / "videos"
    for vf in video_files:
        url = f"https://katana.network/assets/videos/{vf}"
        dest = videos_dir / vf
        # Force re-download since existing files are stubs
        if dest.exists() and dest.stat().st_size < 200:
            dest.unlink()
        download_file(url, dest, f"Video: {vf}")


def step3_download_storyblok_images():
    """Download Storyblok CDN images referenced in index.html."""
    print("\n" + "="*60)
    print("STEP 3: Downloading Storyblok images")
    print("="*60)

    html_file = BASE_DIR / "index.html"
    content = html_file.read_text(encoding="utf-8", errors="replace")

    # Find all storyblok URLs in the HTML
    storyblok_urls = set()

    # Direct storyblok URLs (e.g., in og:image meta tags)
    direct_urls = re.findall(r'https?://a\.storyblok\.com/f/[^\s"\'&<>]+', content)
    storyblok_urls.update(direct_urls)

    # URL-encoded storyblok URLs (from _next/image srcSet/src)
    encoded_urls = re.findall(r'https%3A%2F%2Fa\.storyblok\.com%2Ff%2F[^&"\s]+', content)
    for eu in encoded_urls:
        decoded = urllib.parse.unquote(eu)
        storyblok_urls.add(decoded)

    print(f"Found {len(storyblok_urls)} unique Storyblok image URLs")

    downloaded_map = {}
    for url in sorted(storyblok_urls):
        # Create a clean filename from the URL path
        url_path = urllib.parse.urlparse(url).path
        # e.g. /f/330094/240x240/5a2eb0f02a/morpho.png
        parts = url_path.strip("/").split("/")
        if len(parts) >= 5:
            filename = f"storyblok_{parts[2]}_{parts[4]}"  # e.g. storyblok_240x240_morpho.png
        else:
            filename = "storyblok_" + hashlib.md5(url.encode()).hexdigest()[:8] + ".png"

        dest = IMAGES_DIR / filename
        if download_file(url, dest, f"Storyblok: {filename}"):
            downloaded_map[url] = filename

    return downloaded_map


def step4_download_next_images():
    """Download _next/image optimized images."""
    print("\n" + "="*60)
    print("STEP 4: Downloading _next/image optimized images")
    print("="*60)

    html_file = BASE_DIR / "index.html"
    content = html_file.read_text(encoding="utf-8", errors="replace")

    # Find all /_next/image URLs
    next_image_urls = re.findall(r'/_next/image\?[^"\'<>\s]+', content)
    print(f"Found {len(next_image_urls)} _next/image references")

    downloaded_map = {}
    for img_ref in sorted(set(next_image_urls)):
        # Parse the URL parameters to get the original image URL
        parsed = urllib.parse.urlparse(img_ref)
        params = urllib.parse.parse_qs(parsed.query)
        original_url = params.get("url", [""])[0]
        width = params.get("w", ["0"])[0]
        quality = params.get("q", ["75"])[0]

        if not original_url:
            continue

        # Decode if needed
        original_url_decoded = urllib.parse.unquote(original_url)

        # Create a filename
        url_parts = original_url_decoded.strip("/").split("/")
        if "a.storyblok.com" in original_url_decoded and len(url_parts) >= 5:
            base_name = url_parts[-1]
            size_info = url_parts[-3] if len(url_parts) >= 3 else ""
            filename = f"next_img_{size_info}_{base_name}".replace("/", "_")
        else:
            filename = f"next_img_{hashlib.md5(img_ref.encode()).hexdigest()[:12]}.webp"

        # Add size suffix
        filename_base, filename_ext = os.path.splitext(filename)
        filename = f"{filename_base}_w{width}{filename_ext}"

        dest = IMAGES_DIR / filename

        # Build the full _next/image URL for downloading
        full_url = f"https://katana.network{img_ref}"
        if download_file(full_url, dest, f"NextImage: {filename}"):
            downloaded_map[img_ref] = f"/site_assets/images/{filename}"

    return downloaded_map


def step5_download_webp_images():
    """Download the _next image webp files (the 3 images in _next dir)."""
    print("\n" + "="*60)
    print("STEP 5: Checking _next/image webp files")
    print("="*60)

    next_dir = BASE_DIR / "_next"
    webp_files = list(next_dir.glob("*.webp"))
    for wf in webp_files:
        if wf.stat().st_size < 200:
            url = f"https://katana.network/_next/{wf.name}"
            wf.unlink()
            download_file(url, wf, f"WebP: {wf.name}")
        else:
            print(f"  [OK] Already valid: {wf.name} ({wf.stat().st_size} bytes)")


def step6_download_api_data():
    """Download API data that the site might need."""
    print("\n" + "="*60)
    print("STEP 6: Downloading API data")
    print("="*60)

    api_dir = Path(r"c:\Users\Om Rai\Downloads\katana.network\api.turtle.xyz")
    api_dir.mkdir(parents=True, exist_ok=True)

    # The turtle.xyz API endpoint for TVL/stats
    api_urls = {
        "api_turtle.json": "https://api.turtle.xyz/v1/katana/tvl",
    }

    for filename, url in api_urls.items():
        dest = api_dir / filename
        download_file(url, dest, f"API: {filename}")


def step7_download_missing_assets():
    """Download any other missing or stub files."""
    print("\n" + "="*60)
    print("STEP 7: Downloading other missing assets")
    print("="*60)

    # Check for missing favicon files
    meta_dir = BASE_DIR / "meta"
    missing_meta = {
        "favicon-96x96.png": "https://katana.network/meta/favicon-96x96.png",
        "apple-touch-icon.png": "https://katana.network/meta/apple-touch-icon.png",
    }

    for filename, url in missing_meta.items():
        dest = meta_dir / filename
        download_file(url, dest, f"Meta: {filename}")

    # HDRI environment file
    hdri_dir = BASE_DIR / "assets" / "hdri"
    hdri_files = list(hdri_dir.glob("*")) if hdri_dir.exists() else []
    for hf in hdri_files:
        if hf.stat().st_size < 200:
            url = f"https://katana.network/assets/hdri/{hf.name}"
            hf.unlink()
            download_file(url, hf, f"HDRI: {hf.name}")

    # Texture files
    tex_dir = BASE_DIR / "assets" / "textures"
    if tex_dir.exists():
        for tf in tex_dir.rglob("*"):
            if tf.is_file() and tf.stat().st_size < 200:
                rel = tf.relative_to(BASE_DIR)
                url = f"https://katana.network/{str(rel).replace(chr(92), '/')}"
                tf.unlink()
                download_file(url, tf, f"Texture: {tf.name}")

    # Stickers
    sticker_dir = BASE_DIR / "assets" / "stickers"
    if sticker_dir.exists():
        for sf in sticker_dir.rglob("*"):
            if sf.is_file() and sf.stat().st_size < 200:
                rel = sf.relative_to(BASE_DIR)
                url = f"https://katana.network/{str(rel).replace(chr(92), '/')}"
                sf.unlink()
                download_file(url, sf, f"Sticker: {sf.name}")

    # GLB model files - check if any are stubs
    models_dir = BASE_DIR / "assets" / "models"
    if models_dir.exists():
        for mf in models_dir.glob("*.glb"):
            if mf.stat().st_size < 200:
                url = f"https://katana.network/assets/models/{mf.name}"
                mf.unlink()
                download_file(url, mf, f"Model: {mf.name}")


def step8_update_html():
    """Update index.html to reference local assets."""
    print("\n" + "="*60)
    print("STEP 8: Updating index.html references")
    print("="*60)

    html_file = BASE_DIR / "index.html"
    content = html_file.read_text(encoding="utf-8", errors="replace")
    original = content

    # 1. Update Google Fonts CSS references
    # Change https://fonts.googleapis.com/css2?... to local CSS files
    # The CSS files are already downloaded - we just need the HTML to load them
    # The href in HTML uses the full Google URL, but wget already saved them locally
    # We need to update these to point to local paths

    # Find Google Fonts links in HTML
    gf_pattern = r'href="https://fonts\.googleapis\.com/css2[^"]*"'
    gf_matches = re.findall(gf_pattern, content)
    print(f"  Found {len(gf_matches)} Google Fonts CSS references")

    # Map Google Fonts CSS to local files
    css_files = sorted(GOOGLE_FONTS_CSS_DIR.glob("*.css"))
    for i, match in enumerate(gf_matches):
        if i < len(css_files):
            local_css = f'/fonts.googleapis.com/{css_files[i].name}'
            # Note: We need paths relative to the serving root
            # Since the files are served from katana.network dir, we go up one level
            # Actually since wget preserved directory structure, we use relative paths
            new_href = f'href="{local_css}"'
            content = content.replace(match, new_href, 1)
            print(f"  [OK] Replaced Google Font CSS #{i+1}")

    # 2. Remove Google Tag Manager / Analytics preloads (won't work offline)
    content = re.sub(
        r'<link rel="preload" href="https://www\.googletagmanager\.com/[^"]*"[^/]*/?>',
        '<!-- GTM removed for offline -->',
        content
    )
    print("  [OK] Removed Google Tag Manager preload")

    # 3. Update _next/image references to local downloaded images
    # Find all _next/image references and replace with local storyblok images
    # For the srcSet and src attributes with _next/image
    next_img_pattern = r'(srcSet|src)="(/_next/image\?[^"]+)"'
    next_img_matches = re.findall(next_img_pattern, content)
    print(f"  Found {len(next_img_matches)} _next/image references in HTML")

    # For these, we need to replace with locally downloaded storyblok images
    # Build a map of original storyblok URLs to local files
    storyblok_local_files = {}
    if IMAGES_DIR.exists():
        for img_file in IMAGES_DIR.glob("storyblok_*"):
            storyblok_local_files[img_file.stem] = img_file.name

    # Replace _next/image URLs with direct storyblok image references
    def replace_next_image(match_obj):
        attr = match_obj.group(1)
        full_url = match_obj.group(2)

        # Parse to get original storyblok URL
        parsed = urllib.parse.urlparse(full_url)
        params = urllib.parse.parse_qs(parsed.query)
        original_url = params.get("url", [""])[0]

        if not original_url:
            return match_obj.group(0)

        original_url_decoded = urllib.parse.unquote(original_url)

        # Try to find a matching local file
        if "a.storyblok.com" in original_url_decoded:
            url_parts = original_url_decoded.strip("/").split("/")
            if len(url_parts) >= 5:
                size_info = url_parts[-3] if len(url_parts) >= 3 else ""
                base_name = url_parts[-1]
                # Look for matching downloaded file
                for local_file in IMAGES_DIR.glob(f"storyblok_{size_info}_{base_name}*"):
                    local_path = f"/site_assets/images/{local_file.name}"
                    return f'{attr}="{local_path}"'

                # Try next_img files
                for local_file in IMAGES_DIR.glob(f"next_img_{size_info}_{base_name}*"):
                    local_path = f"/site_assets/images/{local_file.name}"
                    return f'{attr}="{local_path}"'

        return match_obj.group(0)

    content = re.sub(next_img_pattern, replace_next_image, content)

    # Also handle srcSet with multiple entries (space-separated)
    # srcSet="url1 1x, url2 2x"
    srcset_pattern = r'srcSet="([^"]+)"'
    def replace_srcset(match_obj):
        srcset_val = match_obj.group(1)
        entries = srcset_val.split(", ")
        new_entries = []
        for entry in entries:
            parts = entry.strip().split(" ")
            if len(parts) >= 2 and "/_next/image" in parts[0]:
                url_part = parts[0]
                descriptor = parts[1]
                parsed = urllib.parse.urlparse(url_part)
                params = urllib.parse.parse_qs(parsed.query)
                original_url = urllib.parse.unquote(params.get("url", [""])[0])
                width = params.get("w", ["0"])[0]

                if "a.storyblok.com" in original_url:
                    url_parts = original_url.strip("/").split("/")
                    if len(url_parts) >= 5:
                        size_info = url_parts[-3]
                        base_name = url_parts[-1]
                        found = False
                        for local_file in IMAGES_DIR.glob(f"next_img_{size_info}_{base_name}_w{width}*"):
                            new_entries.append(f"/site_assets/images/{local_file.name} {descriptor}")
                            found = True
                            break
                        if not found:
                            for local_file in IMAGES_DIR.glob(f"storyblok_{size_info}_{base_name}"):
                                new_entries.append(f"/site_assets/images/{local_file.name} {descriptor}")
                                found = True
                                break
                        if not found:
                            new_entries.append(entry)
                    else:
                        new_entries.append(entry)
                else:
                    new_entries.append(entry)
            else:
                new_entries.append(entry)
        return f'srcSet="{", ".join(new_entries)}"'

    content = re.sub(srcset_pattern, replace_srcset, content)

    # 4. Update the og:image and twitter:image to local
    content = re.sub(
        r'content="https://a\.storyblok\.com/f/330094/[^"]*"',
        lambda m: m.group(0),  # Keep as-is for meta tags (they're for social sharing, not display)
        content
    )

    # 5. Fix the polyfills script that has ?dpl= query params
    # Remove query params from local CSS/JS references since we have the files locally
    # The files were saved without query params by wget
    content = re.sub(
        r'(href|src)="(/_next/static/[^"?]+)\?[^"]*"',
        r'\1="\2"',
        content
    )
    print("  [OK] Cleaned up query parameters from _next/static references")

    # 6. Handle the favicon.ico reference
    # The HTML references /favicon.ico but it might be in /meta/
    if not (BASE_DIR / "favicon.ico").exists() and (BASE_DIR / "meta" / "favicon.ico").exists():
        import shutil
        shutil.copy2(str(BASE_DIR / "meta" / "favicon.ico"), str(BASE_DIR / "favicon.ico"))
        print("  [OK] Copied favicon.ico to root")

    # Save the updated HTML
    if content != original:
        # Backup original
        backup = BASE_DIR / "index.html.bak"
        if not backup.exists():
            html_file.rename(backup)
            Path(str(html_file)).write_text(content, encoding="utf-8")
            print(f"\n  [OK] Saved updated index.html (backup at index.html.bak)")
        else:
            html_file.write_text(content, encoding="utf-8")
            print(f"\n  [OK] Saved updated index.html")
    else:
        print("\n  [INFO] No HTML changes needed")


def step9_update_css_for_local_fonts():
    """Make sure the Next.js CSS files that reference Google Fonts are updated."""
    print("\n" + "="*60)
    print("STEP 9: Checking Next.js CSS for external references")
    print("="*60)

    css_dir = BASE_DIR / "_next" / "static" / "css"
    if not css_dir.exists():
        print("  [SKIP] No _next/static/css directory")
        return

    for css_file in css_dir.glob("*.css"):
        content = css_file.read_text(encoding="utf-8", errors="replace")
        if "fonts.googleapis.com" in content or "fonts.gstatic.com" in content:
            print(f"  [WARN] {css_file.name} has external font references")
            # Replace gstatic URLs with local paths
            modified = re.sub(
                r'url\(https://fonts\.gstatic\.com/s/[^)]+/([^/)]+\.woff2)\)',
                r'url(/site_assets/fonts/\1)',
                content
            )
            if modified != content:
                css_file.write_text(modified, encoding="utf-8")
                print(f"  [OK] Updated: {css_file.name}")
        else:
            print(f"  [OK] {css_file.name} - no external references")


def step10_create_server():
    """Create a simple HTTP server script for testing."""
    print("\n" + "="*60)
    print("STEP 10: Creating local server script")
    print("="*60)

    # Create a server that serves from the parent directory
    # so that all the domain directories are accessible
    server_script = Path(r"c:\Users\Om Rai\Downloads\katana.network\serve.py")
    server_content = '''#!/usr/bin/env python3
"""
Simple HTTP server for the localized katana.network site.
Run this script and open http://localhost:8000/katana.network/ in your browser.

Alternatively, for direct serving from katana.network directory:
    cd katana.network
    python -m http.server 8000
Then open http://localhost:8000/
"""
import http.server
import socketserver
import os
import sys

PORT = 8000

# Serve from current directory or katana.network subdirectory
serve_dir = os.path.dirname(os.path.abspath(__file__))

# Check if we're in the parent or child directory  
if os.path.exists(os.path.join(serve_dir, "katana.network", "index.html")):
    # We're in the parent directory - serve katana.network subdir
    serve_dir = os.path.join(serve_dir, "katana.network")

os.chdir(serve_dir)

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler that handles clean URLs and suppresses verbose logging."""

    def do_GET(self):
        # Strip query parameters for local file lookup
        path = self.path.split("?")[0]
        
        # Handle root
        if path == "/":
            self.path = "/index.html"
        
        # Handle requests for Google Fonts CSS
        elif path.startswith("/fonts.googleapis.com/"):
            # Serve from parallel directory
            parent = os.path.dirname(os.getcwd())
            file_path = os.path.join(parent, path.lstrip("/"))
            if os.path.exists(file_path):
                self.send_response(200)
                self.send_header("Content-type", "text/css")
                self.end_headers()
                with open(file_path, "rb") as f:
                    self.wfile.write(f.read())
                return
        
        return super().do_GET()

    def end_headers(self):
        # Add CORS headers for local development
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, format, *args):
        # Only log errors, not every request
        if args and "404" in str(args[1]) if len(args) > 1 else False:
            super().log_message(format, *args)

with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
    print(f"\\n{'='*50}")
    print(f"  Katana Network - Local Server")
    print(f"  Serving at: http://localhost:{PORT}")
    print(f"  Press Ctrl+C to stop")
    print(f"{'='*50}\\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\\nServer stopped.")
'''
    server_script.write_text(server_content, encoding="utf-8")
    print(f"  [OK] Created serve.py")

    # Also create a simple batch file for easy launching
    bat_file = Path(r"c:\Users\Om Rai\Downloads\katana.network\start_server.bat")
    bat_content = '@echo off\necho Starting Katana Network local server...\ncd /d "%~dp0katana.network"\npython -m http.server 8000\npause\n'
    bat_file.write_text(bat_content, encoding="utf-8")
    print(f"  [OK] Created start_server.bat")


def step11_verify():
    """Verify all files are properly downloaded."""
    print("\n" + "="*60)
    print("STEP 11: Verification")
    print("="*60)

    issues = []

    # Check video files
    videos_dir = BASE_DIR / "assets" / "videos"
    for vf in videos_dir.glob("*.mp4"):
        if vf.stat().st_size < 200:
            issues.append(f"Video stub: {vf.name} ({vf.stat().st_size} bytes)")

    # Check GLB models
    models_dir = BASE_DIR / "assets" / "models"
    for mf in models_dir.glob("*.glb"):
        if mf.stat().st_size < 200:
            issues.append(f"Model stub: {mf.name} ({mf.stat().st_size} bytes)")

    # Check fonts
    font_count = len(list(FONTS_DIR.glob("*.woff2"))) if FONTS_DIR.exists() else 0

    # Check JS chunks
    js_count = len(list((BASE_DIR / "_next" / "static" / "chunks").glob("*.js")))
    css_count = len(list((BASE_DIR / "_next" / "static" / "css").glob("*.css")))

    # Check storyblok images
    storyblok_count = len(list(IMAGES_DIR.glob("*"))) if IMAGES_DIR.exists() else 0

    print(f"\n  Summary:")
    print(f"  - JS chunks: {js_count}")
    print(f"  - CSS files: {css_count}")
    print(f"  - Font files (woff2): {font_count}")
    print(f"  - Downloaded images: {storyblok_count}")
    print(f"  - Video posters (jpg): {len(list(videos_dir.glob('*.jpg')))}")
    print(f"  - Video files (mp4): {len(list(videos_dir.glob('*.mp4')))}")
    print(f"  - GLB models: {len(list(models_dir.glob('*.glb')))}")
    print(f"  - SVG images: {len(list((BASE_DIR / 'assets' / 'images').glob('*.svg')))}")

    if issues:
        print(f"\n  ⚠ Issues found ({len(issues)}):")
        for issue in issues:
            print(f"    - {issue}")
    else:
        print(f"\n  ✓ All files look good!")

    print(f"\n  To view the site locally:")
    print(f"  1. cd katana.network\\katana.network")
    print(f"  2. python -m http.server 8000")
    print(f"  3. Open http://localhost:8000 in your browser")


def main():
    print("🔧 Katana.network Localizer")
    print("=" * 60)

    ensure_dirs()
    step1_download_google_fonts()
    step2_download_videos()
    step3_download_storyblok_images()
    step4_download_next_images()
    step5_download_webp_images()
    step6_download_api_data()
    step7_download_missing_assets()
    step8_update_html()
    step9_update_css_for_local_fonts()
    step10_create_server()
    step11_verify()

    print("\n" + "=" * 60)
    print("✅ Localization complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
