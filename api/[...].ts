import type { VercelRequest, VercelResponse } from "@vercel/node";

// Test endpoint - delete after confirming it works
if (process.env.NODE_ENV === "production") {
  console.log("[API] Serverless function handler loaded");
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Test response to verify API routing works
  return res.status(200).json({
    message: "API catch-all endpoint working",
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
}
