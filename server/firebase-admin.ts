
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let adminApp: App;

// Initialize Firebase Admin
if (getApps().length === 0) {
  // For Replit, we'll use the service account from environment variables
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : {
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        // Note: For production, you should add service account credentials
      };

  adminApp = initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  });
} else {
  adminApp = getApps()[0];
}

export const adminAuth = getAuth(adminApp);
