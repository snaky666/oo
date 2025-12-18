import type { VercelRequest, VercelResponse } from "@vercel/node";
import express, { type Express } from "express";
import { registerRoutes } from "../server/routes";

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});

// Register API routes
registerRoutes(app);

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Error:", err);
  res.status(err.statusCode || 500).json({ error: err.message });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
