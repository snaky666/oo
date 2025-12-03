const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

function extractFieldValue(value: any): any {
  if (!value) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return parseInt(value.integerValue);
  if (value.doubleValue !== undefined) return parseFloat(value.doubleValue);
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.arrayValue !== undefined) {
    return value.arrayValue.values?.map((v: any) => extractFieldValue(v)) || [];
  }
  if (value.mapValue !== undefined) {
    const result: any = {};
    for (const [key, val] of Object.entries(value.mapValue.fields || {})) {
      result[key] = extractFieldValue(val);
    }
    return result;
  }
  if (value.timestampValue !== undefined) {
    return new Date(value.timestampValue).getTime();
  }
  return value;
}

function extractDocumentData(fields: any): any {
  if (!fields) return {};
  const result: any = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = extractFieldValue(value);
  }
  return result;
}

export default async (req: any, res: any) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads`,
        {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': FIREBASE_API_KEY || ''
          }
        }
      );

      if (!response.ok) {
        return res.status(200).json([]);
      }

      const data = await response.json();
      const ads = data.documents?.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        ...extractDocumentData(doc.fields)
      })) || [];

      return res.status(200).json(ads);
    }

    if (req.method === 'POST') {
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
        const errorText = await response.text();
        console.error('Firestore error:', response.status, errorText);
        return res.status(500).json({ error: 'Failed to create ad', details: errorText });
      }

      return res.status(200).json({ success: true, id: adId });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Ad ID is required' });
      }

      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${id}`,
        {
          method: 'DELETE',
          headers: {
            'X-Goog-Api-Key': FIREBASE_API_KEY || ''
          }
        }
      );

      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to delete ad' });
      }

      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
};
