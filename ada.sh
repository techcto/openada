#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${OPENADA_URL:-https://openada.us}"
API_KEY="${OPENADA_API_KEY:-}"
SCAN_URL="${2:-https://openada.us/}"
SCAN_PAGES="${3:-5}"

if [[ -t 1 && -z "${NO_COLOR:-}" ]]; then
  RESET=$'\033[0m'
  BOLD=$'\033[1m'
  CYAN=$'\033[36m'
  GREEN=$'\033[32m'
  YELLOW=$'\033[33m'
  MUTED=$'\033[2m'
else
  RESET=''
  BOLD=''
  CYAN=''
  GREEN=''
  YELLOW=''
  MUTED=''
fi

curl_args=(-sS)
if [[ -n "$API_KEY" ]]; then
  curl_args+=(-H "Authorization: Bearer $API_KEY")
fi

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'Missing required command: %s\n' "$1" >&2
    exit 1
  }
}

json_check_summary() {
  node -e 'let s=""; process.stdin.on("data", (chunk) => { s += chunk }).on("end", () => { const value = JSON.parse(s); console.log(JSON.stringify({ ada: { score: value.ada?.score, grade: value.ada?.grade, violations: value.ada?.violationsCount }, language: { errors: value.language?.errors } }, null, 2)) })'
}

json_tools_summary() {
  node -e 'let s=""; process.stdin.on("data", (chunk) => { s += chunk }).on("end", () => { const value = JSON.parse(s); console.log(JSON.stringify({ tools: (value.result?.tools || []).map((tool) => tool.name) }, null, 2)) })'
}

json_page_summary() {
  node -e 'let s=""; process.stdin.on("data", (chunk) => { s += chunk }).on("end", () => { const value = JSON.parse(s); const data = value.result?.structuredContent || (value.result?.content?.[0]?.text ? JSON.parse(value.result.content[0].text) : value); console.log(JSON.stringify({ sourceUrl: data.sourceUrl, ada: { score: data.ada?.score, grade: data.ada?.grade, violations: data.ada?.violationsCount }, language: { errors: data.language?.errors } }, null, 2)) })'
}

print_heading() {
  printf '\n%s%s== %s ==%s\n' "$BOLD" "$CYAN" "$1" "$RESET"
}

print_ok() {
  printf '%s%s[ok]%s %s\n' "$GREEN" "$BOLD" "$RESET" "$1"
}

print_banner() {
  printf '%s%s\n' "$CYAN" "$BOLD"
  cat <<'EOF'
  ___  ____  _____ _   _    _    ____    _
 / _ \|  _ \| ____| \ | |  / \  |  _ \  / \
| | | | |_) |  _| |  \| | / _ \ | | | |/ _ \
| |_| |  __/| |___| |\  |/ ___ \| |_| / ___ \
 \___/|_|   |_____|_| \_/_/   \_\____/_/   \_\
        OPEN ACCESS FOR THE PUBLIC WEB
EOF
  printf '%s%s%s%s\n' "$RESET" "$MUTED" "OpenADA command-line demo - $BASE_URL" "$RESET"
}

run_mcp() {
  local payload="$1"
  local response
  response=$(curl "${curl_args[@]}" \
    -H 'Content-Type: application/json' \
    -H 'Accept: application/json, text/event-stream' \
    --data "$payload" \
    "$BASE_URL/mcp")

  case "$response" in
    \{*) printf '%s' "$response" ;;
    *) printf '%s\n' "$response" | sed -n 's/^data: //p' | tail -n 1 ;;
  esac
}

