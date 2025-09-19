#!/bin/bash

# Comprehensive Test Script for Grocery API
# This script performs thorough testing including edge cases and performance

API_URL="${API_URL:-http://localhost:3000/api}"
EMAIL="test$(date +%s)@example.com"
PASSWORD="Test123!"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters for test results
PASSED=0
FAILED=0

# Test function
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_status="$3"

    echo -e "\n${YELLOW}Testing: $test_name${NC}"

    response=$(eval "$command")

    if echo "$response" | jq -e . >/dev/null 2>&1; then
        echo "$response" | jq '.'

        if [ -n "$expected_status" ]; then
            if echo "$response" | jq -e "$expected_status" >/dev/null 2>&1; then
                echo -e "${GREEN}✓ Test passed${NC}"
                ((PASSED++))
            else
                echo -e "${RED}✗ Test failed - unexpected response${NC}"
                ((FAILED++))
            fi
        else
            echo -e "${GREEN}✓ Test executed${NC}"
            ((PASSED++))
        fi
    else
        echo "$response"
        echo -e "${RED}✗ Test failed - invalid JSON${NC}"
        ((FAILED++))
    fi
}

echo "🚀 Starting Comprehensive Grocery API Tests..."
echo "============================================"

# 1. HEALTH CHECK TESTS
echo -e "\n${GREEN}=== HEALTH CHECK TESTS ===${NC}"
run_test "Health endpoint" \
    "curl -s '$API_URL/health'" \
    '.status == "healthy"'

# 2. AUTHENTICATION TESTS
echo -e "\n${GREEN}=== AUTHENTICATION TESTS ===${NC}"

run_test "Register new user" \
    "curl -s -X POST '$API_URL/auth/register' -H 'Content-Type: application/json' -d '{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}'" \
    '.message == "User registered successfully"'

run_test "Register duplicate user" \
    "curl -s -X POST '$API_URL/auth/register' -H 'Content-Type: application/json' -d '{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}'" \
    '.error == "User with this email already exists"'

run_test "Register with invalid email" \
    "curl -s -X POST '$API_URL/auth/register' -H 'Content-Type: application/json' -d '{\"email\":\"notanemail\",\"password\":\"$PASSWORD\"}'" \
    '.error != null'

run_test "Register with weak password" \
    "curl -s -X POST '$API_URL/auth/register' -H 'Content-Type: application/json' -d '{\"email\":\"weak@example.com\",\"password\":\"123\"}'" \
    '.error != null'

run_test "Login with valid credentials" \
    "curl -s -X POST '$API_URL/auth/login' -H 'Content-Type: application/json' -d '{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}'" \
    '.tokens.accessToken != null'

# Extract token for further tests
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.tokens.accessToken // empty')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get authentication token. Exiting...${NC}"
    exit 1
fi

run_test "Login with invalid password" \
    "curl -s -X POST '$API_URL/auth/login' -H 'Content-Type: application/json' -d '{\"email\":\"$EMAIL\",\"password\":\"WrongPass!\"}'" \
    '.error == "Invalid email or password"'

run_test "Login with non-existent user" \
    "curl -s -X POST '$API_URL/auth/login' -H 'Content-Type: application/json' -d '{\"email\":\"nonexistent@example.com\",\"password\":\"Test123!\"}'" \
    '.error == "Invalid email or password"'

# 3. GROCERY ITEM CRUD TESTS
echo -e "\n${GREEN}=== GROCERY ITEM CRUD TESTS ===${NC}"

run_test "Create item with all fields" \
    "curl -s -X POST '$API_URL/grocery-items' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"name\":\"Test Item\",\"quantity\":5,\"store\":\"Test Store\",\"category\":\"Test Category\",\"notes\":\"Test notes\"}'" \
    '.item.name == "Test Item"'

ITEM_ID=$(curl -s -X POST "$API_URL/grocery-items" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Update Test Item","quantity":1}' | jq -r '.item.id // empty')

run_test "Create item with minimal fields" \
    "curl -s -X POST '$API_URL/grocery-items' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"name\":\"Minimal Item\"}'" \
    '.item.quantity == 1'

run_test "Create item without auth" \
    "curl -s -X POST '$API_URL/grocery-items' -H 'Content-Type: application/json' -d '{\"name\":\"No Auth Item\"}'" \
    '.error == "Authorization header missing"'

run_test "Get all items" \
    "curl -s '$API_URL/grocery-items' -H 'Authorization: Bearer $TOKEN'" \
    '.items != null'

run_test "Get single item" \
    "curl -s '$API_URL/grocery-items/$ITEM_ID' -H 'Authorization: Bearer $TOKEN'" \
    '.item.id == '$ITEM_ID

run_test "Get non-existent item" \
    "curl -s '$API_URL/grocery-items/99999' -H 'Authorization: Bearer $TOKEN'" \
    '.error == "Grocery item not found"'

run_test "Update item - all fields" \
    "curl -s -X PUT '$API_URL/grocery-items/$ITEM_ID' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"name\":\"Updated\",\"quantity\":10,\"store\":\"New Store\",\"category\":\"New Cat\",\"notes\":\"Updated notes\",\"isPurchased\":true}'" \
    '.item.name == "Updated"'

run_test "Update item - partial fields" \
    "curl -s -X PUT '$API_URL/grocery-items/$ITEM_ID' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"quantity\":20}'" \
    '.item.quantity == 20'

run_test "Delete item" \
    "curl -s -X DELETE '$API_URL/grocery-items/$ITEM_ID' -H 'Authorization: Bearer $TOKEN'" \
    '.message == "Grocery item deleted successfully"'

run_test "Delete already deleted item" \
    "curl -s -X DELETE '$API_URL/grocery-items/$ITEM_ID' -H 'Authorization: Bearer $TOKEN'" \
    '.error == "Grocery item not found"'

# 4. FILTERING TESTS
echo -e "\n${GREEN}=== FILTERING TESTS ===${NC}"

# Add test data for filtering
curl -s -X POST "$API_URL/grocery-items" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"Filter Test 1","quantity":1,"store":"Store A","category":"Cat A"}' > /dev/null
curl -s -X POST "$API_URL/grocery-items" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"Filter Test 2","quantity":2,"store":"Store B","category":"Cat A"}' > /dev/null
curl -s -X POST "$API_URL/grocery-items" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"name":"Search Test","quantity":3,"store":"Store A","category":"Cat B"}' > /dev/null

