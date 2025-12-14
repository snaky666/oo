import express, { Request, Response, NextFunction } from 'express';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { Resend } from 'resend';

const app = express();
app.use(express.json());

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

// Initialize Firebase Admin
let adminDb: ReturnType<typeof getFirestore> | null = null;
let adminAuth: ReturnType<typeof getAuth> | null = null;

function initFirebaseAdmin() {
  if (!getApps().length) {
    try {
      let serviceAccount;
      
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
      } else {
        serviceAccount = {
          projectId: process.env.VITE_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        };
      }
      
      const projectId = serviceAccount.projectId || serviceAccount.project_id;
      const clientEmail = serviceAccount.clientEmail || serviceAccount.client_email;
      const privateKey = serviceAccount.privateKey || serviceAccount.private_key;
      
      if (projectId && clientEmail && privateKey) {
        initializeApp({ 
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }) 
        });
        adminDb = getFirestore();
        adminAuth = getAuth();
        console.log('✅ Firebase Admin initialized successfully');
      } else {
        console.warn('⚠️ Firebase Admin: Missing required credentials');
      }
    } catch (error) {
      console.error('Firebase Admin init error:', error);
    }
  } else {
    adminDb = getFirestore();
    adminAuth = getAuth();
  }
}

initFirebaseAdmin();

// CORS middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

// Helper functions for Firestore REST API
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
    const result: any = {};
    for (const [key, val] of Object.entries(value.mapValue.fields || {})) {
      result[key] = extractFieldValue(val);
    }
    return result;
  }
  if (value.timestampValue !== undefined) {
    return new Date(value.timestampValue).getTime();
  }
  return value;
}

function extractDocumentData(fields: any): any {
  if (!fields) return {};
  const result: any = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = extractFieldValue(value);
  }
  return result;
}

function toFirestoreValue(value: any): any {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: value.toString() };
    }
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    const fields: any = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

// ============= AD REQUESTS ROUTES =============

// GET/POST /api/ad-requests
app.get('/api/ad-requests', async (req: Request, res: Response) => {
  try {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests`,
      {
        method: 'GET',
        headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
      }
    );

    if (!response.ok) {
      return res.status(200).json([]);
    }

    const data = await response.json();
    const requests = data.documents?.map((doc: any) => ({
      id: doc.name.split('/').pop(),
      ...extractDocumentData(doc.fields)
    })) || [];

    requests.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    return res.status(200).json(requests);
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

app.post('/api/ad-requests', async (req: Request, res: Response) => {
  try {
    const { image, companyName, link, description, contactEmail, contactPhone } = req.body;

    if (!image || !description || !companyName) {
      return res.status(400).json({ error: "الصورة واسم الشركة والوصف مطلوبين" });
    }

    if (!contactEmail && !contactPhone) {
      return res.status(400).json({ error: "يجب إدخال البريد الإلكتروني أو رقم الهاتف" });
    }

    const requestId = `adreq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const requestData = {
      fields: {
        image: { stringValue: image },
        companyName: { stringValue: companyName },
        link: { stringValue: link || "" },
        description: { stringValue: description },
        contactEmail: { stringValue: contactEmail || "" },
        contactPhone: { stringValue: contactPhone || "" },
        status: { stringValue: "pending" },
        createdAt: { integerValue: Date.now().toString() }
      }
    };

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests/${requestId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': FIREBASE_API_KEY || ''
        },
        body: JSON.stringify(requestData)
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: "فشل في إرسال طلب الإعلان" });
    }

    return res.status(200).json({ success: true, id: requestId });
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

