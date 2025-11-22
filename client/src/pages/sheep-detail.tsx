import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Sheep, InsertOrder } from "@shared/schema";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import placeholderImage from "@assets/generated_images/sheep_product_placeholder.png";

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

  useEffect(() => {
    if (params?.id) {
      fetchSheep(params.id);
    }
  }, [params?.id]);

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

  const handleCreateOrder = async () => {
    if (!sheep || !user) return;

    setCreatingOrder(true);
    try {
      const orderData: Omit<InsertOrder, "sheepId" | "totalPrice"> & { 
        buyerId: string;
        buyerEmail: string;
        sellerId: string;
        sellerEmail: string;
        sheepId: string;
        totalPrice: number;
        sheepData: Partial<Sheep>;
        status: string;
        createdAt: number;
      } = {
        buyerId: user.uid,
        buyerEmail: user.email,
        sellerId: sheep.sellerId,
        sellerEmail: sheep.sellerEmail || "",
        sheepId: sheep.id,
        totalPrice: sheep.price,
        sheepData: {
          images: sheep.images,
          price: sheep.price,
          age: sheep.age,
          weight: sheep.weight,
          city: sheep.city,
          description: sheep.description,
        },
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
                {sheep.price.toLocaleString('ar-SA')} ر.س
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
            {user && user.role === "buyer" && (
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
                    يجب تسجيل الدخول كمشتري لإنشاء طلب شراء
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد طلب الشراء</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من رغبتك في شراء هذا الخروف؟
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">السعر:</span>
                <span className="font-semibold">{sheep.price.toLocaleString('ar-SA')} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">المدينة:</span>
                <span className="font-semibold">{sheep.city}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setOrderDialogOpen(false)}
              disabled={creatingOrder}
              data-testid="button-cancel-order"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={creatingOrder}
              data-testid="button-confirm-order"
            >
              {creatingOrder ? "جاري الإنشاء..." : "تأكيد الطلب"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
