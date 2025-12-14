import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from '../_utils/firebase';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from '../_utils/email';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, orderData } = req.body;
    if (!email || !orderData) {
      return res.status(400).json({ error: "Email and order data required" });
    }

    const result = await sendOrderConfirmationEmail(email, orderData);

    // Also send notification to admin
    await sendAdminNotificationEmail(orderData);

    res.json(result);
  } catch (error: any) {
    console.error("❌ Send confirmation error:", error?.message);
    res.status(500).json({ error: error?.message });
  }
}
