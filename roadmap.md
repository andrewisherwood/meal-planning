# Meal Planning V1 Roadmap (Looped)

North Star

Parents can go to bed without guilt.
Planning closes decisions. Cooking is supported calmly. Leftovers pay effort forward.

## Phase 0 — Foundation (done)

### Loop 0.1 Schema supports real life

household ownership

multi-slot days (breakfast, lunch, snack, dinner:main, dinner:side, dinner:pudding)

pos supports multiple items per slot

Loop 0.2 Seed script creates a living week

households + members

recipes + ingredients + steps

7-day plan with mains/sides/pudding/breakfast + some leftover lunches

### Loop 0.3 Render seeded plan (done)

grouped by date → slot → pos

Stop condition: week looks like a real family eats ✅

## Phase 1 — Calendar Grid View (done)

Goal

A week view you can scan instantly: columns = days, rows = mealtimes, cells contain 0..N cards.

### Loop 1.1 Grid layout only (done)

header row = 7 day labels

left column = slot labels

cells render cards (title only), sorted by pos

### Loop 1.2 Snack row added (done)

include snack in slot order + labels

render even when empty (so it's always available)

Stop condition: you can "see the week" at a glance like a calendar. ✅

## Phase 2 — Add Recipes (done)

Goal

Planning is editable without friction.

Interaction:

Tap a mealtime cell → opens "Add to this slot" drawer

Tap a card → opens cook modal (Phase 3)

### Loop 2.1 Cell tap opens Add Drawer (done)

drawer title includes date + slot

close button

### Loop 2.2 Search recipes inside drawer (done)

search input

results list

quick picks when empty (most recent recipes)

### Loop 2.3 Selecting a recipe creates a plan item (done)

insert into meal_plan with household_id, date, slot, pos

optimistic UI update (card appears immediately)

Stop condition: you can build a week plan from the grid without leaving the page. ✅

## Phase 3 — Cook Modal (done)

Goal

Click a card, cook from it, close when finished.

### Loop 3.1 Card click opens modal (done)

modal shows recipe title

explicit close button

doesn't dismiss by accidental outside click (persistent while cooking)

### Loop 3.2 Modal loads recipe details (done)

ingredients (from recipe_ingredients)

steps (from recipe_steps)

tags displayed below title

Stop condition: you can cook dinner with the modal open and not lose it. ✅

## Phase 4 — Plan Editing Quality (done)

Goal

Make planning feel forgiving.

### Loop 4.1 Remove a plan card (done)

delete that meal_plan row

card disappears immediately

"Remove from plan" button in cook modal

### Loop 4.2 Multiple add behaviour (done)

drawer stays open for sides/pudding/snack/breakfast/lunch

auto-close for dinner:main only

notification shows "{recipe} added to {slot} for {day}"

Stop condition: editing the plan doesn't create friction or guilt. ✅

## Phase 4.5 — Styling (done)

Goal

Skylight-inspired warm pastel UI, improved drawer/modal UX.

### Loop S.1 Color system foundation (done)

CSS variables for slot colors (breakfast, lunch, snack, dinner)

Tailwind theme mapping

### Loop S.2–S.3 Calendar pastel styling (done)

WeekGrid and DayStack use per-slot colors

Row backgrounds = lighter pastel, cards = darker pastel

Improved border radius (rounded-xl/2xl)

Better day header formatting (e.g., "Mon 7")

### Loop S.4 AddDrawer responsive direction (done)

Desktop (md+) = side panel from right

Mobile (<md) = bottom sheet

### Loop S.5–S.6 AddDrawer improvements (done)

Mealtime filter buttons (All, Breakfast, Lunch, Dinner, Snack)

Pre-filtered based on clicked slot

Improved typography and spacing

### Loop S.7 CookModal floating card (done)

Replaced Drawer with Dialog component

Skylight-style floating centered card (rounded-3xl)

Header with edit/delete/close icons

Date display and category badges

Non-dismissible (click outside blocked)

Stop condition: app feels warm, calm, and Skylight-inspired. ✅

## Phase 5 — Drag & Drop (done)

Goal

Planning feels like moving sticky notes.

### Loop 5.1 Install dnd-kit & basic setup (done)

@dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

DndContext provider with PointerSensor + TouchSensor

### Loop 5.2 Sortable cards within slot (done)

SortableContext wrapping card lists

useSortable hook for draggable cards

CSS transforms for drag animations

### Loop 5.3 Persist reorder within slot (done)

handleDragEnd calculates new pos values

optimistic UI update + Supabase persist

### Loop 5.4 Move between days (done)

DroppableCell components for cross-day drops

date field updates on drop

### Loop 5.5 Move between slots with guardrails (done)

canMoveToSlot() helper enforces rules:

- same slot type always allowed
- dinner sub-slots can interchange
- other cross-slot moves blocked

### Loop 5.6 Drag visual feedback (done)

DragOverlay shows ghost card following cursor

source card dims while dragging

drop zones highlight on hover

### Loop 5.7 DayStack mobile drag support (done)

SortableContext + useSortable in DayStack

touch-friendly with TouchSensor

Stop condition: planning is fast and satisfying. ✅

## Phase 6 — Auth & Households (done)

Goal

Your family can sign up and use this for real.

### Loop 6.0 Vitest setup (done)

Test infrastructure with jsdom environment

### Loop 6.1–6.2 Supabase Auth & SSR clients (done)

@supabase/ssr for browser + server clients

Middleware for session refresh

### Loop 6.3 Database schema changes (done)

user_id on household_members

invite_code on households

get_user_household_id() helper function

### Loop 6.4 RLS policies (done)

Enabled on all 6 tables

Policies for SELECT/INSERT/UPDATE/DELETE

### Loop 6.5 Login & auth callback (done)

Magic link (passwordless email)

PKCE code exchange

### Loop 6.6 Onboarding flow (done)

Create household OR join with invite code

### Loop 6.7 Middleware & protected routes (done)

/plan, /settings, /onboarding require auth

### Loop 6.8 Settings page (done)

User info, household, members list

Invite code with copy button

Sign out

### Loop 6.9 RLS verification tests (done)

Vitest tests documenting expected RLS behavior

### Loop 6.10 Link existing data (done)

Helper script for migrating dev data

Stop condition: family members can create accounts and see their shared plan. ✅

---

## Phase 6.5 — Navigation & UX Refinements (done)

Goal

Polish app structure before adding features.

### Loop 6.5.1 Full week calendar (done)

Show Mon–Sun instead of rolling 7 days

Today indicator (dot badge + highlight)

Week navigation (prev/next/today buttons)

### Loop 6.5.2 Recipe filters & search (done)

Filter chips on /recipes page (mealtime + dietary tags)

Search input with debounced query

Matching filter UI in AddDrawer

### Loop 6.5.3 Recipe editing (done)

Edit recipes inline from CookModal

Edit recipes from /r/[slug] page

Stop condition: core UX is polished. ✅

---

## Phase 7 — Shopping List (done)

Goal

Planning leads to action.

### Loop 7.1 Generate list from plan (done)

Query current week's recipes + ingredients

Aggregate quantities by name+unit (2 onions + 1 onion = 3 onions)

Group by category (Fresh Produce, Dairy & Eggs, etc.)

### Loop 7.2 Shopping UI (done)

Modal with checklist view

Check off items (persisted to pantry table)

"Already have" section for checked items

### Loop 7.3 Export (done)

Copy to clipboard — formatted with category headers

Send to Reminders — via Apple Shortcut (clipboard-based, creates individual items)

Stop condition: you can go shopping with just your phone. ✅

---

## Phase 8 — Share to Calendar (done)

Goal

Decisions feel finished when they're on the calendar.

### Loop 8.1 Generate .ics file (done)

Export full week's meal plan as iCal file

Event title: "Dinner: [Meal Name]"

Event time: User's configured dinner time (default 6pm, 1 hour duration)

Event notes: Optional recipe link or description

### Loop 8.2 Share sheet integration (done)

Trigger iOS share sheet with .ics file

User can add to Calendar, Skylight, email, etc.

Works offline (generates file locally)

### Loop 8.3 Settings: Dinner time (done)

Add dinner time picker to Settings (default 6pm)

Used for calendar event times and notification scheduling

Stop condition: meals appear on Skylight/Google/Apple calendar. ✅

---

## Phase 9 — "Everyone Ate" Feedback Loop (done)

Goal

Close the loop on meal planning with a satisfying micro-interaction.

### Loop 9.1 Push notification (done)

Trigger at configurable time (default: 30 mins after dinner time)

Copy: "How was [Meal Name] tonight?"

Tap opens feedback modal (not full app)

No notification if no meal planned

### Loop 9.2 Feedback modal (v1) (done)

Display meal name

Large "Everyone Ate!" button

Confetti animation (1.5 sec, no sound by default)

Meal marked as "completed" in data

"Skip" option marks meal as "skipped" (no confetti)

### Loop 9.3 Settings additions (done)

"Everyone Ate" notification toggle (default: on)

Notification time picker (default: 30 mins after dinner)

Sound toggle (default: off — sleeping children)

### Loop 9.4 Ratings (v2 — future)

After confetti: "How did it go?"

Three emoji buttons: 😍 (Hit) / 😐 (Fine) / 😕 (Miss)

Single tap records rating, modal dismisses

### Data model (done)

```
meal_completions {
  meal_plan_id: uuid
  completed: boolean
  skipped: boolean
  rating: 'hit' | 'fine' | 'miss' | null
  completed_at: timestamp
}
```

Stop condition: good recipes bubble up naturally. ✅

---

## Phase 10 — Leftovers (partial)

Goal

Effort pays forward.

### Loop 10.1 Quick leftovers add (done)

Checkbox in feedback modal: "Save leftovers for tomorrow's lunch?"

Inserts meal to next day's lunch slot with "Leftovers" note

### Loop 10.2 Mark recipes as "makes leftovers" (later)

Yields 2x, batch cooking flag

### Loop 10.3 Suggest leftover lunches (later)

When planning, suggest "Leftover [X]" for next day

### Loop 10.4 Fridge tracking (later)

Simple list of what's in the fridge

"Use up leftovers" prompt when planning

Stop condition: batch cooking feels strategic, not wasteful.

---

## Phase 11 — Recipe Import Enhancements (done)

Goal

Get recipes into the system from anywhere.

### Loop 11.1 Recipe settings (done)

Unit system toggle (metric/imperial) in Settings

Default servings (1-12) in Settings

Settings stored on households table

Parse API uses settings for LLM prompt

### Loop 11.2 Editable voice transcript (done)

Changed read-only transcript display to editable textarea

User can correct speech recognition errors before parsing

### Loop 11.3 URL ingest (done)

New API route: `/api/fetch-url`

Uses jsdom + @mozilla/readability for content extraction

Editable textarea for extracted text before parsing

### Loop 11.4 Photo ingest (done)

Updated `/api/parse-recipe` to accept image input

Claude Vision API extracts recipe from photos

Supports JPEG, PNG, GIF, WebP formats

### Loop 11.5 Import page tabs (done)

Four-tab interface: Voice | URL | Photo | Paste

Consistent flow: input → editable text → parse → review → save

Stop condition: recipes from cookbooks, websites, and voice all work. ✅

---

## Later — Smart Features

These require more data and/or LLM integration.

### Onboarding

Family member profiles (names, ages)

Dietary requirements (vegetarian, allergies, preferences)

How many meals to plan (breakfast? lunch? just dinners?)

### Smart Menu Planning

Rules-based suggestions (no repeat mains within 3 days)

LLM-powered suggestions based on preferences + what's worked

"Plan my week" button

### Pantry Scanning

Take photo of pantry/fridge

LLM vision extracts items

Suggest recipes using what you have

---

## UI tooling

shadcn/ui installed (Drawer for AddDrawer, Dialog for CookModal).
