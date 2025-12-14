import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initFirebase } from './_utils/firebase';
import { sendVerificationEmail, sendResetPasswordEmail } from './_utils/email';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { adminAuth, adminDb } = initFirebase();
  const { action } = req.query;

  try {
    if (action === 'pending-registration' && req.method === 'POST') {
      const { email, password, role, phone, verificationCode, tokenExpiry } = req.body;
      
      if (!adminAuth || !adminDb) {
        return res.status(503).json({ success: false, error: "Firebase Admin not configured" });
      }

      try {
        const authUser = await adminAuth.getUserByEmail(email);
        if (authUser) {
          return res.status(400).json({ success: false, error: "البريد الإلكتروني مستخدم بالفعل" });
        }
      } catch (error: any) {
        if (error.code !== 'auth/user-not-found') throw error;
      }

      const pendingRef = adminDb.collection('pending_registrations');
      const existingSnapshot = await pendingRef.where('email', '==', email).get();
      const pendingData = { email, password, role, phone, verificationCode, tokenExpiry, createdAt: Date.now() };

      if (!existingSnapshot.empty) {
        await pendingRef.doc(existingSnapshot.docs[0].id).set(pendingData);
      } else {
        await pendingRef.add(pendingData);
      }

      return res.json({ success: true });
    }

    if (action === 'complete-registration' && req.method === 'POST') {
      const { code, email } = req.body;
      
      if (!code || !email) {
        return res.status(400).json({ success: false, error: "Code and email required" });
      }

      if (!adminAuth || !adminDb) {
        return res.status(503).json({ success: false, error: "Firebase Admin not configured" });
      }

      const pendingRef = adminDb.collection('pending_registrations');
      const snapshot = await pendingRef.where('email', '==', email).get();

      if (snapshot.empty) {
        return res.status(404).json({ success: false, error: "Pending registration not found" });
      }

      const pendingDoc = snapshot.docs[0];
      const pending = pendingDoc.data();

      if (pending.verificationCode !== code) {
        return res.status(400).json({ success: false, error: "Invalid verification code" });
      }

      if (pending.tokenExpiry < Date.now()) {
        return res.status(400).json({ success: false, error: "Verification code expired" });
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
      return res.json({ success: true, message: "Registration completed successfully" });
    }

    if (action === 'resend-pending-verification' && req.method === 'POST') {
      const { email } = req.body;
      
      if (!adminDb) {
        return res.status(503).json({ success: false, error: "Firebase Admin not configured" });
      }

      const pendingRef = adminDb.collection('pending_registrations');
      const snapshot = await pendingRef.where('email', '==', email).get();

      if (snapshot.empty) {
        return res.status(404).json({ success: false, error: "Pending registration not found" });
      }

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenExpiry = Date.now() + (15 * 60 * 1000);

      await snapshot.docs[0].ref.update({ verificationCode: newCode, tokenExpiry });
      const emailResult = await sendVerificationEmail(email, newCode);

      if (emailResult.success) {
        return res.json({ success: true, message: "New verification code sent" });
      }
      return res.status(500).json({ success: false, error: emailResult.error });
    }

    if (action === 'cancel-pending-registration' && req.method === 'POST') {
      const { email } = req.body;
      
      if (!adminDb) {
        return res.status(503).json({ success: false, error: "Firebase Admin not configured" });
      }

      const pendingRef = adminDb.collection('pending_registrations');
      const snapshot = await pendingRef.where('email', '==', email).get();

      if (!snapshot.empty) {
        await snapshot.docs[0].ref.delete();
      }
      return res.json({ success: true, message: "Pending registration canceled" });
    }

    if (action === 'send-verification' && req.method === 'POST') {
      const { email, code } = req.body;
      res.json({ success: true, message: "Verification code sent" });
      sendVerificationEmail(email, code).catch(console.error);
      return;
    }

    if (action === 'request-password-reset' && req.method === 'POST') {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ success: false, error: "البريد الإلكتروني مطلوب" });
      }

      if (!adminDb) {
        return res.status(503).json({ success: false, error: "خدمة إعادة تعيين كلمة المرور غير متاحة" });
      }

      const usersRef = adminDb.collection('users');
      const usersSnapshot = await usersRef.where('email', '==', email).get();
      
      if (usersSnapshot.empty) {
        return res.json({ success: true, message: "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال كود التحقق" });
      }

      const userDoc = usersSnapshot.docs[0];
      const user = { uid: userDoc.id, ...userDoc.data() };

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenExpiry = Date.now() + (15 * 60 * 1000);

      await adminDb.collection('password_resets').doc(user.uid).set({
        email, code: resetCode, expiry: tokenExpiry, createdAt: Date.now()
      });

      const emailResult = await sendResetPasswordEmail(email, resetCode);

      if (emailResult.success) {
        return res.json({ success: true, message: "تم إرسال كود التحقق إلى بريدك الإلكتروني" });
      }
      return res.status(500).json({ success: false, error: "فشل في إرسال البريد الإلكتروني" });
    }

    if (action === 'reset-password' && req.method === 'POST') {
      const { email, code, newPassword } = req.body;
      
      if (!adminAuth || !adminDb) {
        return res.status(503).json({ success: false, error: "خدمة إعادة تعيين كلمة المرور غير متاحة" });
      }

      if (!email || !code || !newPassword) {
        return res.status(400).json({ success: false, error: "جميع الحقول مطلوبة" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ success: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      }

      const usersRef = adminDb.collection('users');
      const usersSnapshot = await usersRef.where('email', '==', email).get();
      
      if (usersSnapshot.empty) {
        return res.status(404).json({ success: false, error: "المستخدم غير موجود" });
      }

      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;

      const resetDoc = await adminDb.collection('password_resets').doc(userId).get();
      
      if (!resetDoc.exists) {
        return res.status(400).json({ success: false, error: "لم يتم طلب إعادة تعيين كلمة المرور" });
      }

      const resetData = resetDoc.data();
      
      if (resetData?.code !== code) {
        return res.status(400).json({ success: false, error: "كود التحقق غير صحيح" });
      }

      if (resetData?.expiry < Date.now()) {
        return res.status(400).json({ success: false, error: "انتهت صلاحية كود التحقق" });
      }

      await adminAuth.updateUser(userId, { password: newPassword });
      await resetDoc.ref.delete();

      return res.json({ success: true, message: "تم تغيير كلمة المرور بنجاح" });
    }

    if (action === 'resend-reset-code' && req.method === 'POST') {
      const { email } = req.body;
      
      if (!adminDb) {
        return res.status(503).json({ success: false, error: "Firebase Admin not configured" });
      }

      const usersRef = adminDb.collection('users');
      const usersSnapshot = await usersRef.where('email', '==', email).get();
      
      if (usersSnapshot.empty) {
        return res.json({ success: true, message: "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال كود جديد" });
      }

      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;

      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenExpiry = Date.now() + (15 * 60 * 1000);

      await adminDb.collection('password_resets').doc(userId).set({
        email, code: newCode, expiry: tokenExpiry, createdAt: Date.now()
      });

      const emailResult = await sendResetPasswordEmail(email, newCode);

      if (emailResult.success) {
        return res.json({ success: true, message: "تم إرسال كود جديد" });
      }
      return res.status(500).json({ success: false, error: "فشل في إرسال البريد" });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error: any) {
    console.error("Auth error:", error?.message);
    return res.status(500).json({ success: false, error: error?.message || "Server error" });
  }
}
