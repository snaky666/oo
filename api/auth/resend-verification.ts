import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb, setCorsHeaders } from '../_utils/firebase';
import { sendVerificationEmail } from '../_utils/email';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    console.log('🔄 Resend verification request for:', email);

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email required" 
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
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data() as any;

    // Check if already verified
    if (user.emailVerified) {
      return res.json({ 
        success: true, 
        message: "Email already verified" 
      });
    }

    // Generate new verification code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes

    // Update user with new code
    await userDoc.ref.update({
      emailVerificationToken: newCode,
      emailVerificationTokenExpiry: tokenExpiry
    });

    // Send new verification email
    const emailResult = await sendVerificationEmail(email, newCode);

    if (emailResult.success) {
      console.log('✅ New verification code sent to:', email);
      res.json({ 
        success: true, 
        message: "New verification code sent" 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: emailResult.error || "Failed to send email" 
      });
    }
  } catch (error: any) {
    console.error("❌ Resend verification error:", error?.message);
    res.status(500).json({ 
      success: false, 
      error: "An error occurred. Please try again." 
    });
  }
}
