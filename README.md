# Homemates AI - Voice Agent Management Portal

AI Voice Agent Management Portal for Real Estate Builders

## 🏗️ Architecture

- **Frontend**: Next.js 14 (App Router) with TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Express.js with TypeScript
- **Storage**: File-based storage (JSON files for metadata, CSV/Excel for datasets)
- **Integrations**: ElevenLabs API, Google OAuth, Twilio

## 🚀 How to Run

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- ElevenLabs API key (get from [ElevenLabs](https://elevenlabs.io))
- Google OAuth credentials (for Gmail/Calendar integration - optional)

### Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Return to root directory
cd ..
```

Or use the convenience script:
```bash
npm run install:all
```

### Step 2: Set Up Environment Variables

#### Backend Environment Variables

Create `backend/.env` file:

```bash
cd backend
touch .env
```

Add the following to `backend/.env`:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
JWT_SECRET=your_jwt_secret_key_min_32_characters
ENCRYPTION_KEY=your_encryption_key_32_characters_minimum
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

**Note**: 
- `JWT_SECRET` and `ENCRYPTION_KEY` should be at least 32 characters long
- Generate secure keys using: `openssl rand -base64 32`
- Google OAuth credentials are optional (only needed for Gmail/Calendar integration)

#### Where to Get Each Environment Variable

**1. ELEVENLABS_API_KEY** (Required)
- **What it is**: API key for ElevenLabs voice AI service
- **Where to get it**:
  1. Go to [ElevenLabs Website](https://elevenlabs.io)
  2. Sign up or log in to your account
  3. Navigate to your profile/settings
  4. Go to the API section
  5. Copy your API key
- **Required for**: Managing AI voice agents, making calls

**2. JWT_SECRET** (Required)
- **What it is**: Secret key for signing JSON Web Tokens (authentication)
- **How to generate**:
  ```bash
  # On Mac/Linux:
  openssl rand -base64 32
  
  # Or use Node.js:
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  
  # Or use Python:
  python3 -c "import secrets; print(secrets.token_urlsafe(32))"
  ```
- **Example**: `aBc123XyZ456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890`
- **Required for**: User authentication and session management

**3. ENCRYPTION_KEY** (Required)
- **What it is**: Key for encrypting OAuth tokens and sensitive data
- **How to generate**: Same as JWT_SECRET (use a different value)
  ```bash
  openssl rand -base64 32
  ```
- **Example**: `XyZ123AbC456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890`
- **Required for**: Encrypting OAuth tokens (Gmail, Calendar)

**4. GOOGLE_CLIENT_ID** (Optional - Only for Gmail/Calendar integration)
- **What it is**: Google OAuth 2.0 Client ID
- **Where to get it**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com)
  2. Create a new project or select an existing one
  3. Enable the APIs you need:
     - Gmail API (for Gmail integration)
     - Google Calendar API (for Calendar integration)
  4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
  5. Choose "Web application"
  6. Add authorized redirect URI: `http://localhost:3000/tools/callback`
  7. Copy the Client ID
- **Required for**: Connecting Gmail and Google Calendar

**5. GOOGLE_CLIENT_SECRET** (Optional - Only for Gmail/Calendar integration)
- **What it is**: Google OAuth 2.0 Client Secret
- **Where to get it**: Same as above - it's shown when you create the OAuth client ID
- **Required for**: Connecting Gmail and Google Calendar

**Quick Setup Summary:**
- **Required**: ELEVENLABS_API_KEY, JWT_SECRET, ENCRYPTION_KEY
- **Optional**: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (only if you want Gmail/Calendar features)

#### Frontend Environment Variables

Create `frontend/.env.local` file:

```bash
cd frontend
touch .env.local
```

Add the following to `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Step 3: Run the Application

#### Option 1: Using Python Startup Script (Easiest - Recommended)

From the root directory:

```bash
python3 start.py
```

Or on Windows:
```bash
python start.py
```

This script will:
- ✅ Check if Node.js and npm are installed
- ✅ Install backend dependencies automatically
- ✅ Install frontend dependencies automatically
- ✅ Check for environment files
- ✅ Start both backend and frontend servers
- ✅ Display colored output from both servers

**Note**: Make sure you have Python 3 installed on your system.

#### Option 2: Using npm Scripts

From the root directory:

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:3001`
- Frontend application on `http://localhost:3000`

#### Option 3: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on `http://localhost:3000`

### Step 4: Set Up ngrok for Webhook Testing (Optional but Recommended)

If you want to test webhooks (call events from ElevenLabs), you'll need to expose your local backend server using ngrok.

#### Install ngrok

**For macOS (using Homebrew):**
```bash
brew install ngrok
```

**For macOS/Linux (manual installation):**
1. Download ngrok from [ngrok.com/downloads](https://ngrok.com/downloads)
2. Extract the file
3. Move it to a directory in your PATH (e.g., `/usr/local/bin`)
4. Make it executable: `chmod +x /usr/local/bin/ngrok`

**For Windows:**
1. Download ngrok from [ngrok.com/downloads](https://ngrok.com/downloads)
2. Extract the executable
3. Add the directory to your system PATH

#### Authenticate ngrok

1. Sign up for a free account at [ngrok.com](https://ngrok.com/)
2. Get your auth token from the [dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Run the following command:
```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```
Replace `YOUR_AUTH_TOKEN` with your actual token from the dashboard.

#### Start ngrok

After your backend server is running (on port 3001), open a new terminal and run:

```bash
ngrok http 3001
```

This will give you a public URL like `https://abc123.ngrok.io` that tunnels to your local backend.

**Important**: Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`) and use it to configure webhooks in ElevenLabs:
- Webhook URL: `https://abc123.ngrok.io/api/webhooks/elevenlabs`

#### Using start.py with ngrok

The `start.py` script can optionally start ngrok for you. When you run `python3 start.py`, it will:
1. Check if ngrok is installed
2. Ask if you want to use ngrok for webhook testing
3. If yes, start ngrok automatically and display the public URL

### Step 5: Access the Application

1. Open your browser and navigate to: `http://localhost:3000`
2. You'll be redirected to the login page
3. **First time?** Click "Register" to create a new account
4. After registration/login, you'll be redirected to the dashboard

### Step 6: Build for Production

```bash
# Build both frontend and backend
npm run build

# Or build separately
npm run build:frontend
npm run build:backend
```

### Troubleshooting

**Port already in use?**
- Change `PORT` in `backend/.env` to a different port (e.g., 3002)
- Update `NEXT_PUBLIC_API_URL` in `frontend/.env.local` to match

**Module not found errors?**
- Make sure you've run `npm install` in both `frontend/` and `backend/` directories
- Delete `node_modules` and `package-lock.json`, then reinstall

**Backend not connecting?**
- Verify `backend/.env` file exists and has correct values
- Check that backend is running on the port specified in `FRONTEND_URL`

**Frontend not loading?**
- Verify `frontend/.env.local` file exists
- Check that `NEXT_PUBLIC_API_URL` matches your backend URL

## 📁 Project Structure

```
homemates2.0/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js backend API
│   └── data/          # JSON files for metadata storage
│   └── uploads/       # Uploaded files (brand assets, datasets)
├── start.py           # Python startup script (automates installation and running)
├── package.json       # Root package.json with workspace scripts
└── README.md          # This file
```

## 🔐 Security

- All API keys stored in environment variables
- OAuth tokens encrypted with AES-256
- JWT authentication for API endpoints
- HTTPS required in production

## 📊 Modules

1. **Agents** - Manage AI voice agents
2. **Calls** - View call logs and initiate calls
3. **Tools** - Connect Gmail and Calendar
4. **Brand Guide** - Upload brand guidelines
5. **Database** - Manage customer data and leads (CSV/Excel files)

## 💾 Data Storage

All data is stored in files:
- **Metadata**: JSON files in `backend/data/` directory
  - `users.json` - User accounts
  - `agents.json` - Agent customizations
  - `calls.json` - Call logs
  - `brand_guides.json` - Brand guide configurations
  - `integrations.json` - OAuth integrations
  - `datasets.json` - Dataset metadata
- **Uploads**: Files in `backend/uploads/` directory
  - `brand-assets/` - Logos and voice notes
  - `datasets/` - CSV/Excel files

## 📝 Notes

- The system uses file-based storage instead of a database
- All CSV/Excel files are stored in the uploads directory
- Metadata is stored in JSON files for easy backup and migration
