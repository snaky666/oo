import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getFirestore } from "firebase-admin/firestore";

export async function registerRoutes(app: Express): Promise<Server> {
  const db = getFirestore();

  // Get approved sheep listings (public endpoint for guests and users)
  app.get("/api/sheep/approved", async (req, res) => {
    try {
      const snapshot = await db.collection("sheep").where("status", "==", "approved").get();
      
      const sheep = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json(sheep);
    } catch (error) {
      console.error("Error fetching approved sheep:", error);
      res.status(500).json({ error: "Failed to fetch sheep listings" });
    }
  });

  // Get single sheep by ID (public endpoint for guests and users)
  app.get("/api/sheep/:id", async (req, res) => {
    try {
      const sheepDoc = await db.collection("sheep").doc(req.params.id).get();
      
      if (!sheepDoc.exists) {
        return res.status(404).json({ error: "Sheep not found" });
      }

      const data = sheepDoc.data();
      
      // Only return if approved
      if (data?.status !== "approved") {
        return res.status(403).json({ error: "This listing is not available" });
      }

      res.json({
        id: sheepDoc.id,
        ...data
      });
    } catch (error) {
      console.error("Error fetching sheep:", error);
      res.status(500).json({ error: "Failed to fetch sheep" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
