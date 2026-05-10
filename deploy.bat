@echo off
echo Building your Kanji Study App...
call npm run build

echo.
echo Choose deployment option:
echo 1. Surge.sh (Fastest, no signup)
echo 2. Open Vercel (Recommended)
echo 3. Open Netlify
echo.
set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo Deploying to Surge.sh...
    cd dist
    npx surge
    cd ..
) else if "%choice%"=="2" (
    echo Opening Vercel...
    start https://vercel.com
) else if "%choice%"=="3" (
    echo Opening Netlify...
    start https://netlify.com
) else (
    echo Invalid choice. Please run again.
)

pause
