
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json({ 
        success: false, 
        error: "Code and email required" 
      });
    }

    const pendingRef = adminDb.collection('pending_registrations');
    const snapshot = await pendingRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(404).json({ 
        success: false, 
        error: "Pending registration not found" 
      });
    }

    const pendingDoc = snapshot.docs[0];
    const pending = pendingDoc.data();

    if (pending.verificationCode !== code) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid verification code" 
      });
    }

    if (pending.tokenExpiry < Date.now()) {
      return res.status(400).json({ 
        success: false, 
        error: "Verification code expired" 
      });
    }

    const authUser = await adminAuth.createUser({
      email: pending.email,
      password: pending.password,
      emailVerified: true
    });

    await adminDb.collection('users').doc(authUser.uid).set({
      uid: authUser.uid,
      email: pending.email,
      role: pending.role,
      phone: pending.phone,
      emailVerified: true,
      createdAt: Date.now()
    });

    await pendingDoc.ref.delete();

    res.json({ 
      success: true, 
      message: "Registration completed successfully" 
    });
  } catch (error: any) {
    console.error('Complete registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error?.message || 'Failed to complete registration' 
    });
  }
}
