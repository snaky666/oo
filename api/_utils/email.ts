import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(email: string, code: string) {
  if (!resend) {
    console.warn('Resend not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    await resend.emails.send({
      from: 'أضحيتي <noreply@resend.dev>',
      to: email,
      subject: 'رمز التحقق - أضحيتي',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>رمز التحقق الخاص بك</h2>
          <p>استخدم الرمز التالي للتحقق من بريدك الإلكتروني:</p>
          <h1 style="color: #b8860b; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          <p>هذا الرمز صالح لمدة 15 دقيقة.</p>
          <p>إذا لم تطلب هذا الرمز، يرجى تجاهل هذا البريد.</p>
        </div>
      `
    });
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error?.message);
    return { success: false, error: error?.message };
  }
}

export async function sendResetPasswordEmail(email: string, code: string) {
  if (!resend) {
    console.warn('Resend not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    await resend.emails.send({
      from: 'أضحيتي <noreply@resend.dev>',
      to: email,
      subject: 'إعادة تعيين كلمة المرور - أضحيتي',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>إعادة تعيين كلمة المرور</h2>
          <p>استخدم الرمز التالي لإعادة تعيين كلمة المرور:</p>
          <h1 style="color: #b8860b; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          <p>هذا الرمز صالح لمدة 15 دقيقة.</p>
          <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.</p>
        </div>
      `
    });
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error?.message);
    return { success: false, error: error?.message };
  }
}

export async function sendOrderConfirmationEmail(email: string, orderData: any) {
  if (!resend) {
    console.warn('Resend not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    await resend.emails.send({
      from: 'أضحيتي <noreply@resend.dev>',
      to: email,
      subject: 'تأكيد طلب الشراء - أضحيتي',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a472a; margin-bottom: 20px;">تأكيد طلب الشراء</h1>
            <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
              تم استقبال طلبك بنجاح
            </p>
            <p style="color: #666; font-size: 14px;">
              رقم الطلب: <strong>${orderData.orderId || 'N/A'}</strong>
            </p>
          </div>
        </div>
      `
    });
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error?.message);
    return { success: false, error: error?.message };
  }
}

export async function sendAdminNotificationEmail(orderData: any) {
  if (!resend) {
    console.warn('Resend not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@odhiyaty.com';

  try {
    await resend.emails.send({
      from: 'أضحيتي <noreply@resend.dev>',
      to: adminEmail,
      subject: 'طلب شراء جديد - أضحيتي',
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a472a; margin-bottom: 20px;">طلب شراء جديد</h1>
            <p style="color: #666; font-size: 14px;">
              رقم الطلب: <strong>${orderData.orderId || 'N/A'}</strong>
            </p>
          </div>
        </div>
      `
    });
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error?.message);
    return { success: false, error: error?.message };
  }
}
