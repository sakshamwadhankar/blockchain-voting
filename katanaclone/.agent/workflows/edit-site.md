---
description: How to edit the katana.network site
---

## Site Structure

- **HTML**: `c:\Users\Om Rai\Downloads\katana.network\katana.network\index.html` (~4200 lines, prettified)
- **Custom CSS**: `c:\Users\Om Rai\Downloads\katana.network\katana.network\overrides.css` (all custom style changes go here)
- **Original CSS**: `katana.network\_next\static\css\71ad7126acaaad28.css` (DO NOT edit - original site styles)
- **Assets**: `katana.network\assets\` and `katana.network\site_assets\`
- **JS Chunks**: `katana.network\_next\static\chunks\` (DO NOT edit unless necessary)

## Key CSS Class Names (for reference)

### Header / Navigation
- `header_header__w2BOs` - Main header element
- `header_client__wM5mR` - Header content wrapper
- `header_inner__U_dnu` - Inner nav container
- `header_nav__Aoml7` - Nav element
- `header_textLink__y6QmU` - Nav text links (vision, blog, docs, etc.)
- `header_iconLink__5GB31` - Nav icon links (X, Discord)
- `header_button__xBGo0` - "Enter the app" button
- `header_logoContainer__djfF0` - KATANA logo
- `header_logoSmall__Yfho7` - Small K logo
- `header_menuIcon__nkNsj` - Hamburger menu icon (mobile)
- `header_menuOverlay__07lSU` - Mobile menu overlay

### Hero Section
- `heroFrontpage_heroFrontpage__jl6_0` - Hero section
- `heroFrontpage_title__ceesP` - Hero title
- `heroFrontpage_text__1_g_Y` - Hero subtitle
- `heroFrontpage_button__wEMqN` - Hero CTA button

### Other Sections
- `liquidity_liquidity__9ZRR4` - Liquidity section
- `flywheel_flywheel__mOF3A` - Flywheel section
- `features_features__T8EB8` - Features section
- `roadmap_roadmap__bK2Wa` - Roadmap section
- `quotes_quotes__7C7Xt` - Quotes section
- `newsletter_newsletter__6FBXt` - Newsletter section
- `footerFrontpage_footerFrontpage__xegYA` - Footer CTA section
- `footer_footer__mQF6i` - Footer

### Typography
- `typo_h1__sIORA` - H1 style
- `typo_h2__i9CAc` - H2 style
- `typo_h3__T8VrN` - H3 style
- `typo_h4__zlOR8` - H4 style
- `typo_p__aZIKd` - Paragraph style

### Components
- `button_button__HOmVR` - Button component
- `button_important__BKF_D` - Important/highlighted button
- `corner_corner__e41Zg` - Corner decoration element

## How to Make Changes

### Style changes
1. Open `katana.network\overrides.css`
2. Add your CSS rules under the appropriate section comment
3. Refresh the browser - changes apply instantly (no build needed)

### Content changes
1. Open `katana.network\index.html`
2. Search for the text you want to change
3. Edit directly - the HTML is now prettified and readable
4. Refresh the browser

### Starting the server
// turbo
1. Run: `python serve.py` from `c:\Users\Om Rai\Downloads\katana.network`
2. Open: `http://localhost:8000`

### Restarting the server
// turbo
1. Run: `taskkill /F /IM python.exe` to stop
// turbo
2. Run: `python serve.py` from `c:\Users\Om Rai\Downloads\katana.network` to start
