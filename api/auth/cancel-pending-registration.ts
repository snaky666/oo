import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb, setCorsHeaders } from '../_utils/firebase';

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
    console.log('🗑️ Cancel pending registration for:', email);

    const adminDb = getAdminDb();
    if (!adminDb) {
      return res.status(503).json({
        success: false,
        error: "Firebase Admin not configured. Please contact administrator."
      });
    }

    // Get and delete pending registration using Admin SDK
    const pendingRef = adminDb.collection('pending_registrations');
    const snapshot = await pendingRef.where('email', '==', email).get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.delete();
      console.log('✅ Deleted pending registration');
    }

    res.json({ success: true, message: "Pending registration canceled" });
  } catch (error: any) {
    console.error("❌ Cancel error:", error?.message);
    res.status(500).json({ success: false, error: error?.message });
  }
}
