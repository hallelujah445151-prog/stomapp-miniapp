# Test script for main API
$baseUrl = "http://localhost:8000"
$headers = @{"Authorization" = "Bearer test_token"}

Write-Host "Testing StomApp API..." -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Green

# 1. Test root endpoint
Write-Host "`n[1] Testing root endpoint:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "[INFO] Response: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
}

# 2. Test doctors reference
Write-Host "`n[2] Testing doctors reference:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/references/doctors" -Headers $headers -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "[INFO] Response: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
}

# 3. Test technicians reference
Write-Host "`n[3] Testing technicians reference:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/references/technicians" -Headers $headers -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "[INFO] Response: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
}

# 4. Test work types reference
Write-Host "`n[4] Testing work types reference:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/references/work-types" -Headers $headers -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "[INFO] Response: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
}

# 5. Test orders endpoint
Write-Host "`n[5] Testing orders endpoint:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/orders" -Headers $headers -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "[INFO] Response: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
}

Write-Host "`n" + "=" * 50 -ForegroundColor Green
Write-Host "[SUCCESS] Testing completed!" -ForegroundColor Green
Write-Host "[INFO] API Documentation: http://localhost:8000/docs" -ForegroundColor Cyan