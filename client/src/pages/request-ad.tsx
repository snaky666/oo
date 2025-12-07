import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { insertAdRequestSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Image as ImageIcon, CheckCircle, ArrowRight } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";

const formSchema = z.object({
  image: z.string().url("يجب تحميل صورة للإعلان"),
  companyName: z.string().min(2, "اسم الشركة يجب أن يكون على الأقل 2 أحرف").max(50, "اسم الشركة يجب أن لا يزيد عن 50 حرف"),
  link: z.string().url("الرابط غير صالح").optional().or(z.literal("")),
  description: z.string().min(10, "الوصف يجب أن يكون 10 أحرف على الأقل"),
  contactEmail: z.string().email("البريد الإلكتروني غير صالح").optional().or(z.literal("")),
  contactPhone: z.string().min(7, "رقم الهاتف يجب أن يكون 7 أرقام على الأقل").optional().or(z.literal("")),
}).refine(data => data.contactEmail || data.contactPhone, {
  message: "يجب إدخال البريد الإلكتروني أو رقم الهاتف على الأقل",
  path: ["contactEmail"],
});

export default function RequestAdPage() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      image: "",
      companyName: "",
      link: "",
      description: "",
      contactEmail: "",
      contactPhone: "",
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
        description: "فشل رفع الصورة",
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

  const submitMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await fetch("/api/ad-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "فشل في إرسال الطلب");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم إرسال طلب الإعلان بنجاح", description: "سيتم مراجعة طلبك والتواصل معك قريباً" });
      setSubmitted(true);
    },
    onError: (error: Error) => {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!data.image) {
      toast({
        title: "خطأ",
        description: "يجب تحميل صورة للإعلان",
        variant: "destructive",
      });
      return;
    }
    submitMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="p-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold">تم إرسال طلبك بنجاح</h2>
            <p className="text-muted-foreground">
              سيتم مراجعة طلب الإعلان الخاص بك من قبل الإدارة وسيتم التواصل معك عبر البريد الإلكتروني أو رقم الهاتف الذي قدمته
            </p>
            <div className="pt-4">
              <Link href="/">
                <Button data-testid="button-back-home">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  العودة للرئيسية
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">طلب إعلان جديد</CardTitle>
            <CardDescription>
              املأ البيانات التالية لتقديم طلب إعلان. سيتم مراجعة طلبك والتواصل معك قريباً
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                              data-testid="input-ad-request-image"
                            />
                            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                          </div>
                          {imagePreview && (
                            <div className="relative">
                              <img
                                src={imagePreview}
                                alt="معاينة"
                                className="w-full h-48 object-cover rounded-md border"
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الشركة أو العلامة التجارية *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="أدخل اسم الشركة"
                          {...field}
                          data-testid="input-ad-request-company"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف الإعلان *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أدخل وصف الإعلان أو الرسالة التي تريد إيصالها"
                          rows={4}
                          {...field}
                          data-testid="input-ad-request-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط موقع الشركة (اختياري)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          dir="ltr"
                          {...field}
                          data-testid="input-ad-request-link"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">معلومات التواصل</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    أدخل البريد الإلكتروني أو رقم الهاتف (أو كلاهما) ليتمكن فريقنا من التواصل معك
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="email@example.com"
                              dir="ltr"
                              {...field}
                              data-testid="input-ad-request-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="0555123456"
                              dir="ltr"
                              {...field}
                              data-testid="input-ad-request-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full"
                  size="lg"
                  data-testid="button-submit-ad-request"
                >
                  {submitMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  إرسال طلب الإعلان
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}