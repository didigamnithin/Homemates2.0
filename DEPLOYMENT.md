# Homemates Deployment Guide

This guide provides step-by-step instructions for deploying the Homemates application to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Environment Variables](#environment-variables)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Database & CSV Files](#database--csv-files)
7. [Root Folder Files](#root-folder-files)
8. [Platform-Specific Guides](#platform-specific-guides)
9. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

Before deploying, ensure you have:

- **Node.js** 18+ installed
- **npm** or **yarn** package manager
- **Git** for version control
- **API Keys** for:
  - Perplexity AI
  - DesiVocal (Ringg AI)
  - JWT Secret (generate a secure random string)

---

## Project Structure

```
homemates2.0/
├── backend/              # Express.js backend
│   ├── src/
│   ├── data/            # CSV and JSON data files
│   ├── database/        # Master CSV files
│   ├── uploads/         # User-uploaded files
│   └── package.json
├── frontend/             # Next.js frontend
│   ├── app/
│   ├── components/
│   └── package.json
├── database/             # Root-level database files
│   ├── flats.csv
│   └── tenants.csv
├── start.py              # Development startup script
└── README.md
```

---

## Environment Variables

### Backend Environment Variables

Create `backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Perplexity AI
PERPLEXITY_API_KEY=your-perplexity-api-key

# DesiVocal (Ringg AI) - Optional
RINGG_API_KEY=5d001a13-f975-4baa-a8b6-e61fce1e8e98
RINGG_AGENT_ID_INBOUND=91312a1a-f2c3-42dc-a0c7-4e532d90257b
RINGG_AGENT_ID_OUTBOUND=752c2ef5-086d-475a-87ca-c84708d4c49a
RINGG_FROM_NUMBER=+918035736726

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DEST=uploads/
```

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

For production, also create `frontend/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

---

## Backend Deployment

### Google Cloud Run (Recommended)

Google Cloud Run is a fully managed serverless platform that automatically scales your application.

#### Prerequisites

1. **Install Google Cloud SDK**:
   ```bash
   # macOS
   brew install --cask google-cloud-sdk
   
   # Or download from https://cloud.google.com/sdk/docs/install
   ```

2. **Login to Google Cloud**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Enable required APIs**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

#### Step 1: Build and Push Docker Image

1. **Build the Docker image**:
   ```bash
   cd backend
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/homemates-backend
   ```

   Or build locally first:
   ```bash
   docker build -t gcr.io/YOUR_PROJECT_ID/homemates-backend .
   docker push gcr.io/YOUR_PROJECT_ID/homemates-backend
   ```

#### Step 2: Deploy to Cloud Run

1. **Deploy the service**:
   ```bash
   gcloud run deploy homemates-backend \
     --image gcr.io/YOUR_PROJECT_ID/homemates-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --port 8080 \
     --memory 512Mi \
     --cpu 1 \
     --min-instances 0 \
     --max-instances 10 \
     --timeout 300 \
     --set-env-vars "NODE_ENV=production,PORT=8080"
   ```

2. **Set Environment Variables**:
   ```bash
   gcloud run services update homemates-backend \
     --update-env-vars "JWT_SECRET=your-secret-key,PERPLEXITY_API_KEY=your-key,RINGG_API_KEY=5d001a13-f975-4baa-a8b6-e61fce1e8e98,RINGG_AGENT_ID_OUTBOUND=752c2ef5-086d-475a-87ca-c84708d4c49a,RINGG_FROM_NUMBER=+918035736726,FRONTEND_URL=https://your-frontend-domain.com" \
     --region us-central1
   ```

   Or set them individually:
   ```bash
   gcloud run services update homemates-backend \
     --set-env-vars "JWT_SECRET=your-secret-key" \
     --region us-central1
   
   gcloud run services update homemates-backend \
     --set-env-vars "PERPLEXITY_API_KEY=your-key" \
     --region us-central1
   
   gcloud run services update homemates-backend \
     --set-env-vars "RINGG_API_KEY=5d001a13-f975-4baa-a8b6-e61fce1e8e98" \
     --region us-central1
   
   gcloud run services update homemates-backend \
     --set-env-vars "RINGG_AGENT_ID_OUTBOUND=752c2ef5-086d-475a-87ca-c84708d4c49a" \
     --region us-central1
   
   gcloud run services update homemates-backend \
     --set-env-vars "RINGG_FROM_NUMBER=+918035736726" \
     --region us-central1
   
   gcloud run services update homemates-backend \
     --set-env-vars "FRONTEND_URL=https://your-frontend-domain.com" \
     --region us-central1
   ```

#### Step 3: Configure Service

1. **Get the service URL**:
   ```bash
   gcloud run services describe homemates-backend \
     --region us-central1 \
     --format 'value(status.url)'
   ```

2. **Update CORS settings** (if needed):
   - The backend already allows all origins (`origin: '*'`)
   - If you need to restrict, update `backend/src/index.ts`

#### Step 4: Deploy Database Files

Since Cloud Run is stateless, you have two options:

**Option A: Include in Docker Image** (for small files):
```dockerfile
# Already included in Dockerfile
COPY database/ ./database/
```

**Option B: Use Cloud Storage** (recommended for production):
1. Upload to Cloud Storage:
   ```bash
   gsutil cp backend/database/*.csv gs://YOUR_BUCKET_NAME/database/
   ```

2. Update backend to read from Cloud Storage (requires code changes)

#### Step 5: Continuous Deployment (Optional)

1. **Set up Cloud Build trigger**:
   ```bash
   gcloud builds triggers create github \
     --repo-name=homemates2.0 \
     --repo-owner=YOUR_GITHUB_USERNAME \
     --branch-pattern="^main$" \
     --build-config=backend/cloudbuild.yaml
   ```

2. **Create `backend/cloudbuild.yaml`**:
   ```yaml
   steps:
     - name: 'gcr.io/cloud-builders/docker'
       args: ['build', '-t', 'gcr.io/$PROJECT_ID/homemates-backend', '.']
     - name: 'gcr.io/cloud-builders/docker'
       args: ['push', 'gcr.io/$PROJECT_ID/homemates-backend']
     - name: 'gcr.io/cloud-builders/gcloud'
       args:
         - 'run'
         - 'deploy'
         - 'homemates-backend'
         - '--image'
         - 'gcr.io/$PROJECT_ID/homemates-backend'
         - '--region'
         - 'us-central1'
         - '--platform'
         - 'managed'
   ```

#### Useful Commands

```bash
# View logs
gcloud run services logs read homemates-backend --region us-central1

# Update service
gcloud run services update homemates-backend --region us-central1

# Delete service
gcloud run services delete homemates-backend --region us-central1

# List services
gcloud run services list --region us-central1
```

#### Important Notes

- **Port**: Cloud Run requires the app to listen on the port specified by the `PORT` environment variable (default: 8080)
- **Stateless**: Cloud Run instances are stateless. Use Cloud Storage or a database for persistent data
- **Cold Starts**: First request may be slower. Set `--min-instances 1` to avoid cold starts
- **Timeout**: Default timeout is 300 seconds. Increase if needed with `--timeout`
- **Memory**: Adjust `--memory` based on your needs (128Mi, 256Mi, 512Mi, 1Gi, 2Gi, 4Gi, 8Gi)

---

## Frontend Deployment

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd frontend
   vercel
   ```

4. **Set Environment Variables**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_API_URL=https://homemates-backend-87009357635.us-central1.run.app`
   - **Important:** Replace with your actual Cloud Run backend URL if different

5. **Configure Build Settings**:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. **Redeploy**:
   ```bash
   vercel --prod
   ```

### Option 2: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**:
   ```bash
   netlify login
   ```

3. **Initialize**:
   ```bash
   cd frontend
   netlify init
   ```

4. **Set Environment Variables**:
   ```bash
   netlify env:set NEXT_PUBLIC_API_URL https://your-backend-domain.com
   ```

5. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

### Option 3: Self-Hosted (VPS)

1. **SSH into your server**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js** (if not already installed)

3. **Clone Repository**:
   ```bash
   git clone https://github.com/your-username/homemates2.0.git
   cd homemates2.0/frontend
   ```

4. **Install Dependencies**:
   ```bash
   npm install
   ```

5. **Build**:
   ```bash
   npm run build
   ```

6. **Set Environment Variables**:
   ```bash
   echo "NEXT_PUBLIC_API_URL=https://your-backend-domain.com" > .env.production
   ```

7. **Start with PM2**:
   ```bash
   pm2 start npm --name "homemates-frontend" -- start
   pm2 save
   ```

8. **Configure Nginx**:
   ```nginx
   server {
       listen 80;
       server_name your-frontend-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## Database & CSV Files

### Important Files to Deploy

The following CSV and JSON files need to be deployed with your backend:

1. **Backend Data Files** (`backend/data/`):
   - `properties.csv`
   - `tenants.csv`
   - `leads.csv`
   - `users.json`
   - `agents.json`
   - `calls.json`
   - `brand_guides.json`
   - `integrations.json`
   - `datasets.json`

2. **Database Files** (`backend/database/`):
   - `flats.csv` - Master flats/properties database
   - `tenants.csv` - Master tenants database

   **Note:** All database files are now located in `backend/database/`. The root `database/` directory is no longer used.

3. **Upload Directories** (`backend/uploads/`):
   - `properties/`
   - `datasets/`
   - `brand-guides/`

### Deployment Strategy

#### Option 1: Include in Git (Not Recommended for Production)

```bash
# Add CSV files to git
git add backend/data/*.csv
git add backend/database/*.csv
git commit -m "Add data files"
git push
```

⚠️ **Warning**: This exposes your data in version control. Only use for development.

#### Option 2: Use Cloud Storage (Recommended for Cloud Run)

1. **Google Cloud Storage**:
   ```bash
   # Create bucket
   gsutil mb gs://YOUR_BUCKET_NAME
   
   # Upload CSV files
   gsutil cp backend/database/*.csv gs://YOUR_BUCKET_NAME/database/
   gsutil cp backend/data/*.csv gs://YOUR_BUCKET_NAME/data/
   gsutil cp backend/data/*.json gs://YOUR_BUCKET_NAME/data/
   ```
   
   - Update backend to read from Cloud Storage
   - Use environment variables for bucket name
   - Grant Cloud Run service account access to bucket

2. **Database Service**:
   - Migrate to Cloud SQL (PostgreSQL/MySQL)
   - Use CSV import scripts for initial data

#### Option 3: Manual Upload After Deployment

1. **Deploy backend first**
2. **SSH into server** (or use platform's file manager)
3. **Upload CSV files**:
   ```bash
   scp backend/data/*.csv user@server:/path/to/backend/data/
   scp backend/database/*.csv user@server:/path/to/backend/database/
   scp backend/data/*.json user@server:/path/to/backend/data/
   ```

#### Option 4: Initialize on First Run

Create an initialization script that:
- Checks if CSV files exist
- Creates them with headers if missing
- Seeds initial data if needed

---

## Root Folder Files

### Files to Handle

1. **`start.py`** - Development script only
   - ❌ **Do NOT deploy** - This is for local development only
   - Used only for running the app locally

2. **`README.md`** - Documentation
   - ✅ **Deploy** - Useful for reference
   - Can be included in repository

3. **`inbound.md`** and **`outbound.md`** - Agent prompts
   - ✅ **Deploy** - Reference documentation
   - Can be included in repository

4. **`package.json`** (root level)
   - ⚠️ **Check if needed** - May contain workspace configuration
   - Usually not needed for deployment

### Deployment Strategy

```bash
# Create .dockerignore or .gitignore
echo "start.py" >> .gitignore
echo "node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

---

## Platform-Specific Guides

### Google Cloud Run + Vercel (Recommended)

1. **Deploy Backend to Google Cloud Run** (see Backend Deployment section above)
2. **Deploy Frontend to Vercel**:
   - Set `NEXT_PUBLIC_API_URL` to your Cloud Run service URL
   - Connect GitHub repository
   - Auto-deploy on push

### Docker Deployment

#### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Copy data files
COPY data/ ./data/
COPY database/ ./database/
RUN mkdir -p uploads

EXPOSE 3001

CMD ["npm", "start"]
```

#### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - JWT_SECRET=${JWT_SECRET}
      - PERPLEXITY_API_KEY=${PERPLEXITY_API_KEY}
      - FRONTEND_URL=http://localhost:3000
    volumes:
      - ./backend/data:/app/data
      - ./backend/database:/app/database
      - ./backend/uploads:/app/uploads
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    depends_on:
      - backend
    restart: unless-stopped
```

Deploy:
```bash
docker-compose up -d
```

---

## Post-Deployment Checklist

### Backend

- [ ] Backend is accessible at the deployed URL
- [ ] Health check endpoint works: `GET /health`
- [ ] Environment variables are set correctly
- [ ] CSV files are present and readable
- [ ] Upload directories have write permissions
- [ ] CORS is configured for frontend domain
- [ ] JWT authentication is working
- [ ] API endpoints are responding correctly

### Frontend

- [ ] Frontend is accessible at the deployed URL
- [ ] Environment variable `NEXT_PUBLIC_API_URL` is set
- [ ] Frontend can connect to backend API
- [ ] Login functionality works
- [ ] All pages load correctly
- [ ] Static assets are loading
- [ ] No console errors

### Integration

- [ ] Frontend can make API calls to backend
- [ ] Authentication flow works end-to-end
- [ ] File uploads work (if applicable)
- [ ] Webhooks are configured (if using)
- [ ] DesiVocal agents are accessible
- [ ] Perplexity AI integration works

### Security

- [ ] HTTPS is enabled
- [ ] Environment variables are not exposed
- [ ] JWT secret is strong and unique
- [ ] CORS is properly configured
- [ ] File upload size limits are set
- [ ] Rate limiting is configured (optional)

### Monitoring

- [ ] Set up error logging (Sentry, LogRocket, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure analytics (optional)
- [ ] Set up backup for CSV files

---

## Troubleshooting

### Backend Issues

**Problem**: Backend won't start
- Check environment variables
- Verify Node.js version (18+)
- Check port availability
- Review logs for errors

**Problem**: CSV files not found
- Verify file paths
- Check file permissions
- Ensure files are deployed

**Problem**: CORS errors
- Verify `FRONTEND_URL` environment variable
- Check CORS configuration in `backend/src/index.ts`

### Frontend Issues

**Problem**: API calls failing
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check backend is running and accessible
- Verify CORS configuration

**Problem**: Build fails
- Check Node.js version
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Common Errors

**Error**: `Module not found`
- Run `npm install` in the respective directory
- Check `package.json` dependencies

**Error**: `Port already in use`
- Change port in environment variables
- Kill process using the port

**Error**: `JWT_SECRET not set`
- Set `JWT_SECRET` environment variable
- Generate a secure random string

---

## Maintenance

### Regular Tasks

1. **Backup CSV files** weekly
2. **Update dependencies** monthly
3. **Monitor logs** for errors
4. **Review security** quarterly
5. **Update environment variables** as needed

### Backup Strategy

```bash
# Backup CSV files
tar -czf backup-$(date +%Y%m%d).tar.gz backend/data/ backend/database/ database/

# Upload to cloud storage
aws s3 cp backup-*.tar.gz s3://your-bucket/backups/
```

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review application logs
3. Check environment variables
4. Verify file permissions
5. Contact support team

---

## Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-production.html)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Google Cloud Run Quickstart](https://cloud.google.com/run/docs/quickstarts/build-and-deploy)
- [Vercel Documentation](https://vercel.com/docs)
- [Docker Documentation](https://docs.docker.com/)

---

## Quick Deployment Script

A complete deployment script is available at the root: `deploy-all.sh`

This script will:
1. Push changes to all three GitHub repositories (root, frontend, backend)
2. Deploy backend to Google Cloud Run
3. Deploy frontend to Vercel

### Usage

```bash
# Make script executable (first time only)
chmod +x deploy-all.sh

# Run deployment
./deploy-all.sh
```

### What it does

1. **GitHub Push**:
   - Root: `https://github.com/didigamnithin/Homemates2.0.git`
   - Frontend: `https://github.com/didigamnithin/Homemates2.0-frontend.git`
   - Backend: `https://github.com/didigamnithin/Homemates2.0-Backend.git`

2. **Backend Deployment**:
   - Builds Docker image
   - Pushes to Google Container Registry
   - Deploys to Google Cloud Run

3. **Frontend Deployment**:
   - Deploys to Vercel (production)

### Prerequisites

- Git configured with access to the repositories
- Google Cloud SDK installed and authenticated
- Vercel CLI installed (`npm install -g vercel`)
- Vercel project linked (run `vercel link` in frontend directory if needed)

### Configuration

Edit `deploy-all.sh` to customize:
- Repository URLs
- Google Cloud project ID
- Service name and region
- Deployment settings

---

**Last Updated**: 2024
**Version**: 1.0.0