// DELETE /api/ad-requests/:id
app.delete('/api/ad-requests/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Ad request ID is required' });
  }

  try {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests/${id}`,
      {
        method: 'DELETE',
        headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: 'فشل في حذف طلب الإعلان' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

// POST /api/ad-requests/:id/approve
app.post('/api/ad-requests/:id/approve', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { durationDays } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Ad request ID is required' });
  }

  if (!durationDays || durationDays < 1) {
    return res.status(400).json({ error: 'يجب تحديد مدة الإعلان' });
  }

  try {
    const getResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests/${id}`,
      {
        method: 'GET',
        headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
      }
    );

    if (!getResponse.ok) {
      return res.status(404).json({ error: 'طلب الإعلان غير موجود' });
    }

    const requestDoc = await getResponse.json();
    const requestData = extractDocumentData(requestDoc.fields);

    const expiresAt = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
    const adId = `ad_${Date.now()}`;

    const adData = {
      fields: {
        image: { stringValue: requestData.image || "" },
        companyName: { stringValue: requestData.companyName || "" },
        link: { stringValue: requestData.link || "" },
        description: { stringValue: requestData.description || "" },
        active: { booleanValue: true },
        durationDays: { integerValue: durationDays.toString() },
        expiresAt: { integerValue: expiresAt.toString() },
        adRequestId: { stringValue: id },
        createdAt: { integerValue: Date.now().toString() }
      }
    };

    const createAdResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${adId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': FIREBASE_API_KEY || ''
        },
        body: JSON.stringify(adData)
      }
    );

    if (!createAdResponse.ok) {
      return res.status(500).json({ error: 'فشل في إنشاء الإعلان' });
    }

    const updateRequestData = {
      fields: {
        ...requestDoc.fields,
        status: { stringValue: "approved" },
        durationDays: { integerValue: durationDays.toString() },
        expiresAt: { integerValue: expiresAt.toString() },
        updatedAt: { integerValue: Date.now().toString() }
      }
    };

    await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': FIREBASE_API_KEY || ''
        },
        body: JSON.stringify(updateRequestData)
      }
    );

    return res.status(200).json({ success: true, adId });
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: 'فشل في قبول طلب الإعلان' });
  }
});

// POST /api/ad-requests/:id/reject
app.post('/api/ad-requests/:id/reject', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Ad request ID is required' });
  }

  try {
    const getResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests/${id}`,
      {
        method: 'GET',
        headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
      }
    );

    if (!getResponse.ok) {
      return res.status(404).json({ error: 'طلب الإعلان غير موجود' });
    }

    const requestDoc = await getResponse.json();

    const updateData = {
      fields: {
        ...requestDoc.fields,
        status: { stringValue: "rejected" },
        rejectionReason: { stringValue: rejectionReason || "" },
        updatedAt: { integerValue: Date.now().toString() }
      }
    };

    const updateResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ad_requests/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': FIREBASE_API_KEY || ''
        },
        body: JSON.stringify(updateData)
      }
    );

    if (!updateResponse.ok) {
      return res.status(500).json({ error: 'فشل في رفض طلب الإعلان' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: 'فشل في رفض طلب الإعلان' });
  }
});

// ============= ADS ROUTES =============

// GET/POST /api/ads
app.get('/api/ads', async (req: Request, res: Response) => {
  try {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads`,
      {
        method: 'GET',
        headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
      }
    );

    if (!response.ok) {
      return res.status(200).json([]);
    }

    const data = await response.json();
    const ads = data.documents?.map((doc: any) => ({
      id: doc.name.split('/').pop(),
      ...extractDocumentData(doc.fields)
    })) || [];

    return res.status(200).json(ads);
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

