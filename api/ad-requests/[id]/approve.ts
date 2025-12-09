const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

function extractFieldValue(value: any): any {
  if (!value) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return parseInt(value.integerValue);
  if (value.doubleValue !== undefined) return parseFloat(value.doubleValue);
  if (value.booleanValue !== undefined) return value.booleanValue;
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Ad request ID is required' });
  }

  try {
    const getResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests/${id}`,
      {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': FIREBASE_API_KEY || ''
        }
      }
    );

    if (!getResponse.ok) {
      return res.status(404).json({ error: 'Ad request not found' });
    }

    const adRequestDoc = await getResponse.json();
    const adRequestData = extractDocumentData(adRequestDoc.fields);

    const adId = `ad_${Date.now()}`;
    const adData = {
      fields: {
        image: { stringValue: adRequestData.image || '' },
        companyName: { stringValue: adRequestData.companyName || '' },
        link: { stringValue: adRequestData.link || '' },
        description: { stringValue: adRequestData.description || '' },
        active: { booleanValue: true },
        createdAt: { integerValue: String(Date.now()) },
        approvedFromRequest: { stringValue: id }
      }
    };

    const createAdResponse = await fetch(
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

    if (!createAdResponse.ok) {
      const errorText = await createAdResponse.text();
      console.error('Failed to create ad:', errorText);
      return res.status(500).json({ error: 'Failed to create ad from request' });
    }

    const updateRequestData = {
      fields: {
        ...adRequestDoc.fields,
        status: { stringValue: 'approved' },
        approvedAt: { integerValue: String(Date.now()) },
        resultingAdId: { stringValue: adId }
      }
    };

    await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': FIREBASE_API_KEY || ''
        },
        body: JSON.stringify(updateRequestData)
      }
    );

    return res.status(200).json({ success: true, adId });
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
};
