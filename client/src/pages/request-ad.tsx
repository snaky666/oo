
import Header from "@/components/Header";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { insertAdRequestSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Image as ImageIcon, X, Send } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function RequestAdPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const form = useForm({
    resolver: zodResolver(insertAdRequestSchema),
    defaultValues: {
      image: "",
      companyName: "",
      link: "",
      description: "",
      contactPhone: "",
      contactEmail: "",
    },
  });

  const uploadImageToImgBB = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
      if (!apiKey) {
        throw new Error("ImgBB API key not found");
      }

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      const imageUrl = data.data.url;

      form.setValue("image", imageUrl);
      setImagePreview(imageUrl);
      toast({ title: "تم رفع الصورة بنجاح" });

      return imageUrl;
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل رفع الصورة إلى ImgBB",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 32 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الصورة يجب أن يكون أقل من 32 MB",
          variant: "destructive",
        });
        return;
      }

      await uploadImageToImgBB(file);
    }
  };

  const createAdRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user) throw new Error("يجب تسجيل الدخول");

      const response = await fetch("/api/ad-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userId: user.uid,
          userEmail: user.email,
        }),
      });
      if (!response.ok) throw new Error("Failed to create ad request");
      return response.json();
    },
    onSuccess: () => {
      toast({ 
        title: "تم إرسال طلب الإعلان بنجاح",
        description: "سيتم مراجعة طلبك من قبل الإدارة" 
      });
      form.reset();
      setImagePreview("");
      setLocation("/");
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل إرسال طلب الإعلان", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    if (!data.image) {
      toast({
        title: "خطأ",
        description: "يجب تحميل صورة للإعلان",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
    createAdRequestMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">طلب إعلان</CardTitle>
            <CardDescription>
              املأ النموذج أدناه لطلب نشر إعلانك على المنصة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Image Upload */}
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>صورة الإعلان *</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              disabled={uploading}
                              className="flex-1"
                            />
                            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                          </div>
                          {imagePreview && (
                            <div className="relative">
                              <img
                                src={imagePreview}
                                alt="معاينة"
                                className="w-full h-48 object-cover rounded-md border border-input"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setImagePreview("");
                                  form.setValue("image", "");
                                }}
                                className="absolute top-2 left-2 bg-destructive text-destructive-foreground rounded-full p-1"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Company Name */}
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الشركة أو العلامة التجارية *</FormLabel>
                      <FormControl>
                        <Input placeholder="أدخل اسم الشركة" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف الإعلان *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="اكتب وصفاً تفصيلياً للإعلان"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Link */}
                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط الموقع (اختياري)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contact Phone */}
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف للتواصل *</FormLabel>
                      <FormControl>
                        <Input placeholder="0555123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contact Email */}
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البريد الإلكتروني للتواصل (اختياري)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="example@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={createAdRequestMutation.isPending}
                  className="w-full"
                >
                  {createAdRequestMutation.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="ml-2 h-4 w-4" />
                      إرسال الطلب
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
