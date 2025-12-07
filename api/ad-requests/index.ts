
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
    // GET - جلب جميع طلبات الإعلانات
    if (req.method === 'GET') {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/adRequests`,
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
      const adRequests = data.documents?.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        ...extractDocumentData(doc.fields)
      })) || [];

      return res.status(200).json(adRequests);
    }

    // POST - إنشاء طلب إعلان جديد
    if (req.method === 'POST') {
      const { image, companyName, link, description, contactPhone, contactEmail, userId, userEmail } = req.body;

      if (!image || !description || !companyName || !contactPhone || !userId || !userEmail) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const requestId = `adreq_${Date.now()}`;
      const requestData = {
        fields: {
          image: { stringValue: image },
          companyName: { stringValue: companyName },
          link: link ? { stringValue: link } : { stringValue: '' },
          description: { stringValue: description },
          contactPhone: { stringValue: contactPhone },
          contactEmail: contactEmail ? { stringValue: contactEmail } : { stringValue: '' },
          userId: { stringValue: userId },
          userEmail: { stringValue: userEmail },
          status: { stringValue: 'pending' },
          createdAt: { integerValue: Date.now().toString() }
        }
      };

      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/adRequests/${requestId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': FIREBASE_API_KEY || ''
          },
          body: JSON.stringify(requestData)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Firestore error:', response.status, errorText);
        return res.status(500).json({ error: 'Failed to create ad request', details: errorText });
      }

      return res.status(200).json({ success: true, id: requestId });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
};
