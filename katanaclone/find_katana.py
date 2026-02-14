import os, re

path = r'c:\Users\Om Rai\Downloads\katana.network\katana.network\_next\static\chunks'
# Search for the K letter path from the KATANA SVG
k_path = "M0 0H40V40H68L80 0H120"
for f in os.listdir(path):
    if f.endswith('.js'):
        content = open(os.path.join(path, f), 'r', errors='ignore').read()
        if k_path in content:
            idx = content.find(k_path)
            snippet = content[max(0, idx-100):idx+200]
            print(f'{f} at {idx}: ...{snippet}...')
            print('---')

# Also check the 8155 chunk which might be the page-specific chunk
chunk_8155 = os.path.join(path, '8155.431cf77c9f162f00.js')
if os.path.exists(chunk_8155):
    content = open(chunk_8155, 'r', errors='ignore').read()
    print(f"\n8155 chunk size: {len(content)} bytes")
    if 'logo' in content.lower():
        print("Contains 'logo'!")
    # Check for M0 path data
    for m in re.finditer(r'M\d+ \d+[HVLCZhvlcz]', content):
        snippet = content[max(0, m.start()-20):m.end()+40]
        print(f"Path data found: ...{snippet}...")
        break
