#!/usr/bin/env bash
set -euo pipefail

REPO="alloydwhitlock/distracted-work-mozilla-extension"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_HTML="$ROOT_DIR/opensource.html"
OVERRIDES="$SCRIPT_DIR/changelog-overrides.json"

# --- helpers ---

html_escape() {
  local text="$1"
  text="${text//&/&amp;}"
  text="${text//</&lt;}"
  text="${text//>/&gt;}"
  printf '%s' "$text"
}

format_date() {
  local iso_date="$1"
  # Extract year and month number from ISO date
  local year month_num
  year="${iso_date:0:4}"
  month_num="${iso_date:5:2}"
  # Remove leading zero
  month_num="${month_num#0}"

  local -a months=(
    "" "January" "February" "March" "April" "May" "June"
    "July" "August" "September" "October" "November" "December"
  )
  printf '%s %s' "${months[$month_num]}" "$year"
}

# --- fetch releases ---

echo "Fetching releases from $REPO..."
releases_json=$(gh api --paginate "repos/$REPO/releases" \
  --jq 'sort_by(.published_at) | reverse | .[] | {tag_name, published_at, body}')

if [[ -z "$releases_json" ]]; then
  echo "Error: no releases found" >&2
  exit 1
fi

# --- build HTML ---

changelog_html=""

while IFS= read -r release_line; do
  tag=$(echo "$release_line" | jq -r '.tag_name')
  published=$(echo "$release_line" | jq -r '.published_at')
  body=$(echo "$release_line" | jq -r '.body')
  date_str=$(format_date "$published")

  # Check for override
  has_override=$(jq -r --arg t "$tag" 'has($t)' "$OVERRIDES")

  entry="    <div class=\"changelog-entry\">\n"
  entry+="      <h3>$tag</h3>\n"
  entry+="      <p class=\"date\">$date_str</p>\n"

  if [[ "$has_override" == "true" ]]; then
    # Use override items
    entry+="      <ul>\n"
    while IFS= read -r item; do
      escaped=$(html_escape "$item")
      entry+="        <li>$escaped</li>\n"
    done < <(jq -r --arg t "$tag" '.[$t][]' "$OVERRIDES")
    entry+="      </ul>\n"
  else
    # Parse "What's Changed" bullet points from release body
    # Only extract bullets between "## What's Changed" and the next "##" heading
    # Deduplicate lines (handles v1.2.6 double body)
    items=()
    whats_changed=$(echo "$body" | awk '
      /^## What'\''s Changed/ { capture=1; next }
      /^## / { capture=0 }
      capture && /^\* / { print }
    ' | awk '!seen[$0]++')
    while IFS= read -r line; do
      [[ -z "$line" ]] && continue
      # Strip leading "* "
      line="${line#\* }"
      # Strip " by @author in https://..." suffix
      line=$(echo "$line" | sed -E 's/ by @[^ ]+ in https:\/\/[^ ]+$//')
      items+=("$line")
    done <<< "$whats_changed"

    if [[ ${#items[@]} -gt 0 ]]; then
      entry+="      <ul>\n"
      for item in "${items[@]}"; do
        escaped=$(html_escape "$item")
        entry+="        <li>$escaped</li>\n"
      done
      entry+="      </ul>\n"
    fi
  fi

  entry+="    </div>"

  if [[ -n "$changelog_html" ]]; then
    changelog_html+="\n"
  fi
  changelog_html+="$entry"

done < <(echo "$releases_json" | jq -c '.')

# --- splice into opensource.html ---

echo "Updating $TARGET_HTML..."

# Build the replacement block
replacement="    <!-- CHANGELOG_START -->\n${changelog_html}\n    <!-- CHANGELOG_END -->"

# Use awk to replace between markers
awk -v replacement="$replacement" '
  /<!-- CHANGELOG_START -->/ {
    found_start = 1
    # Print the replacement (printf interprets \n)
    n = split(replacement, lines, "\\n")
    for (i = 1; i <= n; i++) print lines[i]
    next
  }
  /<!-- CHANGELOG_END -->/ {
    found_start = 0
    next
  }
  !found_start { print }
' "$TARGET_HTML" > "$TARGET_HTML.tmp"

mv "$TARGET_HTML.tmp" "$TARGET_HTML"

# Count entries
entry_count=$(grep -c 'class="changelog-entry"' "$TARGET_HTML")
echo "Done. $entry_count changelog entries written."
