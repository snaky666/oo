import type { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, getAdminDb } from '../_utils/firebase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { nationalId } = req.body;
    
    if (!nationalId || nationalId.trim().length < 5) {
      return res.status(400).json({ 
        success: false, 
        error: "رقم بطاقة التعريف الوطنية غير صالح" 
      });
    }

    const adminDb = getAdminDb();

    if (!adminDb) {
      return res.status(500).json({ 
        success: false, 
        error: "خطأ في الخادم. يرجى المحاولة لاحقاً." 
      });
    }

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1).getTime();

    const ordersSnapshot = await adminDb.collection('orders')
      .where('nationalId', '==', nationalId.trim())
      .where('sheepOrigin', '==', 'foreign')
      .where('createdAt', '>=', startOfYear)
      .get();

    if (ordersSnapshot.size > 0) {
      return res.json({ 
        success: false, 
        alreadyUsed: true,
        message: `رقم بطاقة التعريف الوطنية "${nationalId}" تم استخدامه بالفعل لطلب أضحية مستوردة هذا العام.`
      });
    }

    res.json({ 
      success: true, 
      alreadyUsed: false,
      message: "رقم بطاقة التعريف الوطنية متاح للاستخدام"
    });
  } catch (error: any) {
    console.error("Check nationalId error:", error?.message);
    res.status(500).json({ 
      success: false, 
      error: "حدث خطأ أثناء التحقق من رقم بطاقة التعريف" 
    });
  }
}
