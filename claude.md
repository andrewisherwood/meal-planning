# Claude.md — Meal Planning Project

## Purpose

This project is a **family meal-planning web app** designed to:

- Reduce cognitive load for parents
- Make “good enough” nutritious food visible and repeatable
- Turn meal planning into a **calendar-first, state-driven system**

The north star is **less guilt, less friction, more calm**.

This is not a recipe app.
This is not a grocery app.
This is a **planning surface** that happens to know about food.

---

## Core Product Principles

1. **Calendar is the source of truth**

   - Meals are planned as dated, slotted events
   - Recipes are attached to calendar entries
   - Planning happens visually, not via forms

2. **Desktop / tablet = planning mode**

   - Grid-based week view (columns = days, rows = meal slots)
   - Drag-and-drop to reorder and move meals
   - Optimised for thinking and rearranging

3. **Mobile = checking mode**

   - Vertical day stack with day tabs for navigation
   - Quick glance, minimal interaction
   - No dense grids on phones

4. **“Good enough” beats perfect**
   - Leftovers are first-class
   - Repetition is encouraged
   - Empty slots are acceptable

---

## Tech Stack (Current)

- **Next.js (App Router)**
- **Supabase** (Postgres + auth)
- **Tailwind CSS v4** with semantic CSS variables
- **shadcn/ui** (Drawer, Dialog components)
- No heavy client state libraries
- No premature abstractions

---

## Data Model (Key Concepts)

- `households` — family units that share a meal plan
  - `unit_system` (metric/imperial for recipe parsing)
  - `default_servings` (1-12, default 4)
- `household_members` — links users to households (includes `is_owner` for ownership tracking)
- `profiles` — user consent/privacy data (terms acceptance, notification consent timestamps)
- `recipes` — shared library + household-private recipes (`household_id` NULL = shared)
- `meal_plan` — planned meals per household
  - `date` (YYYY-MM-DD)
  - `meal` (slot key, e.g. `breakfast`, `dinner:main`)
  - `pos` (ordering within a slot)
  - `recipe_id`
  - `notes`

**RLS (Row Level Security)** enforces data isolation per household and per user (profiles).

Slots are **fixed and ordered**:

- breakfast
- lunch
- snack
- dinner:main
- dinner:side
- dinner:pudding

---

## Rendering Rules

- **≥ md (768px)**  
  → Week grid  
  → Rows = meal slots  
  → Columns = days  
  → Multiple cards allowed per cell

- **< md**  
  → Day stack  
  → One day at a time  
  → Slots rendered vertically

There must be **one codepath for data**, multiple renderers for layout.

---

## Interaction Philosophy (Important)

- Clicking a meal card opens a **cook modal**
- Modal:
  - Shows recipe, ingredients, steps
  - Persists while cooking (doesn't dismiss on outside click)
  - Explicit close button + "Remove from plan" action
- Clicking empty slot opens **add drawer**
  - Search recipes, tap to add
  - Stays open for multi-add slots (sides, snacks, etc.)
- Planning actions should feel **light and reversible**
- Avoid modal chains, wizards, or blocking flows

---

## Development Protocol (AuDHD-friendly)

Claude should **always**:

1. Work in **small, complete loops**

   - One visible outcome per loop
   - No half-finished systems

2. Prefer **structure before styling**

   - Layout first
   - Interaction later
   - Polish last

3. Avoid speculative features

   - No “we’ll need this later” code
   - No premature optimisation

4. Be explicit about **stop conditions**

   - When a loop is complete, say so
   - Encourage committing and stopping

5. Respect existing code
   - Do not rewrite working queries
   - Do not rename tables casually
   - Do not introduce new patterns without reason

6. Use the **PR workflow** for features
   - See `CONTRIBUTING.md` for branch naming and PR process
   - Feature branches: `feature/`, `fix/`, `chore/`
   - Use `scripts/git-workflow.sh` helpers

7. **Multi-priority implementation workflow**
   - Each priority section → separate feature branch
   - Branch naming: `feature/priority-N-description`
   - Workflow per branch:
     1. `git checkout -b feature/priority-N-description`
     2. Implement changes, commit incrementally
     3. `git push -u origin feature/...`
     4. `gh pr create`
     5. `gh pr merge --squash --delete-branch`
     6. `git checkout main && git pull`

---

## Current Roadmap (Looped)

### Phase 0–5 ✅ Complete

- Calendar grid (md+) / day stack (<md)
- Add recipes via drawer with search + mealtime filters
- Cook modal (floating card) with ingredients + steps
- Remove from plan
- Multi-add behaviour (drawer stays open)
- Skylight-inspired pastel styling (per-slot colors)
- Responsive AddDrawer (side panel desktop, bottom mobile)
- Drag & drop (reorder, move between days/slots)
- Mobile day navigation tabs

### Phase 6 ✅ Complete

- Supabase Auth (magic link / passwordless)
- Household creation + invite codes
- RLS policies for data isolation (all 6 tables)
- Protected routes via middleware
- User settings page
- Vitest test infrastructure

### Phase 6.5 ✅ Complete

- Homepage at `/` with marketing copy (move recipes to `/recipes`)
- Consistent nav across site (Recipes, Plan, Settings)
- Full week calendar with today indicator and week navigation

### Phase 7 ✅ Complete

- Calendar Export (ICS file generation, share to calendar apps)

### Phase 8 ✅ Complete

- Shopping List (aggregate ingredients from week's meals)
- Reminders integration (iOS Reminders via share sheet)
- Pantry tracking (mark items you already have)

### Phase 9 ✅ Complete

- "Everyone Ate" feedback loop with confetti celebration
- Meal completion tracking (`meal_completions` table)
- Web Push notifications for dinner reminders
- Push subscription management in Settings
- Edge function for scheduled notification delivery

### Phase 10 ✅ Complete

- GDPR/Privacy compliance (pre-launch)
- Privacy Policy and Terms of Service pages (`/privacy`, `/terms`)
- Terms acceptance during onboarding with checkbox
- Terms acceptance modal for existing users
- Two-step push notification consent flow
- Account deletion with ownership transfer
- Privacy & Data section in Settings
- `profiles` table for consent tracking

### Phase 11 ✅ Complete

- Recipe import enhancements (Voice, URL, Photo, Paste tabs)
- URL ingest with Readability content extraction
- Photo/image ingest with Claude Vision API
- Editable voice transcript before parsing
- Recipe settings (unit system, default servings)
- Leftovers quick-add (checkbox in feedback modal → tomorrow's lunch)

### Future Ideas

- Full leftovers/fridge tracking
- Smart features (LLM-powered suggestions)
- Skylight email integration

---

## Non-Goals (For Now)

- Full nutrition analysis
- Macro counting
- AI recipe generation
- Social features

These belong in `later.md`, not the codebase.

---

## How Claude Should Respond

Claude should:

- Give **concrete code**, not vague advice
- Explain _why_ something broke when it breaks
- Prefer boring, reliable solutions
- Match the user’s tone: calm, direct, collaborative

Claude should **not**:

- Over-engineer
- Introduce new libraries without asking
- Chase perfect UX before the loop is closed

---

## Definition of “Done” (for any loop)

A loop is done when:

- The UI renders correctly
- The data flow is clear
- The user can _see_ progress
- The code can be committed cleanly

When in doubt: **ship the loop, write the next line in `tomorrow.md`, stop.**
