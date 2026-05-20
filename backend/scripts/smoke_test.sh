#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:8000}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_cmd curl
require_cmd jq

TMP_DIR="$(mktemp -d)"
TEST_FILE="$TMP_DIR/test.txt"
echo "smoke-test-file" > "$TEST_FILE"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

assert_success() {
  local json="$1"
  local label="$2"

  if [[ "$(echo "$json" | jq -r '.success')" != "true" ]]; then
    echo "FAILED: $label" >&2
    echo "$json" | jq >&2 || echo "$json" >&2
    exit 1
  fi
}

request_json() {
  local method="$1"
  local url="$2"
  shift 2

  curl -sS -X "$method" "$url" "$@"
}

suffix="$(date +%s)"
alice_login="alice_${suffix}"
bob_login="bob_${suffix}"

echo "[1/10] health"
health_json="$(request_json GET "$BASE_URL/health")"
assert_success "$health_json" "health"
echo "$health_json" | jq

echo "[2/10] register alice"
alice_register_json="$(request_json POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"login\":\"$alice_login\",\"password\":\"secret123\",\"display_name\":\"Alice Smoke\"}")"
assert_success "$alice_register_json" "register alice"
ALICE_TOKEN="$(echo "$alice_register_json" | jq -r '.data.token')"
ALICE_ID="$(echo "$alice_register_json" | jq -r '.data.user.id')"
echo "$alice_register_json" | jq

echo "[3/10] register bob"
bob_register_json="$(request_json POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"login\":\"$bob_login\",\"password\":\"secret123\",\"display_name\":\"Bob Smoke\"}")"
assert_success "$bob_register_json" "register bob"
BOB_TOKEN="$(echo "$bob_register_json" | jq -r '.data.token')"
BOB_ID="$(echo "$bob_register_json" | jq -r '.data.user.id')"
echo "$bob_register_json" | jq

echo "[4/10] search bob as alice"
search_json="$(request_json GET "$BASE_URL/users/search?query=$bob_login" \
  -H "Authorization: Bearer $ALICE_TOKEN")"
assert_success "$search_json" "search users"
echo "$search_json" | jq

echo "[5/10] create and accept contact request"
contact_request_json="$(request_json POST "$BASE_URL/contacts/requests" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$BOB_ID\"}")"
assert_success "$contact_request_json" "create contact request"
REQUEST_ID="$(echo "$contact_request_json" | jq -r '.data.request_id')"
echo "$contact_request_json" | jq

accept_json="$(request_json POST "$BASE_URL/contacts/requests/$REQUEST_ID/accept" \
  -H "Authorization: Bearer $BOB_TOKEN")"
assert_success "$accept_json" "accept contact request"
echo "$accept_json" | jq

echo "[6/10] create session for alice"
session_json="$(request_json POST "$BASE_URL/sessions" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"hello from smoke test"}')"
assert_success "$session_json" "create session"
SESSION_CODE="$(echo "$session_json" | jq -r '.data.code')"
echo "$session_json" | jq

echo "[7/10] update session text"
update_json="$(request_json PUT "$BASE_URL/sessions/$SESSION_CODE/text" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"edited by smoke test"}')"
assert_success "$update_json" "update session text"
echo "$update_json" | jq

echo "[8/10] upload file"
upload_json="$(request_json POST "$BASE_URL/sessions/$SESSION_CODE/files" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -F "file=@$TEST_FILE")"
assert_success "$upload_json" "upload file"
FILE_ID="$(echo "$upload_json" | jq -r '.data.files[0].id')"
echo "$upload_json" | jq

echo "[9/10] download and delete file"
DOWNLOADED_FILE="$TMP_DIR/downloaded.txt"
curl -sS "$BASE_URL/sessions/$SESSION_CODE/files/$FILE_ID" -o "$DOWNLOADED_FILE"
cmp "$TEST_FILE" "$DOWNLOADED_FILE"
echo "download ok"

delete_file_json="$(request_json DELETE "$BASE_URL/sessions/$SESSION_CODE/files/$FILE_ID" \
  -H "Authorization: Bearer $ALICE_TOKEN")"
assert_success "$delete_file_json" "delete file"
echo "$delete_file_json" | jq

echo "[10/10] create contact session and delete session"
contact_session_json="$(request_json POST "$BASE_URL/sessions/for-contact/$BOB_ID" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"for contact"}')"
assert_success "$contact_session_json" "create session for contact"
CONTACT_SESSION_CODE="$(echo "$contact_session_json" | jq -r '.data.code')"
echo "$contact_session_json" | jq

delete_session_json="$(request_json DELETE "$BASE_URL/sessions/$SESSION_CODE" \
  -H "Authorization: Bearer $ALICE_TOKEN")"
assert_success "$delete_session_json" "delete session"
echo "$delete_session_json" | jq

echo "Smoke test completed successfully."
echo "Alice login: $alice_login"
echo "Bob login: $bob_login"
echo "Contact session code: $CONTACT_SESSION_CODE"
