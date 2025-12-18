import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Server } from "node:http";
import express from "express";
import { registerRoutes } from "./routes";
import { log } from "./app";

// For production build serving both API and static files
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setupProduction(app: express.Express, _server: Server) {
  const distDir = path.resolve(__dirname, "..", "dist");
  const publicDir = path.resolve(__dirname, "..", "public");

  // Serve favicon from root
  app.use((req, res, next) => {
    if (req.path === "/favicon.ico") {
      const faviconPath = path.join(publicDir, "favicon.ico");
      if (fs.existsSync(faviconPath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.sendFile(faviconPath);
      }
    }
    next();
  });

  // Serve other static files from public directory
  app.use(express.static(publicDir, {
    maxAge: "1d",
    setHeaders: (res, filepath) => {
      // Set appropriate cache headers for static assets
      if (filepath.endsWith(".ico") || filepath.endsWith(".gif") || filepath.endsWith(".png")) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (filepath.endsWith(".json")) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=3600");
      } else {
        res.setHeader("Cache-Control", "public, max-age=3600");
      }
    },
  }));

  // Serve built client files
  const publicBuildDir = path.join(distDir, "public");
  if (fs.existsSync(publicBuildDir)) {
    app.use(express.static(publicBuildDir, {
      maxAge: "1d",
      setHeaders: (res, filepath) => {
        if (filepath.endsWith(".html")) {
          res.setHeader("Cache-Control", "public, max-age=3600");
        } else if (filepath.match(/\.[a-f0-9]{8}\./)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }));
  }

  // Serve HTML for all non-API routes (SPA) - skip API routes to let them be handled
  app.use("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      // Skip API routes - they should be handled by registered routes above
      return next();
    }

    const indexPath = path.join(publicBuildDir, "index.html");
    if (fs.existsSync(indexPath)) {
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.sendFile(indexPath);
    }

    res.status(404).send("Not Found");
  });
}

export default async function runApp(
  setup: (app: express.Express, server: Server) => Promise<void>,
) {
  // Add CORS middleware before routes
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    
    next();
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Add 404 handler for API routes that don't exist
  app.use("/api/", (req, res) => {
    res.status(404).json({ error: "API endpoint not found" });
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  
  if (process.env.NODE_ENV === "production") {
    await setupProduction(app, server);
  } else {
    await setup(app, server);
  }

  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
}

import { app } from "./app";

// Import to trigger the IIFE at the module level
if (import.meta.url === `file://${process.argv[1]}`) {
  runApp(async () => {});
}
