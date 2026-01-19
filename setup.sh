#!/bin/bash

echo "🚀 Setting up URL Risk Monitor Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your Neon PostgreSQL connection string!"
    echo "   Get it from: https://neon.tech/"
    echo ""
    read -p "Press Enter after you've updated .env..."
fi

# Push database schema
echo "🗄️  Pushing database schema to Neon..."
npm run db:push

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Run: npm run dev"
echo "   2. Test: curl http://localhost:3000"
echo "   3. Seed data (optional): Run seed-data.sql in Neon SQL Editor"
echo ""
