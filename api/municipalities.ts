import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const filePath = path.resolve(process.cwd(), "public", "data", "municipalities.json");
    const data = fs.readFileSync(filePath, "utf-8");
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  } catch (error: any) {
    console.error("Municipalities error:", error?.message);
    res.status(500).json({ error: "Failed to load municipalities" });
  }
}
