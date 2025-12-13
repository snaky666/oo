const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

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

export default async (req: any, res: any) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { durationDays } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Ad request ID is required' });
  }

  if (!durationDays || durationDays < 1) {
    return res.status(400).json({ error: 'يجب تحديد مدة الإعلان' });
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
    const requestData = extractDocumentData(requestDoc.fields);

    const expiresAt = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
    const adId = `ad_${Date.now()}`;

    const adData = {
      fields: {
        image: { stringValue: requestData.image || "" },
        companyName: { stringValue: requestData.companyName || "" },
        link: { stringValue: requestData.link || "" },
        description: { stringValue: requestData.description || "" },
        active: { booleanValue: true },
        durationDays: { integerValue: durationDays.toString() },
        expiresAt: { integerValue: expiresAt.toString() },
        adRequestId: { stringValue: id },
        createdAt: { integerValue: Date.now().toString() }
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
      return res.status(500).json({ error: 'فشل في إنشاء الإعلان' });
    }

    const updateRequestData = {
      fields: {
        ...requestDoc.fields,
        status: { stringValue: "approved" },
        durationDays: { integerValue: durationDays.toString() },
        expiresAt: { integerValue: expiresAt.toString() },
        updatedAt: { integerValue: Date.now().toString() }
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
    res.status(500).json({ error: 'فشل في قبول طلب الإعلان' });
  }
};
