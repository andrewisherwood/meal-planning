Before you start:
git pull --rebase

## Completed
- Phase 0–4: Core functionality
- Phase 4.5: Skylight-inspired styling
  - Warm pastel slot colors (breakfast=peach, lunch=mint, snack=cream, dinner=lavender)
  - AddDrawer: responsive (side panel desktop, bottom mobile), mealtime filters
  - CookModal: floating card with Dialog, edit/delete icons, date + tags
- Phase 5: Drag & Drop
  - @dnd-kit library (core, sortable, utilities)
  - Reorder cards within slot
  - Move cards between days (same slot)
  - Move between dinner sub-slots (main ↔ side ↔ pudding)
  - DragOverlay ghost card + drop zone highlights
  - Mobile support in DayStack

## Next: Phase 6 — Calendar Export

### Loop 6.1 Generate ICS subscription feed
- read-only calendar users can subscribe to
- events include meal title + link back to app

### Loop 6.2 Skylight-friendly option (optional)
- email invites / ingestion workflow if needed

Goal: meals show up in Skylight/Google/Apple calendar without manual copying
