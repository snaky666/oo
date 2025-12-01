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

// Create transporter
let transporter: any;

// Always use real SMTP if credentials are available, otherwise use Ethereal for testing
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  // Use real SMTP (works in both dev and production)
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT === '465' ? true : false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
} else {
  // Development fallback: Use test account
  transporter = nodemailer.createTestAccount().then(testAccount => 
    nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
  );
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const mailer = await transporter;
    const info = await mailer.sendMail({
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
        html: options.html,
        previewUrl: nodemailer.getTestMessageUrl(info),
      };
      
      fs.appendFileSync(
        path.join(logsDir, 'emails.log'),
        JSON.stringify(emailLog) + '\n'
      );
      
      console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
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
  
  return sendEmail({
    to: email,
    subject: 'تحقق من بريدك الإلكتروني - أضحيتي',
    html: `
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
    `,
  });
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const baseUrl = getBaseUrl();
  const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  
  return sendEmail({
    to: email,
    subject: 'إعادة تعيين كلمة المرور - أضحيتي',
    html: `
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
    `,
  });
}

export async function sendOrderConfirmationEmail(email: string, orderData: any) {
  return sendEmail({
    to: email,
    subject: 'تأكيد طلب الشراء - أضحيتي',
    html: `<div dir="rtl"><h2>تأكيد طلب</h2><p>رقم الطلب: ${orderData.orderId}</p></div>`,
  });
}

export async function sendAdminNotificationEmail(orderData: any) {
  return sendEmail({
    to: 'admin@odhiyaty.com',
    subject: 'طلب شراء جديد - أضحيتي',
    html: `<div dir="rtl"><h2>طلب جديد</h2><p>${orderData.orderId}</p></div>`,
  });
}
