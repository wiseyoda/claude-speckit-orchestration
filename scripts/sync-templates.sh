#!/usr/bin/env bash
#
# sync-templates.sh - Update .specify/templates/ in all repos with latest templates
#
# Usage:
#   ./scripts/sync-templates.sh           # Dry run (show what would be updated)
#   ./scripts/sync-templates.sh --apply   # Actually update templates
#   ./scripts/sync-templates.sh --verbose # Show detailed diff info
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Source templates location
SOURCE_TEMPLATES="${HOME}/.specflow/templates"

# Flags
DRY_RUN=true
VERBOSE=false

# Parse arguments
for arg in "$@"; do
  case $arg in
    --apply)
      DRY_RUN=false
      ;;
    --verbose)
      VERBOSE=true
      ;;
    --help|-h)
      echo "Usage: $0 [--apply] [--verbose]"
      echo ""
      echo "Finds all repos with .specify/templates/ and updates them with latest templates."
      echo ""
      echo "Options:"
      echo "  --apply    Actually copy templates (default is dry run)"
      echo "  --verbose  Show detailed diff information"
      echo ""
      echo "Source: ${SOURCE_TEMPLATES}"
      exit 0
      ;;
  esac
done

# Check source exists
if [[ ! -d "$SOURCE_TEMPLATES" ]]; then
  echo -e "${RED}Error: Source templates not found at ${SOURCE_TEMPLATES}${NC}"
  echo "Run ./install.sh first to install templates."
  exit 1
fi

# Count source templates
SOURCE_COUNT=$(find "$SOURCE_TEMPLATES" -maxdepth 1 -type f \( -name "*.md" -o -name "*.yaml" \) | wc -l | tr -d ' ')
echo -e "${BLUE}Source: ${SOURCE_TEMPLATES} (${SOURCE_COUNT} templates)${NC}"
echo ""

if $DRY_RUN; then
  echo -e "${YELLOW}DRY RUN - No changes will be made. Use --apply to update.${NC}"
  echo ""
fi

# Find all .specify/templates directories
REPOS_UPDATED=0
REPOS_SKIPPED=0
FILES_UPDATED=0
FILES_ADDED=0

# Search common development directories
SEARCH_PATHS=(
  "${HOME}/dev"
  "${HOME}/Developer"
  "${HOME}/projects"
  "${HOME}/code"
  "${HOME}/repos"
  "${HOME}/src"
  "${HOME}/work"
)

# Build find command for existing paths
EXISTING_PATHS=()
for path in "${SEARCH_PATHS[@]}"; do
  if [[ -d "$path" ]]; then
    EXISTING_PATHS+=("$path")
  fi
done

if [[ ${#EXISTING_PATHS[@]} -eq 0 ]]; then
  echo -e "${YELLOW}No common dev directories found. Searching entire home directory...${NC}"
  EXISTING_PATHS=("${HOME}")
fi

echo "Searching in: ${EXISTING_PATHS[*]}"
echo ""

# Find all .specify/templates directories
while IFS= read -r -d '' templates_dir; do
  repo_dir=$(dirname "$(dirname "$templates_dir")")
  repo_name=$(basename "$repo_dir")

  # Skip the specflow repo itself (it has its own templates/)
  if [[ "$repo_dir" == *"/specflow" ]] && [[ -d "$repo_dir/templates" ]]; then
    echo -e "${YELLOW}Skipping${NC} ${repo_name} (specflow source repo)"
    ((REPOS_SKIPPED++))
    continue
  fi

  # Skip if templates_dir is actually ~/.specflow/templates
  if [[ "$templates_dir" == "$SOURCE_TEMPLATES" ]]; then
    continue
  fi

  echo -e "${BLUE}Checking${NC} ${repo_name}"

  REPO_CHANGES=0
  REPO_ADDS=0

  # Check each source template
  for src_file in "$SOURCE_TEMPLATES"/*.md "$SOURCE_TEMPLATES"/*.yaml; do
    [[ -e "$src_file" ]] || continue

    filename=$(basename "$src_file")
    dest_file="${templates_dir}/${filename}"

    if [[ -f "$dest_file" ]]; then
      # File exists - check if different
      if ! diff -q "$src_file" "$dest_file" > /dev/null 2>&1; then
        ((REPO_CHANGES++))
        ((FILES_UPDATED++))
        if $VERBOSE; then
          echo -e "  ${YELLOW}Update${NC} ${filename}"
          diff --color=auto "$dest_file" "$src_file" 2>/dev/null | head -20 || true
        else
          echo -e "  ${YELLOW}Update${NC} ${filename}"
        fi

        if ! $DRY_RUN; then
          cp "$src_file" "$dest_file"
        fi
      fi
    else
      # File doesn't exist - add it
      ((REPO_ADDS++))
      ((FILES_ADDED++))
      echo -e "  ${GREEN}Add${NC}    ${filename}"

      if ! $DRY_RUN; then
        cp "$src_file" "$dest_file"
      fi
    fi
  done

  if [[ $REPO_CHANGES -gt 0 ]] || [[ $REPO_ADDS -gt 0 ]]; then
    ((REPOS_UPDATED++))
    echo -e "  ${GREEN}→ ${REPO_CHANGES} updated, ${REPO_ADDS} added${NC}"
  else
    echo -e "  ${GREEN}→ Up to date${NC}"
  fi
  echo ""

done < <(find "${EXISTING_PATHS[@]}" -type d -name "templates" -path "*/.specify/templates" -print0 2>/dev/null)

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Repos with updates needed: ${REPOS_UPDATED}"
echo "Repos skipped:            ${REPOS_SKIPPED}"
echo "Files to update:          ${FILES_UPDATED}"
echo "Files to add:             ${FILES_ADDED}"
echo ""

if $DRY_RUN; then
  if [[ $FILES_UPDATED -gt 0 ]] || [[ $FILES_ADDED -gt 0 ]]; then
    echo -e "${YELLOW}Run with --apply to make these changes.${NC}"
  else
    echo -e "${GREEN}All repos are up to date!${NC}"
  fi
else
  echo -e "${GREEN}Done! All templates updated.${NC}"
fi
