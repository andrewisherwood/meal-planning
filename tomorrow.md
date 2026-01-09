Before you start:
git pull --rebase

## Completed

- Phase 0–5: Core functionality (grid, recipes, cook modal, drag-drop)
- Phase 6: Auth & Households (magic link, RLS, protected routes)

## Next: Phase 6.5 — Navigation & UX Refinements

Goal: Polish the app structure before adding new features.

### Loop 6.5.1 Homepage (completed)

Create a proper landing page describing the app:

- `/` → Marketing homepage with sections describing the app
- `/recipes` → Recipe browser (move current `/` content here)
- `/r/[slug]` → Individual recipes (keep as-is)
- User has copy ready for the homepage

Stop condition: Styled homepage appears at /

### Loop 6.5.2 Consistent Navigation

Add a unified nav bar/header across the site:

- Recipes link (home)
- Plan link
- Settings icon
- Current page indicator
- Works on mobile and desktop

### Loop 6.5.3 Full Week Calendar

Change plan view from "rolling 7 days" to "full week":

- Show Mon–Sun (or Sun–Sat based on locale)
- Highlight today with visual indicator
- Week navigation (prev/next week buttons)
- "Today" button to jump back to current week
- Remember: mobile still uses day stack with day tabs

Stop condition: Navigation feels complete and professional.

## Upcoming

| Phase | Name            | Goal                       |
| ----- | --------------- | -------------------------- |
| 7     | Calendar Export | Decisions on Skylight      |
| 8     | Shopping List   | Plan → Shop → Cook loop    |
| 9     | Feedback Loop   | Learn what works           |
| 10    | Leftovers       | Batch cooking pays forward |
| Later | Smart Features  | LLM-powered suggestions    |
