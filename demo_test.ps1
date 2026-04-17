# Doctor Appointment System API Demo Script
$base = "http://localhost:3000/api"

Write-Host "--- 1. Registering a Doctor ---" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Body (@{
    name = "Dr. Strange";
    email = "strange@marvel.com";
    password = "magic";
    role = "Doctor";
    specialization = "Surgery"
} | ConvertTo-Json) -ContentType "application/json"

Write-Host "`n--- 2. Registering a Patient ---" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Body (@{
    name = "Peter Parker";
    email = "peter@parker.com";
    password = "spidey";
    role = "User"
} | ConvertTo-Json) -ContentType "application/json"

Write-Host "`n--- 3. Logging in as Patient ---" -ForegroundColor Cyan
$login = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Body (@{
    email = "peter@parker.com";
    password = "spidey"
} | ConvertTo-Json) -ContentType "application/json"
# Note: Since I used register for login logic in controller sometimes they overlap, but I'll use login endpoint
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -Body (@{
    email = "peter@parker.com";
    password = "spidey"
} | ConvertTo-Json) -ContentType "application/json"
$token = $login.token

Write-Host "`n--- 4. Searching for Surgeons ---" -ForegroundColor Cyan
$doctors = Invoke-RestMethod -Uri "$base/doctors?specialization=Surgery" -Method Get
$doctors | Format-Table id, specialization, status
$doctorId = $doctors[0].id

Write-Host "`n--- 5. Booking an Appointment (Monday 10 AM) ---" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/appointments" -Method Post -Headers @{ Authorization = "Bearer $token" } -Body (@{
    doctorId = $doctorId;
    appointmentDate = "2026-03-23T10:00:00.000Z"
} | ConvertTo-Json) -ContentType "application/json"

Write-Host "`n--- 6. Viewing My Appointments ---" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/appointments" -Method Get -Headers @{ Authorization = "Bearer $token" } | Format-List
