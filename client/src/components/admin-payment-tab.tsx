
import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CIBReceipt, Payment, VIP_PACKAGES, Order, User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Loader2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminPaymentTabProps {
  statusFilter?: "all" | "pending" | "verified" | "rejected";
}

export default function AdminPaymentTab({ statusFilter = "all" }: AdminPaymentTabProps) {
  const { toast } = useToast();
  const [cibReceipts, setCIBReceipts] = useState<CIBReceipt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ordersMap, setOrdersMap] = useState<Record<string, Order>>({});
  const [usersMap, setUsersMap] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<CIBReceipt | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<"all" | "vip" | "local" | "foreign">("all");

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const [receiptsSnapshot, paymentsSnapshot, ordersSnapshot, usersSnapshot] = await Promise.all([
        getDocs(collection(db, "cibReceipts")),
        getDocs(collection(db, "payments")),
        getDocs(collection(db, "orders")),
        getDocs(collection(db, "users")),
      ]);

      // إنشاء خريطة للمستخدمين (البائعين)
      const fullUsersMap: Record<string, User> = {};
      usersSnapshot.docs.forEach((doc) => {
        const userData = doc.data();
        fullUsersMap[doc.id] = { uid: doc.id, ...userData } as User;
      });
      setUsersMap(fullUsersMap);

      // إنشاء خريطة لنوع الأضحية من الطلبات وتخزين بيانات الطلبات كاملة
      const orderOriginMap: Record<string, string> = {};
      const fullOrdersMap: Record<string, Order> = {};
      ordersSnapshot.docs.forEach((doc) => {
        const orderData = doc.data();
        orderOriginMap[doc.id] = orderData.sheepOrigin || "local";
        fullOrdersMap[doc.id] = { id: doc.id, ...orderData } as Order;
      });
      setOrdersMap(fullOrdersMap);

      // إثراء وصولات CIB بنوع الأضحية من الطلبات
      const receiptsData = receiptsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const orderId = data.orderId;
        // إذا لم يكن sheepOrigin موجوداً في الوصل، نحصل عليه من الطلب
        const sheepOrigin = data.sheepOrigin || (orderId ? orderOriginMap[orderId] : undefined) || "local";
        return {
          id: doc.id,
          ...data,
          sheepOrigin,
        };
      }) as CIBReceipt[];

      // إثراء المدفوعات بنوع الأضحية من الطلبات
      const paymentsData = paymentsSnapshot.docs.map((doc) => {
        const data = doc.data();
        const orderId = data.orderId;
        const sheepOrigin = data.sheepOrigin || (orderId ? orderOriginMap[orderId] : undefined) || "local";
        return {
          id: doc.id,
          ...data,
          sheepOrigin,
        };
      }) as Payment[];

      // تحويل الطلبات إلى صيغة مدفوعات للعرض
      const ordersData = ordersSnapshot.docs.map((doc) => {
        const orderData = doc.data();
        return {
          id: doc.id,
          orderId: doc.id,
          userId: orderData.buyerId,
          userEmail: orderData.buyerEmail || "",
          amount: orderData.totalPrice || 0,
          method: orderData.paymentMethod || "cash",
          status: orderData.status === "confirmed" ? "verified" : orderData.status === "rejected" ? "rejected" : "pending",
          vipUpgrade: false,
          sheepOrigin: orderData.sheepOrigin || "local",
          createdAt: orderData.createdAt,
        } as Payment;
      });

      // دمج المدفوعات مع الطلبات
      const allPayments = [...paymentsData, ...ordersData];

      setCIBReceipts(receiptsData.sort((a, b) => b.createdAt - a.createdAt));
      setPayments(allPayments.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error("Error fetching payment data:", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل بيانات الدفع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyReceipt = async () => {
    if (!selectedReceipt) return;
    setProcessing(true);
    try {
      await updateDoc(doc(db, "cibReceipts", selectedReceipt.id), {
        status: "verified",
        verifiedBy: "admin",
        verifiedAt: Date.now(),
        updatedAt: Date.now(),
      });

      if (selectedReceipt.vipUpgrade) {
        const vipPackage = selectedReceipt.vipPackage || "silver";
        const pkg = VIP_PACKAGES[vipPackage as keyof typeof VIP_PACKAGES];
        const expiresAt = Date.now() + pkg.duration * 24 * 60 * 60 * 1000;

        await updateDoc(doc(db, "users", selectedReceipt.userId), {
          vipStatus: vipPackage,
          vipPackage: vipPackage,
          vipUpgradedAt: Date.now(),
          vipExpiresAt: expiresAt,
          rewardPoints: 100,
          updatedAt: Date.now(),
        });
      }

      toast({
        title: "تم التحقق من الوصل",
        description: selectedReceipt.vipUpgrade ? "تم تفعيل الترقية VIP بنجاح" : "تم تأكيد الدفع بنجاح",
      });

      setSelectedReceipt(null);
      fetchPaymentData();
    } catch (error) {
      console.error("Error verifying receipt:", error);
      toast({
        title: "خطأ",
        description: "فشل التحقق من الوصل",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectReceipt = async () => {
    if (!selectedReceipt) return;
    setProcessing(true);
    try {
      await updateDoc(doc(db, "cibReceipts", selectedReceipt.id), {
        status: "rejected",
        rejectionReason: rejectionReason,
        verifiedBy: "admin",
        verifiedAt: Date.now(),
        updatedAt: Date.now(),
      });

      toast({
        title: "تم رفض الوصل",
        description: "تم إخطار المستخدم برفض الوصل",
      });

      setSelectedReceipt(null);
      setRejectionReason("");
      fetchPaymentData();
    } catch (error) {
      console.error("Error rejecting receipt:", error);
      toast({
        title: "خطأ",
        description: "فشل رفض الوصل",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // فصل البيانات حسب النوع
  const vipPayments = payments.filter((p) => p.vipUpgrade);
  const sheepPayments = payments.filter((p) => !p.vipUpgrade);
  const vipReceipts = cibReceipts.filter((r) => r.vipUpgrade);
  const sheepReceipts = cibReceipts.filter((r) => !r.vipUpgrade);
  
  // فصل الأضاحي المحلية والمستوردة
  const localSheepPayments = sheepPayments.filter((p) => !p.sheepOrigin || p.sheepOrigin === "local");
  const foreignSheepPayments = sheepPayments.filter((p) => p.sheepOrigin === "foreign");
  const localSheepReceipts = sheepReceipts.filter((r) => !r.sheepOrigin || r.sheepOrigin === "local");
  const foreignSheepReceipts = sheepReceipts.filter((r) => r.sheepOrigin === "foreign");

  const pendingReceipts = cibReceipts.filter((r) => r.status === "pending");
  const verifiedReceipts = cibReceipts.filter((r) => r.status === "verified");
  const rejectedReceipts = cibReceipts.filter((r) => r.status === "rejected");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" />
            في الانتظار
          </Badge>
        );
      case "verified":
        return (
          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" />
            تم التحقق
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" />
            مرفوض
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "card":
        return "تحويل بنكي (CIB)";
      case "cash":
        return "دفع نقدي";
      case "installment":
        return "تقسيط";
      default:
        return method;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Filter data based on selected filter
  const getFilteredData = () => {
    let receipts: CIBReceipt[] = [];
    let paymentsList: Payment[] = [];
    let title = "";
    let icon = "";

    // Filter by payment type (vip, local, foreign, all)
    if (paymentFilter === "vip") {
      receipts = vipReceipts;
      paymentsList = vipPayments;
      title = "مدفوعات VIP";
      icon = "💎";
    } else if (paymentFilter === "local") {
      receipts = localSheepReceipts;
      paymentsList = localSheepPayments;
      title = "مدفوعات الأضاحي المحلية";
      icon = "🐑";
    } else if (paymentFilter === "foreign") {
      receipts = foreignSheepReceipts;
      paymentsList = foreignSheepPayments;
      title = "مدفوعات الأضاحي المستوردة";
      icon = "🌍";
    } else {
      receipts = cibReceipts;
      paymentsList = payments;
      title = "جميع المدفوعات";
      icon = "💰";
    }

    // Apply status filter if provided
    if (statusFilter && statusFilter !== "all") {
      receipts = receipts.filter(r => {
        if (statusFilter === "pending") return r.status === "pending";
        if (statusFilter === "verified") return r.status === "verified";
        if (statusFilter === "rejected") return r.status === "rejected";
        return true;
      });
      
      paymentsList = paymentsList.filter(p => {
        if (statusFilter === "pending") return p.status === "pending";
        if (statusFilter === "verified") return p.status === "verified" || p.status === "completed";
        if (statusFilter === "rejected") return p.status === "rejected";
        return true;
      });
    }

    return { receipts, payments: paymentsList, title, icon };
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6">
      {/* أزرار الفلترة */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant={paymentFilter === "vip" ? "default" : "outline"}
          onClick={() => setPaymentFilter("vip")}
          className={paymentFilter === "vip" ? "bg-amber-500 hover:bg-amber-600" : ""}
        >
          💎 مدفوعات VIP ({vipReceipts.length + vipPayments.length})
        </Button>
        <Button
          variant={paymentFilter === "local" ? "default" : "outline"}
          onClick={() => setPaymentFilter("local")}
          className={paymentFilter === "local" ? "bg-green-500 hover:bg-green-600" : ""}
        >
          🐑 أضاحي محلية ({localSheepReceipts.length + localSheepPayments.length})
        </Button>
        <Button
          variant={paymentFilter === "foreign" ? "default" : "outline"}
          onClick={() => setPaymentFilter("foreign")}
          className={paymentFilter === "foreign" ? "bg-blue-500 hover:bg-blue-600" : ""}
        >
          🌍 أضاحي مستوردة ({foreignSheepReceipts.length + foreignSheepPayments.length})
        </Button>
      </div>

      {/* إحصائيات */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">{pendingReceipts.length}</div>
              <p className="text-sm text-muted-foreground mt-2">وصلات في الانتظار</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{verifiedReceipts.length}</div>
              <p className="text-sm text-muted-foreground mt-2">وصلات موثقة</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{rejectedReceipts.length}</div>
              <p className="text-sm text-muted-foreground mt-2">وصلات مرفوضة</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قسم المدفوعات المفلترة */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{filteredData.icon}</span>
          <h2 className="text-2xl font-bold">{filteredData.title}</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{filteredData.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>المبلغ</TableHead>
                    {paymentFilter === "vip" ? (
                      <TableHead>الباقة</TableHead>
                    ) : (
                      <TableHead>رقم الطلب</TableHead>
                    )}
                    <TableHead>طريقة الدفع</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* عرض التحويلات البنكية أولاً */}
                  {filteredData.receipts.map((receipt) => (
                    <TableRow 
                      key={`receipt-${receipt.id}`}
                      className={receipt.status === "pending" ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={() => receipt.status === "pending" && setSelectedReceipt(receipt)}
                    >
                      <TableCell className="font-medium">{receipt.userEmail}</TableCell>
                      <TableCell>{receipt.amount.toLocaleString()} DA</TableCell>
                      <TableCell>
                        {paymentFilter === "vip" ? (
                          receipt.vipPackage && VIP_PACKAGES[receipt.vipPackage as keyof typeof VIP_PACKAGES]
                            ? VIP_PACKAGES[receipt.vipPackage as keyof typeof VIP_PACKAGES].nameAr
                            : "-"
                        ) : (
                          <span className="font-mono text-xs">
                            {receipt.orderId ? receipt.orderId.slice(0, 8) : "-"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>تحويل بنكي (CIB)</TableCell>
                      <TableCell>{getStatusBadge(receipt.status)}</TableCell>
                      <TableCell>{formatDate(receipt.createdAt)}</TableCell>
                      <TableCell>
                        {receipt.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReceipt(receipt);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            مراجعة
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* عرض باقي المدفوعات */}
                  {filteredData.payments.map((payment) => (
                    <TableRow key={`payment-${payment.id}`}>
                      <TableCell className="font-medium">{payment.userEmail}</TableCell>
                      <TableCell>{payment.amount.toLocaleString()} DA</TableCell>
                      <TableCell>
                        {paymentFilter === "vip" ? (
                          payment.vipPackage && VIP_PACKAGES[payment.vipPackage as keyof typeof VIP_PACKAGES]
                            ? VIP_PACKAGES[payment.vipPackage as keyof typeof VIP_PACKAGES].nameAr
                            : "-"
                        ) : (
                          <span className="font-mono text-xs">
                            {payment.orderId ? payment.orderId.slice(0, 8) : "-"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getPaymentMethodLabel(payment.method)}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredData.receipts.length === 0 && filteredData.payments.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">
                  لا توجد {filteredData.title.toLowerCase()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نافذة مراجعة الوصل */}
      <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>مراجعة وصل التحويل</DialogTitle>
            <DialogDescription>
              تحقق من الوصل وقرر ما إذا كان صحيحًا
            </DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">المستخدم</p>
                <p className="font-semibold">{selectedReceipt.userEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">النوع</p>
                <p className="font-semibold">
                  {selectedReceipt.vipUpgrade ? "ترقية VIP" : "شراء أضحية"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المبلغ</p>
                <p className="font-semibold text-lg">{selectedReceipt.amount.toLocaleString()} DA</p>
              </div>
              {selectedReceipt.vipPackage && (
                <div>
                  <p className="text-sm text-muted-foreground">الباقة</p>
                  <p className="font-semibold">
                    {VIP_PACKAGES[selectedReceipt.vipPackage as keyof typeof VIP_PACKAGES]?.nameAr}
                  </p>
                </div>
              )}
              {selectedReceipt.orderId && (
                <div>
                  <p className="text-sm text-muted-foreground">رقم الطلب</p>
                  <p className="font-semibold font-mono text-xs">{selectedReceipt.orderId}</p>
                </div>
              )}

              {/* معلومات العميل من الطلب */}
              {selectedReceipt.orderId && ordersMap[selectedReceipt.orderId] && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-base">معلومات العميل</h4>
                  
                  {ordersMap[selectedReceipt.orderId].buyerName && (
                    <div>
                      <p className="text-sm text-muted-foreground">اسم المشتري</p>
                      <p className="font-semibold">{ordersMap[selectedReceipt.orderId].buyerName}</p>
                    </div>
                  )}
                  
                  {ordersMap[selectedReceipt.orderId].buyerPhone && (
                    <div>
                      <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                      <p className="font-semibold" dir="ltr">{ordersMap[selectedReceipt.orderId].buyerPhone}</p>
                    </div>
                  )}
                  
                  {ordersMap[selectedReceipt.orderId].buyerCity && (
                    <div>
                      <p className="text-sm text-muted-foreground">المدينة</p>
                      <p className="font-semibold">{ordersMap[selectedReceipt.orderId].buyerCity}</p>
                    </div>
                  )}
                  
                  {ordersMap[selectedReceipt.orderId].buyerAddress && (
                    <div>
                      <p className="text-sm text-muted-foreground">العنوان</p>
                      <p className="font-semibold">{ordersMap[selectedReceipt.orderId].buyerAddress}</p>
                    </div>
                  )}

                  {/* معلومات إضافية للأضاحي المستوردة */}
                  {ordersMap[selectedReceipt.orderId].sheepOrigin === "foreign" && (
                    <>
                      {ordersMap[selectedReceipt.orderId].nationalId && (
                        <div>
                          <p className="text-sm text-muted-foreground">رقم الهوية الوطنية</p>
                          <p className="font-semibold">{ordersMap[selectedReceipt.orderId].nationalId}</p>
                        </div>
                      )}
                      
                      {ordersMap[selectedReceipt.orderId].paySlipImageUrl && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">صورة كشف الراتب</p>
                          <img
                            src={ordersMap[selectedReceipt.orderId].paySlipImageUrl}
                            alt="Pay Slip"
                            className="w-full h-auto rounded-lg border max-h-48 object-contain"
                          />
                        </div>
                      )}
                      
                      {ordersMap[selectedReceipt.orderId].workDocImageUrl && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">صورة شهادة العمل</p>
                          <img
                            src={ordersMap[selectedReceipt.orderId].workDocImageUrl}
                            alt="Work Document"
                            className="w-full h-auto rounded-lg border max-h-48 object-contain"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* معلومات البائع للأضاحي المحلية */}
              {selectedReceipt.orderId && ordersMap[selectedReceipt.orderId] && 
               ordersMap[selectedReceipt.orderId].sellerId && 
               ordersMap[selectedReceipt.orderId].sheepOrigin !== "foreign" &&
               usersMap[ordersMap[selectedReceipt.orderId].sellerId] && (
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-base">معلومات البائع</h4>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">اسم البائع</p>
                    <p className="font-semibold">{usersMap[ordersMap[selectedReceipt.orderId].sellerId].fullName || "غير متوفر"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-semibold">{usersMap[ordersMap[selectedReceipt.orderId].sellerId].email || "غير متوفر"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                    <p className="font-semibold" dir="ltr">{usersMap[ordersMap[selectedReceipt.orderId].sellerId].phone || "غير متوفر"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">الولاية</p>
                    <p className="font-semibold">{usersMap[ordersMap[selectedReceipt.orderId].sellerId].city || "غير متوفر"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">البلدية</p>
                    <p className="font-semibold">{usersMap[ordersMap[selectedReceipt.orderId].sellerId].municipality || "غير متوفر"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">العنوان</p>
                    <p className="font-semibold">{usersMap[ordersMap[selectedReceipt.orderId].sellerId].address || "غير متوفر"}</p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">صورة الوصل</p>
                <img
                  src={selectedReceipt.receiptImageUrl}
                  alt="Receipt"
                  className="w-full h-auto rounded-lg border"
                />
              </div>

              <div>
                <Label htmlFor="reason">سبب الرفض (اختياري)</Label>
                <Input
                  id="reason"
                  placeholder="أدخل سبب الرفض إذا لزم الأمر"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={handleRejectReceipt}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              رفض
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleVerifyReceipt}
              disabled={processing}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              قبول وتفعيل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
