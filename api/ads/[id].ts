import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, FIREBASE_PROJECT_ID, FIREBASE_API_KEY, extractDocumentData } from '../_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Ad ID is required' });
  }

  if (req.method === 'GET') {
    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${id}`,
        {
          method: 'GET',
          headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
        }
      );

      if (!response.ok) {
        return res.status(404).json({ error: 'Ad not found' });
      }

      const doc = await response.json();
      return res.json({
        id: doc.name.split('/').pop(),
        ...extractDocumentData(doc.fields)
      });
    } catch (error: any) {
      console.error("Error:", error?.message);
      res.status(500).json({ error: 'Failed to fetch ad' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${id}`,
        {
          method: 'DELETE',
          headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
        }
      );

      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to delete ad' });
      }

      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error:", error?.message);
      res.status(500).json({ error: 'Failed to delete ad' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const { image, companyName, link, description, durationDays, active } = req.body;

      const getResponse = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${id}`,
        {
          method: 'GET',
          headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
        }
      );

      if (!getResponse.ok) {
        return res.status(404).json({ error: 'Ad not found' });
      }

      const existingDoc = await getResponse.json();
      const existingData = extractDocumentData(existingDoc.fields);

      let expiresAt = existingData.expiresAt;
      if (durationDays && durationDays !== existingData.durationDays) {
        expiresAt = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
      }

      const updateData = {
        fields: {
          image: { stringValue: image || existingData.image },
          companyName: { stringValue: companyName || existingData.companyName },
          link: { stringValue: link !== undefined ? link : (existingData.link || '') },
          description: { stringValue: description || existingData.description },
          active: { booleanValue: active !== undefined ? active : existingData.active },
          durationDays: { integerValue: (durationDays || existingData.durationDays || 30).toString() },
          expiresAt: { integerValue: (expiresAt || Date.now()).toString() },
          createdAt: { integerValue: (existingData.createdAt || Date.now()).toString() }
        }
      };

      const updateResponse = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${id}`,
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
        return res.status(500).json({ error: 'Failed to update ad' });
      }

      return res.json({ success: true });
    } catch (error: any) {
      console.error("Error:", error?.message);
      res.status(500).json({ error: 'Failed to update ad' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
