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
    const { email, code, newPassword } = req.body;

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    if (!adminAuth || !adminDb) {
      return res.status(503).json({
        success: false,
        error: "خدمة إعادة تعيين كلمة المرور غير متاحة حالياً"
      });
    }

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

    const usersSnapshot = await adminDb.collection('users').where('email', '==', email).get();
    
    if (usersSnapshot.empty) {
      return res.status(404).json({ 
        success: false, 
        error: "المستخدم غير موجود" 
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    const resetDoc = await adminDb.collection('password_resets').doc(userId).get();
    
    if (!resetDoc.exists) {
      return res.status(400).json({ 
        success: false, 
        error: "لم يتم طلب إعادة تعيين كلمة المرور" 
      });
    }

    const resetData = resetDoc.data();

    if (resetData?.code !== code) {
      return res.status(400).json({ 
        success: false, 
        error: "رمز التحقق غير صحيح" 
      });
    }

    if (resetData?.expiry < Date.now()) {
      return res.status(400).json({ 
        success: false, 
        error: "انتهت صلاحية رمز التحقق" 
      });
    }

    await adminAuth.updateUser(userId, { password: newPassword });
    await adminDb.collection('password_resets').doc(userId).delete();

    res.json({ 
      success: true, 
      message: "تم تغيير كلمة المرور بنجاح" 
    });
  } catch (error: any) {
    console.error("Reset password error:", error?.message);
    res.status(500).json({ 
      success: false, 
      error: "حدث خطأ أثناء إعادة تعيين كلمة المرور" 
    });
  }
}
