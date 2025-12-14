import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb, setCorsHeaders, FIREBASE_PROJECT_ID, FIREBASE_API_KEY, extractDocumentData } from '../_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, email } = req.body;
    console.log('🔐 Verify request:', { email, code: code ? 'present' : 'missing' });

    if (!code || !email) {
      console.log('❌ Missing code or email');
      return res.status(400).json({ 
        success: false, 
        error: "Code and email required" 
      });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return res.status(503).json({
        success: false,
        error: "Firebase Admin not configured"
      });
    }

    // Get user from Firestore
    const usersRef = adminDb.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();
    
    if (snapshot.empty) {
      console.log('❌ User not found for email:', email);
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    const userDoc = snapshot.docs[0];
    const user = { uid: userDoc.id, ...userDoc.data() } as any;

    console.log('👤 Found user:', user.uid);
    console.log('📧 Email verified status:', user.emailVerified);
    console.log('🔑 Has verification token:', !!user.emailVerificationToken);

    // Check if already verified
    if (user.emailVerified) {
      console.log('✅ Email already verified');
      return res.json({ 
        success: true, 
        message: "Email already verified" 
      });
    }

    // Check code validity
    if (!user.emailVerificationToken) {
      console.log('❌ No verification code found');
      return res.status(400).json({ 
        success: false, 
        error: "Invalid verification code" 
      });
    }

    if (user.emailVerificationToken !== code) {
      console.log('❌ Code mismatch');
      console.log('Expected:', user.emailVerificationToken);
      console.log('Received:', code);
      return res.status(400).json({ 
        success: false, 
        error: "Invalid verification code" 
      });
    }

    if (user.emailVerificationTokenExpiry && user.emailVerificationTokenExpiry < Date.now()) {
      console.log('❌ Code expired');
      return res.status(400).json({ 
        success: false, 
        error: "Verification code expired. Please request a new verification code." 
      });
    }

    // Update user to mark email as verified
    console.log('📝 Updating user verification status...');
    await userDoc.ref.update({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null
    });

    console.log('✅ Email verified successfully for:', email);
    res.json({ 
      success: true, 
      message: "Email verified successfully" 
    });
  } catch (error: any) {
    console.error("❌ Email verification error:", error?.message || error);
    res.status(500).json({ 
      success: false, 
      error: "An error occurred during verification. Please try again." 
    });
  }
}