run_test "Filter by store" \
    "curl -s '$API_URL/grocery-items?store=Store%20A' -H 'Authorization: Bearer $TOKEN'" \
    '.items | map(select(.store == "Store A")) | length == (.items | length)'

run_test "Filter by category" \
    "curl -s '$API_URL/grocery-items?category=Cat%20A' -H 'Authorization: Bearer $TOKEN'" \
    '.items | map(select(.category == "Cat A")) | length == (.items | length)'

run_test "Filter by purchase status" \
    "curl -s '$API_URL/grocery-items?isPurchased=false' -H 'Authorization: Bearer $TOKEN'" \
    '.items | map(select(.isPurchased == false)) | length == (.items | length)'

run_test "Search by name" \
    "curl -s '$API_URL/grocery-items?search=Search' -H 'Authorization: Bearer $TOKEN'" \
    '.count > 0'

run_test "Combined filters" \
    "curl -s '$API_URL/grocery-items?store=Store%20A&category=Cat%20A' -H 'Authorization: Bearer $TOKEN'" \
    '.items != null'

# 5. EDGE CASES AND VALIDATION
echo -e "\n${GREEN}=== EDGE CASES AND VALIDATION ===${NC}"

run_test "Create item with very long name (255 chars)" \
    "curl -s -X POST '$API_URL/grocery-items' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"name\":\"$(printf 'a%.0s' {1..255})\"}'" \
    '.item.name != null'

run_test "Create item with name exceeding limit (256 chars)" \
    "curl -s -X POST '$API_URL/grocery-items' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"name\":\"$(printf 'a%.0s' {1..256})\"}'" \
    '.error != null'

run_test "Create item with zero quantity" \
    "curl -s -X POST '$API_URL/grocery-items' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"name\":\"Zero Qty\",\"quantity\":0}'" \
    '.error != null'

run_test "Create item with negative quantity" \
    "curl -s -X POST '$API_URL/grocery-items' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"name\":\"Negative Qty\",\"quantity\":-5}'" \
    '.error != null'

run_test "Create item with empty name" \
    "curl -s -X POST '$API_URL/grocery-items' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{\"name\":\"\"}'" \
    '.error != null'

run_test "Update with empty body" \
    "curl -s -X PUT '$API_URL/grocery-items/1' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{}'" \
    '.error != null'

run_test "Invalid JSON body" \
    "curl -s -X POST '$API_URL/grocery-items' -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d 'not json'" \
    '.error != null'

# 6. AUTHORIZATION TESTS
echo -e "\n${GREEN}=== AUTHORIZATION TESTS ===${NC}"

run_test "Access items without token" \
    "curl -s '$API_URL/grocery-items'" \
    '.error == "Authorization header missing"'

run_test "Access items with malformed token" \
    "curl -s '$API_URL/grocery-items' -H 'Authorization: malformed_token'" \
    '.error != null'

run_test "Access items with expired token (simulated invalid)" \
    "curl -s '$API_URL/grocery-items' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAwMDAxfQ.invalid'" \
    '.error != null'

# 7. PERFORMANCE TESTS (BASIC)
echo -e "\n${GREEN}=== PERFORMANCE TESTS ===${NC}"

echo "Creating 10 items rapidly..."
START_TIME=$(date +%s%N)
for i in {1..10}; do
    curl -s -X POST "$API_URL/grocery-items" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"name\":\"Perf Test $i\",\"quantity\":$i}" > /dev/null &
done
wait
END_TIME=$(date +%s%N)
ELAPSED=$((($END_TIME - $START_TIME) / 1000000))
echo "Time taken for 10 parallel creates: ${ELAPSED}ms"

if [ $ELAPSED -lt 5000 ]; then
    echo -e "${GREEN}✓ Performance acceptable${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ Performance may be slow${NC}"
fi

# SUMMARY
echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}TEST SUMMARY${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed successfully!${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please review the output.${NC}"
    exit 1
fi