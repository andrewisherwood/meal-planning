Before you start:
git pull --rebase

## Completed
- Phase 0–4: Core functionality
- Phase 4.5: Skylight-inspired styling
  - Warm pastel slot colors (breakfast=peach, lunch=mint, snack=cream, dinner=lavender)
  - AddDrawer: responsive (side panel desktop, bottom mobile), mealtime filters
  - CookModal: floating card with Dialog, edit/delete icons, date + tags

## Next: Phase 5 — Drag & Drop

### Loop 5.1 Reorder within a cell
- drag cards within a slot → updates pos

### Loop 5.2 Move between days
- drag a card to another day same slot → updates date

### Loop 5.3 Move between slots (optional rules)
- allow main ↔ main, sides ↔ sides
- treat with guardrails

Library options: @dnd-kit or react-beautiful-dnd
