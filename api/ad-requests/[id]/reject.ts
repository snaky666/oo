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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { reason } = req.body;

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

    const updateRequestData = {
      fields: {
        ...adRequestDoc.fields,
        status: { stringValue: 'rejected' },
        rejectedAt: { integerValue: String(Date.now()) },
        rejectionReason: { stringValue: reason || '' }
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
        body: JSON.stringify(updateRequestData)
      }
    );

    if (!updateResponse.ok) {
      return res.status(500).json({ error: 'Failed to reject ad request' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
};
