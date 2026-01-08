# if you think of a feature put it here. the loops are set.

1. This should be global folder
   One last step — add to your ~/.zshrc to make commands available in all terminals:

echo 'source ~/Documents/meal-planning/scripts/git-workflow.sh' >> ~/.zshrc
source ~/.zshrc

2. The old @/lib/supabase.ts (browser singleton) isn't used anywhere now, so it can be deleted. But @/lib/supabase-server.ts should stay for admin functionality.
