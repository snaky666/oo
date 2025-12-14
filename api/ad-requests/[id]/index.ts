import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, FIREBASE_PROJECT_ID, FIREBASE_API_KEY, extractDocumentData } from '../../_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Ad request ID is required' });
  }

  if (req.method === 'GET') {
    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests/${id}`,
        {
          method: 'GET',
          headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
        }
      );

      if (!response.ok) {
        return res.status(404).json({ error: 'Ad request not found' });
      }

      const doc = await response.json();
      return res.json({
        id: doc.name.split('/').pop(),
        ...extractDocumentData(doc.fields)
      });
    } catch (error: any) {
      console.error("Error:", error?.message);
      res.status(500).json({ error: 'Failed to fetch ad request' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests/${id}`,
        {
          method: 'DELETE',
          headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
        }
      );

      if (!response.ok) {
        return res.status(500).json({ error: 'فشل في حذف طلب الإعلان' });
      }

      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error:", error?.message);
      res.status(500).json({ error: 'فشل في حذف طلب الإعلان' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
