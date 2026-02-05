# tomorrow.md

## Current: Pre-launch Polish

Goal: Test and polish before sharing with family/friends.

### To Do
- [ ] Full signup → onboard → plan → cook flow tested
- [ ] Partner/friend tests on their phone
- [ ] Test push notifications end-to-end
- [ ] Mobile nav works properly
- [ ] Homepage → login → onboarding → plan is smooth

---

## Next: Full Leftovers Tracking (Phase 10 remaining)

Goal: Make batch cooking feel strategic, not wasteful.

### Ideas
- Mark recipes as "makes leftovers" (yields 2x)
- Suggest leftover lunches for next day
- Simple fridge tracking list

---

## Future: Smart Features

- LLM-powered "Plan my week" suggestions
- Pantry scanning with vision
- Family member profiles in onboarding

---

## Bugs (backlog)

- [ ] Signout redirects to error instead of homepage
- [ ] Pages slow to load until cached — investigate

---

## Recently Completed

### Recipe Import Enhancements (Phase 11)
- [x] URL ingest with Readability content extraction
- [x] Photo ingest with Claude Vision API
- [x] Editable voice transcript before parsing
- [x] Four-tab import interface (Voice | URL | Photo | Paste)
- [x] Recipe settings (unit system, default servings)
- [x] Leftovers quick-add checkbox in feedback modal

### Bug Fixes
- [x] Center + add button in slots
- [x] Fix RLS violation when saving imported recipes
- [x] Fix "Done cooking" button visibility on mobile
- [x] Recipe tags align with system (pudding not dessert)

### "Everyone Ate" Feedback Loop (Phase 9)
- [x] Push notification at configurable time (default: 7pm)
- [x] Notification tap opens feedback modal
- [x] "Everyone Ate!" button with confetti animation
- [x] Data model: `meal_completions` table
- [x] Service worker for push events
- [x] Device notification settings in Settings page
- [x] Edge function `send-dinner-notifications`

### Calendar Export (Phase 7)
- [x] Generate .ics file from week's meal plan
- [x] Event format: "Dinner: [Meal Name]" at configured time
- [x] Trigger iOS share sheet for .ics file
- [x] Dinner time picker in Settings

### Shopping List (Phase 8)
- [x] Generate list from planned meals
- [x] Aggregate ingredients by name+unit
- [x] Group by category (10 aisles)
- [x] Pantry state (check off items, persists)
- [x] Copy List button (formatted with headers)
- [x] Send to Reminders via Apple Shortcut
