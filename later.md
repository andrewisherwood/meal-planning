# Later / Parking Lot

Ideas and notes that don't belong in the current loop.

## Dev Environment

1. Make git-workflow.sh global:
   ```bash
   echo 'source ~/Documents/meal-planning/scripts/git-workflow.sh' >> ~/.zshrc
   source ~/.zshrc
   ```

## Warnings to Investigate

1. Next.js middleware deprecation warning:
   > The "middleware" file convention is deprecated. Please use "proxy" instead.

   Check: https://nextjs.org/docs/messages/middleware-to-proxy

   (May not apply to Supabase auth middleware pattern)

## Future Ideas

- Skylight email integration (send plan to Skylight calendar)
- Recipe import from URL (parse ingredients/steps)
- Pantry scanning with LLM vision
- "Plan my week" AI suggestions
- Nutrition info (optional, non-judgmental)
