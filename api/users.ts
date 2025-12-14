import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initFirebase } from './_utils/firebase';
import { sendVerificationEmail } from './_utils/email';

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { adminAuth, adminDb } = initFirebase();
  const { action, id } = req.query;

  try {
    if (action === 'get' && id) {
      if (adminDb) {
        const doc = await adminDb.collection("users").doc(id as string).get();
        if (!doc.exists) return res.status(404).json({ error: "User not found" });
        return res.json({ id: doc.id, ...doc.data() });
      }
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${id}`,
        { headers: { "X-Goog-Api-Key": FIREBASE_API_KEY || "" } }
      );
      if (!response.ok) return res.status(404).json({ error: "User not found" });
      const doc = await response.json();
      return res.json({ id, ...doc.fields });
    }

    if (action === 'resend-verification' && req.method === 'POST') {
      const { email } = req.body;
      if (!adminDb) return res.status(503).json({ success: false, error: "Firebase not configured" });

      const usersRef = adminDb.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();
      if (snapshot.empty) return res.status(404).json({ success: false, error: "User not found" });

      const userDoc = snapshot.docs[0];
      const user = userDoc.data();
      if (user.emailVerified) return res.json({ success: true, message: "Email already verified" });

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenExpiry = Date.now() + (15 * 60 * 1000);
      await userDoc.ref.update({ emailVerificationToken: newCode, emailVerificationTokenExpiry: tokenExpiry });

      const emailResult = await sendVerificationEmail(email, newCode);
      if (emailResult.success) return res.json({ success: true, message: "Code sent" });
      return res.status(500).json({ success: false, error: emailResult.error });
    }

    if (action === 'delete-unverified' && req.method === 'POST') {
      const { email } = req.body;
      if (!adminAuth) return res.status(503).json({ success: false, error: "Firebase not configured" });

      try {
        const authUser = await adminAuth.getUserByEmail(email);
        if (authUser && !authUser.emailVerified) {
          await adminAuth.deleteUser(authUser.uid);
        }
      } catch (e: any) {
        if (e.code !== 'auth/user-not-found') throw e;
      }

      if (adminDb) {
        const snapshot = await adminDb.collection('users').where('email', '==', email).get();
        if (!snapshot.empty) {
          const user = snapshot.docs[0].data();
          if (!user.emailVerified) await snapshot.docs[0].ref.delete();
        }
      }
      return res.json({ success: true });
    }

    if (action === 'verify-email' && req.method === 'POST') {
      const { code, email } = req.body;
      if (!code || !email) return res.status(400).json({ success: false, error: "Code and email required" });
      if (!adminDb) return res.status(503).json({ success: false, error: "Firebase not configured" });

      const snapshot = await adminDb.collection('users').where('email', '==', email).get();
      if (snapshot.empty) return res.status(404).json({ success: false, error: "User not found" });

      const userDoc = snapshot.docs[0];
      const user = userDoc.data();

      if (user.emailVerified) return res.json({ success: true, message: "Already verified" });
      if (user.emailVerificationToken !== code) return res.status(400).json({ success: false, error: "Invalid code" });
      if (user.emailVerificationTokenExpiry < Date.now()) return res.status(400).json({ success: false, error: "Code expired" });

      await userDoc.ref.update({ emailVerified: true, emailVerificationToken: null, emailVerificationTokenExpiry: null });
      return res.json({ success: true, message: "Email verified" });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error: any) {
    console.error("Users error:", error?.message);
    return res.status(500).json({ success: false, error: error?.message });
  }
}
