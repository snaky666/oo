import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Banknote, Percent, Check } from "lucide-react";
import { doc, addDoc, collection, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";

export default function Checkout() {
  const { user, refreshUser } = useAuthContext();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "installment">("card");
  const [processing, setProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [installmentMonths, setInstallmentMonths] = useState(3);

  const [orderId, setOrderId] = useState<string | null>(null);
  const [isVIPUpgrade, setIsVIPUpgrade] = useState(false);
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const pending = localStorage.getItem("pendingOrderId");
    const vipUpgrade = localStorage.getItem("pendingVIPUpgrade");
    
    if (pending) {
      setOrderId(pending);
      const orderAmount = localStorage.getItem("pendingOrderAmount");
      setAmount(parseInt(orderAmount || "0"));
    } else if (vipUpgrade) {
      setIsVIPUpgrade(true);
      setAmount(9999);
    }
  }, []);
  const downPayment = Math.ceil(amount * 0.3);
  const monthlyPayment = Math.ceil((amount - downPayment) / installmentMonths);

  const handlePayment = async () => {
    if (!user) {
      setLocation("/login");
      return;
    }

    setProcessing(true);
    try {
      // إنشاء سجل الدفع
      const paymentData = {
        userId: user.uid,
        userEmail: user.email,
        amount: amount,
        method: paymentMethod,
        status: paymentMethod === "cash" ? "pending" : "completed",
        orderId: orderId || undefined,
        vipUpgrade: isVIPUpgrade,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const paymentRef = await addDoc(collection(db, "payments"), paymentData);

      // إذا كان VIP upgrade
      if (isVIPUpgrade && paymentMethod !== "cash") {
        await updateDoc(doc(db, "users", user.uid), {
          vipStatus: "vip",
          vipUpgradedAt: Date.now(),
          updatedAt: Date.now(),
        });
        await refreshUser();
      }

      // إذا كان تقسيط
      if (paymentMethod === "installment") {
        await addDoc(collection(db, "installments"), {
          paymentId: paymentRef.id,
          userId: user.uid,
          totalAmount: amount,
          downPayment: downPayment,
          remainingAmount: amount - downPayment,
          monthlyInstallment: monthlyPayment,
          numberOfMonths: installmentMonths,
          paidInstallments: 1,
          nextDueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
          status: "active",
          createdAt: Date.now(),
        });
      }

      // تنظيف localStorage
      localStorage.removeItem("pendingOrderId");
      localStorage.removeItem("pendingOrderAmount");
      localStorage.removeItem("pendingVIPUpgrade");
      localStorage.removeItem("vipAmount");

      toast({
        title: "نجح الدفع",
        description: `تم ${paymentMethod === "card" ? "معالجة الدفع بنجاح" : paymentMethod === "cash" ? "تسجيل الطلب للدفع عند الاستلام" : "تسجيل الأقساط"}`,
      });

      setLocation(isVIPUpgrade ? (user?.role === "seller" ? "/seller" : "/browse") : "/orders");
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "خطأ في الدفع",
        description: "حدث خطأ أثناء معالجة الدفع",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-2xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">الدفع</h1>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* بطاقة CIB */}
          <Card
            className={`cursor-pointer transition ${
              paymentMethod === "card"
                ? "border-primary bg-primary/5"
                : "hover:border-primary/50"
            }`}
            onClick={() => setPaymentMethod("card")}
          >
            <CardContent className="p-6 text-center">
              <CreditCard className="h-8 w-8 mx-auto mb-3 text-blue-500" />
              <h3 className="font-semibold mb-2">بطاقة CIB</h3>
              <p className="text-sm text-muted-foreground">دفع فوري آمن</p>
              {paymentMethod === "card" && (
                <Check className="h-5 w-5 mx-auto mt-2 text-green-500" />
              )}
            </CardContent>
          </Card>

          {/* دفع نقدي */}
          <Card
            className={`cursor-pointer transition ${
              paymentMethod === "cash"
                ? "border-primary bg-primary/5"
                : "hover:border-primary/50"
            }`}
            onClick={() => setPaymentMethod("cash")}
          >
            <CardContent className="p-6 text-center">
              <Banknote className="h-8 w-8 mx-auto mb-3 text-green-500" />
              <h3 className="font-semibold mb-2">دفع نقدي</h3>
              <p className="text-sm text-muted-foreground">عند الاستلام</p>
              {paymentMethod === "cash" && (
                <Check className="h-5 w-5 mx-auto mt-2 text-green-500" />
              )}
            </CardContent>
          </Card>

          {/* تقسيط */}
          <Card
            className={`cursor-pointer transition ${
              paymentMethod === "installment"
                ? "border-primary bg-primary/5"
                : "hover:border-primary/50"
            }`}
            onClick={() => setPaymentMethod("installment")}
          >
            <CardContent className="p-6 text-center">
              <Percent className="h-8 w-8 mx-auto mb-3 text-orange-500" />
              <h3 className="font-semibold mb-2">تقسيط</h3>
              <p className="text-sm text-muted-foreground">أقساط مرنة</p>
              {paymentMethod === "installment" && (
                <Check className="h-5 w-5 mx-auto mt-2 text-green-500" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* تفاصيل الدفع */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>تفاصيل الدفع</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethod === "card" && (
              <>
                <div>
                  <Label>رقم البطاقة</Label>
                  <Input
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>تاريخ الانتهاء</Label>
                    <Input
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>رمز الأمان</Label>
                    <Input
                      placeholder="CVC"
                      value={cardCVC}
                      onChange={(e) => setCardCVC(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {paymentMethod === "installment" && (
              <>
                <div>
                  <Label>عدد الأقساط</Label>
                  <select
                    value={installmentMonths}
                    onChange={(e) => setInstallmentMonths(parseInt(e.target.value))}
                    className="w-full p-2 border rounded-md"
                  >
                    {[3, 6, 9, 12].map((month) => (
                      <option key={month} value={month}>
                        {month} أشهر
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>الدفعة الأولى:</span>
                    <Badge>{downPayment.toLocaleString()} DA</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>القسط الشهري:</span>
                    <Badge variant="outline">{monthlyPayment.toLocaleString()} DA</Badge>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>إجمالي الأقساط:</span>
                    <span>{installmentMonths}</span>
                  </div>
                </div>
              </>
            )}

            {paymentMethod === "cash" && (
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg text-sm">
                <p className="text-amber-900 dark:text-amber-100">
                  ✓ سيتم تسجيل طلبك كـ "قيد الانتظار" حتى يتم تأكيد الدفع من قبل الإدارة عند استلامك للمنتج.
                </p>
              </div>
            )}

            {/* ملخص الدفع */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-lg font-bold">
                <span>المبلغ الإجمالي:</span>
                <span className="text-primary">{amount.toLocaleString()} DA</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* أزرار الإجراء */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setLocation("/browse")}
            disabled={processing}
          >
            إلغاء
          </Button>
          <Button onClick={handlePayment} disabled={processing} className="flex-1">
            {processing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
            {paymentMethod === "card"
              ? "دفع الآن"
              : paymentMethod === "cash"
              ? "تأكيد الدفع عند الاستلام"
              : "تطبيق الأقساط"}
          </Button>
        </div>
      </div>
    </div>
  );
}
