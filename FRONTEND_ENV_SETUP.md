# Frontend Environment Setup

## Backend URL Configuration

Your backend is deployed at:
**https://homemates-backend-87009357635.us-central1.run.app**

## Setting Up Frontend Environment Variables

### For Vercel Deployment:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following environment variable:

   **Variable Name:** `NEXT_PUBLIC_API_URL`
   **Value:** `https://homemates-backend-87009357635.us-central1.run.app`
   **Environment:** Production, Preview, Development

4. Redeploy your frontend application

### For Local Development:

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=https://homemates-backend-87009357635.us-central1.run.app
```

Or use the local backend:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Verification

After setting the environment variable, verify it's working:

1. Check the browser console for API calls
2. Test the login functionality
3. Verify API requests are going to the correct backend URL

## Backend CORS Configuration

The backend is configured to allow all origins (`origin: '*'`), so it will accept requests from any frontend URL.

