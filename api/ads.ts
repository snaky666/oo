import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initFirebase } from './_utils/firebase';

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

function extractDocumentData(fields: any): any {
  if (!fields) return {};
  const result: any = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) result[key] = value.stringValue;
    else if (value.integerValue !== undefined) result[key] = parseInt(value.integerValue);
    else if (value.booleanValue !== undefined) result[key] = value.booleanValue;
  }
  return result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { adminDb } = initFirebase();
  const { type, id, action } = req.query;

  try {
    // Ad Requests
    if (type === 'requests') {
      if (req.method === 'GET') {
        if (!adminDb) return res.json([]);
        const snapshot = await adminDb.collection('ad_requests').orderBy('createdAt', 'desc').get();
        return res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }

      if (req.method === 'POST' && !action) {
        if (!adminDb) return res.status(500).json({ error: "Database not available" });
        const { image, companyName, link, description, contactEmail, contactPhone } = req.body;
        if (!image || !description || !companyName) {
          return res.status(400).json({ error: "الصورة واسم الشركة والوصف مطلوبين" });
        }
        if (!contactEmail && !contactPhone) {
          return res.status(400).json({ error: "يجب إدخال البريد الإلكتروني أو رقم الهاتف" });
        }

        const requestId = `adreq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await adminDb.collection('ad_requests').doc(requestId).set({
          image, companyName, link: link || "", description,
          contactEmail: contactEmail || "", contactPhone: contactPhone || "",
          status: "pending", createdAt: Date.now()
        });
        return res.json({ success: true, id: requestId });
      }

      if (req.method === 'POST' && action === 'approve' && id) {
        if (!adminDb) return res.status(500).json({ error: "Database not available" });
        const doc = await adminDb.collection('ad_requests').doc(id as string).get();
        if (!doc.exists) return res.status(404).json({ error: "Request not found" });
        
        const data = doc.data();
        const adId = `ad_${Date.now()}`;
        await adminDb.collection('ads').doc(adId).set({
          image: data?.image, companyName: data?.companyName, link: data?.link,
          description: data?.description, active: true, createdAt: Date.now()
        });
        await doc.ref.update({ status: "approved" });
        return res.json({ success: true, adId });
      }

      if (req.method === 'POST' && action === 'reject' && id) {
        if (!adminDb) return res.status(500).json({ error: "Database not available" });
        await adminDb.collection('ad_requests').doc(id as string).update({ status: "rejected" });
        return res.json({ success: true });
      }
    }

    // Regular Ads
    if (req.method === 'GET') {
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads`,
        { headers: { "X-Goog-Api-Key": FIREBASE_API_KEY || "" } }
      );
      if (!response.ok) return res.json([]);
      const data = await response.json();
      return res.json(data.documents?.map((doc: any) => ({
        id: doc.name.split('/').pop(), ...extractDocumentData(doc.fields)
      })) || []);
    }

    if (req.method === 'POST') {
      const { image, companyName, link, description } = req.body;
      if (!image || !description || !companyName) {
        return res.status(400).json({ error: "Image, company name and description required" });
      }

      const adId = `ad_${Date.now()}`;
      const adData = {
        fields: {
          image: { stringValue: image }, companyName: { stringValue: companyName },
          link: { stringValue: link || "" }, description: { stringValue: description },
          active: { booleanValue: true }, createdAt: { integerValue: Date.now() }
        }
      };

      await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${adId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "X-Goog-Api-Key": FIREBASE_API_KEY || "" },
          body: JSON.stringify(adData)
        }
      );
      return res.json({ success: true, id: adId });
    }

    if (req.method === 'DELETE' && id) {
      await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${id}`,
        { method: "DELETE", headers: { "X-Goog-Api-Key": FIREBASE_API_KEY || "" } }
      );
      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Invalid request" });
  } catch (error: any) {
    console.error("Ads error:", error?.message);
    return res.status(500).json({ error: error?.message });
  }
}
