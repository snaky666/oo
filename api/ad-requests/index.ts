import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, getAdminDb, FIREBASE_PROJECT_ID, FIREBASE_API_KEY, extractDocumentData } from '../_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const adminDb = getAdminDb();
      
      if (adminDb) {
        const snapshot = await adminDb.collection('ad_requests').orderBy('createdAt', 'desc').get();
        const requests = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }));
        return res.json(requests);
      }

      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests`,
        {
          method: 'GET',
          headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
        }
      );

      if (!response.ok) {
        return res.json([]);
      }

      const data = await response.json();
      const requests = data.documents?.map((doc: any) => ({
        id: doc.name.split('/').pop(),
        ...extractDocumentData(doc.fields)
      })) || [];

      requests.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      return res.json(requests);
    } catch (error: any) {
      console.error("Error:", error?.message);
      res.json([]);
    }
  } else if (req.method === 'POST') {
    try {
      const { image, companyName, link, description, contactEmail, contactPhone } = req.body;

      if (!image || !description || !companyName) {
        return res.status(400).json({ error: "الصورة واسم الشركة والوصف مطلوبين" });
      }

      if (!contactEmail && !contactPhone) {
        return res.status(400).json({ error: "يجب إدخال البريد الإلكتروني أو رقم الهاتف" });
      }

      const requestId = `adreq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const requestData = {
        fields: {
          image: { stringValue: image },
          companyName: { stringValue: companyName },
          link: { stringValue: link || "" },
          description: { stringValue: description },
          contactEmail: { stringValue: contactEmail || "" },
          contactPhone: { stringValue: contactPhone || "" },
          status: { stringValue: "pending" },
          createdAt: { integerValue: Date.now().toString() }
        }
      };

      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests/${requestId}`,
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
        return res.status(500).json({ error: "فشل في إرسال طلب الإعلان" });
      }

      return res.json({ success: true, id: requestId });
    } catch (error: any) {
      console.error("Error:", error?.message);
      res.status(500).json({ error: "فشل في إرسال طلب الإعلان" });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
