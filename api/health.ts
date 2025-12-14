import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, getAdminDb, getAdminAuth } from './_utils/firebase';

export default function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const adminAuth = getAdminAuth();
  const adminDb = getAdminDb();

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
