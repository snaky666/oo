import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { sendVerificationEmail, sendResetPasswordEmail, sendOrderConfirmationEmail, sendAdminNotificationEmail } from "./services/emailService";

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
  // Get sheep listings (public endpoint for guests and users)
  app.get("/api/sheep", async (req, res) => {
    try {
      const approved = req.query.approved === "true";
      console.log(`🐑 Fetching ${approved ? "approved" : "all"} sheep...`);

      // Use REST API with a direct Firestore query
      const body: any = {
        structuredQuery: {
          from: [{ collectionId: "sheep" }]
        }
      };

      if (approved) {
        body.structuredQuery.where = {
          fieldFilter: {
            field: { fieldPath: "status" },
            op: "EQUAL",
            value: { stringValue: "approved" }
          }
        };
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

      console.log(`✅ Found ${data.length} ${approved ? "approved" : ""} sheep`);
      res.json(data);
    } catch (error: any) {
      console.error("❌ Error:", error?.message);
      res.json([]);
    }
  });

  // Backward compatibility: Get approved sheep listings
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

  // Send verification email with code
  app.post("/api/auth/send-verification", async (req, res) => {
    try {
      const { email, code } = req.body;
      console.log('📧 Sending verification code to:', email);

      const result = await sendVerificationEmail(email, code);

      if (result.success) {
        res.json({ success: true, message: "Verification code sent" });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      console.error("❌ Send verification error:", error?.message);
      res.status(500).json({ success: false, error: error?.message });
    }
  });

  // Send password reset email
  app.post("/api/auth/send-reset", async (req, res) => {
    try {
      const { email, token } = req.body;
      if (!email || !token) {
        return res.status(400).json({ error: "Email and token required" });
      }

      const result = await sendResetPasswordEmail(email, token);
      res.json(result);
    } catch (error: any) {
      console.error("❌ Send reset error:", error?.message);
      res.status(500).json({ error: error?.message });
    }
  });

  // Send order confirmation
  app.post("/api/orders/send-confirmation", async (req, res) => {
    try {
      const { email, orderData } = req.body;
      if (!email || !orderData) {
        return res.status(400).json({ error: "Email and order data required" });
      }

      const result = await sendOrderConfirmationEmail(email, orderData);

      // Also send notification to admin
      await sendAdminNotificationEmail(orderData);

      res.json(result);
    } catch (error: any) {
      console.error("❌ Send confirmation error:", error?.message);
      res.status(500).json({ error: error?.message });
    }
  });

  // Verify email token
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token, email } = req.body;
      console.log('🔐 Verify request:', { email, token: token ? 'present' : 'missing' });

      if (!token || !email) {
        console.log('❌ Missing token or email');
        return res.status(400).json({ 
          success: false, 
          error: "Token and email required" 
        });
      }

      // Query Firestore to find user by email
      console.log('🔍 Searching for user with email:', email);
      const users = await queryFirestore("users", [
        { field: "email", op: "EQUAL", value: email }
      ]);

      if (users.length === 0) {
        console.log('❌ User not found for email:', email);
        return res.status(404).json({ 
          success: false, 
          error: "User not found" 
        });
      }

      const user = users[0];
      console.log('👤 Found user:', user.id);
      console.log('📧 Email verified status:', user.emailVerified);
      console.log('🔑 Has verification token:', !!user.emailVerificationToken);

      // Check if already verified
      if (user.emailVerified) {
        console.log('✅ Email already verified');
        return res.json({ 
          success: true, 
          message: "Email already verified" 
        });
      }

      // Check token validity
      if (!user.emailVerificationToken) {
        console.log('❌ No verification token found');
        return res.status(400).json({ 
          success: false, 
          error: "Invalid verification token" 
        });
      }

      if (user.emailVerificationToken !== token) {
        console.log('❌ Token mismatch');
        console.log('Expected:', user.emailVerificationToken);
        console.log('Received:', token);
        return res.status(400).json({ 
          success: false, 
          error: "Invalid verification token" 
        });
      }

      if (user.emailVerificationTokenExpiry && user.emailVerificationTokenExpiry < Date.now()) {
        console.log('❌ Token expired');
        return res.status(400).json({ 
          success: false, 
          error: "Verification token expired. Please request a new verification email." 
        });
      }

      // Update user to mark email as verified
      console.log('📝 Updating user verification status...');
      const updateResponse = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${user.id}?updateMask.fieldPaths=emailVerified&updateMask.fieldPaths=emailVerificationToken&updateMask.fieldPaths=emailVerificationTokenExpiry`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": FIREBASE_API_KEY || ""
          },
          body: JSON.stringify({
            fields: {
              emailVerified: { booleanValue: true },
              emailVerificationToken: { nullValue: null },
              emailVerificationTokenExpiry: { nullValue: null }
            }
          })
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('❌ Failed to update user:', errorText);
        return res.status(500).json({ 
          success: false, 
          error: "Failed to verify email. Please try again." 
        });
      }

      console.log('✅ Email verified successfully for:', email);
      res.json({ 
        success: true, 
        message: "Email verified successfully" 
      });
    } catch (error: any) {
      console.error("❌ Email verification error:", error?.message || error);
      res.status(500).json({ 
        success: false, 
        error: "An error occurred during verification. Please try again." 
      });
    }
  });

  // Serve municipalities data with proper JSON content-type
  app.get("/api/municipalities", async (req, res) => {
    try {
      const filePath = path.resolve(import.meta.dirname, "..", "public", "data", "municipalities.json");
      const data = await fs.promises.readFile(filePath, "utf-8");

      res.set("Content-Type", "application/json");
      res.send(data);
    } catch (error: any) {
      console.error("❌ Error loading municipalities:", error?.message);
      res.status(500).json({ error: "Failed to load municipalities data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}