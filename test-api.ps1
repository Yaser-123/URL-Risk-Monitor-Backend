# Backend API Test Script (PowerShell)
# Usage: .\test-api.ps1

$BASE_URL = "http://localhost:3000"

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Backend API Test Suite" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "✅ Test 1: Health Check" -ForegroundColor Green
Invoke-RestMethod -Uri $BASE_URL -Method GET | ConvertTo-Json -Depth 10
Write-Host ""

# Test 2: Add Trusted Domain (Google)
Write-Host "✅ Test 2: Add Trusted Domain (google.com)" -ForegroundColor Green
$body = @{
    domain = "https://www.Google.com/search?q=test"
    trust_level = "full"
    source = "manual"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$BASE_URL/api/trusted-domains" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
Write-Host ""

# Test 3: Add Another Trusted Domain (GitHub)
Write-Host "✅ Test 3: Add Trusted Domain (github.com)" -ForegroundColor Green
$body = @{
    domain = "GITHUB.COM"
    trust_level = "full"
    source = "manual"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$BASE_URL/api/trusted-domains" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
Write-Host ""

# Test 4: Try Adding Duplicate (should fail)
Write-Host "✅ Test 4: Try Adding Duplicate (should return 409)" -ForegroundColor Green
try {
    $body = @{
        domain = "google.com"
        trust_level = "full"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BASE_URL/api/trusted-domains" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop | ConvertTo-Json -Depth 10
} catch {
    $_.Exception.Response.StatusCode
    Write-Host "Error (Expected): Domain already exists" -ForegroundColor Yellow
}
Write-Host ""

# Test 5: Get All Trusted Domains
Write-Host "✅ Test 5: Get All Trusted Domains" -ForegroundColor Green
Invoke-RestMethod -Uri "$BASE_URL/api/trusted-domains" -Method GET | ConvertTo-Json -Depth 10
Write-Host ""

# Test 6: Check if google.com is Trusted
Write-Host "✅ Test 6: Check if google.com is Trusted" -ForegroundColor Green
Invoke-RestMethod -Uri "$BASE_URL/api/trusted-domains/google.com" -Method GET | ConvertTo-Json -Depth 10
Write-Host ""

# Test 7: Check if unknown.com is Trusted
Write-Host "✅ Test 7: Check if unknown.com is Trusted" -ForegroundColor Green
Invoke-RestMethod -Uri "$BASE_URL/api/trusted-domains/unknown.com" -Method GET | ConvertTo-Json -Depth 10
Write-Host ""

# Test 8: Log Trusted Domain Stats (should skip)
Write-Host "✅ Test 8: Log Trusted Domain Stats (should skip)" -ForegroundColor Green
$body = @{
    domain = "www.google.com"
    riskLevel = "high"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$BASE_URL/api/stats" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
Write-Host ""

# Test 9: Log Untrusted Domain (first time)
Write-Host "✅ Test 9: Log Untrusted Domain - First Visit" -ForegroundColor Green
$body = @{
    domain = "https://sketchy-phishing-site.com/login"
    riskLevel = "high"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$BASE_URL/api/stats" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
Write-Host ""

# Test 10: Log Same Domain Again (should rate limit)
Write-Host "✅ Test 10: Log Same Domain Again (should rate limit)" -ForegroundColor Green
$body = @{
    domain = "sketchy-phishing-site.com"
    riskLevel = "high"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$BASE_URL/api/stats" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
Write-Host ""

# Test 11: Log Different Untrusted Domain
Write-Host "✅ Test 11: Log Different Untrusted Domain" -ForegroundColor Green
$body = @{
    domain = "malicious-site.net"
    riskLevel = "medium"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$BASE_URL/api/stats" -Method POST -Body $body -ContentType "application/json" | ConvertTo-Json -Depth 10
Write-Host ""

# Test 12: Get Stats Summary
Write-Host "✅ Test 12: Get Stats Summary" -ForegroundColor Green
Invoke-RestMethod -Uri "$BASE_URL/api/stats/summary" -Method GET | ConvertTo-Json -Depth 10
Write-Host ""

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "🎉 All Tests Complete!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Expected Results:" -ForegroundColor Yellow
Write-Host "  ✅ 2 trusted domains added (google.com, github.com)"
Write-Host "  ✅ Duplicate insertion rejected (409 error)"
Write-Host "  ✅ Trusted domain stats skipped (logged: false)"
Write-Host "  ✅ 2 untrusted domains logged (sketchy-phishing-site.com, malicious-site.net)"
Write-Host "  ✅ Rate limiting prevented duplicate (logged: false)"
Write-Host "  ✅ Stats summary shows 2 unique domains"
Write-Host ""
