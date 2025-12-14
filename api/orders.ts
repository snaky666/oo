import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initFirebase } from './_utils/firebase';
import { sendOrderConfirmationEmail, sendAdminNotificationEmail } from './_utils/email';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { adminDb } = initFirebase();
  const { action } = req.query;

  try {
    if (action === 'create' && req.method === 'POST') {
      const orderData = req.body;
      
      if (!orderData || !orderData.buyerId || !orderData.sheepId) {
        return res.status(400).json({ success: false, error: "بيانات الطلب غير صالحة" });
      }

      if (!adminDb) {
        return res.status(500).json({ success: false, error: "خطأ في الخادم" });
      }

      if (orderData.sheepOrigin === "foreign") {
        if (!orderData.nationalId || orderData.nationalId.trim().length < 5) {
          return res.status(400).json({ success: false, error: "رقم بطاقة التعريف الوطنية مطلوب (5 أحرف على الأقل)" });
        }

        if (!orderData.paySlipImageUrl) {
          return res.status(400).json({ success: false, error: "صورة كشف الراتب مطلوبة" });
        }

        if (!orderData.workDocImageUrl) {
          return res.status(400).json({ success: false, error: "صورة وثيقة العمل مطلوبة" });
        }

        const monthlySalary = Number(orderData.monthlySalary);
        if (!monthlySalary || isNaN(monthlySalary) || monthlySalary <= 0) {
          return res.status(400).json({ success: false, error: "الراتب الشهري مطلوب" });
        }

        const settingsDoc = await adminDb.collection('settings').doc('app').get();
        if (settingsDoc.exists) {
          const settings = settingsDoc.data();
          const maxSalary = Number(settings?.maxSalaryForForeignSheep) || 0;
          if (maxSalary > 0 && monthlySalary > maxSalary) {
            return res.status(400).json({ 
              success: false, 
              error: `راتبك يتجاوز الحد الأقصى (${maxSalary.toLocaleString()} DA)`
            });
          }
        }

        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1).getTime();

        const ordersSnapshot = await adminDb.collection('orders')
          .where('nationalId', '==', orderData.nationalId.trim())
          .where('sheepOrigin', '==', 'foreign')
          .where('createdAt', '>=', startOfYear)
          .get();

        if (ordersSnapshot.size > 0) {
          return res.status(400).json({ 
            success: false, 
            alreadyUsed: true,
            error: `رقم بطاقة التعريف تم استخدامه بالفعل هذا العام`
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

      await adminDb.collection('orders').doc(orderId).set(orderDataToSave);
      return res.json({ success: true, orderId, message: "تم إنشاء الطلب بنجاح" });
    }

    if (action === 'check-national-id' && req.method === 'POST') {
      const { nationalId } = req.body;
      
      if (!nationalId || nationalId.trim().length < 5) {
        return res.status(400).json({ success: false, error: "رقم بطاقة التعريف غير صالح" });
      }

      if (!adminDb) {
        return res.status(500).json({ success: false, error: "خطأ في الخادم" });
      }

      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1).getTime();

      const ordersSnapshot = await adminDb.collection('orders')
        .where('nationalId', '==', nationalId.trim())
        .where('sheepOrigin', '==', 'foreign')
        .where('createdAt', '>=', startOfYear)
        .get();

      if (ordersSnapshot.size > 0) {
        return res.json({ success: false, alreadyUsed: true, message: "تم استخدام رقم البطاقة بالفعل" });
      }

      return res.json({ success: true, alreadyUsed: false, message: "رقم البطاقة متاح" });
    }

    if (action === 'send-confirmation' && req.method === 'POST') {
      const { email, orderData } = req.body;
      await sendOrderConfirmationEmail(email, orderData);
      await sendAdminNotificationEmail(orderData);
      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Invalid action" });
  } catch (error: any) {
    console.error("Orders error:", error?.message);
    return res.status(500).json({ success: false, error: error?.message || "Server error" });
  }
}
