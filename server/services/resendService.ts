import { Resend } from 'resend';

let connectionSettings: any;
let resendClient: Resend | null = null;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

const getBaseUrl = () => {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === 'production') return `https://${process.env.DOMAIN || 'odhiyaty.com'}`;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return 'http://localhost:5000';
};

export async function sendVerificationEmail(email: string, token: string) {
  try {
    const baseUrl = getBaseUrl();
    const verificationLink = `${baseUrl}/verify?token=${token}&email=${encodeURIComponent(email)}`;
    
    console.log('📧 Sending verification to:', email);
    console.log('🔗 Link:', verificationLink);

    const { client, fromEmail } = await getUncachableResendClient();

    const result = await client.emails.send({
      from: fromEmail,
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

    if (result.error) {
      console.error('❌ Resend error:', result.error);
      return { success: false, error: result.error?.message };
    }

    console.log('✅ Email sent via Resend:', result.data?.id);
    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error('❌ Email error:', error?.message);
    return { success: false, error: error?.message };
  }
}

export async function sendResetPasswordEmail(email: string, token: string) {
  try {
    const baseUrl = getBaseUrl();
    const resetLink = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    const { client, fromEmail } = await getUncachableResendClient();

    const result = await client.emails.send({
      from: fromEmail,
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

    if (result.error) {
      console.error('❌ Resend error:', result.error);
      return { success: false, error: result.error?.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error('❌ Email error:', error?.message);
    return { success: false, error: error?.message };
  }
}

export async function sendOrderConfirmationEmail(email: string, orderData: any) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

    const result = await client.emails.send({
      from: fromEmail,
      to: email,
      subject: 'تأكيد طلب الشراء - أضحيتي',
      html: `<div dir="rtl"><h2>تأكيد طلب</h2><p>رقم الطلب: ${orderData.orderId}</p></div>`,
    });

    if (result.error) {
      console.error('❌ Resend error:', result.error);
      return { success: false, error: result.error?.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error('❌ Email error:', error?.message);
    return { success: false, error: error?.message };
  }
}

export async function sendAdminNotificationEmail(orderData: any) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

    const result = await client.emails.send({
      from: fromEmail,
      to: 'admin@odhiyaty.com',
      subject: 'طلب شراء جديد - أضحيتي',
      html: `<div dir="rtl"><h2>طلب جديد</h2><p>${orderData.orderId}</p></div>`,
    });

    if (result.error) {
      console.error('❌ Resend error:', result.error);
      return { success: false, error: result.error?.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error('❌ Email error:', error?.message);
    return { success: false, error: error?.message };
  }
}
