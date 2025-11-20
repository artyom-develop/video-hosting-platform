#!/bin/bash

# Deploy script for Docker Swarm

set -e

echo "Removing old stack..."
docker stack rm xatube || true
sleep 5

echo "Creating overlay network..."
docker network create --driver overlay xatube_xatube-network || true
sleep 2

echo "Deploying stack..."
docker stack deploy -c docker-compose-swarm.yml xatube

echo "Waiting for services to start..."
sleep 15

echo "Service status:"
docker service ls

echo ""
echo "Testing connectivity..."
sleep 5
curl -v http://localhost/health || echo "Health check failed"
