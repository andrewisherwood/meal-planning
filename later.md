# Later / Parking Lot

Ideas and notes that don't belong in the current loop.

---

## Dev Environment

1. Make git-workflow.sh global:
   ```bash
   echo 'source ~/Documents/meal-planning/scripts/git-workflow.sh' >> ~/.zshrc
   source ~/.zshrc
   ```

---

## Warnings to Investigate

1. Next.js middleware deprecation warning:

   > The "middleware" file convention is deprecated. Please use "proxy" instead.

   Check: https://nextjs.org/docs/messages/middleware-to-proxy

   (May not apply to Supabase auth middleware pattern)

---

## Cleanup (non-blocking)

- Footer copyright is hardcoded to 2025
- Recipes page still uses inline styles (existing code, just moved)
- Components import types from page file — could extract to shared types later
- Settings page has mixed CSS variable syntax (cosmetic)

---

## Future Ideas

- Skylight email integration (send plan to Skylight calendar)
- Pantry scanning with LLM vision
- "Plan my week" AI suggestions
- Nutrition info (optional, non-judgmental)
- Family member profiles (names, ages, dietary requirements)
- PDF recipe import (convert to image or extract text)

---

## Bugs

- Send to Reminders needs visual prompt explaining you need to press the button twice and have Shopping set up in Reminders app
- Make sure active nav highlighting works for shopping and calendar
