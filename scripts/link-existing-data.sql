-- Link Existing Data to Auth User
-- Run this after signing up via the app to link your auth user to existing household data
--
-- Usage:
-- 1. Sign up at /login with your email
-- 2. Check your email and click the magic link
-- 3. Replace 'your@email.com' below with your actual email
-- 4. Run this script via Supabase SQL editor or MCP

-- Link a specific household member to an auth user
UPDATE household_members
SET user_id = (SELECT id FROM auth.users WHERE email = 'your@email.com')
WHERE household_id = (SELECT id FROM households WHERE slug = 'isherwood')
AND name = 'Andy';

-- Verify the link worked
SELECT
  hm.name,
  hm.role,
  hm.user_id,
  au.email
FROM household_members hm
LEFT JOIN auth.users au ON hm.user_id = au.id
WHERE hm.household_id = (SELECT id FROM households WHERE slug = 'isherwood');