app.post('/api/ads', async (req: Request, res: Response) => {
  try {
    const { image, companyName, link, description } = req.body;

    if (!image || !description || !companyName) {
      return res.status(400).json({ error: 'Image, company name and description are required' });
    }

    const adId = `ad_${Date.now()}`;
    const adData = {
      fields: {
        image: { stringValue: image },
        companyName: { stringValue: companyName },
        link: link ? { stringValue: link } : { stringValue: '' },
        description: { stringValue: description },
        active: { booleanValue: true },
        createdAt: { integerValue: Date.now().toString() }
      }
    };

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${adId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': FIREBASE_API_KEY || ''
        },
        body: JSON.stringify(adData)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firestore error:', response.status, errorText);
      return res.status(500).json({ error: 'Failed to create ad', details: errorText });
    }

    return res.status(200).json({ success: true, id: adId });
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

// GET/DELETE/PATCH /api/ads/:id
app.get('/api/ads/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Ad ID is required' });
  }

  try {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${id}`,
      {
        method: 'GET',
        headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
      }
    );

    if (!response.ok) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    const doc = await response.json();
    const ad = {
      id: doc.name.split('/').pop(),
      ...extractDocumentData(doc.fields)
    };

    return res.status(200).json(ad);
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

app.delete('/api/ads/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Ad ID is required' });
  }

  try {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${id}`,
      {
        method: 'DELETE',
        headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
      }
    );

    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to delete ad' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

