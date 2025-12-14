import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAdminDb, setCorsHeaders, FIREBASE_PROJECT_ID, FIREBASE_API_KEY, extractDocumentData } from '../_utils/firebase';
import { sendResetPasswordEmail } from '../_utils/email';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    console.log('🔄 Resend reset code for:', email);

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "البريد الإلكتروني مطلوب" 
      });
    }

    // Check if user exists
    const usersQuery = await queryFirestore('users', [{ field: 'email', op: 'EQUAL', value: email }]);
    
    if (usersQuery.length === 0) {
      return res.json({ 
        success: true, 
        message: "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال كود جديد" 
      });
    }

    const user = usersQuery[0];

    // Generate new reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpiry = Date.now() + (15 * 60 * 1000);

    // Update reset code in Firestore
    const resetData = {
      fields: {
        email: { stringValue: email },
        code: { stringValue: resetCode },
        expiry: { integerValue: tokenExpiry.toString() },
        createdAt: { integerValue: Date.now().toString() }
      }
    };

    await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/password_resets/${user.uid || user.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": FIREBASE_API_KEY || ""
        },
        body: JSON.stringify(resetData)
      }
    );

    // Send reset email
    const emailResult = await sendResetPasswordEmail(email, resetCode);

    if (emailResult.success) {
      res.json({ 
        success: true, 
        message: "تم إرسال كود جديد" 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: "فشل في إرسال البريد الإلكتروني" 
      });
    }
  } catch (error: any) {
    console.error("❌ Resend reset code error:", error?.message);
    res.status(500).json({ 
      success: false, 
      error: "حدث خطأ غير متوقع" 
    });
  }
}
