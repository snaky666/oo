
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminDb = getFirestore();
const adminAuth = getAuth();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, role, phone, verificationCode, tokenExpiry } = req.body;
    
    // Check if email already exists
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

    // Check/update pending registration
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
    console.error('Pending registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error?.message || 'Failed to create pending registration' 
    });
  }
}
