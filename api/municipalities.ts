import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders } from './_utils/firebase';
import fs from 'fs';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filePath = path.resolve(process.cwd(), "public", "data", "municipalities.json");
    const data = await fs.promises.readFile(filePath, "utf-8");
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  } catch (error: any) {
    console.error("Error loading municipalities:", error?.message);
    res.status(500).json({ error: "Failed to load municipalities data" });
  }
}
