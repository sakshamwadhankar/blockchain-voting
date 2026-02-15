# Katana Clone Migration Plan

## Overview
Migrating latest voting system components from `frontend/` to `katanaclone/katana-react/` while maintaining Katana's unique theme and styling.

## Katana Theme Characteristics
- **Colors**: Primary yellow (#F6FF0D), dark backgrounds
- **Components**: Custom buttons with corners, page wrappers, glass effects
- **Layout**: page-wrapper, page-content, page-header, page-card structure
- **Particles**: SectionParticles, StarField for visual effects
- **Typography**: typo-h1, typo-h3, typo-h4 classes

## Files to Update

### 1. VerifyPage.jsx ✅ (Already has latest logic)
- Location: `katanaclone/katana-react/src/pages/VerifyPage.jsx`
- Status: Already updated with latest biometric verification

### 2. VotePage.jsx → Update with VotingBooth.jsx logic
- Source: `frontend/src/pages/VotingBooth.jsx`
- Target: `katanaclone/katana-react/src/pages/VotePage.jsx`
- Changes needed:
  - Keep Katana theme (page-wrapper, btn classes)
  - Add latest election loading logic
  - Add Firebase metadata integration
  - Add voter verification checks

### 3. ResultsPage.jsx → Update with LiveResults.jsx logic
- Source: `frontend/src/pages/LiveResults.jsx`
- Target: `katanaclone/katana-react/src/pages/ResultsPage.jsx`
- Changes needed:
  - Keep Katana theme
  - Add real-time vote counting
  - Add Chart.js integration
  - Add audit trail display

### 4. AdminPage.jsx → Update with UnifiedAdminPanel.jsx logic
- Source: `frontend/src/pages/UnifiedAdminPanel.jsx`
- Target: `katanaclone/katana-react/src/pages/AdminPage.jsx`
- Changes needed:
  - Keep Katana theme
  - Add tabbed interface
  - Add election creation
  - Add candidate management
  - Add election finalization

## Context & Services
- Already exist in katana-react
- May need minor updates for consistency

## Next Steps
1. Update VotePage.jsx with latest voting logic
2. Update ResultsPage.jsx with live results
3. Update AdminPage.jsx with unified admin panel
4. Test all integrations
