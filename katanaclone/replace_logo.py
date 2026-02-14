import re

html = open(r'c:\Users\Om Rai\Downloads\katana.network\katana.network\index.html', 'r', encoding='utf-8').read()

# The current SVG has a <text> element - we need to replace it with proper SVG paths for KWOTE  
# Since the 3D engine reads SVG path elements, we need actual <path> elements

# KWOTE letters as SVG paths (designed to fit in the 820x100 viewbox)
kwote_paths = '''
       <path d="M0 0H40V40H68L80 0H120L105 50L130 100H90L70 60H40V100H0V0Z" fill="#f6ff0d"></path>
       <path d="M145 0H180L200 40L220 0H255L225 50L240 100H205L200 55L195 100H160L175 50L145 0Z" fill="#f6ff0d"></path>
       <path fill-rule="evenodd" clip-rule="evenodd" d="M270 0H360C395 0 395 100 360 100H270V0ZM310 30V70H350C365 70 365 30 350 30H310Z" fill="#f6ff0d"></path>
       <path d="M410 0H530V30H490V100H450V30H410V0Z" fill="#f6ff0d"></path>
       <path d="M545 0H665V30H585V35H655V65H585V70H665V100H545V0Z" fill="#f6ff0d"></path>
'''

# Find and replace the SVG content
match = re.search(r'(<svg[^>]*header_logo__9b1Md[^>]*>)(.*?)(</svg>)', html, re.DOTALL)
if match:
    new_html = html[:match.start()] + match.group(1) + kwote_paths + match.group(3) + html[match.end():]
    open(r'c:\Users\Om Rai\Downloads\katana.network\katana.network\index.html', 'w', encoding='utf-8').write(new_html)
    print('Done! Replaced with KWOTE SVG paths')
else:
    print('Could not find the logo SVG')
