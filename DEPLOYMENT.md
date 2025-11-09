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
RINGG_API_KEY=your-ringg-api-key
RINGG_AGENT_ID_INBOUND=93a4364f-562a-49bf-9aa4-fba317f7c1b4
RINGG_AGENT_ID_OUTBOUND=7fbc224c-8efe-4a21-a01f-e6f5117f0672

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

### Option 1: Railway (Recommended)

1. **Install Railway CLI**:
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Initialize Railway Project**:
   ```bash
   cd backend
   railway init
   ```

3. **Set Environment Variables**:
   ```bash
   railway variables set PORT=3001
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=your-secret-key
   railway variables set PERPLEXITY_API_KEY=your-key
   railway variables set FRONTEND_URL=https://homemates20-frontend-pqxt81fr2-nithins-projects-4472876c.vercel.app
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

5. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Root Directory: `backend`

### Option 2: Heroku

1. **Install Heroku CLI**:
   ```bash
   # macOS
   brew tap heroku/brew && brew install heroku
   
   # Or download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login and Create App**:
   ```bash
   heroku login
   cd backend
   heroku create homemates-backend
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set PORT=3001
   heroku config:set JWT_SECRET=your-secret-key
   heroku config:set PERPLEXITY_API_KEY=your-key
   heroku config:set FRONTEND_URL=https://your-frontend-domain.com
   ```

4. **Configure Buildpacks**:
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

5. **Deploy**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   heroku git:remote -a homemates-backend
   git push heroku main
   ```

### Option 3: AWS EC2 / DigitalOcean

1. **SSH into your server**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Clone Repository**:
   ```bash
   git clone https://github.com/your-username/homemates2.0.git
   cd homemates2.0/backend
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
   nano .env
   # Add all environment variables
   ```

7. **Use PM2 for Process Management**:
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name homemates-backend
   pm2 save
   pm2 startup
   ```

8. **Configure Nginx** (optional):
   ```nginx
   server {
       listen 80;
       server_name your-backend-domain.com;

       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

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
   - Add: `NEXT_PUBLIC_API_URL=https://your-backend-domain.com`

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

#### Option 2: Use Cloud Storage (Recommended)

1. **AWS S3 / DigitalOcean Spaces**:
   - Upload CSV files to S3 bucket
   - Update backend to read from S3
   - Use environment variables for bucket name

2. **Database Service**:
   - Migrate to PostgreSQL/MySQL
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

### Railway (Full Stack)

1. **Create Two Services**:
   - Service 1: Backend
   - Service 2: Frontend

2. **Backend Service**:
   ```bash
   cd backend
   railway init
   railway variables set PORT=3001
   railway variables set NODE_ENV=production
   # ... set other variables
   railway up
   ```

3. **Frontend Service**:
   ```bash
   cd frontend
   railway init
   railway variables set NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
   railway up
   ```

### Vercel + Railway

1. **Deploy Backend to Railway**
2. **Deploy Frontend to Vercel**:
   - Set `NEXT_PUBLIC_API_URL` to Railway backend URL
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
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Heroku Node.js Guide](https://devcenter.heroku.com/articles/getting-started-with-nodejs)

---

**Last Updated**: 2024
**Version**: 1.0.0

