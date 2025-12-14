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

  try {
    const approved = req.query.approved === "true";
    const adminDb = getAdminDb();

    if (adminDb) {
      let query: any = adminDb.collection("sheep");
      if (approved) {
        query = query.where("status", "==", "approved");
      }
      const snapshot = await query.get();
      const data = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));
      return res.json(data);
    }

    const body: any = {
      structuredQuery: {
        from: [{ collectionId: "sheep" }]
      }
    };

    if (approved) {
      body.structuredQuery.where = {
        fieldFilter: {
          field: { fieldPath: "status" },
          op: "EQUAL",
          value: { stringValue: "approved" }
        }
      };
    }

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": FIREBASE_API_KEY || ""
        },
        body: JSON.stringify(body)
      }
    );

    let data: any[] = [];
    if (response.ok) {
      const result = await response.json();
      if (Array.isArray(result)) {
        data = result.filter((item: any) => item.document).map((item: any) => ({
          id: item.document.name.split('/').pop(),
          ...extractDocumentData(item.document.fields)
        }));
      }
    }

    res.json(data);
  } catch (error: any) {
    console.error("Error:", error?.message);
    res.json([]);
  }
}
