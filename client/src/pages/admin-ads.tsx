import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertAdSchema, Ad } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, Upload, Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export default function AdminAdsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const form = useForm({
    resolver: zodResolver(insertAdSchema),
    defaultValues: {
      image: "",
      companyName: "",
      link: "",
      description: "",
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

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["/api/ads"],
    queryFn: async () => {
      const response = await fetch("/api/ads");
      return response.json() as Promise<Ad[]>;
    },
  });

  const createAdMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create ad");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم إضافة الإعلان بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      form.reset();
      setOpen(false);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل إضافة الإعلان", variant: "destructive" });
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/ads/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete ad");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم حذف الإعلان بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل حذف الإعلان", variant: "destructive" });
    },
  });

  const updateAdDurationMutation = useMutation({
    mutationFn: async ({ id, durationDays }: { id: string; durationDays: number }) => {
      const response = await fetch(`/api/ads/update/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationDays }),
      });
      if (!response.ok) throw new Error("Failed to update ad duration");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم تحديث مدة الإعلان بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل تحديث مدة الإعلان", variant: "destructive" });
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
    createAdMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">إدارة الإعلانات</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-ad">
              <Plus className="ml-2 h-4 w-4" />
              إضافة إعلان
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة إعلان جديد</DialogTitle>
              <DialogDescription>
                أضف إعلان جديد للعرض على الصفحة الرئيسية
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>صورة الإعلان</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              disabled={uploading}
                              className="flex-1"
                              data-testid="input-ad-image-file"
                            />
                            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                          </div>
                          {imagePreview && (
                            <div className="relative">
                              <img
                                src={imagePreview}
                                alt="معاينة"
                                className="w-full h-40 object-cover rounded-md border border-input"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                                <ImageIcon className="h-8 w-8 text-white" />
                              </div>
                            </div>
                          )}
                          {field.value && (
                            <p className="text-xs text-muted-foreground break-all">
                              {field.value}
                            </p>
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
                      <FormLabel>اسم الشركة</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="أدخل اسم الشركة أو العلامة التجارية"
                          {...field}
                          data-testid="input-ad-company-name"
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
                      <FormLabel>وصف الإعلان</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أدخل وصف الإعلان أو رسالة الشركة"
                          {...field}
                          data-testid="input-ad-description"
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
                          {...field}
                          data-testid="input-ad-link"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={createAdMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-ad"
                >
                  {createAdMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  إضافة الإعلان
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            جاري التحميل...
          </CardContent>
        </Card>
      ) : ads.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            لا توجد إعلانات حتى الآن
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ads.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="p-4 space-y-3">
                <img
                  src={ad.image}
                  alt="إعلان"
                  className="w-full h-40 object-cover rounded-md"
                />
                <div>
                  <p className="font-bold text-lg text-primary">{ad.companyName}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{ad.description}</p>
                </div>
                {ad.link && ad.link !== "" && (
                  <a
                    href={ad.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm hover:underline block truncate"
                  >
                    {ad.link}
                  </a>
                )}
                {ad.durationDays && ad.expiresAt && (
                  <div className="text-xs space-y-1">
                    <p><strong>المدة:</strong> {ad.durationDays} يوم</p>
                    <p className={ad.expiresAt < Date.now() ? "text-red-600" : ""}>
                      <strong>ينتهي:</strong> {new Date(ad.expiresAt).toLocaleDateString("ar-DZ")}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDuration = prompt("أدخل المدة الجديدة بالأيام:", ad.durationDays?.toString() || "30");
                      if (newDuration) {
                        updateAdDurationMutation.mutate({ id: ad.id, durationDays: parseInt(newDuration) });
                      }
                    }}
                    className="flex-1"
                  >
                    تعديل المدة
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteAdMutation.mutate(ad.id)}
                    disabled={deleteAdMutation.isPending}
                    className="flex-1"
                    data-testid={`button-delete-ad-${ad.id}`}
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
