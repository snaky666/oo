import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Sheep, algeriaCities } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Weight, ArrowRight, ShoppingCart, Upload, FileText, CreditCard } from "lucide-react";
import { uploadToImgBB } from "@/lib/imgbb";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import placeholderImage from "@assets/generated_images/sheep_product_placeholder.png";

const orderFormSchema = z.object({
  fullName: z.string().min(3, "الاسم الكامل مطلوب"),
  phone: z.string().regex(/^(\+213|0)[1-9]\d{8}$/, "رقم الهاتف غير صحيح"),
  address: z.string().min(5, "العنوان مطلوب"),
  city: z.string().min(1, "المدينة مطلوبة"),
  nationalId: z.string().optional(),
  monthlySalary: z.number().optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

export default function SheepDetail() {
  const [, params] = useRoute("/sheep/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sheep, setSheep] = useState<Sheep | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [guestLoginDialogOpen, setGuestLoginDialogOpen] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [paySlipFile, setPaySlipFile] = useState<File | null>(null);
  const [workDocFile, setWorkDocFile] = useState<File | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    const guestMode = localStorage.getItem("guestMode") === "true";
    setIsGuest(guestMode);
    console.log("🚀 Guest Mode Status:", guestMode);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      address: user?.address || "",
      city: user?.city || "",
      nationalId: "",
      monthlySalary: undefined,
    },
  });

  useEffect(() => {
    if (params?.id) {
      fetchSheep(params.id);
    }
  }, [params?.id, user]);

  useEffect(() => {
    if (user) {
      setValue("fullName", user.fullName || "");
      setValue("phone", user.phone || "");
      setValue("address", user.address || "");
      setValue("city", user.city || "");
    }
  }, [user, setValue]);

  const fetchSheep = async (id: string) => {
    setLoading(true);
    try {
      const sheepDoc = await getDoc(doc(db, "sheep", id));
      if (sheepDoc.exists()) {
        const data = sheepDoc.data();
        // Allow viewing if approved OR if the user is the owner (seller)
        const isOwner = user && data?.sellerId === user.uid;
        const isAdmin = user && user.role === "admin";
        if (data?.status === "approved" || isOwner || isAdmin) {
          setSheep({ id: sheepDoc.id, ...data } as Sheep);
        } else {
          throw new Error("Sheep not approved");
        }
      } else {
        throw new Error("Sheep not found");
      }
    } catch (error) {
      console.error("Error fetching sheep:", error);
      toast({
        title: "خطأ",
        description: "لم يتم العثور على الخروف أو غير متاح",
        variant: "destructive",
      });
      setLocation("/browse");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (formData: OrderFormData) => {
    if (!sheep || !user) return;

    const isForeignSheep = sheep.origin === "foreign";

    if (isForeignSheep) {
      if (!formData.nationalId || formData.nationalId.trim().length < 5) {
        toast({
          title: "خطأ",
          description: "يجب إدخال رقم بطاقة التعريف الوطنية",
          variant: "destructive",
        });
        return;
      }
      if (!formData.monthlySalary || formData.monthlySalary <= 0) {
        toast({
          title: "خطأ",
          description: "يجب إدخال الراتب الشهري",
          variant: "destructive",
        });
        return;
      }
      if (!paySlipFile) {
        toast({
          title: "خطأ",
          description: "يجب رفع صورة كشف الراتب (Fiche de paie)",
          variant: "destructive",
        });
        return;
      }
      if (!workDocFile) {
        toast({
          title: "خطأ",
          description: "يجب رفع صورة وثيقة العمل",
          variant: "destructive",
        });
        return;
      }
    }

    setCreatingOrder(true);
    setUploadingFiles(isForeignSheep);

    try {
      let paySlipImageUrl = "";
      let workDocImageUrl = "";

      if (isForeignSheep && paySlipFile && workDocFile) {
        toast({
          title: "جاري رفع الملفات...",
          description: "يرجى الانتظار",
        });

        const [paySlipUrl, workDocUrl] = await Promise.all([
          uploadToImgBB(paySlipFile),
          uploadToImgBB(workDocFile),
        ]);
        paySlipImageUrl = paySlipUrl;
        workDocImageUrl = workDocUrl;
      }

      // Verify user is authenticated
      if (!user || !user.uid) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً",
          variant: "destructive",
        });
        return;
      }

      // Base order data - only include fields that are common to all orders
      const baseOrderData: Record<string, any> = {
        buyerId: user.uid,
        buyerEmail: user.email || "",
        buyerName: formData.fullName.trim(),
        buyerPhone: formData.phone.trim(),
        buyerCity: formData.city.trim(),
        buyerAddress: formData.address.trim(),
        sellerId: sheep.sellerId || "",
        sellerEmail: sheep.sellerEmail || "",
        sheepId: sheep.id || "",
        sheepPrice: Number(sheep.price) || 0,
        sheepAge: Number(sheep.age) || 0,
        sheepWeight: Number(sheep.weight) || 0,
        sheepCity: sheep.city || "",
        totalPrice: Number(sheep.price) || 0,
      };

      // Add foreign sheep specific fields only if it's a foreign sheep
      if (isForeignSheep && formData.nationalId && paySlipImageUrl && workDocImageUrl) {
        baseOrderData.sheepOrigin = "foreign";
        baseOrderData.nationalId = formData.nationalId.trim();
        baseOrderData.paySlipImageUrl = paySlipImageUrl;
        baseOrderData.workDocImageUrl = workDocImageUrl;
        baseOrderData.monthlySalary = formData.monthlySalary;
      } else if (!isForeignSheep) {
        baseOrderData.sheepOrigin = "local";
      }

      console.log("📝 Order data to be created:", baseOrderData);

      // Use secure server-side API for order creation (validates nationalId for foreign sheep)
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(baseOrderData),
      });

      const result = await response.json();

      if (!result.success) {
        // Handle nationalId already used error
        if (result.alreadyUsed) {
          toast({
            title: "تنبيه",
            description: result.error || "رقم بطاقة التعريف الوطنية تم استخدامه بالفعل لطلب أضحية مستوردة هذا العام",
            variant: "destructive",
          });
        } else {
          toast({
            title: "خطأ",
            description: result.error || "حدث خطأ أثناء إنشاء الطلب",
            variant: "destructive",
          });
        }
        setCreatingOrder(false);
        setUploadingFiles(false);
        return;
      }

      localStorage.setItem("pendingOrderId", result.orderId);
      localStorage.setItem("pendingOrderAmount", sheep.price.toString());
      localStorage.setItem("pendingOrderSheepOrigin", baseOrderData.sheepOrigin || "local");

      setPaySlipFile(null);
      setWorkDocFile(null);

      toast({
        title: "تم إنشاء الطلب",
        description: "اختر طريقة الدفع لإكمال الطلب",
      });

      setOrderDialogOpen(false);
      setLocation("/checkout/sheep");
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الطلب",
        variant: "destructive",
      });
    } finally {
      setCreatingOrder(false);
      setUploadingFiles(false);
    }
  };

  // New function added based on the user request
  const handleBuyNow = () => {
    if (!user) {
      setLocation("/login");
      return;
    }

    if (user.role === "seller") {
      toast({
        title: "غير مسموح",
        description: "لا يمكن للبائعين شراء الأغنام",
        variant: "destructive",
      });
      return;
    }

    // Check if sheep is VIP and user is not VIP
    if (sheep?.isVIP && (!user.vipStatus || user.vipStatus === "none")) {
      toast({
        title: "منتج VIP حصري",
        description: "يرجى الاشتراك في خدمة VIP للوصول إلى هذا المنتج",
        variant: "destructive",
        action: (
          <button
            onClick={() => setLocation("/vip-packages")}
            className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-sm"
          >
            الاشتراك الآن
          </button>
        ),
      });
      return;
    }

    setLocation(`/checkout/${sheep?.id}`); // Use sheep?.id here
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
      <Header />
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!sheep) return null;

  const images = sheep.images && sheep.images.length > 0 ? sheep.images : [placeholderImage];
  const isOwner = user && sheep.sellerId === user.uid;
  const isAdmin = user && user.role === "admin";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      default:
        return "";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "مقبول";
      case "pending":
        return "قيد المراجعة";
      case "rejected":
        return "مرفوض";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => setLocation("/browse")}
          className="mb-8"
          data-testid="button-back"
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          العودة للتصفح
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={images[selectedImage]}
                alt={`صورة ${selectedImage + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = placeholderImage;
                }}
                data-testid="img-main"
              />
            </div>

            {/* Thumbnail Grid */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-md overflow-hidden border-2 transition-all hover-elevate ${
                      selectedImage === idx
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                    data-testid={`button-thumbnail-${idx}`}
                  >
                    <img
                      src={img}
                      alt={`صورة مصغرة ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = placeholderImage;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Price and Status */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="text-2xl font-bold px-4 py-2">
                {sheep.price.toLocaleString()} DA
              </Badge>
              {/* Show status for owner or admin */}
              {(isOwner || isAdmin) && sheep.status !== "approved" && (
                <Badge className={`text-base px-3 py-1 ${getStatusColor(sheep.status)}`}>
                  {getStatusLabel(sheep.status)}
                </Badge>
              )}
            </div>

            {/* Metadata */}
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <Calendar className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{sheep.age}</p>
                    <p className="text-sm text-muted-foreground">شهر</p>
                  </div>
                  <div>
                    <Weight className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{sheep.weight}</p>
                    <p className="text-sm text-muted-foreground">كجم</p>
                  </div>
                  <div>
                    <MapPin className="h-6 w-6 mx-auto mb-2 text-primary" />
                    <p className="text-xl font-bold">{sheep.city}</p>
                    <p className="text-sm text-muted-foreground">المدينة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-3">الوصف</h2>
              <p className="text-muted-foreground leading-relaxed">
                {sheep.description}
              </p>
            </div>

            {/* Order Button - hide for owners viewing their own sheep */}
            {!isOwner && (
              <Button
                size="lg"
                className="w-full text-lg"
                onClick={() => setOrderDialogOpen(true)}
                data-testid="button-create-order"
              >
                <ShoppingCart className="ml-2 h-5 w-5" />
                طلب الشراء
              </Button>
            )}
            
            {/* Owner notice */}
            {isOwner && (
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center">
                  <p className="text-muted-foreground">هذا المنتج خاص بك</p>
                  {sheep.status === "pending" && (
                    <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                      في انتظار موافقة الإدارة
                    </p>
                  )}
                  {sheep.status === "rejected" && sheep.rejectionReason && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      سبب الرفض: {sheep.rejectionReason}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Order Confirmation Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>طلب شراء - إدخال البيانات الشخصية</DialogTitle>
            <DialogDescription>
              يرجى إدخال بيانات التواصل الخاصة بك
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleCreateOrder)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                placeholder="أحمد محمد"
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                placeholder="+213612345678 أو 0612345678"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">الولاية</Label>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الولاية" />
                    </SelectTrigger>
                    <SelectContent>
                      {algeriaCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                placeholder="شارع ما، الحي الإداري"
                {...register("address")}
              />
              {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
              )}
            </div>

            {/* Foreign Sheep Additional Fields */}
            {sheep.origin === "foreign" && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <FileText className="h-5 w-5" />
                  <span className="font-semibold">وثائق إضافية مطلوبة للأغنام المستوردة</span>
                </div>

                {/* National ID */}
                <div className="space-y-2">
                  <Label htmlFor="nationalId">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      رقم بطاقة التعريف الوطنية *
                    </div>
                  </Label>
                  <Input
                    id="nationalId"
                    placeholder="أدخل رقم بطاقة التعريف الوطنية"
                    {...register("nationalId")}
                    data-testid="input-national-id"
                  />
                </div>

                {/* Monthly Salary */}
                <div className="space-y-2">
                  <Label htmlFor="monthlySalary">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      الراتب الشهري (DA) *
                    </div>
                  </Label>
                  <Input
                    id="monthlySalary"
                    type="number"
                    placeholder="أدخل الراتب الشهري"
                    {...register("monthlySalary", { valueAsNumber: true })}
                    data-testid="input-monthly-salary"
                  />
                </div>

                {/* Pay Slip Image */}
                <div className="space-y-2">
                  <Label htmlFor="paySlip">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      كشف الراتب (Fiche de paie) *
                    </div>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="paySlip"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPaySlipFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                      data-testid="input-pay-slip"
                    />
                    {paySlipFile && (
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {paySlipFile.name.slice(0, 15)}...
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Work Document Image */}
                <div className="space-y-2">
                  <Label htmlFor="workDoc">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      وثيقة العمل *
                    </div>
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="workDoc"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setWorkDocFile(e.target.files?.[0] || null)}
                      className="cursor-pointer"
                      data-testid="input-work-doc"
                    />
                    {workDocFile && (
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {workDocFile.name.slice(0, 15)}...
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">السعر:</span>
                  <span className="font-semibold">{sheep.price.toLocaleString()} DA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العمر:</span>
                  <span className="font-semibold">{sheep.age} شهر</span>
                </div>
              </CardContent>
            </Card>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOrderDialogOpen(false)}
                disabled={creatingOrder}
              >
                إلغاء
              </Button>
              {isGuest ? (
                <Button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("guestMode");
                    setOrderDialogOpen(false);
                    setLocation("/login");
                  }}
                >
                  سجل الدخول أولاً
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={creatingOrder || uploadingFiles}
                >
                  {uploadingFiles ? "جاري رفع الملفات..." : creatingOrder ? "جاري الإنشاء..." : "تأكيد الطلب"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Guest Login Dialog */}
      <Dialog open={guestLoginDialogOpen} onOpenChange={setGuestLoginDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تسجيل الدخول مطلوب</DialogTitle>
            <DialogDescription>
              يجب تسجيل الدخول أو إنشاء حساب لإنشاء طلب شراء
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-center text-muted-foreground mb-4">
              هل تريد متابعة التسوق كمستخدم مسجل؟
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setGuestLoginDialogOpen(false)}
            >
              العودة للمتصفح
            </Button>
            <Button
              type="button"
              onClick={() => {
                localStorage.removeItem("guestMode");
                setGuestLoginDialogOpen(false);
                setLocation("/login");
              }}
            >
              سجل الدخول أولاً
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
}