/**
 * ImgBB Image Upload Service
 * يرفع الصور تلقائياً إلى ImgBB ويعيد الرابط
 */

interface ImgBBResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    medium: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

/**
 * رفع صورة واحدة إلى ImgBB
 * @param file - ملف الصورة
 * @returns رابط الصورة من ImgBB
 */
export const uploadImageToImgBB = async (file: File): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
    
    if (!apiKey) {
      throw new Error('ImgBB API key غير موجود. تأكد من إضافة VITE_IMGBB_API_KEY في البيئة');
    }

    // إنشاء FormData
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', apiKey);

    // إرسال الطلب إلى ImgBB
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ImgBB Error: ${response.statusText}`);
    }

    const data: ImgBBResponse = await response.json();

    if (!data.success) {
      throw new Error('فشل رفع الصورة إلى ImgBB');
    }

    // إرجاع رابط الصورة الرسمي
    return data.data.url;
  } catch (error) {
    console.error('خطأ في رفع الصورة إلى ImgBB:', error);
    throw error;
  }
};

/**
 * رفع عدة صور إلى ImgBB بالتوازي
 * @param files - قائمة ملفات الصور
 * @returns قائمة روابط الصور
 */
export const uploadMultipleImagesToImgBB = async (files: File[]): Promise<string[]> => {
  try {
    // رفع جميع الصور بالتوازي (بدون انتظار)
    const uploadPromises = files.map(file => uploadImageToImgBB(file));
    
    // انتظر جميع الرفع ينتهي
    const imageUrls = await Promise.all(uploadPromises);
    
    return imageUrls;
  } catch (error) {
    console.error('خطأ في رفع الصور متعددة إلى ImgBB:', error);
    throw error;
  }
};