app.patch('/api/ads/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { image, companyName, link, description, durationDays, active } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Ad ID is required' });
  }

  try {
    const getResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${id}`,
      {
        method: 'GET',
        headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
      }
    );

    if (!getResponse.ok) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    const existingDoc = await getResponse.json();
    const existingData = extractDocumentData(existingDoc.fields);

    let expiresAt = existingData.expiresAt;
    if (durationDays && durationDays !== existingData.durationDays) {
      expiresAt = Date.now() + (durationDays * 24 * 60 * 60 * 1000);
    }

    const updateData = {
      fields: {
        image: { stringValue: image || existingData.image },
        companyName: { stringValue: companyName || existingData.companyName },
        link: { stringValue: link !== undefined ? link : (existingData.link || '') },
        description: { stringValue: description || existingData.description },
        active: { booleanValue: active !== undefined ? active : existingData.active },
        durationDays: { integerValue: (durationDays || existingData.durationDays || 30).toString() },
        expiresAt: { integerValue: expiresAt.toString() },
        createdAt: { integerValue: (existingData.createdAt || Date.now()).toString() }
      }
    };

    const updateResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/ads/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': FIREBASE_API_KEY || ''
        },
        body: JSON.stringify(updateData)
      }
    );

    if (!updateResponse.ok) {
      return res.status(500).json({ error: 'Failed to update ad' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

// ============= ORDERS ROUTES =============

// POST /api/orders/create
app.post('/api/orders/create', async (req: Request, res: Response) => {
  try {
    const orderData = req.body;

    if (!orderData || !orderData.buyerId || !orderData.sheepId) {
      return res.status(400).json({
        success: false,
        error: "بيانات الطلب غير صالحة"
      });
    }

    console.log('📝 Creating order...', {
      buyerId: orderData.buyerId,
      sheepId: orderData.sheepId,
      sheepOrigin: orderData.sheepOrigin
    });

    if (orderData.sheepOrigin === "foreign") {
      if (!orderData.nationalId || orderData.nationalId.trim().length < 5) {
        return res.status(400).json({
          success: false,
          error: "رقم بطاقة التعريف الوطنية مطلوب للأضاحي المستوردة (5 أحرف على الأقل)"
        });
      }

      if (!orderData.paySlipImageUrl) {
        return res.status(400).json({
          success: false,
          error: "صورة كشف الراتب مطلوبة للأضاحي المستوردة"
        });
      }

      if (!orderData.workDocImageUrl) {
        return res.status(400).json({
          success: false,
          error: "صورة وثيقة العمل مطلوبة للأضاحي المستوردة"
        });
      }

      const monthlySalary = Number(orderData.monthlySalary);
      if (!monthlySalary || isNaN(monthlySalary) || monthlySalary <= 0) {
        return res.status(400).json({
          success: false,
          error: "الراتب الشهري مطلوب للأضاحي المستوردة ويجب أن يكون رقماً موجباً"
        });
      }

      try {
        const settingsResponse = await fetch(
          `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/settings/app`,
          {
            method: 'GET',
            headers: { 'X-Goog-Api-Key': FIREBASE_API_KEY || '' }
          }
        );

        if (settingsResponse.ok) {
          const settingsDoc = await settingsResponse.json();
          const settings = extractDocumentData(settingsDoc.fields);
          const maxSalary = Number(settings?.maxSalaryForForeignSheep) || 0;
          if (maxSalary > 0 && monthlySalary > maxSalary) {
            return res.status(400).json({
              success: false,
              error: `راتبك الشهري (${monthlySalary.toLocaleString()} DA) يتجاوز الحد الأقصى المسموح به (${maxSalary.toLocaleString()} DA) لطلب أضحية مستوردة`
            });
          }
        }
      } catch (settingsError) {
        console.error("⚠️ Could not check salary settings:", settingsError);
      }

      const nationalId = orderData.nationalId.trim();
      console.log('🔍 Checking nationalId for existing foreign sheep orders:', nationalId);

      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1).getTime();

      try {
        const queryBody = {
          structuredQuery: {
            from: [{ collectionId: "orders" }],
            where: {
              compositeFilter: {
                op: "AND",
                filters: [
                  {
                    fieldFilter: {
                      field: { fieldPath: "nationalId" },
                      op: "EQUAL",
                      value: { stringValue: nationalId }
                    }
                  },
                  {
                    fieldFilter: {
                      field: { fieldPath: "sheepOrigin" },
                      op: "EQUAL",
                      value: { stringValue: "foreign" }
                    }
                  },
                  {
                    fieldFilter: {
                      field: { fieldPath: "createdAt" },
                      op: "GREATER_THAN_OR_EQUAL",
                      value: { integerValue: startOfYear.toString() }
                    }
                  }
                ]
              }
            }
          }
        };

        const queryResponse = await fetch(
          `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': FIREBASE_API_KEY || ''
            },
            body: JSON.stringify(queryBody)
          }
        );

        if (queryResponse.ok) {
          const queryResult = await queryResponse.json();
          const existingOrders = Array.isArray(queryResult) 
            ? queryResult.filter((item: any) => item.document).length 
            : 0;

          console.log(`📋 Found ${existingOrders} existing foreign sheep orders with this nationalId`);

          if (existingOrders > 0) {
            return res.status(400).json({
              success: false,
              alreadyUsed: true,
              error: `رقم بطاقة التعريف الوطنية "${nationalId}" تم استخدامه بالفعل لطلب أضحية مستوردة هذا العام. يمكنك طلب أضحية مستوردة واحدة فقط في السنة.`
            });
          }
        }
      } catch (queryError: any) {
        console.error("❌ Failed to check nationalId:", queryError?.message || queryError);
        return res.status(500).json({
          success: false,
          error: "فشل في التحقق من رقم بطاقة التعريف. يرجى المحاولة مرة أخرى."
        });
      }
    }

    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const orderDataToSave: any = {
      buyerId: orderData.buyerId,
      buyerEmail: orderData.buyerEmail || "",
      buyerName: orderData.buyerName || "",
      buyerPhone: orderData.buyerPhone || "",
      buyerCity: orderData.buyerCity || "",
      buyerAddress: orderData.buyerAddress || "",
      sellerId: orderData.sellerId || "",
      sellerEmail: orderData.sellerEmail || "",
      sheepId: orderData.sheepId || "",
      sheepPrice: orderData.sheepPrice || 0,
      sheepAge: orderData.sheepAge || 0,
      sheepWeight: orderData.sheepWeight || 0,
      sheepCity: orderData.sheepCity || "",
      sheepOrigin: orderData.sheepOrigin || "local",
      totalPrice: orderData.totalPrice || 0,
      status: "pending",
      paymentMethod: "cash",
      paymentStatus: "pending",
      orderStatus: "new",
      createdAt: Date.now()
    };

    if (orderData.sheepOrigin === "foreign") {
      orderDataToSave.nationalId = orderData.nationalId?.trim() || "";
      orderDataToSave.paySlipImageUrl = orderData.paySlipImageUrl || "";
      orderDataToSave.workDocImageUrl = orderData.workDocImageUrl || "";
      orderDataToSave.monthlySalary = Number(orderData.monthlySalary) || 0;
    }

    const firestoreFields: any = {};
    for (const [key, value] of Object.entries(orderDataToSave)) {
      firestoreFields[key] = toFirestoreValue(value);
    }

    const createResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/orders/${orderId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': FIREBASE_API_KEY || ''
        },
        body: JSON.stringify({ fields: firestoreFields })
      }
    );

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('❌ Firestore create error:', createResponse.status, errorText);
      return res.status(500).json({
        success: false,
        error: "فشل في إنشاء الطلب. يرجى المحاولة مرة أخرى."
      });
    }

    console.log('✅ Order created successfully:', orderId);
    res.json({
      success: true,
      orderId: orderId,
      message: "تم إنشاء الطلب بنجاح"
    });

  } catch (error: any) {
    console.error('❌ Order creation error:', error?.message || error);
    res.status(500).json({
      success: false,
      error: error?.message || 'حدث خطأ أثناء إنشاء الطلب'
    });
  }
});

