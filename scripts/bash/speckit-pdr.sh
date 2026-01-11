#!/usr/bin/env bash
#
# speckit-pdr.sh - PDR (Product Design Requirements) operations
#
# Usage:
#   speckit pdr list              List all PDRs with status
#   speckit pdr status            Show PDR summary
#   speckit pdr validate <file>   Validate PDR structure
#   speckit pdr path              Show PDR directory path
#

set -euo pipefail

# Source libraries
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/common.sh"
source "${SCRIPT_DIR}/lib/json.sh"

# Validate dependencies
require_jq

# =============================================================================
# Constants
# =============================================================================

readonly PDR_DIR=".specify/memory/pdrs"

# Required sections for a valid PDR
readonly REQUIRED_SECTIONS=(
  "Problem Statement"
  "Desired Outcome"
  "User Stories"
  "Success Criteria"
  "Acceptance Criteria"
)

# =============================================================================
# Help
# =============================================================================

show_help() {
  cat << 'EOF'
speckit pdr - PDR (Product Design Requirements) operations

USAGE:
    speckit pdr <command> [options]

COMMANDS:
    list                List all PDRs with status
    status              Show PDR summary (counts by status)
    show <file>         Show PDR details (title, status, stories)
    validate <file>     Validate PDR structure
    path                Show PDR directory path
    init                Create PDR directory if missing

OPTIONS:
    --json              Output in JSON format
    -h, --help          Show this help

PDR STATUS VALUES:
    Draft               Work in progress
    Ready               Complete, awaiting approval
    Approved            Ready for phase planning
    Implemented         Shipped (archive candidate)

EXAMPLES:
    speckit pdr list
    speckit pdr status
    speckit pdr show pdr-offline-mode.md
    speckit pdr validate pdr-offline-mode.md
    speckit pdr path
EOF
}

# =============================================================================
# Helpers
# =============================================================================

# Get PDR directory path
get_pdr_path() {
  local repo_root
  repo_root="$(get_repo_root)"
  echo "${repo_root}/${PDR_DIR}"
}

# Ensure PDR directory exists
ensure_pdr_dir() {
  local pdr_path
  pdr_path="$(get_pdr_path)"

  if [[ ! -d "$pdr_path" ]]; then
    log_error "PDR directory not found: $pdr_path"
    log_info "Create it with: speckit pdr init"
    exit 1
  fi
}

# Get PDR file path (handles relative and absolute)
resolve_pdr_file() {
  local file="$1"
  local pdr_path
  pdr_path="$(get_pdr_path)"

  # If absolute path, use as-is
  if [[ "$file" = /* ]]; then
    echo "$file"
    return
  fi

  # If already has path prefix, use as-is
  if [[ "$file" = */* ]]; then
    echo "$(get_repo_root)/$file"
    return
  fi

  # Otherwise, assume it's in PDR directory
  echo "${pdr_path}/${file}"
}

# Extract field from PDR frontmatter or body
extract_pdr_field() {
  local file="$1"
  local field="$2"
  local default="${3:-}"

  # Try frontmatter first (YAML-like)
  local value
  value=$(grep -E "^\*\*${field}\*\*:" "$file" 2>/dev/null | head -1 | sed "s/.*\*\*${field}\*\*:[[:space:]]*//" | tr -d '`')

  if [[ -n "$value" ]]; then
    echo "$value"
    return
  fi

  echo "$default"
}

# Extract PDR ID from file
get_pdr_id() {
  local file="$1"
  extract_pdr_field "$file" "PDR ID" "unknown"
}

# Extract PDR status from file
get_pdr_status() {
  local file="$1"
  local status_line
  status_line=$(extract_pdr_field "$file" "Status" "Draft")

  # Clean up - extract first word (Draft, Ready, Approved, Implemented)
  echo "$status_line" | awk '{print $1}' | tr -d '|'
}

# Extract PDR priority from file
get_pdr_priority() {
  local file="$1"
  extract_pdr_field "$file" "Priority" "-"
}

# Extract PDR title from file (first H1)
get_pdr_title() {
  local file="$1"
  grep -E "^# PDR:" "$file" 2>/dev/null | head -1 | sed 's/^# PDR:[[:space:]]*//'
}

# Count user stories in PDR
count_user_stories() {
  local file="$1"
  grep -cE "^### Story [0-9]" "$file" 2>/dev/null || echo "0"
}

# Check if section exists in PDR
has_section() {
  local file="$1"
  local section="$2"
  grep -qE "^## ${section}" "$file" 2>/dev/null
}

# =============================================================================
# Commands
# =============================================================================

