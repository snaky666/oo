import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initFirebase } from './_utils/firebase';

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

function extractDocumentData(fields: any): any {
  if (!fields) return {};
  const result: any = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = extractFieldValue(value);
  }
  return result;
}

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
    return extractDocumentData(value.mapValue.fields);
  }
  if (value.timestampValue !== undefined) {
    return new Date(value.timestampValue).getTime();
  }
  return value;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { adminDb } = initFirebase();
  const { id, approved } = req.query;

  try {
    if (id) {
      if (adminDb) {
        const doc = await adminDb.collection("sheep").doc(id as string).get();
        if (!doc.exists) {
          return res.status(404).json({ error: "Sheep not found" });
        }
        return res.json({ id: doc.id, ...doc.data() });
      }
      
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/sheep/${id}`,
        { headers: { "X-Goog-Api-Key": FIREBASE_API_KEY || "" } }
      );
      if (!response.ok) {
        return res.status(404).json({ error: "Sheep not found" });
      }
      const doc = await response.json();
      return res.json({ id, ...extractDocumentData(doc.fields) });
    }

    const isApproved = approved === "true";

    if (adminDb) {
      let query: any = adminDb.collection("sheep");
      if (isApproved) {
        query = query.where("status", "==", "approved");
      }
      const snapshot = await query.get();
      const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      return res.json(data);
    }

    const body: any = { structuredQuery: { from: [{ collectionId: "sheep" }] } };
    if (isApproved) {
      body.structuredQuery.where = {
        fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "approved" } }
      };
    }

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Goog-Api-Key": FIREBASE_API_KEY || "" },
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
    res.status(500).json({ error: "Failed to fetch sheep" });
  }
}
