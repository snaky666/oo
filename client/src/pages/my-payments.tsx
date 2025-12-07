
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { CreditCard, Calendar, DollarSign, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { VIP_PACKAGES } from "@shared/schema";

interface PaymentItem {
  id: string;
  orderId?: string;
  userId: string;
  amount: number;
  method: "cash" | "card" | "installment";
  status: "pending" | "verified" | "rejected" | "completed";
  vipUpgrade: boolean;
  vipPackage?: "silver" | "gold" | "platinum";
  receiptUrl?: string;
  createdAt: number;
  // Order details
  sheepId?: string;
  sheepType?: string;
  sheepImages?: string[];
  sellerName?: string;
}

export default function MyPaymentsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    const fetchPayments = async () => {
      try {
        const paymentsData: PaymentItem[] = [];

        // جلب المدفوعات من مجموعة payments
        const paymentsQuery = query(
          collection(db, "payments"),
          where("userId", "==", user.uid)
        );
        const paymentsSnapshot = await getDocs(paymentsQuery);

        for (const paymentDoc of paymentsSnapshot.docs) {
          const paymentData = paymentDoc.data();
          const payment: PaymentItem = {
            id: paymentDoc.id,
            ...paymentData,
          } as PaymentItem;

          // جلب تفاصيل الطلب إذا كان موجوداً
          if (payment.orderId) {
            try {
              const orderDoc = await getDoc(doc(db, "orders", payment.orderId));
              if (orderDoc.exists()) {
                const orderData = orderDoc.data();
                
                // جلب تفاصيل الأغنام
                if (orderData.sheepId) {
                  const sheepDoc = await getDoc(doc(db, "sheep", orderData.sheepId));
                  if (sheepDoc.exists()) {
                    const sheepData = sheepDoc.data();
                    payment.sheepType = sheepData.type || "غنم";
                    payment.sheepImages = sheepData.images || [];
                  }
                }

                // جلب بيانات البائع
                if (orderData.sellerId) {
                  const sellerDoc = await getDoc(doc(db, "users", orderData.sellerId));
                  if (sellerDoc.exists()) {
                    const sellerData = sellerDoc.data();
                    payment.sellerName = sellerData.fullName || sellerData.email;
                  }
                }
              }
            } catch (err) {
              console.error("Error fetching order details:", err);
            }
          }

          paymentsData.push(payment);
        }

        // جلب الطلبات التي تعتبر مدفوعات
        const ordersQuery = query(
          collection(db, "orders"),
          where("buyerId", "==", user.uid)
        );
        const ordersSnapshot = await getDocs(ordersQuery);

        for (const orderDoc of ordersSnapshot.docs) {
          const orderData = orderDoc.data();
          
          // تحقق إذا لم يكن هناك دفعة مسجلة لهذا الطلب
          const existingPayment = paymentsData.find(p => p.orderId === orderDoc.id);
          if (!existingPayment) {
            const payment: PaymentItem = {
              id: orderDoc.id,
              orderId: orderDoc.id,
              userId: orderData.buyerId,
              amount: orderData.totalPrice || 0,
              method: orderData.paymentMethod || "cash",
              status: orderData.paymentStatus || "pending",
              vipUpgrade: false,
              createdAt: orderData.createdAt,
            };

            // جلب تفاصيل الأغنام
            if (orderData.sheepId) {
              try {
                const sheepDoc = await getDoc(doc(db, "sheep", orderData.sheepId));
                if (sheepDoc.exists()) {
                  const sheepData = sheepDoc.data();
                  payment.sheepType = sheepData.type || "غنم";
                  payment.sheepImages = sheepData.images || [];
                }
              } catch (err) {
                console.error("Error fetching sheep:", err);
              }
            }

            // جلب بيانات البائع
            if (orderData.sellerId) {
              try {
                const sellerDoc = await getDoc(doc(db, "users", orderData.sellerId));
                if (sellerDoc.exists()) {
                  const sellerData = sellerDoc.data();
                  payment.sellerName = sellerData.fullName || sellerData.email;
                }
              } catch (err) {
                console.error("Error fetching seller:", err);
              }
            }

            paymentsData.push(payment);
          }
        }

        // ترتيب حسب التاريخ
        paymentsData.sort((a, b) => b.createdAt - a.createdAt);
        setPayments(paymentsData);
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [user, setLocation]);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "verified":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case "verified":
      case "completed":
        return "مدفوع";
      case "pending":
        return "قيد التحقق";
      case "rejected":
        return "مرفوض";
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "card":
        return "💳 تحويل بنكي";
      case "cash":
        return "💵 دفع نقدي";
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
          <CreditCard className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">مدفوعاتي</h1>
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
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-28" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : payments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg text-muted-foreground mb-4">لا توجد مدفوعات حتى الآن</p>
              <Button onClick={() => setLocation("/browse")}>تصفح الأضاحي</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* صورة أو أيقونة */}
                    <div className="flex-shrink-0">
                      {payment.vipUpgrade ? (
                        <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                          <div className="text-center text-white">
                            <DollarSign className="h-8 w-8 mx-auto mb-1" />
                            <p className="text-xs font-bold">VIP</p>
                          </div>
                        </div>
                      ) : payment.sheepImages && payment.sheepImages.length > 0 ? (
                        <img
                          src={payment.sheepImages[0]}
                          alt="الأضحية"
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                          <CreditCard className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* معلومات الدفع */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">نوع الدفع</p>
                        <p className="font-semibold">
                          {payment.vipUpgrade
                            ? payment.vipPackage && VIP_PACKAGES[payment.vipPackage]
                              ? VIP_PACKAGES[payment.vipPackage].nameAr
                              : "ترقية VIP"
                            : payment.sheepType || "أضحية"}
                        </p>
                      </div>
                      {payment.sellerName && (
                        <div>
                          <p className="text-xs text-muted-foreground">البائع</p>
                          <p className="text-sm">{payment.sellerName}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(payment.createdAt), "dd MMM yyyy", { locale: ar })}
                      </div>
                    </div>

                    {/* معلومات السعر والحالة */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">المبلغ</p>
                        <p className="font-bold text-lg text-primary">
                          {payment.amount.toLocaleString()} DA
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">طريقة الدفع</p>
                        <p className="text-sm">{getPaymentMethodLabel(payment.method)}</p>
                      </div>
                      <Badge className={getPaymentStatusColor(payment.status)}>
                        {payment.status === "verified" || payment.status === "completed" ? (
                          <CheckCircle className="h-3 w-3 ml-1" />
                        ) : payment.status === "rejected" ? (
                          <XCircle className="h-3 w-3 ml-1" />
                        ) : (
                          <Clock className="h-3 w-3 ml-1" />
                        )}
                        {getPaymentStatusLabel(payment.status)}
                      </Badge>
                    </div>

                    {/* الإجراءات */}
                    <div className="flex flex-col gap-2 justify-start">
                      {payment.orderId && (
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => setLocation(`/order/${payment.orderId}`)}
                        >
                          <Eye className="h-4 w-4 ml-2" />
                          عرض الطلب
                        </Button>
                      )}
                      {payment.receiptUrl && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => window.open(payment.receiptUrl, "_blank")}
                        >
                          عرض الإيصال
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
