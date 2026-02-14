@echo off
echo Starting Katana Network local server...
cd /d "%~dp0katana.network"
python -m http.server 8000
pause
