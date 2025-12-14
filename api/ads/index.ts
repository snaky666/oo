import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, FIREBASE_PROJECT_ID, FIREBASE_API_KEY, extractDocumentData } from '../_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads`,
        {
          method: 'GET',
          headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
        }
      );

      if (!response.ok) {
        return res.json([]);
      }

      const data = await response.json();
      const ads = data.documents?.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        ...extractDocumentData(doc.fields)
      })) || [];

      return res.json(ads);
    } catch (error: any) {
      console.error("Error fetching ads:", error?.message);
      res.json([]);
    }
  } else if (req.method === 'POST') {
    try {
      const { image, companyName, link, description } = req.body;

      if (!image || !description || !companyName) {
        return res.status(400).json({ error: 'Image, company name and description are required' });
      }

      const adId = `ad_${Date.now()}`;
      const adData = {
        fields: {
          image: { stringValue: image },
          companyName: { stringValue: companyName },
          link: link ? { stringValue: link } : { stringValue: '' },
          description: { stringValue: description },
          active: { booleanValue: true },
          createdAt: { integerValue: Date.now().toString() }
        }
      };

      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${adId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': FIREBASE_API_KEY || ''
          },
          body: JSON.stringify(adData)
        }
      );

      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to create ad' });
      }

      return res.json({ success: true, id: adId });
    } catch (error: any) {
      console.error("Error creating ad:", error?.message);
      res.status(500).json({ error: 'Failed to create ad' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