run_scan() {
  print_heading "Queue a ${SCAN_PAGES}-page site scan"
  local queued job_id status_json status pages_scanned pages_discovered current_url
  queued=$(curl "${curl_args[@]}" \
    -H 'Content-Type: application/json' \
    --data "{\"url\":\"$SCAN_URL\",\"maxPages\":$SCAN_PAGES,\"crawl\":true}" \
    "$BASE_URL/api/v1/scans")
  printf '%s\n' "$queued" | node -e 'let s=""; process.stdin.on("data", (chunk) => { s += chunk }).on("end", () => { const value = JSON.parse(s); console.log(JSON.stringify(value, null, 2)) })'
  job_id=$(printf '%s' "$queued" | node -e 'let s=""; process.stdin.on("data", (chunk) => { s += chunk }).on("end", () => { const value = JSON.parse(s); process.stdout.write(value.jobId || "") })')
  if [[ -z "$job_id" ]]; then
    printf 'The scan was not queued.\n' >&2
    exit 1
  fi

  print_heading "Poll scan progress"
  local spinner='|/-\'
  local spinner_index=0
  while :; do
    status_json=$(curl "${curl_args[@]}" "$BASE_URL/api/v1/scans/$job_id")
    IFS=$'\t' read -r status pages_scanned pages_discovered current_url <<< "$(printf '%s' "$status_json" | node -e 'let s=""; process.stdin.on("data", (chunk) => { s += chunk }).on("end", () => { const value = JSON.parse(s); const progress = value.progress || {}; process.stdout.write([value.status || "unknown", progress.pagesScanned || 0, progress.pagesDiscovered || 0, progress.currentUrl || "-"].join("\t")) })')"
    if [[ -t 1 ]]; then
      printf '\r%s[%s]%s %s/%s pages %s%s%s %s' "$YELLOW" "${spinner:spinner_index:1}" "$RESET" "$pages_scanned" "$pages_discovered" "$MUTED" "$current_url" "$RESET" ""
      spinner_index=$(( (spinner_index + 1) % ${#spinner} ))
    else
      printf '[%s] %s/%s pages, current URL: %s\n' "$status" "$pages_scanned" "$pages_discovered" "$current_url"
    fi

    case "$status" in
      completed)
        [[ -t 1 ]] && printf '\n'
        print_heading "Completed report summary"
        printf '%s\n' "$status_json" | node -e 'let s=""; process.stdin.on("data", (chunk) => { s += chunk }).on("end", () => { const value = JSON.parse(s); console.log(JSON.stringify({ jobId: value.jobId, url: value.url, maxPages: value.maxPages, status: value.status, result: value.result, error: value.error }, null, 2)) })'
        return
        ;;
      failed)
        [[ -t 1 ]] && printf '\n'
        printf '%s\n' "$status_json" | node -e 'let s=""; process.stdin.on("data", (chunk) => { s += chunk }).on("end", () => { const value = JSON.parse(s); console.error(JSON.stringify({ jobId: value.jobId, url: value.url, status: value.status, error: value.error }, null, 2)) })' >&2
        exit 1
        ;;
    esac
    sleep 2
  done
}

require_command curl
require_command node
print_banner

print_heading "OpenADA health"
curl "${curl_args[@]}" "$BASE_URL/api/health"
printf '\n'
print_ok "API is reachable"

print_heading "Combined accessibility and language check"
check_response=$(curl "${curl_args[@]}" \
  -H 'Content-Type: application/json' \
  --data '{"html":"<main><h1>Hello OpenADA</h1><p>A command-line accessibility test.</p></main>","language":"en-US"}' \
  "$BASE_URL/api/v1/check")
printf '%s\n' "$check_response" | json_check_summary
print_ok "Combined accessibility and language check completed"

print_heading "MCP tool discovery"
tools_response=$(run_mcp '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}')
printf '%s\n' "$tools_response" | json_tools_summary
print_ok "MCP tools discovered"

print_heading "MCP page check"
page_response=$(run_mcp "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"openada_check_page\",\"arguments\":{\"url\":\"$BASE_URL/\"}}}")
printf '%s\n' "$page_response" | json_page_summary
print_ok "MCP page check completed"

if [[ "${1:-}" == "scan" ]]; then
  run_scan
else
  printf '\n%sTry a bounded site scan:%s %s scan https://example.com 5\n' "$MUTED" "$RESET" "$0"
fi
