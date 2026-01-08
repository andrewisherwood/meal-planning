# Contributing to Meal Planning

## Git Workflow

We use a **feature branch workflow** with pull requests. No direct pushes to `main`.

### Quick Reference

```bash
# Start new work
newbranch feature my-feature-name   # or: fix, chore

# Create PR when ready
pr "Add my feature"                  # or: prdraft for draft PR

# After review, merge
prmerge                              # squash merge + delete branch
```

### Setup

Add to your `~/.zshrc`:

```bash
source /Users/andrew/Documents/meal-planning/scripts/git-workflow.sh
```

Then reload: `source ~/.zshrc`

---

## Workflow Steps

### 1. Create a Feature Branch

```bash
newbranch <type> <name>
```

**Types:**
- `feature` — New functionality
- `fix` — Bug fixes
- `chore` — Maintenance, refactoring, deps

**Examples:**
```bash
newbranch feature calendar-export
newbranch fix mobile-drag-drop
newbranch chore update-dependencies
```

This will:
1. Switch to `main` and pull latest
2. Create and checkout `<type>/<name>` branch

### 2. Make Your Changes

Work normally. Commit often with clear messages:

```bash
git add .
git commit -m "Add calendar export button to settings"
```

### 3. Create a Pull Request

When ready for review:

```bash
pr "Add calendar export feature"
```

Or create a draft if still WIP:

```bash
prdraft "WIP: Calendar export"
```

This will:
1. Push your branch to GitHub
2. Open PR creation (uses template)

### 4. Review Process

- Claude reviews for code quality + security
- Address any feedback with additional commits
- Use `prview` to open PR in browser
- Use `prstatus` to check PR status

### 5. Merge

After approval:

```bash
prmerge
```

This will:
1. Squash merge to `main`
2. Delete the feature branch (local + remote)
3. Switch back to `main` and pull

---

## Available Commands

| Command | Description |
|---------|-------------|
| `newbranch <type> <name>` | Create feature/fix/chore branch |
| `pr [title]` | Push and create PR |
| `prdraft [title]` | Push and create draft PR |
| `prview` | Open current PR in browser |
| `prlist` | List all open PRs |
| `prmerge` | Squash merge and cleanup |
| `prstatus` | Show PR status |

---

## Branch Protection

The `main` branch is protected:
- Requires PR before merging
- Direct pushes blocked

---

## PR Template

PRs use a template with sections for:
- Summary of changes
- Type of change (feature/fix/chore)
- Checklist (tests, security, manual testing)
- Evidence traceability (for AI-assisted work)

Fill out the template completely before requesting review.

---

## Code Style

- Follow existing patterns in the codebase
- No over-engineering (see `claude.md`)
- Prefer boring, reliable solutions
- Test manually on desktop + mobile for UI changes
