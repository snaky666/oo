import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.odhiyaty.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || 'verification@odhiyaty.com',
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'verification@odhiyaty.com';
    const result = await transporter.sendMail({
      from: `"أضحيتي" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error('Email error:', error?.message);
    return { success: false, error: error?.message };
  }
}

export async function sendVerificationEmail(email: string, code: string) {
  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head><meta charset="UTF-8"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; padding: 40px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a472a; text-align: center;">أهلاً بك في أضحيتي</h1>
          <p style="color: #333; font-size: 16px;">شكراً لتسجيلك. استخدم كود التحقق التالي:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: #1a472a; padding: 20px 40px; border-radius: 10px;">
              <p style="color: #fff; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0;">${code}</p>
            </div>
          </div>
          <p style="color: #856404; background-color: #fff3cd; padding: 15px; border-radius: 5px;">صلاحية الكود: 15 دقيقة</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to: email, subject: 'كود التحقق - أضحيتي', html });
}

export async function sendResetPasswordEmail(email: string, code: string) {
  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head><meta charset="UTF-8"></head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="background-color: #f5f5f5; padding: 20px;">
        <div style="background-color: white; padding: 40px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a472a; text-align: center;">إعادة تعيين كلمة المرور</h1>
          <p style="color: #333; font-size: 16px;">استخدم الكود التالي لإعادة تعيين كلمة المرور:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: #1a472a; padding: 20px 40px; border-radius: 10px;">
              <p style="color: #fff; font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0;">${code}</p>
            </div>
          </div>
          <p style="color: #856404; background-color: #fff3cd; padding: 15px; border-radius: 5px;">صلاحية الكود: 15 دقيقة</p>
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to: email, subject: 'كود إعادة تعيين كلمة المرور - أضحيتي', html });
}

export async function sendOrderConfirmationEmail(email: string, orderData: any) {
  const html = `
    <div dir="rtl" style="font-family: Arial; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a472a;">تأكيد طلب الشراء</h1>
        <p>تم استقبال طلبك بنجاح</p>
        <p>رقم الطلب: <strong>${orderData.orderId}</strong></p>
      </div>
    </div>
  `;
  return sendEmail({ to: email, subject: 'تأكيد طلب الشراء - أضحيتي', html });
}

export async function sendAdminNotificationEmail(orderData: any) {
  const html = `
    <div dir="rtl" style="font-family: Arial; padding: 20px; background-color: #f5f5f5;">
      <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a472a;">طلب شراء جديد</h1>
        <p>رقم الطلب: <strong>${orderData.orderId}</strong></p>
      </div>
    </div>
  `;
  return sendEmail({ to: process.env.ADMIN_EMAIL || 'admin@odhiyaty.com', subject: 'طلب شراء جديد - أضحيتي', html });
}
