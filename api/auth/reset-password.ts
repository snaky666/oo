
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const adminAuth = getAuth();
const adminDb = getFirestore();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: "جميع الحقول مطلوبة" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" 
      });
    }

    // Get user from Firestore
    const usersRef = adminDb.collection('users');
    const usersSnapshot = await usersRef.where('email', '==', email).get();
    
    if (usersSnapshot.empty) {
      return res.status(404).json({ 
        success: false, 
        error: "المستخدم غير موجود" 
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const user = { uid: userDoc.id, ...userDoc.data() };

    // Get reset code from Firestore
    const resetDocRef = adminDb.collection('password_resets').doc(user.uid);
    const resetDocSnapshot = await resetDocRef.get();

    if (!resetDocSnapshot.exists) {
      return res.status(400).json({ 
        success: false, 
        error: "لم يتم طلب إعادة تعيين كلمة المرور. يرجى طلب كود جديد." 
      });
    }

    const resetDoc = resetDocSnapshot.data();

    // Verify code
    if (resetDoc?.code !== code) {
      return res.status(400).json({ 
        success: false, 
        error: "كود التحقق غير صحيح" 
      });
    }

    // Check expiry
    const expiryTime = typeof resetDoc?.expiry === 'number' ? resetDoc.expiry : parseInt(resetDoc?.expiry);
    if (expiryTime < Date.now()) {
      await resetDocRef.delete();
      return res.status(400).json({ 
        success: false, 
        error: "انتهت صلاحية كود التحقق. يرجى طلب كود جديد." 
      });
    }

    // Update password using Firebase Admin SDK
    await adminAuth.updateUser(user.uid, { password: newPassword });

    // Delete reset code after successful password update
    await resetDocRef.delete();

    return res.json({ 
      success: true, 
      message: "تم تغيير كلمة المرور بنجاح" 
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "حدث خطأ غير متوقع" 
    });
  }
}
