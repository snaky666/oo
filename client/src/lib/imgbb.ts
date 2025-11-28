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
export const uploadToImgBB = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("https://api.imgbb.com/1/upload?key=a055310e5a26ecb1f3c62707fbda3bcf", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ImgBB Error: ${response.statusText}`);
    }

    const data: ImgBBResponse = await response.json();

    if (!data.success) {
      throw new Error("فشل رفع الصورة إلى ImgBB");
    }

    return data.data.url;
  } catch (error) {
    console.error("خطأ في رفع الصورة إلى ImgBB:", error);
    throw error;
  }
};

/**
 * رفع صورة واحدة إلى ImgBB (نفس الدالة بأسماء مختلفة للتوافقية)
 * @param file - ملف الصورة
 * @returns رابط الصورة من ImgBB
 */
export const uploadImageToImgBB = async (file: File): Promise<string> => {
  return uploadToImgBB(file);
};

/**
 * رفع عدة صور إلى ImgBB بالتوازي
 * @param files - قائمة ملفات الصور
 * @returns قائمة روابط الصور
 */
export const uploadMultipleImagesToImgBB = async (files: File[]): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadToImgBB(file));
    const imageUrls = await Promise.all(uploadPromises);
    return imageUrls;
  } catch (error) {
    console.error("خطأ في رفع الصور متعددة إلى ImgBB:", error);
    throw error;
  }
};
