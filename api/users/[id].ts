import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, getAdminDb, FIREBASE_PROJECT_ID, FIREBASE_API_KEY, extractDocumentData } from '../_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  if (req.method === 'GET') {
    try {
      const adminDb = getAdminDb();

      if (adminDb) {
        const doc = await adminDb.collection("users").doc(id).get();
        if (!doc.exists) {
          return res.status(404).json({ error: "User not found" });
        }
        return res.json({
          id: doc.id,
          ...doc.data()
        });
      }

      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${id}`,
        {
          method: 'GET',
          headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
        }
      );

      if (!response.ok) {
        return res.status(404).json({ error: 'User not found' });
      }

      const doc = await response.json();
      return res.json({
        id: id,
        ...extractDocumentData(doc.fields)
      });
    } catch (error: any) {
      console.error("Error:", error?.message);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  } else if (req.method === 'PATCH') {
    try {
      const adminDb = getAdminDb();
      const updateData = req.body;

      if (adminDb) {
        await adminDb.collection('users').doc(id).update(updateData);
        return res.json({ success: true });
      }

      res.status(500).json({ error: 'Database not available' });
    } catch (error: any) {
      console.error("Error:", error?.message);
      res.status(500).json({ error: 'Failed to update user' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
