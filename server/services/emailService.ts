import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
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
      from: process.env.SMTP_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ Email error:', error?.message);
    return { success: false, error: error?.message };
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationLink = `${process.env.REPLIT_DOMAINS}/verify?token=${token}&email=${encodeURIComponent(email)}`;
  
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
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            © 2025 أضحيتي - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    `,
    text: `أهلاً بك في أضحيتي\n\nشكراً لتسجيلك. يرجى تحقق من بريدك الإلكتروني باستخدام هذا الرابط:\n${verificationLink}`,
  });
}

export async function sendResetPasswordEmail(email: string, token: string) {
  const resetLink = `${process.env.REPLIT_DOMAINS}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  
  return sendEmail({
    to: email,
    subject: 'إعادة تعيين كلمة المرور - أضحيتي',
    html: `
      <div dir="rtl" style="font-family: Cairo, Arial; text-align: right; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a472a; margin-bottom: 20px;">إعادة تعيين كلمة المرور</h1>
          <p style="color: #333; font-size: 16px; margin-bottom: 15px;">
            لقد طلبت إعادة تعيين كلمة المرور. انقر على الزر أدناه لتعيين كلمة مرور جديدة:
          </p>
          <a href="${resetLink}" style="display: inline-block; background-color: #1a472a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
            إعادة تعيين كلمة المرور
          </a>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            أو انسخ هذا الرابط:
          </p>
          <p style="color: #1a472a; word-break: break-all; font-size: 12px; background-color: #f9f9f9; padding: 10px; border-radius: 5px;">
            ${resetLink}
          </p>
          <p style="color: #e74c3c; font-size: 14px; margin-top: 20px; font-weight: bold;">
            ⚠️ صلاحية هذا الرابط تنتهي بعد ساعة واحدة.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد أو تواصل معنا.
          </p>
        </div>
      </div>
    `,
    text: `إعادة تعيين كلمة المرور\n\nانقر على الرابط أدناه:\n${resetLink}\n\nصلاحية الرابط: ساعة واحدة`,
  });
}

export async function sendOrderConfirmationEmail(email: string, orderData: any) {
  return sendEmail({
    to: email,
    subject: 'تأكيد طلب الشراء - أضحيتي',
    html: `
      <div dir="rtl" style="font-family: Cairo, Arial; text-align: right; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a472a; margin-bottom: 20px;">تأكيد طلب الشراء</h1>
          <p style="color: #333; font-size: 16px; margin-bottom: 20px;">
            شكراً لك! تم استقبال طلب شرائك بنجاح.
          </p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>رقم الطلب:</strong> ${orderData.orderId}</p>
            <p><strong>الحالة:</strong> قيد المراجعة</p>
            <p><strong>تاريخ الطلب:</strong> ${new Date().toLocaleDateString('ar-DZ')}</p>
          </div>
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            سيتواصل معك البائع قريباً للمتابعة والتفاصيل الإضافية.
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            © 2025 أضحيتي - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendAdminNotificationEmail(orderData: any) {
  return sendEmail({
    to: 'admin@odhiyaty.com',
    subject: 'طلب شراء جديد - أضحيتي',
    html: `
      <div dir="rtl" style="font-family: Cairo, Arial; text-align: right; padding: 20px;">
        <h2>طلب شراء جديد</h2>
        <p><strong>المشتري:</strong> ${orderData.buyerName}</p>
        <p><strong>البريد الإلكتروني:</strong> ${orderData.buyerEmail}</p>
        <p><strong>رقم الطلب:</strong> ${orderData.orderId}</p>
        <p><strong>التفاصيل:</strong> ${orderData.details}</p>
      </div>
    `,
  });
}
