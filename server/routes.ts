import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

// Helper to query Firestore via REST API
async function queryFirestore(collectionName: string, filters: Array<{ field: string; op: string; value: any }> = []) {
  try {
    const body: any = {
      structuredQuery: {
        from: [{ collectionId: collectionName }],
      }
    };

    if (filters.length > 0) {
      const conditions = filters.map((f: any) => ({
        fieldFilter: {
          field: { fieldPath: f.field },
          op: f.op,
          value: { stringValue: f.value }
        }
      }));
      body.structuredQuery.where = { compositeFilter: { op: "AND", filters: conditions } };
    }

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": FIREBASE_API_KEY || ""
        },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      console.error(`Firestore API error: ${response.status} ${await response.text()}`);
      return [];
    }

    const data = await response.json();
    const results: any[] = [];
    
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item.document) {
          results.push({
            id: item.document.name.split('/').pop(),
            ...extractDocumentData(item.document.fields)
          });
        }
      }
    }

    return results;
  } catch (error: any) {
    console.error(`Error querying Firestore:`, error?.message);
    return [];
  }
}

// Helper to get a single document
async function getDocument(collectionName: string, documentId: string) {
  try {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${collectionName}/${documentId}`,
      {
        method: "GET",
        headers: {
          "X-Goog-Api-Key": FIREBASE_API_KEY || ""
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const doc = await response.json();
    return {
      id: documentId,
      ...extractDocumentData(doc.fields)
    };
  } catch (error: any) {
    console.error(`Error getting document:`, error?.message);
    return null;
  }
}

// Helper to extract data from Firestore document fields
function extractDocumentData(fields: any): any {
  if (!fields) return {};
  
  const result: any = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = extractFieldValue(value);
  }
  return result;
}

// Helper to extract value from Firestore field value
function extractFieldValue(value: any): any {
  if (!value) return null;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return parseInt(value.integerValue);
  if (value.doubleValue !== undefined) return parseFloat(value.doubleValue);
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.arrayValue !== undefined) {
    return value.arrayValue.values?.map((v: any) => extractFieldValue(v)) || [];
  }
  if (value.mapValue !== undefined) {
    return extractDocumentData(value.mapValue.fields);
  }
  if (value.timestampValue !== undefined) {
    return new Date(value.timestampValue).getTime();
  }
  return value;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get approved sheep listings (public endpoint for guests and users)
  app.get("/api/sheep/approved", async (req, res) => {
    try {
      console.log("🐑 Fetching approved sheep...");
      
      // Use REST API with a direct Firestore query
      const body = {
        structuredQuery: {
          from: [{ collectionId: "sheep" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "status" },
              op: "EQUAL",
              value: { stringValue: "approved" }
            }
          }
        }
      };

      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": FIREBASE_API_KEY || ""
          },
          body: JSON.stringify(body)
        }
      );

      let data = [];
      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result)) {
          data = result.filter((item: any) => item.document).map((item: any) => ({
            id: item.document.name.split('/').pop(),
            ...extractDocumentData(item.document.fields)
          }));
        }
      }

      console.log(`✅ Found ${data.length} approved sheep`);
      res.json(data);
    } catch (error: any) {
      console.error("❌ Error:", error?.message);
      res.json([]);
    }
  });

  // Get single sheep by ID (public endpoint for guests and users)
  app.get("/api/sheep/:id", async (req, res) => {
    try {
      console.log(`🐑 Fetching sheep ${req.params.id}...`);
      
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/sheep/${req.params.id}`,
        {
          method: "GET",
          headers: {
            "X-Goog-Api-Key": FIREBASE_API_KEY || ""
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`⚠️ Sheep ${req.params.id} not found`);
          return res.status(404).json({ error: "Sheep not found" });
        }
        const errorText = await response.text();
        console.error(`❌ Firestore API error: ${response.status} ${errorText}`);
        return res.status(500).json({ error: "Failed to fetch sheep" });
      }

      const doc = await response.json();
      const data = extractDocumentData(doc.fields);
      
      // Only return if approved
      if (data?.status !== "approved") {
        console.log(`⚠️ Sheep ${req.params.id} status is ${data?.status}, not approved`);
        return res.status(403).json({ error: "This listing is not available" });
      }

      console.log(`✅ Returning sheep ${req.params.id}`);
      res.json({
        id: req.params.id,
        ...data
      });
    } catch (error: any) {
      console.error(`❌ Error fetching sheep ${req.params.id}:`, error?.message || error);
      res.status(500).json({ error: "Failed to fetch sheep", details: error?.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
