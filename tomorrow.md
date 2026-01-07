Before you start:
git pull --rebase

## Completed

- Phase 0–4: Core functionality
- Phase 4.5: Skylight-inspired styling
- Phase 5: Drag & Drop (with bug fixes)

## Next: Phase 6 — Auth & Households

Goal: Your family can sign up and use this for real.

### Loop 6.1 Supabase Auth setup
- Enable auth in Supabase project
- Email/magic link authentication

### Loop 6.2 Sign up / sign in pages
- /login and /signup routes
- Form validation, error handling

### Loop 6.3 Household creation
- First user creates household, gets invite code
- Store household settings (name, Skylight email)

### Loop 6.4 Join household flow
- Enter invite code to join existing household

### Loop 6.5 User profile & settings page
- View/edit name, email
- Household settings

### Loop 6.6 Database Migration - RLS
- Enable RLS on all tables
- Add household_id to recipes (NULL = shared, non-null = private)
- Create RLS policies for data isolation

### Loop 6.7 Protected routes
- Redirect to login if not authenticated
- Replace hardcoded "isherwood" with user's actual household

### Loop 6.8 User profile & settings
- Settings page with Skylight email (for Phase 7)
- Sign out button

Stop condition: family members can create accounts and see their shared plan.

## Upcoming

| Phase | Name | Goal |
|-------|------|------|
| 7 | Calendar Export | Decisions on Skylight |
| 8 | Shopping List | Plan → Shop → Cook loop |
| 9 | Feedback Loop | Learn what works |
| 10 | Leftovers | Batch cooking pays forward |
| Later | Smart Features | LLM-powered suggestions |
