import { Resend } from 'resend';

const isDev = process.env.NODE_ENV !== 'production';

const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === 'production') return `https://${process.env.DOMAIN || 'odhiyaty.com'}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return 'http://localhost:5000';
};

// Use Resend for all environments (development and production)
const resend = new Resend(process.env.RESEND_API_KEY || 're_test_');

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    console.log('📧 Sending email via Resend to:', options.to);
    console.log('🔑 Using API Key:', process.env.RESEND_API_KEY ? '✓ Available' : '✗ Missing');

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (result.error) {
      console.error('❌ Resend error:', result.error);
      return { success: false, error: result.error?.message };
    }

    console.log('✅ Email sent successfully:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error('❌ Email error:', error?.message);
    return { success: false, error: error?.message };
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = getBaseUrl();
  const verificationLink = `${baseUrl}/verify?token=${token}&email=${encodeURIComponent(email)}`;
  
  console.log('📧 Sending verification to:', email);
  console.log('🔗 Verification link:', verificationLink);

  const html = `
    <div dir="rtl" style="font-family: Cairo, Arial; text-align: right; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a472a; margin-bottom: 20px;">أهلاً بك في أضحيتي</h1>
        <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
          شكراً لتسجيلك في منصة أضحيتي. يرجى تحقق من بريدك الإلكتروني بالنقر على الزر أدناه:
        </p>
        <a href="${verificationLink}" style="display: inline-block; background-color: #1a472a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
          تحقق من البريد الإلكتروني
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          أو انسخ هذا الرابط والصقه في المتصفح:
        </p>
        <p style="color: #1a472a; word-break: break-all; font-size: 12px; background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
          ${verificationLink}
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          إذا لم تقم بإنشاء حساب، يرجى تجاهل هذا البريد.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'تحقق من بريدك الإلكتروني - أضحيتي',
    html,
  });
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const baseUrl = getBaseUrl();
  const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  
  console.log('📧 Sending password reset to:', email);

  const html = `
    <div dir="rtl" style="font-family: Cairo, Arial; text-align: right; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a472a; margin-bottom: 20px;">إعادة تعيين كلمة المرور</h1>
        <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
          لقد طلبت إعادة تعيين كلمة المرور. اضغط على الزر أدناه:
        </p>
        <a href="${resetLink}" style="display: inline-block; background-color: #1a472a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
          إعادة تعيين كلمة المرور
        </a>
        <p style="color: #e74c3c; font-size: 14px; margin-top: 20px; font-weight: bold;">
          ⚠️ صلاحية هذا الرابط تنتهي بعد ساعة واحدة.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذا البريد.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'إعادة تعيين كلمة المرور - أضحيتي',
    html,
  });
}

export async function sendOrderConfirmationEmail(email: string, orderData: any) {
  const html = `
    <div dir="rtl" style="font-family: Cairo, Arial; text-align: right; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a472a; margin-bottom: 20px;">تأكيد طلب الشراء</h1>
        <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
          تم استقبال طلبك بنجاح
        </p>
        <p style="color: #666; font-size: 14px;">
          رقم الطلب: <strong>${orderData.orderId}</strong>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'تأكيد طلب الشراء - أضحيتي',
    html,
  });
}

export async function sendAdminNotificationEmail(orderData: any) {
  const html = `
    <div dir="rtl" style="font-family: Cairo, Arial; text-align: right; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a472a; margin-bottom: 20px;">طلب شراء جديد</h1>
        <p style="color: #666; font-size: 14px;">
          رقم الطلب: <strong>${orderData.orderId}</strong>
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: process.env.ADMIN_EMAIL || 'admin@odhiyaty.com',
    subject: 'طلب شراء جديد - أضحيتي',
    html,
  });
}
