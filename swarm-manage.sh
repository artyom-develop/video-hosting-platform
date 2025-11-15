#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=====================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    print_success "Docker is installed"
}

# Initialize Swarm
init_swarm() {
    print_header "Initializing Docker Swarm"
    
    if docker info | grep -q "Swarm: active"; then
        print_warning "Swarm is already active"
        return
    fi
    
    docker swarm init
    if [ $? -eq 0 ]; then
        print_success "Swarm initialized successfully"
        docker node ls
    else
        print_error "Failed to initialize Swarm"
        exit 1
    fi
}

# Build images
build_images() {
    print_header "Building Docker images"
    
    echo -e "${YELLOW}Building backend image...${NC}"
    docker build -t kursach-backend:latest ./backend
    if [ $? -eq 0 ]; then
        print_success "Backend image built"
    else
        print_error "Failed to build backend image"
        exit 1
    fi
    
    echo -e "${YELLOW}Building frontend image...${NC}"
    docker build -t kursach-frontend:latest ./frontend
    if [ $? -eq 0 ]; then
        print_success "Frontend image built"
    else
        print_error "Failed to build frontend image"
        exit 1
    fi
}

# Deploy stack
deploy_stack() {
    print_header "Deploying Xatube stack to Swarm"
    
    docker stack deploy -c docker-compose-swarm.yml xatube
    if [ $? -eq 0 ]; then
        print_success "Stack deployed successfully"
    else
        print_error "Failed to deploy stack"
        exit 1
    fi
}

# Wait for services
wait_for_services() {
    print_header "Waiting for services to be ready"
    
    echo -e "${YELLOW}Services status:${NC}"
    docker service ls
    
    echo -e "${YELLOW}Waiting 30 seconds for services to stabilize...${NC}"
    sleep 30
    
    echo -e "${YELLOW}Service replicas:${NC}"
    docker service ls --format "{{.Name}}\t{{.Replicas}}"
}

# Show service logs
show_logs() {
    print_header "Recent service logs"
    
    echo -e "${YELLOW}Backend logs:${NC}"
    docker service logs xatube_backend --tail 20 2>/dev/null || echo "No logs yet"
    
    echo -e "${YELLOW}Frontend logs:${NC}"
    docker service logs xatube_frontend --tail 20 2>/dev/null || echo "No logs yet"
}

# Remove stack
remove_stack() {
    print_header "Removing Xatube stack"
    
    docker stack rm xatube
    if [ $? -eq 0 ]; then
        print_success "Stack removed successfully"
    else
        print_error "Failed to remove stack"
    fi
}

# Leave Swarm
leave_swarm() {
    print_header "Leaving Swarm"
    
    docker swarm leave --force
    if [ $? -eq 0 ]; then
        print_success "Left Swarm successfully"
    else
        print_error "Failed to leave Swarm"
    fi
}

# Show usage
show_usage() {
    echo "Usage: $0 {init|build|deploy|status|logs|remove|leave|help}"
    echo ""
    echo "Commands:"
    echo "  init     - Initialize Docker Swarm"
    echo "  build    - Build Docker images"
    echo "  deploy   - Deploy stack to Swarm"
    echo "  status   - Show service status"
    echo "  logs     - Show service logs"
    echo "  remove   - Remove stack from Swarm"
    echo "  leave    - Leave Swarm and clean up"
    echo "  help     - Show this help message"
}

# Main
case "${1:-help}" in
    init)
        check_docker
        init_swarm
        ;;
    build)
        check_docker
        build_images
        ;;
    deploy)
        check_docker
        deploy_stack
        wait_for_services
        ;;
    status)
        print_header "Swarm and Service Status"
        echo -e "${YELLOW}Swarm Status:${NC}"
        docker info | grep -A 10 "Swarm:"
        echo ""
        echo -e "${YELLOW}Nodes:${NC}"
        docker node ls
        echo ""
        echo -e "${YELLOW}Services:${NC}"
        docker service ls
        echo ""
        echo -e "${YELLOW}Service Details:${NC}"
        docker service ls --format "{{.Name}}\t{{.Replicas}}\t{{.Image}}"
        ;;
    logs)
        show_logs
        ;;
    remove)
        remove_stack
        wait_for_services
        ;;
    leave)
        remove_stack
        leave_swarm
        ;;
    *)
        show_usage
        ;;
esac