// ============= SHEEP ROUTES =============

// GET /api/sheep
app.get('/api/sheep', async (req: Request, res: Response) => {
  const { approved } = req.query;

  try {
    // Use Firebase Admin SDK if available (bypasses security rules)
    if (adminDb) {
      let query: FirebaseFirestore.Query = adminDb.collection('sheep');
      if (approved === 'true') {
        query = query.where('status', '==', 'approved');
      }
      const snapshot = await query.get();
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`✅ Found ${data.length} ${approved === 'true' ? 'approved' : ''} sheep (Admin SDK)`);
      return res.status(200).json(data);
    }

    // Fallback to REST API
    if (approved === 'true') {
      const body = {
        structuredQuery: {
          from: [{ collectionId: 'sheep' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'status' },
              op: 'EQUAL',
              value: { stringValue: 'approved' }
            }
          }
        }
      };

      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents:runQuery`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': FIREBASE_API_KEY || ''
          },
          body: JSON.stringify(body)
        }
      );

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch sheep' });
      }

      const result = await response.json();
      const data = Array.isArray(result)
        ? result.filter((item: any) => item.document).map((item: any) => ({
            id: item.document.name.split('/').pop(),
            ...extractDocumentData(item.document.fields)
          }))
        : [];

      return res.status(200).json(data);
    }

    res.status(400).json({ error: 'Invalid query' });
  } catch (error: any) {
    console.error('API Error:', error?.message);
    res.status(500).json({ error: error?.message || 'Internal server error' });
  }
});

// ============= AUTH ROUTES =============

// Helper function to send emails
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'أضحيتي <noreply@odhiyaty.com>',
      to,
      subject,
      html
    });
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

// POST /api/auth/send-verification
app.post('/api/auth/send-verification', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and code required' 
      });
    }

    const result = await sendEmail(
      email,
      'كود التحقق من بريدك الإلكتروني',
      `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>مرحباً بك في أضحيتي</h2>
          <p>كود التحقق الخاص بك هو:</p>
          <h1 style="color: #D97706; font-size: 32px; letter-spacing: 5px;">${code}</h1>
          <p>الكود صالح لمدة 15 دقيقة</p>
        </div>
      `
    );

    if (result.success) {
      res.json({ success: true, message: 'Verification code sent' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to send email' });
    }
  } catch (error: any) {
    console.error('Send verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: error?.message || 'Failed to send email' 
    });
  }
});

// POST /api/auth/pending-registration
app.post('/api/auth/pending-registration', async (req: Request, res: Response) => {
  if (!adminDb || !adminAuth) {
    return res.status(500).json({ success: false, error: 'Firebase Admin not initialized' });
  }

  try {
    const { email, password, role, phone, verificationCode, tokenExpiry } = req.body;
    
    try {
      const authUser = await adminAuth.getUserByEmail(email);
      if (authUser) {
        return res.status(400).json({
          success: false,
          error: "البريد الإلكتروني مستخدم بالفعل"
        });
      }
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error;
      }
    }

    const pendingRef = adminDb.collection('pending_registrations');
    const existingSnapshot = await pendingRef.where('email', '==', email).get();

    const pendingData = {
      email,
      password,
      role,
      phone,
      verificationCode,
      tokenExpiry,
      createdAt: Date.now()
    };

    if (!existingSnapshot.empty) {
      const docId = existingSnapshot.docs[0].id;
      await pendingRef.doc(docId).set(pendingData);
    } else {
      await pendingRef.add(pendingData);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Pending registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error?.message || 'Failed to create pending registration' 
    });
  }
});

// POST /api/auth/complete-registration
app.post('/api/auth/complete-registration', async (req: Request, res: Response) => {
  if (!adminDb || !adminAuth) {
    return res.status(500).json({ success: false, error: 'Firebase Admin not initialized' });
  }

  try {
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json({ 
        success: false, 
        error: "Code and email required" 
      });
    }

    const pendingRef = adminDb.collection('pending_registrations');
    const snapshot = await pendingRef.where('email', '==', email).get();

    if (snapshot.empty) {
      return res.status(404).json({ 
        success: false, 
        error: "Pending registration not found" 
      });
    }

    const pendingDoc = snapshot.docs[0];
    const pending = pendingDoc.data();

    if (pending.verificationCode !== code) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid verification code" 
      });
    }

    if (pending.tokenExpiry < Date.now()) {
      return res.status(400).json({ 
        success: false, 
        error: "Verification code expired" 
      });
    }

    const authUser = await adminAuth.createUser({
      email: pending.email,
      password: pending.password,
      emailVerified: true
    });

    await adminDb.collection('users').doc(authUser.uid).set({
      uid: authUser.uid,
      email: pending.email,
      role: pending.role,
      phone: pending.phone,
      emailVerified: true,
      createdAt: Date.now()
    });

    await pendingDoc.ref.delete();

    res.json({ 
      success: true, 
      message: "Registration completed successfully" 
    });
  } catch (error: any) {
    console.error('Complete registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: error?.message || 'Failed to complete registration' 
    });
  }
});

// POST /api/auth/request-password-reset
app.post('/api/auth/request-password-reset', async (req: Request, res: Response) => {
  if (!adminDb) {
    return res.status(500).json({ success: false, error: 'Firebase Admin not initialized' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "البريد الإلكتروني مطلوب" 
      });
    }

    const usersRef = adminDb.collection('users');
    const usersSnapshot = await usersRef.where('email', '==', email).get();
    
    if (usersSnapshot.empty) {
      return res.json({ 
        success: true, 
        message: "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال كود التحقق" 
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const user = { uid: userDoc.id, ...userDoc.data() };

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpiry = Date.now() + (15 * 60 * 1000);

    await adminDb.collection('password_resets').doc(user.uid).set({
      email: email,
      code: resetCode,
      expiry: tokenExpiry,
      createdAt: Date.now()
    });

    const emailResult = await sendEmail(
      email,
      'إعادة تعيين كلمة المرور - أضحيتي',
      `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">إعادة تعيين كلمة المرور</h2>
          <p>مرحباً،</p>
          <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.</p>
          <p>كود التحقق الخاص بك هو:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${resetCode}
          </div>
          <p>هذا الكود صالح لمدة 15 دقيقة فقط.</p>
          <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.</p>
          <p>مع التحية،<br>فريق أضحيتي</p>
        </div>
      `
    );

    if (emailResult.success) {
      return res.json({ 
        success: true, 
        message: "تم إرسال كود التحقق إلى بريدك الإلكتروني" 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: "فشل في إرسال البريد الإلكتروني" 
      });
    }
  } catch (error: any) {
    console.error("Password reset request error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "حدث خطأ غير متوقع" 
    });
  }
});

// POST /api/auth/resend-reset-code
app.post('/api/auth/resend-reset-code', async (req: Request, res: Response) => {
  if (!adminDb) {
    return res.status(500).json({ success: false, error: 'Firebase Admin not initialized' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "البريد الإلكتروني مطلوب" 
      });
    }

    const usersRef = adminDb.collection('users');
    const usersSnapshot = await usersRef.where('email', '==', email).get();
    
    if (usersSnapshot.empty) {
      return res.json({ 
        success: true, 
        message: "إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال كود جديد" 
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const user = { uid: userDoc.id };

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenExpiry = Date.now() + (15 * 60 * 1000);

    await adminDb.collection('password_resets').doc(user.uid).set({
      email: email,
      code: resetCode,
      expiry: tokenExpiry,
      createdAt: Date.now()
    });

    const emailResult = await sendEmail(
      email,
      'إعادة تعيين كلمة المرور - أضحيتي',
      `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">إعادة تعيين كلمة المرور</h2>
          <p>مرحباً،</p>
          <p>كود التحقق الجديد هو:</p>
          <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${resetCode}
          </div>
          <p>هذا الكود صالح لمدة 15 دقيقة فقط.</p>
          <p>مع التحية،<br>فريق أضحيتي</p>
        </div>
      `
    );

    if (emailResult.success) {
      return res.json({ 
        success: true, 
        message: "تم إرسال كود جديد" 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: "فشل في إرسال البريد الإلكتروني" 
      });
    }
  } catch (error: any) {
    console.error("Resend reset code error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "حدث خطأ غير متوقع" 
    });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  if (!adminDb || !adminAuth) {
    return res.status(500).json({ success: false, error: 'Firebase Admin not initialized' });
  }

  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        error: "جميع الحقول مطلوبة" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" 
      });
    }

    const usersRef = adminDb.collection('users');
    const usersSnapshot = await usersRef.where('email', '==', email).get();
    
    if (usersSnapshot.empty) {
      return res.status(404).json({ 
        success: false, 
        error: "المستخدم غير موجود" 
      });
    }

    const userDoc = usersSnapshot.docs[0];
    const user = { uid: userDoc.id, ...userDoc.data() };

    const resetDocRef = adminDb.collection('password_resets').doc(user.uid);
    const resetDocSnapshot = await resetDocRef.get();

    if (!resetDocSnapshot.exists) {
      return res.status(400).json({ 
        success: false, 
        error: "لم يتم طلب إعادة تعيين كلمة المرور. يرجى طلب كود جديد." 
      });
    }

    const resetDoc = resetDocSnapshot.data();

    if (resetDoc?.code !== code) {
      return res.status(400).json({ 
        success: false, 
        error: "كود التحقق غير صحيح" 
      });
    }

    const expiryTime = typeof resetDoc?.expiry === 'number' ? resetDoc.expiry : parseInt(resetDoc?.expiry);
    if (expiryTime < Date.now()) {
      await resetDocRef.delete();
      return res.status(400).json({ 
        success: false, 
        error: "انتهت صلاحية كود التحقق. يرجى طلب كود جديد." 
      });
    }

    await adminAuth.updateUser(user.uid, { password: newPassword });
    await resetDocRef.delete();

    return res.json({ 
      success: true, 
      message: "تم تغيير كلمة المرور بنجاح" 
    });
  } catch (error: any) {
    console.error("Reset password error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "حدث خطأ غير متوقع" 
    });
  }
});

// Local development server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`API running on port ${PORT}`));
}

// Export for Vercel
export default app;
