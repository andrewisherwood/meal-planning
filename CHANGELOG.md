# Changelog

## Completed

- Phase 0–5: Core functionality (grid, recipes, cook modal, drag-drop)
- Phase 6: Auth & Households (magic link, RLS, protected routes)
- Phase 6.5: Navigation & UX Refinements
- Phase 7: Calendar Export
- Phase 8: Shopping List with Reminders
- Phase 9: "Everyone Ate" Feedback Loop with Push Notifications

## Bug Fixes (Jan 2026)

### AddDrawer Multi-Select Filters
- Fixed dinner:side and dinner:pudding preselecting wrong filter
- Added multi-select filter support (toggle filters on/off)
- All filters now use AND logic when multiple selected

### CookModal Save Reliability
- Added error handling to all Supabase save operations
- Display save errors to user
- Only exit edit mode on successful save

### Drag-and-Drop Rollback
- Added rollback on failed Supabase updates
- Restore original state if backend update fails

## Phase 9 — Feedback Loop & Push Notifications (Jan 2026)

### Everyone Ate Feedback
- Added FeedbackModal with confetti celebration
- "Done cooking?" button in CookModal
- Meal completion tracking in `meal_completions` table

### Push Notifications
- Service worker for receiving push events
- Device notification settings in Settings page
- Edge function `send-dinner-notifications` for scheduled delivery
- Clicking notification opens feedback modal

## Phase 8 — Shopping List (Jan 2026)

- Aggregate ingredients from week's planned meals
- Category-based grouping (Produce, Dairy, Meat, etc.)
- Pantry tracking to mark items you already have
- Share to iOS Reminders via share sheet
- Generate shareable shopping list

## Phase 7 — Calendar Export (Jan 2026)

- Generate .ics files for meal plan
- Share to calendar apps (Google Calendar, Apple Calendar, etc.)
- Configurable dinner time from Settings

## Phase 6.5 — Navigation & UX Refinements (Jan 2026)

### 6.5.3 Full Week Calendar

- Changed plan view from rolling 7 days to full Mon-Sun week
- Added week navigation (prev/next/today buttons)
- Today's column/tab highlighted with accent color and dot
- Mobile auto-selects today's tab when in current week

### 6.5.2 Consistent Navigation

- Added unified NavBar across authenticated pages
- Icons: Plan, Recipes, Add Recipe, Settings
- Current page indicator with active state
- Mobile-friendly compact bar

### 6.5.1 Homepage

- Created marketing homepage at `/`
- Moved recipe browser to `/recipes`
- Brand identity with warm colors and illustrations

## Phase 6 — Auth & Households (Jan 2026)

- Supabase Auth with magic link login
- Household creation and onboarding flow
- Row Level Security (RLS) for data isolation
- Protected routes via middleware

## Phase 0–5 — Core Functionality (Dec 2025 – Jan 2026)

- Week grid (desktop) and day stack (mobile) views
- Recipe browser with search and filters
- Cook modal with ingredients and steps
- Add recipes to meal plan via drawer
- Drag-and-drop reordering and cross-day moves
- Skylight-inspired pastel slot colors