cmd_list() {
  ensure_pdr_dir
  local pdr_path
  pdr_path="$(get_pdr_path)"

  # Find all PDR files (exclude README)
  local pdr_files=()
  while IFS= read -r -d '' file; do
    [[ "$(basename "$file")" == "README.md" ]] && continue
    pdr_files+=("$file")
  done < <(find "$pdr_path" -maxdepth 1 -name "*.md" -print0 2>/dev/null | sort -z)

  if [[ ${#pdr_files[@]} -eq 0 ]]; then
    if is_json_output; then
      echo '{"pdrs": [], "count": 0}'
    else
      log_info "No PDRs found in $PDR_DIR"
      log_info "Create one with: cp templates/pdr-template.md $PDR_DIR/pdr-my-feature.md"
    fi
    exit 0
  fi

  # Collect PDR data
  local pdrs=()
  local draft_count=0
  local ready_count=0
  local approved_count=0
  local implemented_count=0

  for file in "${pdr_files[@]}"; do
    local filename
    filename=$(basename "$file")
    local title
    title=$(get_pdr_title "$file")
    local status
    status=$(get_pdr_status "$file")
    local priority
    priority=$(get_pdr_priority "$file")
    local stories
    stories=$(count_user_stories "$file")

    pdrs+=("${filename}|${title}|${status}|${priority}|${stories}")

    case "$status" in
      Draft) ((draft_count++)) || true ;;
      Ready) ((ready_count++)) || true ;;
      Approved) ((approved_count++)) || true ;;
      Implemented) ((implemented_count++)) || true ;;
    esac
  done

  if is_json_output; then
    local json_pdrs="[]"
    for pdr_data in "${pdrs[@]}"; do
      IFS='|' read -r filename title status priority stories <<< "$pdr_data"
      json_pdrs=$(echo "$json_pdrs" | jq --arg f "$filename" --arg t "$title" --arg s "$status" --arg p "$priority" --arg c "$stories" \
        '. + [{"file": $f, "title": $t, "status": $s, "priority": $p, "stories": ($c | tonumber)}]')
    done
    echo "$json_pdrs" | jq "{pdrs: ., count: (. | length), by_status: {draft: $draft_count, ready: $ready_count, approved: $approved_count, implemented: $implemented_count}}"
  else
    # Three-Line Rule: Summary first
    echo -e "${BLUE}INFO${RESET}: ${#pdrs[@]} PDR(s) found"
    echo ""

    # PDR list with status indicators
    for pdr_data in "${pdrs[@]}"; do
      IFS='|' read -r filename title status priority stories <<< "$pdr_data"

      case "$status" in
        Draft)
          print_status pending "$filename - $title [$priority] ($stories stories)"
          ;;
        Ready)
          print_status progress "$filename - $title [$priority] ($stories stories)"
          ;;
        Approved)
          print_status ok "$filename - $title [$priority] ($stories stories)"
          ;;
        Implemented)
          echo -e "  ${DIM}✓ $filename - $title (implemented)${RESET}"
          ;;
        *)
          echo "  ? $filename - $title [$status]"
          ;;
      esac
    done
  fi
}

cmd_status() {
  ensure_pdr_dir
  local pdr_path
  pdr_path="$(get_pdr_path)"

  # Find all PDR files (exclude README)
  local draft_count=0
  local ready_count=0
  local approved_count=0
  local implemented_count=0
  local total_count=0

  while IFS= read -r -d '' file; do
    [[ "$(basename "$file")" == "README.md" ]] && continue

    ((total_count++)) || true
    local status
    status=$(get_pdr_status "$file")

    case "$status" in
      Draft) ((draft_count++)) || true ;;
      Ready) ((ready_count++)) || true ;;
      Approved) ((approved_count++)) || true ;;
      Implemented) ((implemented_count++)) || true ;;
    esac
  done < <(find "$pdr_path" -maxdepth 1 -name "*.md" -print0 2>/dev/null)

  if is_json_output; then
    echo "{\"total\": $total_count, \"draft\": $draft_count, \"ready\": $ready_count, \"approved\": $approved_count, \"implemented\": $implemented_count}"
  else
    echo -e "${BLUE}INFO${RESET}: $total_count PDR(s)"
    echo ""
    echo "  Draft:       $draft_count"
    echo "  Ready:       $ready_count"
    echo "  Approved:    $approved_count"
    echo "  Implemented: $implemented_count"

    if [[ $approved_count -gt 0 ]]; then
      echo ""
      log_info "$approved_count PDR(s) ready for phase creation: /speckit.phase"
    fi
  fi
}

cmd_show() {
  local file="$1"

  if [[ -z "$file" ]]; then
    log_error "File required"
    echo "Usage: speckit pdr show <file>"
    exit 1
  fi

  local pdr_file
  pdr_file=$(resolve_pdr_file "$file")

  if [[ ! -f "$pdr_file" ]]; then
    log_error "PDR not found: $pdr_file"
    exit 1
  fi

  local title
  title=$(get_pdr_title "$pdr_file")
  local pdr_id
  pdr_id=$(get_pdr_id "$pdr_file")
  local status
  status=$(get_pdr_status "$pdr_file")
  local priority
  priority=$(get_pdr_priority "$pdr_file")
  local stories
  stories=$(count_user_stories "$pdr_file")

  # Extract problem statement (first paragraph after ## Problem Statement)
  local problem
  problem=$(awk '/^## Problem Statement/,/^## / { if (!/^##/ && !/^$/ && !/^<!--/) print }' "$pdr_file" | head -3 | tr '\n' ' ' | sed 's/[[:space:]]*$//')

  if is_json_output; then
    jq -n --arg id "$pdr_id" --arg title "$title" --arg status "$status" --arg priority "$priority" --arg stories "$stories" --arg problem "$problem" \
      '{id: $id, title: $title, status: $status, priority: $priority, stories: ($stories | tonumber), problem: $problem}'
  else
    echo -e "${BOLD}$title${RESET}"
    echo ""
    echo "  ID:       $pdr_id"
    echo "  Status:   $status"
    echo "  Priority: $priority"
    echo "  Stories:  $stories"
    echo ""
    if [[ -n "$problem" ]]; then
      echo "  Problem:"
      echo "  $problem"
    fi
  fi
}

