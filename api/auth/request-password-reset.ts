
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const adminDb = getFirestore();

// Helper function to send email (you'll need to implement this with Resend)
async function sendResetPasswordEmail(email: string, code: string) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'noreply@odhiyaty.com',
        to: email,
        subject: 'إعادة تعيين كلمة المرور - أضحيتي',
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">إعادة تعيين كلمة المرور</h2>
            <p>مرحباً،</p>
            <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.</p>
            <p>كود التحقق الخاص بك هو:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
              ${code}
            </div>
            <p>هذا الكود صالح لمدة 15 دقيقة فقط.</p>
            <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.</p>
            <p>مع التحية،<br>فريق أضحيتي</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "البريد الإلكتروني مطلوب" 
      });
    }

    // Check if user exists
    const usersRef = adminDb.collection('users');
    const usersSnapshot = await usersRef.where('email', '==', email).get();
    
    if (usersSnapshot.empty) {
      // Don't reveal if email exists for security
      return res.json({ 
        success: true, 
        message: "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال كود التحقق" 
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const user = { uid: userDoc.id, ...userDoc.data() };

    // Generate reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes

    // Store reset code in Firestore
    await adminDb.collection('password_resets').doc(user.uid).set({
      email: email,
      code: resetCode,
      expiry: tokenExpiry,
      createdAt: Date.now()
    });

    // Send reset email
    const emailResult = await sendResetPasswordEmail(email, resetCode);

    if (emailResult.success) {
      return res.json({ 
        success: true, 
        message: "تم إرسال كود التحقق إلى بريدك الإلكتروني" 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: "فشل في إرسال البريد الإلكتروني" 
      });
    }
  } catch (error: any) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "حدث خطأ غير متوقع" 
    });
  }
}
