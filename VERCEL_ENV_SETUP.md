# Vercel Environment Variables Setup

## Issue
The admin page doesn't show data on Vercel deployment because Firebase environment variables are not configured.

## Solution
Add the following environment variables to your Vercel project:

### Firebase Configuration (Required)
- `VITE_FIREBASE_API_KEY` - Your Firebase API key
- `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `VITE_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
- `VITE_FIREBASE_DATABASE_URL` - Your Firebase database URL (if using Realtime Database)
- `VITE_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Your Firebase app ID

### How to Add Environment Variables to Vercel
1. Go to your project on Vercel dashboard (https://vercel.com/dashboard)
2. Click on your project
3. Go to Settings → Environment Variables
4. Add each variable above with its corresponding value
5. Select which environments they should be available in (Production, Preview, Development)
6. Redeploy your project

### How to Find Your Firebase Configuration
1. Go to Firebase Console (https://console.firebase.google.com)
2. Select your project
3. Click the Settings icon (⚙️) and select "Project settings"
4. Go to the "Your apps" section
5. Find your web app and click on it
6. Copy the `firebaseConfig` object - it contains all the values you need

### Alternative: Use Firebase Admin SDK
If you want the backend to handle Firebase authentication instead:
- `FIREBASE_PRIVATE_KEY` - Your Firebase service account private key
- `FIREBASE_CLIENT_EMAIL` - Your Firebase service account client email
- `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID

## After Adding Environment Variables
1. The changes take effect immediately for new deployments
2. Redeploy your project: Push to your git branch or click "Redeploy" in Vercel dashboard
3. The admin page should now show data

## Testing Locally
Make sure these variables are also set in your `.env` file for local testing:
```
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
...
```
