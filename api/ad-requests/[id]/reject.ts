import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, FIREBASE_PROJECT_ID, FIREBASE_API_KEY } from '../../_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { rejectionReason } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Ad request ID is required' });
  }

  try {
    const getResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests/${id}`,
      {
        method: 'GET',
        headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
      }
    );

    if (!getResponse.ok) {
      return res.status(404).json({ error: 'طلب الإعلان غير موجود' });
    }

    const requestDoc = await getResponse.json();

    const updateData = {
      fields: {
        ...requestDoc.fields,
        status: { stringValue: "rejected" },
        rejectionReason: { stringValue: rejectionReason || "" },
        updatedAt: { integerValue: Date.now().toString() }
      }
    };

    const updateResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': FIREBASE_API_KEY || ''
        },
        body: JSON.stringify(updateData)
      }
    );

    if (!updateResponse.ok) {
      return res.status(500).json({ error: 'فشل في رفض طلب الإعلان' });
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error:", error?.message);
    res.status(500).json({ error: 'فشل في رفض طلب الإعلان' });
  }
}
