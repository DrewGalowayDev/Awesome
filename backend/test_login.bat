@echo off
echo ==================================================
echo ADMIN LOGIN TEST
echo ==================================================

echo.
echo Testing server health...
curl -X GET http://localhost:5000/health

echo.
echo.
echo ==================================================
echo Testing login with: admin@awesometech.co.ke
echo ==================================================
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@awesometech.co.ke\",\"password\":\"awesometech254\"}"

echo.
echo.
echo ==================================================
echo Testing login with: awesometech
echo ==================================================
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"awesometech\",\"password\":\"awesometech254\"}"

echo.
echo.
echo ==================================================
echo TEST COMPLETED
echo ==================================================
pause
