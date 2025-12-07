
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
    if (req.method === 'PATCH') {
      const { image, companyName, link, description, durationDays, active } = req.body;

      const updateFields: any = {};

      if (image) updateFields.image = { stringValue: image };
      if (companyName) updateFields.companyName = { stringValue: companyName };
      if (link !== undefined) updateFields.link = { stringValue: link };
      if (description) updateFields.description = { stringValue: description };
      if (active !== undefined) updateFields.active = { booleanValue: active };
      
      // تحديث المدة وتاريخ الانتهاء
      if (durationDays !== undefined) {
        updateFields.durationDays = { integerValue: durationDays.toString() };
        const now = Date.now();
        const expiresAt = now + (durationDays * 24 * 60 * 60 * 1000);
        updateFields.expiresAt = { integerValue: expiresAt.toString() };
      }

      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': FIREBASE_API_KEY || ''
          },
          body: JSON.stringify({
            fields: updateFields
          })
        }
      );

      if (!response.ok) {
        return res.status(500).json({ error: 'Failed to update ad' });
      }

      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
};
