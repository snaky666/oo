import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Sheep, InsertOrder, algeriaCities } from "@shared/schema";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Weight, ArrowRight, ShoppingCart } from "lucide-react";
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
    },
  });

  useEffect(() => {
    if (params?.id) {
      fetchSheep(params.id);
    }
  }, [params?.id]);

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
        setSheep({ id: sheepDoc.id, ...sheepDoc.data() } as Sheep);
      } else {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على الخروف",
          variant: "destructive",
        });
        setLocation("/browse");
      }
    } catch (error) {
      console.error("Error fetching sheep:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (formData: OrderFormData) => {
    if (!sheep || !user) return;

    setCreatingOrder(true);
    try {
      const orderData = {
        buyerId: user.uid,
        buyerEmail: user.email,
        buyerName: formData.fullName,
        buyerPhone: formData.phone,
        buyerCity: formData.city,
        buyerAddress: formData.address,
        sellerId: sheep.sellerId,
        sellerEmail: sheep.sellerEmail || "",
        sheepId: sheep.id,
        sheepPrice: sheep.price,
        sheepAge: sheep.age,
        sheepWeight: sheep.weight,
        sheepCity: sheep.city,
        totalPrice: sheep.price,
        status: "pending",
        createdAt: Date.now(),
      };

      await addDoc(collection(db, "orders"), orderData);

      toast({
        title: "تم إنشاء الطلب بنجاح",
        description: "سيتم التواصل معك قريباً من قبل الإدارة",
      });

      setOrderDialogOpen(false);
      setLocation("/browse");
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الطلب",
        variant: "destructive",
      });
    } finally {
      setCreatingOrder(false);
    }
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
      </div>
    );
  }

  if (!sheep) return null;

  const images = sheep.images && sheep.images.length > 0 ? sheep.images : [placeholderImage];

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
            {/* Price */}
            <div>
              <Badge className="text-2xl font-bold px-4 py-2">
                {sheep.price.toLocaleString()} DA
              </Badge>
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

            {/* Order Button */}
            {user && (user.role === "buyer" || user.role === "seller") && (
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

            {!user && (
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    يجب تسجيل الدخول لإنشاء طلب شراء
                  </p>
                  <Button onClick={() => setLocation("/login")}>
                    تسجيل الدخول
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Order Confirmation Dialog */}
      <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
        <DialogContent className="max-w-md">
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
              <Button
                type="submit"
                disabled={creatingOrder}
              >
                {creatingOrder ? "جاري الإنشاء..." : "تأكيد الطلب"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
