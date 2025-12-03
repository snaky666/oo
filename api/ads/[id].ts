const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

export default async (req: any, res: any) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Ad ID is required' });
  }

  try {
    if (req.method === 'DELETE') {
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

    if (req.method === 'GET') {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${id}`,
        {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': FIREBASE_API_KEY || ''
          }
        }
      );

      if (!response.ok) {
        return res.status(404).json({ error: 'Ad not found' });
      }

      const doc = await response.json();
      
      function extractFieldValue(value: any): any {
        if (!value) return null;
        if (value.stringValue !== undefined) return value.stringValue;
        if (value.integerValue !== undefined) return parseInt(value.integerValue);
        if (value.doubleValue !== undefined) return parseFloat(value.doubleValue);
        if (value.booleanValue !== undefined) return value.booleanValue;
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

      const ad = {
        id: doc.name.split('/').pop(),
        ...extractDocumentData(doc.fields)
      };

      return res.status(200).json(ad);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
};
