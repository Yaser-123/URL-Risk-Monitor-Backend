@echo off
echo 🚀 Setting up URL Risk Monitor Backend...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

echo ✅ Node.js found
node --version

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Check if .env exists
if not exist .env (
    echo 📝 Creating .env file...
    copy .env.example .env
    echo.
    echo ⚠️  IMPORTANT: Edit .env and add your Neon PostgreSQL connection string!
    echo    Get it from: https://neon.tech/
    echo.
    pause
)

REM Push database schema
echo 🗄️  Pushing database schema to Neon...
call npm run db:push

echo.
echo ✅ Setup complete!
echo.
echo 📋 Next steps:
echo    1. Run: npm run dev
echo    2. Test: curl http://localhost:3000
echo    3. Seed data (optional): Run seed-data.sql in Neon SQL Editor
echo.
pause
