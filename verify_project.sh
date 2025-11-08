#!/bin/bash

# XaTube - Project Verification Script
# This script checks if all required files and configurations are in place

set -e

echo "🔍 XaTube Project Verification"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
total=0
passed=0

# Helper function
check_file() {
    local file=$1
    local description=$2
    
    total=$((total + 1))
    
    if [ -f "$file" ] || [ -d "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        passed=$((passed + 1))
    else
        echo -e "${RED}✗${NC} $description - NOT FOUND: $file"
    fi
}

echo "📋 Checking Backend Files..."
echo "---"

# Backend core
check_file "backend/app/main.py" "Backend main.py"
check_file "backend/app/core/config.py" "Config"
check_file "backend/app/core/database.py" "Database"
check_file "backend/app/core/security.py" "Security"
check_file "backend/app/core/metrics.py" "Metrics"
check_file "backend/app/models/models.py" "Models (6 tables)"
check_file "backend/app/schemas/schemas.py" "Pydantic Schemas"

# Backend routes
check_file "backend/app/routes/auth.py" "Auth Routes"
check_file "backend/app/routes/channels.py" "Channels Routes"
check_file "backend/app/routes/streams.py" "Streams Routes"
check_file "backend/app/routes/statistics.py" "Statistics Routes"
check_file "backend/app/routes/documents.py" "Documents Routes"
check_file "backend/app/routes/users.py" "Users Routes"

# Backend config
check_file "backend/requirements.txt" "requirements.txt"
check_file "backend/Dockerfile" "Backend Dockerfile"
check_file "backend/.env.example" "Backend .env.example"

echo ""
echo "📱 Checking Frontend Files..."
echo "---"

# Frontend components
check_file "frontend/src/components/Header.js" "Header Component"
check_file "frontend/src/context/AuthContext.js" "AuthContext"
check_file "frontend/src/pages/AuthPages.js" "AuthPages"
check_file "frontend/src/pages/HomePage.js" "HomePage"
check_file "frontend/src/pages/ProfilePage.js" "ProfilePage"
check_file "frontend/src/pages/StatisticsPage.js" "StatisticsPage"
check_file "frontend/src/pages/PlayerPage.js" "PlayerPage"

# Frontend services
check_file "frontend/src/services/api.js" "API Service"

# Frontend styles
check_file "frontend/src/styles/index.css" "Global Styles"
check_file "frontend/src/styles/App.css" "App Styles"
check_file "frontend/src/styles/Header.css" "Header Styles"
check_file "frontend/src/styles/Auth.css" "Auth Styles"
check_file "frontend/src/styles/Home.css" "Home Styles"
check_file "frontend/src/styles/Player.css" "Player Styles"
check_file "frontend/src/styles/Profile.css" "Profile Styles"
check_file "frontend/src/styles/Statistics.css" "Statistics Styles"

# Frontend config
check_file "frontend/package.json" "package.json"
check_file "frontend/src/App.js" "App.js"
check_file "frontend/src/index.js" "index.js"
check_file "frontend/.env.example" "Frontend .env.example"

echo ""
echo "🐳 Checking Infrastructure Files..."
echo "---"

# Docker files
check_file "docker-compose.yml" "docker-compose.yml"
check_file "docker/postgres/init.sql" "PostgreSQL Init Script"
check_file "docker/nginx/nginx.conf" "NGINX Config"
check_file "docker/nginx/Dockerfile" "NGINX Dockerfile"
check_file "docker/rtmp/nginx.conf" "RTMP Config"
check_file "docker/rtmp/Dockerfile" "RTMP Dockerfile"
check_file "docker/prometheus/prometheus.yml" "Prometheus Config"
check_file "docker/prometheus/Dockerfile" "Prometheus Dockerfile"
check_file "docker/grafana/provisioning" "Grafana Provisioning"

echo ""
echo "📚 Checking Documentation Files..."
echo "---"

# Documentation
check_file "README.md" "README.md"
check_file "docs/ARCHITECTURE.md" "ARCHITECTURE.md"
check_file "docs/API.md" "API.md"
check_file "docs/DEPLOYMENT.md" "DEPLOYMENT.md"
check_file "docs/TERMS_OF_SERVICE.md" "TERMS_OF_SERVICE.md"
check_file "docs/PRIVACY_POLICY.md" "PRIVACY_POLICY.md"
check_file "docs/CONTENT_GUIDELINES.md" "CONTENT_GUIDELINES.md"

echo ""
echo "📋 Checking Additional Files..."
echo "---"

# Additional files
check_file "QUICKSTART.md" "QUICKSTART.md"
check_file "COMPLETION_REPORT.md" "COMPLETION_REPORT.md"
check_file "COMPONENTS_CHECKLIST.md" "COMPONENTS_CHECKLIST.md"
check_file "PRE_PRODUCTION_CHECKLIST.md" "PRE_PRODUCTION_CHECKLIST.md"
check_file "DOCUMENTATION.md" "DOCUMENTATION.md"
check_file ".gitignore" ".gitignore"
check_file ".git" "Git Repository"

echo ""
echo "================================"
echo -e "📊 Results: ${GREEN}$passed${NC} / $total files found"

if [ $passed -eq $total ]; then
    echo -e "${GREEN}✓ All files present!${NC}"
    exit 0
else
    missing=$((total - passed))
    echo -e "${YELLOW}⚠ $missing files missing${NC}"
    exit 1
fi
