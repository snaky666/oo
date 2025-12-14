import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, getAdminDb, getAdminAuth } from '../_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, role, phone, verificationCode, tokenExpiry } = req.body;
    
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    if (!adminAuth || !adminDb) {
      return res.status(503).json({
        success: false,
        error: "Firebase Admin not configured. Please contact administrator."
      });
    }

    try {
      const authUser = await adminAuth.getUserByEmail(email);
      if (authUser) {
        return res.status(400).json({
          success: false,
          error: "البريد الإلكتروني مستخدم بالفعل"
        });
      }
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    const pendingRef = adminDb.collection('pending_registrations');
    const existingSnapshot = await pendingRef.where('email', '==', email).get();

    const pendingData = {
      email,
      password,
      role,
      phone,
      verificationCode,
      tokenExpiry,
      createdAt: Date.now()
    };

    if (!existingSnapshot.empty) {
      const docId = existingSnapshot.docs[0].id;
      await pendingRef.doc(docId).set(pendingData);
    } else {
      await pendingRef.add(pendingData);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Pending registration error:", error?.message);
    res.status(500).json({ 
      success: false, 
      error: error?.message || "Failed to create pending registration" 
    });
  }
}
