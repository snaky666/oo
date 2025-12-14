import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initFirebase } from './_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { adminDb } = initFirebase();

  try {
    if (!adminDb) return res.status(500).json({ error: "Database not initialized" });

    if (req.method === 'GET') {
      const settingsDoc = await adminDb.collection('settings').doc('app').get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        return res.json({
          maxSalaryForForeignSheep: data?.maxSalaryForForeignSheep || 0,
          updatedAt: data?.updatedAt || null,
          updatedBy: data?.updatedBy || null,
        });
      }
      return res.json({ maxSalaryForForeignSheep: 0, updatedAt: null, updatedBy: null });
    }

    if (req.method === 'POST') {
      const { maxSalaryForForeignSheep, updatedBy } = req.body;
      await adminDb.collection('settings').doc('app').set({
        maxSalaryForForeignSheep: maxSalaryForForeignSheep || 0,
        updatedAt: Date.now(),
        updatedBy: updatedBy || null,
      }, { merge: true });
      return res.json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Settings error:", error?.message);
    return res.status(500).json({ error: "Failed to process settings" });
  }
}
