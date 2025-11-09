#!/bin/bash
# Complete deployment script for Homemates 2.0
# Pushes to GitHub and redeploys frontend and backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_REPO="https://github.com/didigamnithin/Homemates2.0-frontend.git"
BACKEND_REPO="https://github.com/didigamnithin/Homemates2.0-Backend.git"
ROOT_REPO="https://github.com/didigamnithin/Homemates2.0.git"

PROJECT_ID="homemates2"
SERVICE_NAME="homemates-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Get script directory (must be defined before functions that use it)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to check if git is initialized
check_git() {
    if [ ! -d ".git" ]; then
        print_warning "Git not initialized. Initializing..."
        git init
        git remote add origin "$1" 2>/dev/null || git remote set-url origin "$1"
    fi
}

# Function to commit and push to GitHub
push_to_github() {
    local dir=$1
    local repo_url=$2
    local repo_name=$3
    local current_dir=$(pwd)
    
    print_info "Pushing $repo_name to GitHub..."
    
    cd "$dir"
    
    # Check if git is initialized
    if [ ! -d ".git" ]; then
        print_warning "Git not initialized in $dir. Initializing..."
        git init
        git remote add origin "$repo_url" 2>/dev/null || git remote set-url origin "$repo_url"
    else
        # Update remote URL if it exists
        if git remote get-url origin &>/dev/null; then
            git remote set-url origin "$repo_url"
        else
            git remote add origin "$repo_url"
        fi
    fi
    
    # Add all changes
    git add .
    
    # Check if there are changes to commit
    if git diff --staged --quiet && git diff --quiet; then
        print_warning "No changes to commit in $repo_name"
        cd "$current_dir"
        return 0
    fi
    
    # Commit changes
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || {
        print_error "Failed to commit changes in $repo_name"
        cd "$current_dir"
        return 1
    }
    
    # Determine default branch
    local branch="main"
    if git show-ref --verify --quiet refs/heads/master; then
        branch="master"
    fi
    
    # Push to GitHub
    git push origin $branch || {
        print_warning "Failed to push. Trying to set upstream..."
        git push -u origin $branch || {
            print_error "Failed to push $repo_name to GitHub"
            cd "$current_dir"
            return 1
        }
    }
    
    print_success "$repo_name pushed to GitHub successfully"
    cd "$current_dir"
}

# Function to deploy backend to Google Cloud Run
deploy_backend() {
    print_info "Deploying backend to Google Cloud Run..."
    
    local current_dir=$(pwd)
    cd "$SCRIPT_DIR/backend"
    
    # Build and push Docker image
    print_info "Building Docker image..."
    gcloud builds submit --tag ${IMAGE_NAME} --project=${PROJECT_ID} || {
        print_error "Failed to build Docker image"
        cd "$current_dir"
        return 1
    }
    
    # Deploy to Cloud Run
    print_info "Deploying to Cloud Run..."
    gcloud run deploy ${SERVICE_NAME} \
        --image ${IMAGE_NAME} \
        --platform managed \
        --region ${REGION} \
        --allow-unauthenticated \
        --port 8080 \
        --memory 512Mi \
        --cpu 1 \
        --min-instances 0 \
        --max-instances 10 \
        --timeout 300 \
        --set-env-vars "NODE_ENV=production" \
        --project=${PROJECT_ID} || {
        print_error "Failed to deploy to Cloud Run"
        cd "$current_dir"
        return 1
    }
    
    # Get service URL
    BACKEND_URL=$(gcloud run services describe ${SERVICE_NAME} \
        --region ${REGION} \
        --format 'value(status.url)' \
        --project=${PROJECT_ID})
    
    print_success "Backend deployed successfully!"
    print_info "Backend URL: $BACKEND_URL"
    
    cd "$current_dir"
}

# Function to deploy frontend to Vercel
deploy_frontend() {
    print_info "Deploying frontend to Vercel..."
    
    local current_dir=$(pwd)
    cd "$SCRIPT_DIR/frontend"
    
    # Check if vercel is installed
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    # Check if project is linked to Vercel
    if [ ! -f ".vercel/project.json" ]; then
        print_warning "Project not linked to Vercel. Linking..."
        vercel link --yes || {
            print_error "Failed to link project to Vercel"
            cd "$current_dir"
            return 1
        }
    fi
    
    # Deploy to Vercel
    print_info "Deploying to Vercel (production)..."
    vercel --prod --yes || {
        print_error "Failed to deploy to Vercel"
        cd "$current_dir"
        return 1
    }
    
    print_success "Frontend deployed to Vercel successfully!"
    
    cd "$current_dir"
}

# Main deployment flow
main() {
    echo ""
    echo "🚀 Starting complete deployment for Homemates 2.0"
    echo "=================================================="
    echo ""
    
    # Change to script directory
    cd "$SCRIPT_DIR"
    
    # Step 1: Push root repository
    print_info "Step 1: Pushing root repository to GitHub..."
    push_to_github "$SCRIPT_DIR" "$ROOT_REPO" "Root"
    echo ""
    
    # Step 2: Push backend repository
    print_info "Step 2: Pushing backend repository to GitHub..."
    push_to_github "$SCRIPT_DIR/backend" "$BACKEND_REPO" "Backend"
    echo ""
    
    # Step 3: Push frontend repository
    print_info "Step 3: Pushing frontend repository to GitHub..."
    push_to_github "$SCRIPT_DIR/frontend" "$FRONTEND_REPO" "Frontend"
    echo ""
    
    # Step 4: Deploy backend
    print_info "Step 4: Deploying backend to Google Cloud Run..."
    deploy_backend
    echo ""
    
    # Step 5: Deploy frontend
    print_info "Step 5: Deploying frontend to Vercel..."
    deploy_frontend
    echo ""
    
    # Summary
    echo "=================================================="
    print_success "Deployment complete!"
    echo ""
    print_info "Summary:"
    echo "  ✅ Root repository pushed to GitHub"
    echo "  ✅ Backend repository pushed to GitHub"
    echo "  ✅ Frontend repository pushed to GitHub"
    echo "  ✅ Backend deployed to Google Cloud Run"
    echo "  ✅ Frontend deployed to Vercel"
    echo ""
    
    # Get backend URL
    BACKEND_URL=$(gcloud run services describe ${SERVICE_NAME} \
        --region ${REGION} \
        --format 'value(status.url)' \
        --project=${PROJECT_ID} 2>/dev/null || echo "N/A")
    
    print_info "Backend URL: $BACKEND_URL"
    print_info "Don't forget to set NEXT_PUBLIC_API_URL in Vercel to: $BACKEND_URL"
    echo ""
}

# Run main function
main

