import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, getAdminDb, FIREBASE_PROJECT_ID, FIREBASE_API_KEY, extractDocumentData } from '../_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const orderData = req.body;

    if (!orderData || !orderData.buyerId || !orderData.sheepId) {
      return res.status(400).json({
        success: false,
        error: "بيانات الطلب غير صالحة"
      });
    }

    const adminDb = getAdminDb();

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
        console.error("Could not check salary settings:", settingsError);
      }

      const nationalId = orderData.nationalId.trim();
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1).getTime();

      if (adminDb) {
        const ordersSnapshot = await adminDb.collection('orders')
          .where('nationalId', '==', nationalId)
          .where('sheepOrigin', '==', 'foreign')
          .where('createdAt', '>=', startOfYear)
          .get();

        if (ordersSnapshot.size > 0) {
          return res.status(400).json({
            success: false,
            alreadyUsed: true,
            error: `رقم بطاقة التعريف الوطنية "${nationalId}" تم استخدامه بالفعل لطلب أضحية مستوردة هذا العام.`
          });
        }
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

    if (adminDb) {
      await adminDb.collection('orders').doc(orderId).set(orderDataToSave);
    }

    res.json({
      success: true,
      orderId: orderId,
      message: "تم إنشاء الطلب بنجاح"
    });
  } catch (error: any) {
    console.error("Create order error:", error?.message);
    res.status(500).json({
      success: false,
      error: "حدث خطأ أثناء إنشاء الطلب"
    });
  }
}
