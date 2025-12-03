import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

// Initialize Firebase Admin only if service account is provided
if (getApps().length === 0) {
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    // Support both full JSON service account and individual credentials
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: projectId,
      });
      
      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);
      console.log('✅ Firebase Admin initialized with service account JSON');
    } else if (privateKey && clientEmail && projectId) {
      // Build service account from individual environment variables
      const serviceAccount = {
        type: 'service_account',
        project_id: projectId,
        private_key: privateKey.replace(/\\n/g, '\n'),
        client_email: clientEmail,
      };
      
      adminApp = initializeApp({
        credential: cert(serviceAccount as any),
        projectId: projectId,
      });
      
      adminAuth = getAuth(adminApp);
      adminDb = getFirestore(adminApp);
      console.log('✅ Firebase Admin initialized with individual credentials');
    } else {
      console.warn('⚠️ Firebase Admin not initialized - credentials not provided');
      console.warn('⚠️ Required: FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, VITE_FIREBASE_PROJECT_ID');
      console.warn('⚠️ Some backend features may be limited');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    console.warn('⚠️ Some backend features may be limited');
  }
} else {
  adminApp = getApps()[0];
  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
}

export { adminAuth, adminDb };
