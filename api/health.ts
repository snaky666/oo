import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initFirebase } from './_utils/firebase';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { adminAuth, adminDb } = initFirebase();
  
  res.json({
    status: "ok",
    firebase: {
      adminAuth: adminAuth ? "initialized" : "not initialized",
      adminDb: adminDb ? "initialized" : "not initialized",
    },
    env: {
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT,
      hasProjectId: !!process.env.VITE_FIREBASE_PROJECT_ID,
      hasApiKey: !!process.env.VITE_FIREBASE_API_KEY,
      hasResendKey: !!process.env.RESEND_API_KEY,
    },
    timestamp: new Date().toISOString()
  });
}
