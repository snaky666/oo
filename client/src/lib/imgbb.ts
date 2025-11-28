export async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch("https://api.imgbb.com/1/upload?key=a055310e5a26ecb1f3c62707fbda3bcf", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Upload failed");
    
    const data = await response.json();
    return data.data.url;
  } catch (error) {
    console.error("ImgBB upload error:", error);
    throw error;
  }
}
