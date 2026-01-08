#!/bin/bash
# Git workflow helper functions for feature branch + PR workflow
# Source this file in your .zshrc: source /path/to/git-workflow.sh

# Create and checkout a new branch
# Usage: newbranch <type> <name>
# Example: newbranch feature calendar-sync
# Example: newbranch fix drag-drop-mobile
# Example: newbranch chore update-deps
newbranch() {
  local type="$1"
  local name="$2"

  if [[ -z "$type" || -z "$name" ]]; then
    echo "Usage: newbranch <type> <name>"
    echo "Types: feature, fix, chore"
    echo "Example: newbranch feature calendar-sync"
    return 1
  fi

  # Validate type
  if [[ "$type" != "feature" && "$type" != "fix" && "$type" != "chore" ]]; then
    echo "Error: type must be 'feature', 'fix', or 'chore'"
    return 1
  fi

  local branch="${type}/${name}"

  # Ensure we're on main and up to date
  echo "Switching to main and pulling latest..."
  git checkout main && git pull origin main

  # Create and checkout new branch
  echo "Creating branch: $branch"
  git checkout -b "$branch"

  echo "Ready to work on $branch"
}

# Push current branch and create a PR
# Usage: pr [title]
# If no title provided, uses branch name
pr() {
  local branch=$(git branch --show-current)

  if [[ "$branch" == "main" ]]; then
    echo "Error: Cannot create PR from main branch"
    echo "Use 'newbranch <type> <name>' to create a feature branch first"
    return 1
  fi

  # Push branch to origin
  echo "Pushing $branch to origin..."
  git push -u origin "$branch"

  # Create PR
  echo "Creating pull request..."
  if [[ -n "$1" ]]; then
    gh pr create --title "$1" --fill
  else
    gh pr create --fill
  fi
}

# Push current branch and create a draft PR
# Usage: prdraft [title]
prdraft() {
  local branch=$(git branch --show-current)

  if [[ "$branch" == "main" ]]; then
    echo "Error: Cannot create PR from main branch"
    echo "Use 'newbranch <type> <name>' to create a feature branch first"
    return 1
  fi

  # Push branch to origin
  echo "Pushing $branch to origin..."
  git push -u origin "$branch"

  # Create draft PR
  echo "Creating draft pull request..."
  if [[ -n "$1" ]]; then
    gh pr create --title "$1" --fill --draft
  else
    gh pr create --fill --draft
  fi
}

# View current PR in browser
prview() {
  gh pr view --web
}

# List open PRs
prlist() {
  gh pr list
}

# Merge current PR (squash) and delete branch
prmerge() {
  local branch=$(git branch --show-current)

  echo "Squash merging PR and deleting branch..."
  gh pr merge --squash --delete-branch

  echo "Switching to main..."
  git checkout main && git pull origin main

  echo "Done! Merged and cleaned up."
}

# Quick status check
prstatus() {
  gh pr status
}
