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
   - Drag-and-drop eventually
   - Optimised for thinking and rearranging

3. **Mobile = checking mode**

   - Vertical day stack
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
- **Tailwind CSS**
- No heavy client state libraries
- No premature abstractions

---

## Data Model (Key Concepts)

- `households`
- `recipes`
- `meal_plan`
  - `date` (YYYY-MM-DD)
  - `meal` (slot key, e.g. `breakfast`, `dinner:main`)
  - `pos` (ordering within a slot)
  - `recipe_id`
  - `notes`

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

- Clicking a meal card opens a **modal / drawer**
- Modal:
  - Shows recipe, ingredients, steps
  - Persists while cooking
  - Closes by tapping outside (no explicit close button required)
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

---

## Current Roadmap (Looped)

### Loop 1 — Calendar Surface ✅

- Seed household + meal plan
- Render weekly plan
- Responsive: grid (md+) / stack (<md)

### Loop 2 — Recipe Modal

- Click card → open modal
- Show ingredients + steps
- Modal persists while cooking

### Loop 3 — Add to Plan

- Click empty cell / slot
- Search recipes
- Add to correct date + slot

### Loop 4 — Reordering

- Drag cards within a slot
- Persist `pos`

### Loop 5 — Calendar Export

- Generate `.ics` feed
- Subscribe from Skylight / Apple / Google

---

## Non-Goals (For Now)

- Full nutrition analysis
- Macro counting
- AI recipe generation
- Social features
- Multi-household sharing

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
