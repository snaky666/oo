
import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;

// Initialize Firebase Admin only if service account is provided
if (getApps().length === 0) {
  try {
    // For Replit, we'll use the service account from environment variables
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      });
      
      adminAuth = getAuth(adminApp);
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      console.warn('⚠️ Firebase Admin not initialized - FIREBASE_SERVICE_ACCOUNT not provided');
      console.warn('⚠️ Some backend features may be limited');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    console.warn('⚠️ Some backend features may be limited');
  }
} else {
  adminApp = getApps()[0];
  adminAuth = getAuth(adminApp);
}

export { adminAuth };
