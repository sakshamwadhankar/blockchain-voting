#!/usr/bin/env python3
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
    print(f"\n{'='*50}")
    print(f"  Katana Network - Local Server")
    print(f"  Serving at: http://localhost:{PORT}")
    print(f"  Press Ctrl+C to stop")
    print(f"{'='*50}\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
