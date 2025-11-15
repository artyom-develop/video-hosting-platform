#!/bin/bash

# Quick Swarm Setup for Testing (Single Node)
# This script sets up a development Swarm cluster on a single machine

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Xatube Docker Swarm Quick Setup     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"

# Check Docker
echo -e "${YELLOW}Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed${NC}"
    exit 1
fi
docker --version
echo -e "${GREEN}✓ Docker found${NC}\n"

# Check Swarm
echo -e "${YELLOW}Checking Docker Swarm status...${NC}"
if docker info | grep -q "Swarm: inactive"; then
    echo -e "${YELLOW}Initializing Swarm...${NC}"
    docker swarm init
    echo -e "${GREEN}✓ Swarm initialized${NC}\n"
elif docker info | grep -q "Swarm: active"; then
    echo -e "${GREEN}✓ Swarm already active${NC}\n"
fi

# Show node
echo -e "${YELLOW}Swarm nodes:${NC}"
docker node ls
echo ""

# Create directories for volumes
echo -e "${YELLOW}Creating volume directories...${NC}"
mkdir -p ./data/{postgres,redis,prometheus,grafana}
chmod 777 ./data/{postgres,redis,prometheus,grafana}
echo -e "${GREEN}✓ Directories created${NC}\n"

# Build images
echo -e "${YELLOW}Building Docker images...${NC}"
echo "Building backend..."
docker build -t kursach-backend:latest ./backend --quiet
echo -e "${GREEN}✓ Backend built${NC}"

echo "Building frontend..."
docker build -t kursach-frontend:latest ./frontend --quiet
echo -e "${GREEN}✓ Frontend built${NC}\n"

# Deploy stack
echo -e "${YELLOW}Deploying Xatube stack...${NC}"
docker stack deploy -c docker-compose-swarm.yml xatube
echo -e "${GREEN}✓ Stack deployed${NC}\n"

# Wait for services
echo -e "${YELLOW}Waiting for services to start (30s)...${NC}"
sleep 30

# Show status
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Service Status${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
docker service ls --format "table {{.Name}}\t{{.Replicas}}\t{{.Image}}\t{{.Status}}"
echo ""

# Service endpoints
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Service Endpoints${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}Frontend:${NC}      http://localhost"
echo -e "${GREEN}API:${NC}           http://localhost/api"
echo -e "${GREEN}Prometheus:${NC}    http://localhost:9090"
echo -e "${GREEN}Grafana:${NC}       http://localhost:3001 (admin:admin)"
echo ""

# Useful commands
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}Useful Commands${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo "View service logs:     docker service logs xatube_backend"
echo "View service details:  docker service ps xatube_backend"
echo "Scale service:         docker service scale xatube_backend=5"
echo "Update service:        docker service update --force-update xatube_backend"
echo "View nodes:            docker node ls"
echo "Remove stack:          docker stack rm xatube"
echo "Leave Swarm:           docker swarm leave --force"
echo ""

echo -e "${GREEN}✓ Setup complete!${NC}"
