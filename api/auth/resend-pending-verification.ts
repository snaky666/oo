import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, getAdminDb } from '../_utils/firebase';
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
    const adminDb = getAdminDb();

    if (!adminDb) {
      return res.status(503).json({
        success: false,
        error: "Firebase Admin not configured."
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
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpiry = Date.now() + (15 * 60 * 1000);

    await pendingDoc.ref.update({
      verificationCode: newCode,
      tokenExpiry: tokenExpiry
    });

    const emailResult = await sendVerificationEmail(email, newCode);

    if (emailResult.success) {
      res.json({ success: true, message: "New verification code sent" });
    } else {
      res.status(500).json({ success: false, error: emailResult.error });
    }
  } catch (error: any) {
    console.error("Resend error:", error?.message);
    res.status(500).json({ success: false, error: error?.message });
  }
}
