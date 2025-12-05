import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { ShoppingBag, Calendar, DollarSign, Truck } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface OrderItem {
  id: string;
  sheepId: string;
  sellerId: string;
  buyerId: string;
  totalPrice: number;
  paymentMethod: "cash" | "card" | "installment";
  paymentStatus: "pending" | "verified" | "rejected" | "completed";
  orderStatus: "new" | "confirmed" | "ready" | "delivered" | "cancelled";
  createdAt: number;
  // Sheep details
  sheepPrice?: number;
  sheepAge?: number;
  sheepWeight?: number;
  sheepImages?: string[];
  sheepType?: string;
  // Seller info
  sellerName?: string;
  sellerPhone?: string;
  // Buyer info
  buyerName?: string;
  buyerEmail?: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        console.log("🔍 جاري جلب الطلبات...");
        const startTime = Date.now();

        // استعلام محسّن مع ترتيب وحد أقصى
        let q;
        if (user.role === "buyer") {
          q = query(
            collection(db, "orders"),
            where("buyerId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(50)
          );
        } else if (user.role === "seller") {
          q = query(
            collection(db, "orders"),
            orderBy("createdAt", "desc"),
            limit(50)
          );
        } else {
          q = query(
            collection(db, "orders"),
            orderBy("createdAt", "desc"),
            limit(50)
          );
        }

        const snapshot = await getDocs(q);
        console.log(`✅ تم جلب ${snapshot.docs.length} طلب في ${Date.now() - startTime}ms`);

        // تجميع IDs للبيانات المطلوبة
        const sheepIds = new Set<string>();
        const sellerIds = new Set<string>();
        const filteredOrders: any[] = [];

        snapshot.docs.forEach((orderDoc) => {
          const orderData = orderDoc.data();

          // تصفية الطلبات
          if (user.role === "buyer" && orderData.buyerId !== user.uid) return;
          if (user.role === "seller" && orderData.buyerId !== user.uid && orderData.sellerId !== user.uid) return;

          filteredOrders.push({
            id: orderDoc.id,
            ...orderData,
          });

          if (orderData.sheepId) sheepIds.add(orderData.sheepId);
          if (orderData.sellerId) sellerIds.add(orderData.sellerId);
        });

        console.log(`📊 طلبات مصفاة: ${filteredOrders.length}, أغنام: ${sheepIds.size}, بائعين: ${sellerIds.size}`);

        // جلب بيانات الأغنام دفعة واحدة
        const sheepCache = new Map();
        if (sheepIds.size > 0) {
          const sheepPromises = Array.from(sheepIds).map(async (sheepId) => {
            try {
              const sheepSnap = await getDoc(doc(db, "sheep", sheepId));
              if (sheepSnap.exists()) {
                sheepCache.set(sheepId, sheepSnap.data());
              }
            } catch (err) {
              console.error("خطأ في جلب بيانات الأغنام:", err);
            }
          });
          await Promise.all(sheepPromises);
        }

        // جلب بيانات البائعين دفعة واحدة
        const sellerCache = new Map();
        if (sellerIds.size > 0) {
          const sellerPromises = Array.from(sellerIds).map(async (sellerId) => {
            try {
              const sellerSnap = await getDoc(doc(db, "users", sellerId));
              if (sellerSnap.exists()) {
                sellerCache.set(sellerId, sellerSnap.data());
              }
            } catch (err) {
              console.error("خطأ في جلب بيانات البائعين:", err);
            }
          });
          await Promise.all(sellerPromises);
        }

        // دمج البيانات
        const ordersData: OrderItem[] = filteredOrders.map((order) => {
          const sheepData = sheepCache.get(order.sheepId);
          const sellerData = sellerCache.get(order.sellerId);

          return {
            ...order,
            sheepImages: sheepData?.images || [],
            sheepType: sheepData?.type || "غنم",
            sheepAge: sheepData?.age,
            sheepWeight: sheepData?.weight,
            sellerName: sellerData?.fullName || sellerData?.email,
            sellerPhone: sellerData?.phone,
          } as OrderItem;
        });

        console.log(`✅ اكتمل التحميل في ${Date.now() - startTime}ms`);
        setOrders(ordersData);
      } catch (error) {
        console.error("خطأ في جلب الطلبات:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, setLocation]);

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "ready":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700";
      case "verified":
        return "bg-green-50 text-green-700";
      case "pending":
        return "bg-yellow-50 text-yellow-700";
      case "rejected":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const getOrderStatusLabel = (status: string) => {
    switch (status) {
      case "new":
        return "بانتظار التأكيد";
      case "confirmed":
        return "تم التأكيد";
      case "ready":
        return "جاهز للتسليم";
      case "delivered":
        return "تم التسليم";
      case "cancelled":
        return "ملغى";
      default:
        return status;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "verified":
        return "مدفوع";
      case "completed":
        return "مدفوع";
      case "rejected":
        return "مرفوض";
      case "pending":
      default:
        return "قيد التحقق";
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "card":
        return "💳 تحويل بنكي";
      case "cash":
        return "💵 دفع عند الاستلام";
      case "installment":
        return "📅 تقسيط";
      default:
        return method;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <ShoppingBag className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">طلباتي</h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Skeleton className="h-24 w-24 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg text-muted-foreground mb-4">لم تقم بأي طلبات حتى الآن</p>
              <Button onClick={() => setLocation("/browse")}>تصفح الأضاحي</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* صورة الأغنم */}
                    <div className="flex-shrink-0">
                      {order.sheepImages && order.sheepImages.length > 0 ? (
                        <img
                          src={order.sheepImages[0]}
                          alt="الأضحية"
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* معلومات الطلب الأساسية */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">رقم الطلب</p>
                          <p className="font-mono text-sm font-semibold">{order.id.slice(0, 8)}</p>
                        </div>
                        <Badge className={getOrderStatusColor(order.orderStatus)}>
                          {getOrderStatusLabel(order.orderStatus)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">نوع الأضحية</p>
                        <p className="text-sm font-medium">{order.sheepType}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(order.createdAt), "dd MMM yyyy", { locale: ar })}
                      </div>
                    </div>

                    {/* معلومات السعر والدفع */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">السعر الإجمالي</p>
                        <p className="font-bold text-lg text-primary">
                          {order.totalPrice.toLocaleString()} DA
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">طريقة الدفع</p>
                        <p className="text-sm">{getPaymentMethodLabel(order.paymentMethod)}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={getPaymentStatusColor(order.paymentStatus)}
                      >
                        {getPaymentStatusLabel(order.paymentStatus)}
                      </Badge>
                    </div>

                    {/* الإجراءات */}
                    <div className="flex flex-col gap-2 justify-start">
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => setLocation(`/order/${order.id}`)}
                      >
                        عرض التفاصيل
                      </Button>
                      {/* زر واتساب البائع - يظهر للبائع والأدمن فقط */}
                      {order.sellerPhone && (user?.uid === order.sellerId || user?.role === "admin") && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            window.open(
                              `https://wa.me/${order.sellerPhone!.replace(/\D/g, "")}?text=السلام عليكم، أتواصل معك بخصوص الطلب ${order.id}`,
                              "_blank"
                            );
                          }}
                        >
                          واتساب البائع
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}