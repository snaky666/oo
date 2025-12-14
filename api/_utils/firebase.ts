import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

function formatPrivateKey(key: string): string {
  let formattedKey = key.trim();
  if ((formattedKey.startsWith('"') && formattedKey.endsWith('"')) ||
      (formattedKey.startsWith("'") && formattedKey.endsWith("'"))) {
    formattedKey = formattedKey.slice(1, -1);
  }
  formattedKey = formattedKey.replace(/\\n/g, '\n');
  formattedKey = formattedKey.replace(/\\\\n/g, '\n');
  formattedKey = formattedKey.replace(/"/g, '');
  if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    formattedKey = `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----\n`;
  }
  formattedKey = formattedKey.replace('-----BEGIN PRIVATE KEY-----', '-----BEGIN PRIVATE KEY-----\n');
  formattedKey = formattedKey.replace('-----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----');
  formattedKey = formattedKey.replace(/\n\n+/g, '\n');
  return formattedKey;
}

export function initFirebase() {
  if (adminAuth && adminDb) return { adminAuth, adminDb };
  
  if (getApps().length === 0) {
    try {
      const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        let serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
        try {
          if (!serviceAccountJson.startsWith('{')) {
            serviceAccountJson = Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
          }
        } catch (decodeError) {}
        
        const serviceAccount = JSON.parse(serviceAccountJson);
        
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id || projectId,
        });
        
        adminAuth = getAuth(adminApp);
        adminDb = getFirestore(adminApp);
      } else if (privateKey && clientEmail && projectId) {
        const formattedPrivateKey = formatPrivateKey(privateKey);
        const serviceAccount = {
          type: 'service_account',
          project_id: projectId,
          private_key: formattedPrivateKey,
          client_email: clientEmail,
        };
        
        adminApp = initializeApp({
          credential: cert(serviceAccount as any),
          projectId: projectId,
        });
        
        adminAuth = getAuth(adminApp);
        adminDb = getFirestore(adminApp);
      }
    } catch (error: any) {
      console.error('Failed to initialize Firebase Admin:', error?.message);
    }
  } else {
    adminApp = getApps()[0];
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  }
  
  return { adminAuth, adminDb };
}

export { adminAuth, adminDb };
