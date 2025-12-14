import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../_utils/firebase';
import { sendVerificationEmail } from '../_utils/email';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, code } = req.body;

    res.json({ success: true, message: "Verification code sent" });

    sendVerificationEmail(email, code)
      .then(result => {
        if (result.success) {
          console.log('Verification email sent to:', email);
        } else {
          console.error('Failed to send verification email:', result.error);
        }
      })
      .catch(error => {
        console.error('Email sending error:', error?.message);
      });
  } catch (error: any) {
    console.error("Send verification error:", error?.message);
    res.status(500).json({ success: false, error: error?.message });
  }
}