cmd_validate() {
  local file="$1"

  if [[ -z "$file" ]]; then
    log_error "File required"
    echo "Usage: speckit pdr validate <file>"
    exit 1
  fi

  local pdr_file
  pdr_file=$(resolve_pdr_file "$file")

  if [[ ! -f "$pdr_file" ]]; then
    log_error "PDR not found: $pdr_file"
    exit 1
  fi

  local errors=0
  local warnings=0

  log_step "Validating $(basename "$pdr_file")"

  # Check for required sections
  for section in "${REQUIRED_SECTIONS[@]}"; do
    if has_section "$pdr_file" "$section"; then
      print_status ok "Has section: $section"
    else
      log_error "Missing section: $section"
      ((errors++))
    fi
  done

  # Check for PDR ID
  local pdr_id
  pdr_id=$(get_pdr_id "$pdr_file")
  if [[ "$pdr_id" == "unknown" ]] || [[ "$pdr_id" == *"["* ]]; then
    log_warn "PDR ID not set or is placeholder"
    ((warnings++))
  else
    print_status ok "PDR ID: $pdr_id"
  fi

  # Check for at least one user story
  local stories
  stories=$(count_user_stories "$pdr_file")
  if [[ "$stories" -eq 0 ]]; then
    log_warn "No user stories found"
    ((warnings++))
  else
    print_status ok "User stories: $stories"
  fi

  # Check for TODO markers
  local todos
  todos=$(grep -c "\[TODO" "$pdr_file" 2>/dev/null || echo "0")
  if [[ "$todos" -gt 0 ]]; then
    log_warn "$todos TODO marker(s) remaining"
    ((warnings++))
  fi

  # Check for placeholder brackets
  local placeholders
  placeholders=$(grep -cE "\[[A-Z][A-Z_ ]+\]" "$pdr_file" 2>/dev/null || echo "0")
  if [[ "$placeholders" -gt 0 ]]; then
    log_warn "$placeholders placeholder(s) remaining (e.g., [FEATURE NAME])"
    ((warnings++))
  fi

  echo ""

  if [[ $errors -eq 0 ]]; then
    local status
    status=$(get_pdr_status "$pdr_file")
    if [[ $warnings -eq 0 ]]; then
      log_success "PDR is valid (status: $status)"
    else
      log_success "PDR is valid with $warnings warning(s) (status: $status)"
    fi

    if [[ "$status" == "Draft" && $warnings -eq 0 ]]; then
      log_info "Consider updating status to 'Ready' if complete"
    fi

    if is_json_output; then
      echo "{\"valid\": true, \"errors\": 0, \"warnings\": $warnings, \"status\": \"$status\"}"
    fi
    exit 0
  else
    log_error "Found $errors error(s) and $warnings warning(s)"
    if is_json_output; then
      echo "{\"valid\": false, \"errors\": $errors, \"warnings\": $warnings}"
    fi
    exit 1
  fi
}

cmd_path() {
  get_pdr_path
}

cmd_init() {
  local pdr_path
  pdr_path="$(get_pdr_path)"

  if [[ -d "$pdr_path" ]]; then
    log_info "PDR directory already exists: $pdr_path"
    exit 0
  fi

  mkdir -p "$pdr_path"

  # Create README if template exists
  local template_dir
  template_dir="$(get_repo_root)/templates"
  local readme_content='# Product Design Requirements (PDRs)

This directory contains PDRs - non-technical feature requirements.

See templates/pdr-template.md for the template.
'

  echo "$readme_content" > "${pdr_path}/README.md"

  log_success "Created PDR directory: $pdr_path"
}

# =============================================================================
# Main
# =============================================================================

main() {
  parse_common_flags "$@"
  set -- "${REMAINING_ARGS[@]:-}"

  if [[ $# -eq 0 ]]; then
    show_help
    exit 0
  fi

  local command="$1"
  shift

  case "$command" in
    list|ls)
      cmd_list
      ;;
    status|st)
      cmd_status
      ;;
    show)
      cmd_show "${1:-}"
      ;;
    validate)
      cmd_validate "${1:-}"
      ;;
    path)
      cmd_path
      ;;
    init)
      cmd_init
      ;;
    help|--help|-h)
      show_help
      exit 0
      ;;
    *)
      log_error "Unknown command: $command"
      echo "Run 'speckit pdr --help' for usage"
      exit 1
      ;;
  esac
}

main "$@"
