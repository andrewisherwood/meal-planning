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

## Phase 1 — Calendar Grid View (scan like Skylight)

Goal

A week view you can scan instantly: columns = days, rows = mealtimes, cells contain 0..N cards.

### Loop 1.1 Grid layout only

header row = 7 day labels

left column = slot labels

cells render cards (title only), sorted by pos

### Loop 1.2 Snack row added

include snack in slot order + labels

render even when empty (so it’s always available)

Stop condition: you can “see the week” at a glance like a calendar.

## Phase 2 — Add Recipes (no + button clutter)

Goal

Planning is editable without friction.

Interaction:

Tap a mealtime cell → opens “Add to this slot” drawer

Tap a card → opens cook modal (Phase 3)

### Loop 2.1 Cell tap opens Add Drawer (context-aware)

drawer title includes date + slot

close button

no search yet (dummy content)

### Loop 2.2 Search recipes inside drawer

search input

results list

quick picks when empty (e.g. most recent recipes)

### Loop 2.3 Selecting a recipe creates a plan item

insert into meal_plan with:

household_id

date

slot

pos = max(pos)+1 for that date+slot

optimistic UI update (card appears immediately)

Stop condition: you can build a week plan from the grid without leaving the page.

## Phase 3 — Cook Modal (persistent, calm)

Goal

Click a card, cook from it, close when finished.

### Loop 3.1 Card click opens modal

modal shows recipe title

explicit close button

doesn’t dismiss by accidental outside click (persistent while cooking)

### Loop 3.2 Modal loads recipe details

ingredients (from recipe_ingredients)

steps (from recipe_steps)

optional notes/tags

Stop condition: you can cook dinner with the modal open and not lose it.

## Phase 4 — Plan Editing Quality (small but important)

Goal

Make planning feel forgiving.

### Loop 4.1 Remove a plan card

delete that meal_plan row

card disappears immediately

### Loop 4.2 Multiple add behaviour

keep drawer open for sides/pudding/snack (because you often add several)

optional: auto-close for dinner main

Stop condition: editing the plan doesn’t create friction or guilt.

## Phase 5 — Drag & Drop (nice but later)

Goal

Planning feels like moving sticky notes.

### Loop 5.1 Reorder within a cell

drag cards within a slot → updates pos

### Loop 5.2 Move between days

drag a card to another day same slot → updates date

### Loop 5.3 Move between slots (optional rules)

likely allow main ↔ main

allow sides ↔ sides

treat with guardrails

Stop condition: planning is fast and satisfying.

## Phase 6 — Send to Calendar (Skylight + any calendar)

Goal

One button → week appears on calendar so decisions are finished.

### Loop 6.1 Generate ICS subscription feed

read-only calendar users can subscribe to

events include meal title + link back

### Loop 6.2 Skylight-friendly option (optional)

email invites / ingestion workflow if needed

Stop condition: meals show up in Skylight/Google/Apple calendar without manual copying.

Optional UI tooling

Install shadcn/ui when you start Phase 2/3 (drawer + dialog are perfect for this).

Don’t install before you need it.
