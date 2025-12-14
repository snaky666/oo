import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, getAdminDb, FIREBASE_PROJECT_ID, FIREBASE_API_KEY, extractDocumentData } from '../_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Sheep ID is required' });
  }

  try {
    const adminDb = getAdminDb();

    if (adminDb) {
      const doc = await adminDb.collection("sheep").doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ error: "Sheep not found" });
      }
      return res.json({
        id: doc.id,
        ...doc.data()
      });
    }

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/sheep/${id}`,
      {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": FIREBASE_API_KEY || ""
        }
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({ error: "Sheep not found" });
      }
      return res.status(500).json({ error: "Failed to fetch sheep" });
    }

    const doc = await response.json();
    res.json({
      id: id,
      ...extractDocumentData(doc.fields)
    });
  } catch (error: any) {
    console.error("Error:", error?.message);
    res.status(500).json({ error: "Failed to fetch sheep" });
  }
}
