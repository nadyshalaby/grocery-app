#!/bin/bash

# Test script for Grocery API
# This script tests all API endpoints

API_URL="${API_URL:-http://localhost:3000/api}"
EMAIL="test@example.com"
PASSWORD="Test123!"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Starting Grocery API Tests..."
echo "================================"

# Test Health Endpoint
echo -e "\n${GREEN}1. Testing Health Check${NC}"
curl -s "$API_URL/health" | jq '.' || echo "Health check failed"

# Test User Registration
echo -e "\n${GREEN}2. Testing User Registration${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "$REGISTER_RESPONSE" | jq '.' || echo "Registration failed"

# Test User Login
echo -e "\n${GREEN}3. Testing User Login${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "$LOGIN_RESPONSE" | jq '.' || echo "Login failed"

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get authentication token. Exiting...${NC}"
    exit 1
fi

echo "Token obtained successfully!"

# Test Create Grocery Item
echo -e "\n${GREEN}4. Testing Create Grocery Item${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/grocery-items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Milk",
    "quantity": 2,
    "store": "Walmart",
    "category": "Dairy",
    "notes": "2% milk"
  }')

echo "$CREATE_RESPONSE" | jq '.' || echo "Create item failed"

# Extract item ID
ITEM_ID=$(echo "$CREATE_RESPONSE" | jq -r '.item.id // empty')

# Create more items for testing
echo -e "\n${GREEN}5. Creating Additional Items${NC}"
curl -s -X POST "$API_URL/grocery-items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Bread", "quantity": 1, "store": "Walmart", "category": "Bakery"}' | jq '.'

curl -s -X POST "$API_URL/grocery-items" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Apples", "quantity": 5, "store": "Whole Foods", "category": "Produce"}' | jq '.'

# Test Get All Items
echo -e "\n${GREEN}6. Testing Get All Items${NC}"
curl -s "$API_URL/grocery-items" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# Test Get Single Item
if [ ! -z "$ITEM_ID" ]; then
    echo -e "\n${GREEN}7. Testing Get Single Item${NC}"
    curl -s "$API_URL/grocery-items/$ITEM_ID" \
      -H "Authorization: Bearer $TOKEN" | jq '.'

    # Test Update Item
    echo -e "\n${GREEN}8. Testing Update Item${NC}"
    curl -s -X PUT "$API_URL/grocery-items/$ITEM_ID" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "name": "Whole Milk",
        "quantity": 3,
        "is_purchased": true
      }' | jq '.'

    # Test Delete Item
    echo -e "\n${GREEN}9. Testing Delete Item${NC}"
    curl -s -X DELETE "$API_URL/grocery-items/$ITEM_ID" \
      -H "Authorization: Bearer $TOKEN" | jq '.'
fi

# Test filtering
echo -e "\n${GREEN}10. Testing Item Filtering${NC}"
echo "By category:"
curl -s "$API_URL/grocery-items?category=Produce" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n${GREEN}✅ All tests completed!${NC}"
echo "================================"