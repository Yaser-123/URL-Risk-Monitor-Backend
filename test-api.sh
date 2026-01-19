#!/bin/bash
# Backend API Test Script
# Usage: bash test-api.sh
# Or copy-paste individual commands

BASE_URL="http://localhost:3000"

echo "======================================"
echo "Backend API Test Suite"
echo "======================================"
echo ""

# Test 1: Health Check
echo "✅ Test 1: Health Check"
curl -s $BASE_URL | jq
echo ""
echo ""

# Test 2: Add Trusted Domain (Google)
echo "✅ Test 2: Add Trusted Domain (google.com)"
curl -s -X POST $BASE_URL/api/trusted-domains \
  -H "Content-Type: application/json" \
  -d '{"domain": "https://www.Google.com/search?q=test", "trust_level": "full", "source": "manual"}' | jq
echo ""
echo ""

# Test 3: Add Another Trusted Domain (GitHub)
echo "✅ Test 3: Add Trusted Domain (github.com)"
curl -s -X POST $BASE_URL/api/trusted-domains \
  -H "Content-Type: application/json" \
  -d '{"domain": "GITHUB.COM", "trust_level": "full", "source": "manual"}' | jq
echo ""
echo ""

# Test 4: Try Adding Duplicate (should fail)
echo "✅ Test 4: Try Adding Duplicate (should return 409)"
curl -s -X POST $BASE_URL/api/trusted-domains \
  -H "Content-Type: application/json" \
  -d '{"domain": "google.com", "trust_level": "full"}' | jq
echo ""
echo ""

# Test 5: Get All Trusted Domains
echo "✅ Test 5: Get All Trusted Domains"
curl -s $BASE_URL/api/trusted-domains | jq
echo ""
echo ""

# Test 6: Check if google.com is Trusted
echo "✅ Test 6: Check if google.com is Trusted"
curl -s $BASE_URL/api/trusted-domains/google.com | jq
echo ""
echo ""

# Test 7: Check if unknown.com is Trusted
echo "✅ Test 7: Check if unknown.com is Trusted"
curl -s $BASE_URL/api/trusted-domains/unknown.com | jq
echo ""
echo ""

# Test 8: Log Trusted Domain Stats (should skip)
echo "✅ Test 8: Log Trusted Domain Stats (should skip)"
curl -s -X POST $BASE_URL/api/stats \
  -H "Content-Type: application/json" \
  -d '{"domain": "www.google.com", "riskLevel": "high"}' | jq
echo ""
echo ""

# Test 9: Log Untrusted Domain (first time)
echo "✅ Test 9: Log Untrusted Domain - First Visit"
curl -s -X POST $BASE_URL/api/stats \
  -H "Content-Type: application/json" \
  -d '{"domain": "https://sketchy-phishing-site.com/login", "riskLevel": "high"}' | jq
echo ""
echo ""

# Test 10: Log Same Domain Again (should rate limit)
echo "✅ Test 10: Log Same Domain Again (should rate limit)"
curl -s -X POST $BASE_URL/api/stats \
  -H "Content-Type: application/json" \
  -d '{"domain": "sketchy-phishing-site.com", "riskLevel": "high"}' | jq
echo ""
echo ""

# Test 11: Log Different Untrusted Domain
echo "✅ Test 11: Log Different Untrusted Domain"
curl -s -X POST $BASE_URL/api/stats \
  -H "Content-Type: application/json" \
  -d '{"domain": "malicious-site.net", "riskLevel": "medium"}' | jq
echo ""
echo ""

# Test 12: Get Stats Summary
echo "✅ Test 12: Get Stats Summary"
curl -s $BASE_URL/api/stats/summary | jq
echo ""
echo ""

echo "======================================"
echo "🎉 All Tests Complete!"
echo "======================================"
echo ""
echo "Expected Results:"
echo "  ✅ 2 trusted domains added (google.com, github.com)"
echo "  ✅ Duplicate insertion rejected (409 error)"
echo "  ✅ Trusted domain stats skipped (logged: false)"
echo "  ✅ 2 untrusted domains logged (sketchy-phishing-site.com, malicious-site.net)"
echo "  ✅ Rate limiting prevented duplicate (logged: false)"
echo "  ✅ Stats summary shows 2 unique domains"
echo ""
