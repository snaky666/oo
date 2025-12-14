import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, getAdminDb } from '../_utils/firebase';
import { sendResetPasswordEmail } from '../_utils/email';

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

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "البريد الإلكتروني مطلوب" 
      });
    }

    const adminDb = getAdminDb();

    if (!adminDb) {
      return res.status(503).json({
        success: false,
        error: "خدمة إعادة تعيين كلمة المرور غير متاحة حالياً"
      });
    }

    const usersRef = adminDb.collection('users');
    const usersSnapshot = await usersRef.where('email', '==', email).get();
    
    if (usersSnapshot.empty) {
      return res.json({ 
        success: true, 
        message: "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال كود التحقق" 
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const user = { uid: userDoc.id, ...userDoc.data() };

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpiry = Date.now() + (15 * 60 * 1000);

    await adminDb.collection('password_resets').doc(user.uid).set({
      email: email,
      code: resetCode,
      expiry: tokenExpiry,
      createdAt: Date.now()
    });

    const emailResult = await sendResetPasswordEmail(email, resetCode);

    if (emailResult.success) {
      res.json({ 
        success: true, 
        message: "تم إرسال كود التحقق إلى بريدك الإلكتروني" 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: "فشل في إرسال البريد الإلكتروني" 
      });
    }
  } catch (error: any) {
    console.error("Password reset request error:", error?.message);
    res.status(500).json({ 
      success: false, 
      error: "حدث خطأ غير متوقع" 
    });
  }
}
