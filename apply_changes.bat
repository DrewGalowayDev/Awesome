@echo off
echo Restoring index.html from git...
git checkout index.html

echo.
echo Replacing product tabs with dynamic containers...
node replace_tabs.js

echo.
echo Adding load-products.js script tag...
node add_script.js

echo.
echo Done! Changes applied successfully.
pause
