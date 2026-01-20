# tomorrow.md

## Current: Share to Calendar

Goal: Export weekly meal plan to external calendars (iOS, Google, Skylight).

### To Do
- [ ] Generate .ics file from week's meal plan
- [ ] Event format: "Dinner: [Meal Name]" at configured time (default 6pm)
- [ ] Trigger iOS share sheet for .ics file
- [ ] Add "Share to Calendar" button to week view

### Technical Notes
- Skylight syncs with Google/Apple calendars, so .ics import works
- Consider individual meal "Add to calendar" option later

---

## Next: "Everyone Ate" Notification & Feedback

Goal: Close the loop with a satisfying micro-interaction that brings users back daily.

### v1 (ship first)
- [ ] Push notification at configurable time (default: 7pm)
- [ ] Notification tap opens feedback modal
- [ ] "Everyone Ate!" button with confetti animation
- [ ] "Skip" option for meals not cooked
- [ ] Data model: meal completion status

### v2 (after v1 tested)
- [ ] Post-confetti rating: Hit / Fine / Miss (emoji buttons)
- [ ] Store rating for future "family favourites" feature

---

## Settings Additions

For new features:
- [ ] Dinner time picker (default 6pm) — for calendar events & notifications
- [ ] "Everyone Ate" notification toggle (default: on)
- [ ] Notification time picker (default: 30 mins after dinner)
- [ ] Sound toggle (default: off — sleeping children)

---

## Bugs (backlog)

- [ ] Signout redirects to error instead of homepage
- [ ] Pages slow to load until cached — investigate

---

## Pre-launch Checklist

- [ ] Full signup → onboard → plan → cook flow tested
- [ ] Partner/friend tests on their phone
- [ ] Mobile nav works properly
- [ ] Homepage → login → onboarding → plan is smooth

---

## Recently Completed

### Shopping List (merged to main)
- [x] Generate list from planned meals
- [x] Aggregate ingredients by name+unit
- [x] Group by category (10 aisles)
- [x] Pantry state (check off items, persists)
- [x] Copy List button (formatted with headers)
- [x] Send to Reminders via Apple Shortcut
