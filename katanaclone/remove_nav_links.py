import re

# Read the HTML file
with open(r'c:\Users\Om Rai\Downloads\katana.network\katana.network\index.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

# Pattern to match navigation links (vision, blog, docs, ecosystem, careers, institutions)
# We want to remove these specific links but keep the "enter the app" button and social icons

# Remove navigation links from the main header nav
# Pattern: <a href="/vision" class="textLink...">vision</a> and similar
nav_links_pattern = r'<a href="(?:/vision|/blog/|https://docs\.katana\.network|https://app\.katana\.network/ecosystem|https://jobs\.ashbyhq\.com/katana-network|/institutions)" class="textLink_textLink__cTqsP header_textLink__y6QmU[^"]*"[^>]*>(?:vision|blog|docs|ecosystem|careers|institutions)</a>'

# Remove from main nav
html_content = re.sub(nav_links_pattern, '', html_content)

# Remove navigation links from the mobile menu overlay
overlay_nav_pattern = r'<a href="(?:/vision|/blog/|https://docs\.katana\.network|https://app\.katana\.network/ecosystem|https://jobs\.ashbyhq\.com/katana-network|/institutions)" class="textLink_textLink__cTqsP header_menuOverlayTextLink__Z692B[^"]*"[^>]*>(?:vision|blog|docs|ecosystem|careers|institutions)</a>'

html_content = re.sub(overlay_nav_pattern, '', html_content)

# Write the modified HTML back
with open(r'c:\Users\Om Rai\Downloads\katana.network\katana.network\index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Navigation links removed successfully!")
print("Kept: 'enter the app' button and social icons (X/Twitter and Discord)")
