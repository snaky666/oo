import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertAdSchema, Ad, AdRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Loader2, Upload, Image as ImageIcon, Check, X, Clock, Edit, Phone, Mail, Calendar, ExternalLink, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

export default function AdminAdsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AdRequest | null>(null);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [durationDays, setDurationDays] = useState<number>(30);
  const [rejectionReason, setRejectionReason] = useState("");

  const createForm = useForm({
    resolver: zodResolver(insertAdSchema),
    defaultValues: {
      image: "",
      companyName: "",
      link: "",
      description: "",
    },
  });

  const editSchema = z.object({
    image: z.string().url("يجب إدخال رابط صورة صحيح"),
    companyName: z.string().min(2),
    link: z.string().optional().or(z.literal("")),
    description: z.string().min(10),
    durationDays: z.number().min(1),
    active: z.boolean(),
  });

  const editForm = useForm({
    resolver: zodResolver(editSchema),
    defaultValues: {
      image: "",
      companyName: "",
      link: "",
      description: "",
      durationDays: 30,
      active: true,
    },
  });

  const uploadImageToImgBB = async (file: File, formToUpdate: any) => {
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

      formToUpdate.setValue("image", imageUrl);
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, formToUpdate: any) => {
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

      await uploadImageToImgBB(file, formToUpdate);
    }
  };

  const { data: ads = [], isLoading: adsLoading } = useQuery({
    queryKey: ["/api/ads"],
    queryFn: async () => {
      const response = await fetch("/api/ads");
      return response.json() as Promise<Ad[]>;
    },
  });

  const { data: adRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/ad-requests"],
    queryFn: async () => {
      const response = await fetch("/api/ad-requests");
      return response.json() as Promise<AdRequest[]>;
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
      createForm.reset();
      setImagePreview("");
      setCreateOpen(false);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل إضافة الإعلان", variant: "destructive" });
    },
  });

  const updateAdMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/ads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update ad");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم تحديث الإعلان بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      setEditOpen(false);
      setSelectedAd(null);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل تحديث الإعلان", variant: "destructive" });
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

  const approveRequestMutation = useMutation({
    mutationFn: async ({ id, durationDays }: { id: string; durationDays: number }) => {
      const response = await fetch(`/api/ad-requests/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ durationDays }),
      });
      if (!response.ok) throw new Error("Failed to approve request");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم قبول طلب الإعلان وإضافته" });
      queryClient.invalidateQueries({ queryKey: ["/api/ad-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      setApproveOpen(false);
      setSelectedRequest(null);
      setDurationDays(30);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل قبول طلب الإعلان", variant: "destructive" });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async ({ id, rejectionReason }: { id: string; rejectionReason: string }) => {
      const response = await fetch(`/api/ad-requests/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason }),
      });
      if (!response.ok) throw new Error("Failed to reject request");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم رفض طلب الإعلان" });
      queryClient.invalidateQueries({ queryKey: ["/api/ad-requests"] });
      setRejectOpen(false);
      setSelectedRequest(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل رفض طلب الإعلان", variant: "destructive" });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/ad-requests/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete request");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم حذف طلب الإعلان" });
      queryClient.invalidateQueries({ queryKey: ["/api/ad-requests"] });
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل حذف طلب الإعلان", variant: "destructive" });
    },
  });

  const onCreateSubmit = (data: any) => {
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

  const onEditSubmit = (data: any) => {
    if (selectedAd) {
      updateAdMutation.mutate({ id: selectedAd.id, data });
    }
  };

  const openEditDialog = (ad: Ad) => {
    setSelectedAd(ad);
    editForm.reset({
      image: ad.image,
      companyName: ad.companyName,
      link: ad.link || "",
      description: ad.description,
      durationDays: ad.durationDays || 30,
      active: ad.active,
    });
    setImagePreview(ad.image);
    setEditOpen(true);
  };

  const pendingRequests = adRequests.filter(r => r.status === "pending");
  const processedRequests = adRequests.filter(r => r.status !== "pending");

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("ar-DZ", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isExpired = (expiresAt?: number) => {
    if (!expiresAt) return false;
    return Date.now() > expiresAt;
  };

  const getRemainingDays = (expiresAt?: number) => {
    if (!expiresAt) return null;
    const remaining = Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000));
    return remaining > 0 ? remaining : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-bold">إدارة الإعلانات</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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

            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
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
                              onChange={(e) => handleImageChange(e, createForm)}
                              disabled={uploading}
                              className="flex-1"
                              data-testid="input-ad-image-file"
                            />
                            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                          </div>
                          {imagePreview && (
                            <img
                              src={imagePreview}
                              alt="معاينة"
                              className="w-full h-40 object-cover rounded-md border"
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الشركة</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="أدخل اسم الشركة"
                          {...field}
                          data-testid="input-ad-company-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف الإعلان</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="أدخل وصف الإعلان"
                          {...field}
                          data-testid="input-ad-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
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

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests" data-testid="tab-ad-requests">
            طلبات الإعلانات
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="mr-2">{pendingRequests.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ads" data-testid="tab-active-ads">
            الإعلانات النشطة ({ads.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">الطلبات المعلقة ({pendingRequests.length})</h3>
              {requestsLoading ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    جاري التحميل...
                  </CardContent>
                </Card>
              ) : pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    لا توجد طلبات معلقة
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {pendingRequests.map((request) => (
                    <Card key={request.id}>
                      <CardContent className="p-4 space-y-3">
                        <img
                          src={request.image}
                          alt="إعلان"
                          className="w-full h-40 object-cover rounded-md"
                        />
                        <div>
                          <p className="font-bold text-lg">{request.companyName}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{request.description}</p>
                        </div>
                        {request.link && (
                          <a
                            href={request.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {request.link}
                          </a>
                        )}
                        <div className="border-t pt-3 space-y-2">
                          <p className="text-sm font-medium">معلومات التواصل:</p>
                          {request.contactEmail && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span dir="ltr">{request.contactEmail}</span>
                            </div>
                          )}
                          {request.contactPhone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span dir="ltr">{request.contactPhone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>تاريخ الطلب: {formatDate(request.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setApproveOpen(true);
                            }}
                            className="flex-1"
                            data-testid={`button-approve-request-${request.id}`}
                          >
                            <Check className="ml-1 h-4 w-4" />
                            قبول
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setRejectOpen(true);
                            }}
                            className="flex-1"
                            data-testid={`button-reject-request-${request.id}`}
                          >
                            <X className="ml-1 h-4 w-4" />
                            رفض
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {processedRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">الطلبات المعالجة ({processedRequests.length})</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {processedRequests.map((request) => (
                    <Card key={request.id} className="opacity-75">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant={request.status === "approved" ? "default" : "destructive"}>
                            {request.status === "approved" ? "مقبول" : "مرفوض"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</span>
                        </div>
                        <img
                          src={request.image}
                          alt="إعلان"
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <div>
                          <p className="font-bold">{request.companyName}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{request.description}</p>
                        </div>
                        {request.status === "rejected" && request.rejectionReason && (
                          <p className="text-sm text-destructive">سبب الرفض: {request.rejectionReason}</p>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRequestMutation.mutate(request.id)}
                          disabled={deleteRequestMutation.isPending}
                          className="w-full"
                          data-testid={`button-delete-request-${request.id}`}
                        >
                          <Trash2 className="ml-1 h-4 w-4" />
                          حذف من السجل
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ads" className="mt-6">
          {adsLoading ? (
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
                <Card key={ad.id} className={isExpired(ad.expiresAt) ? "border-destructive" : ""}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant={ad.active && !isExpired(ad.expiresAt) ? "default" : "secondary"}>
                        {isExpired(ad.expiresAt) ? "منتهي" : ad.active ? "نشط" : "متوقف"}
                      </Badge>
                      {ad.expiresAt && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {isExpired(ad.expiresAt) ? (
                            <span className="text-destructive">انتهت الصلاحية</span>
                          ) : (
                            <span>متبقي {getRemainingDays(ad.expiresAt)} يوم</span>
                          )}
                        </div>
                      )}
                    </div>
                    <img
                      src={ad.image}
                      alt="إعلان"
                      className="w-full h-40 object-cover rounded-md"
                    />
                    <div>
                      <p className="font-bold text-lg">{ad.companyName}</p>
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(ad)}
                        className="flex-1"
                        data-testid={`button-edit-ad-${ad.id}`}
                      >
                        <Edit className="ml-1 h-4 w-4" />
                        تعديل
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteAdMutation.mutate(ad.id)}
                        disabled={deleteAdMutation.isPending}
                        className="flex-1"
                        data-testid={`button-delete-ad-${ad.id}`}
                      >
                        <Trash2 className="ml-1 h-4 w-4" />
                        حذف
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>قبول طلب الإعلان</DialogTitle>
            <DialogDescription>
              حدد مدة الإعلان بالأيام. سيتم إضافة الإعلان مباشرة للصفحة الرئيسية.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">مدة الإعلان (بالأيام)</label>
              <Input
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 30)}
                data-testid="input-duration-days"
              />
              <p className="text-xs text-muted-foreground">
                سينتهي الإعلان تلقائياً بعد {durationDays} يوم
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  approveRequestMutation.mutate({ id: selectedRequest.id, durationDays });
                }
              }}
              disabled={approveRequestMutation.isPending}
              data-testid="button-confirm-approve"
            >
              {approveRequestMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تأكيد القبول
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض طلب الإعلان</DialogTitle>
            <DialogDescription>
              يمكنك إضافة سبب الرفض (اختياري)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">سبب الرفض</label>
              <Textarea
                placeholder="أدخل سبب الرفض (اختياري)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                data-testid="input-rejection-reason"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRequest) {
                  rejectRequestMutation.mutate({ id: selectedRequest.id, rejectionReason });
                }
              }}
              disabled={rejectRequestMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {rejectRequestMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>تعديل الإعلان</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات الإعلان
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1 -mx-1">

          <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
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
                              onChange={(e) => handleImageChange(e, editForm)}
                              disabled={uploading}
                              className="flex-1"
                              data-testid="input-edit-ad-image"
                            />
                            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                          </div>
                          {(imagePreview || field.value) && (
                            <img
                              src={imagePreview || field.value}
                              alt="معاينة"
                              className="w-full h-40 object-cover rounded-md border"
                            />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم الشركة</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وصف الإعلان</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-edit-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رابط موقع الشركة</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-link" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="durationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مدة الإعلان (بالأيام)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                          data-testid="input-edit-duration"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>حالة الإعلان</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          {field.value ? "الإعلان نشط ويظهر للمستخدمين" : "الإعلان متوقف ولا يظهر للمستخدمين"}
                        </p>
                      </div>
                      <FormControl>
                        <Button
                          type="button"
                          variant={field.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => field.onChange(!field.value)}
                          data-testid="button-toggle-active"
                        >
                          {field.value ? "نشط" : "متوقف"}
                        </Button>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="sticky bottom-0 bg-background pt-4 pb-2 border-t mt-4 -mx-1 px-1">
                  <Button
                    type="submit"
                    disabled={updateAdMutation.isPending}
                    className="w-full"
                    data-testid="button-save-edit"
                  >
                    {updateAdMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    حفظ التعديلات
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}