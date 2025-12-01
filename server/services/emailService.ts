import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV !== 'production';

const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === 'production') return `https://${process.env.DOMAIN || 'odhiyaty.com'}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return 'http://localhost:5000';
};

// Create transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.odhiyaty.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'verification@odhiyaty.com',
    pass: process.env.SMTP_PASSWORD || 'silo@salah55',
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || 'verification@odhiyaty.com',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    
    console.log('✅ Email sent:', info.messageId);
    
    // Save to file in development
    if (isDev) {
      const logsDir = path.join(process.cwd(), '.logs');
      if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
      
      const emailLog = {
        timestamp: new Date().toISOString(),
        to: options.to,
        subject: options.subject,
        messageId: info.messageId,
      };
      
      fs.appendFileSync(
        path.join(logsDir, 'emails.log'),
        JSON.stringify(emailLog) + '\n'
      );
    }
    
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ Email error:', error?.message);
    return { success: false, error: error?.message };
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = getBaseUrl();
  const verificationLink = `${baseUrl}/verify?token=${token}&email=${encodeURIComponent(email)}`;
  
  console.log('📧 Sending verification to:', email);
  console.log('🔗 Link:', verificationLink);

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
  
  const html = `
    <div dir="rtl" style="font-family: Cairo, Arial; text-align: right; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a472a; margin-bottom: 20px;">إعادة تعيين كلمة المرور</h1>
        <a href="${resetLink}" style="display: inline-block; background-color: #1a472a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
          إعادة تعيين كلمة المرور
        </a>
        <p style="color: #e74c3c; font-size: 14px; margin-top: 20px; font-weight: bold;">
          ⚠️ صلاحية هذا الرابط تنتهي بعد ساعة واحدة.
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
    <div dir="rtl" style="font-family: Cairo, Arial; text-align: right; padding: 20px;">
      <h2>تأكيد طلب الشراء</h2>
      <p>رقم الطلب: ${orderData.orderId}</p>
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
    <div dir="rtl" style="font-family: Cairo, Arial; text-align: right; padding: 20px;">
      <h2>طلب شراء جديد</h2>
      <p>رقم الطلب: ${orderData.orderId}</p>
    </div>
  `;

  return sendEmail({
    to: 'admin@odhiyaty.com',
    subject: 'طلب شراء جديد - أضحيتي',
    html,
  });
}
