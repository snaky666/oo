const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID;
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;

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

export default async (req: any, res: any) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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

    // If it's a foreign sheep order, validate required documents and nationalId
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

      // Check max salary limit from settings
      try {
        const settingsResponse = await fetch(
          `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/settings/app`,
          {
            method: 'GET',
            headers: {
              'X-Goog-Api-Key': FIREBASE_API_KEY || ''
            }
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

    // Create the order
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
};
