import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, getAdminDb, FIREBASE_PROJECT_ID, FIREBASE_API_KEY, extractDocumentData } from './_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const adminDb = getAdminDb();

  if (req.method === 'GET') {
    try {
      if (adminDb) {
        const settingsDoc = await adminDb.collection('settings').doc('app').get();
        
        if (settingsDoc.exists) {
          const data = settingsDoc.data();
          return res.json({
            maxSalaryForForeignSheep: data?.maxSalaryForForeignSheep || 0,
            updatedAt: data?.updatedAt || null,
            updatedBy: data?.updatedBy || null,
          });
        }
      }

      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/settings/app`,
        {
          method: 'GET',
          headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
        }
      );

      if (response.ok) {
        const doc = await response.json();
        const data = extractDocumentData(doc.fields);
        return res.json({
          maxSalaryForForeignSheep: data?.maxSalaryForForeignSheep || 0,
          updatedAt: data?.updatedAt || null,
          updatedBy: data?.updatedBy || null,
        });
      }

      res.json({
        maxSalaryForForeignSheep: 0,
        updatedAt: null,
        updatedBy: null,
      });
    } catch (error: any) {
      console.error("Error fetching settings:", error?.message);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  } else if (req.method === 'POST') {
    try {
      if (!adminDb) {
        return res.status(500).json({ error: "Database not initialized" });
      }

      const { maxSalaryForForeignSheep, updatedBy } = req.body;

      await adminDb.collection('settings').doc('app').set({
        maxSalaryForForeignSheep: maxSalaryForForeignSheep || 0,
        updatedAt: Date.now(),
        updatedBy: updatedBy || null,
      }, { merge: true });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error saving settings:", error?.message);
      res.status(500).json({ error: "Failed to save settings" });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
