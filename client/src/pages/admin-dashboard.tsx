import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, updateDoc, deleteDoc, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sheep, Order, User } from "@shared/schema";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Package,
  Users,
  ShoppingBag,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react";
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
import placeholderImage from "@assets/generated_images/sheep_product_placeholder.png";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [sheep, setSheep] = useState<Sheep[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheep, setSelectedSheep] = useState<Sheep | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSheep(),
        fetchOrders(),
        fetchUsers(),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSheep = async () => {
    const snapshot = await getDocs(collection(db, "sheep"));
    const sheepData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Sheep[];
    setSheep(sheepData);
  };

  const fetchOrders = async () => {
    const snapshot = await getDocs(collection(db, "orders"));
    const ordersData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Order[];
    setOrders(ordersData);
  };

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const usersData = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    })) as User[];
    setUsers(usersData);
  };

  const handleReview = async (sheepId: string, approved: boolean, rejectionReason?: string) => {
    setReviewing(true);
    try {
      const updateData: any = {
        status: approved ? "approved" : "rejected",
        updatedAt: Date.now(),
      };
      
      if (!approved && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      
      await updateDoc(doc(db, "sheep", sheepId), updateData);

      toast({
        title: approved ? "تم قبول الخروف" : "تم رفض الخروف",
        description: approved ? "الخروف الآن متاح للمشترين" : "تم رفض القائمة بسبب: " + (rejectionReason || "أسباب إدارية"),
      });

      setSelectedSheep(null);
      fetchSheep();
    } catch (error) {
      console.error("Error reviewing sheep:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء المراجعة",
        variant: "destructive",
      });
    } finally {
      setReviewing(false);
    }
  };

  const handleOrderReview = async (orderId: string, approved: boolean) => {
    setReviewing(true);
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: approved ? "confirmed" : "rejected",
        updatedAt: Date.now(),
      });

      toast({
        title: approved ? "تم قبول الطلب" : "تم رفض الطلب",
        description: approved ? "تم تأكيد الطلب بنجاح" : "تم رفض الطلب",
      });

      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error("Error reviewing order:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء المراجعة",
        variant: "destructive",
      });
    } finally {
      setReviewing(false);
    }
  };

  const handleDeleteSheep = async (sheepId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العرض؟")) return;
    
    setReviewing(true);
    try {
      await deleteDoc(doc(db, "sheep", sheepId));

      toast({
        title: "تم حذف العرض",
        description: "تم حذف الخروف بنجاح",
      });

      fetchSheep();
    } catch (error) {
      console.error("Error deleting sheep:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء الحذف",
        variant: "destructive",
      });
    } finally {
      setReviewing(false);
    }
  };

  const pendingSheep = sheep.filter(s => s.status === "pending");
  const stats = {
    totalSheep: sheep.length,
    pendingSheep: pendingSheep.length,
    totalOrders: orders.length,
    totalUsers: users.length,
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "مدير";
      case "seller": return "بائع";
      case "buyer": return "مشتري";
      default: return role;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400">مدير</Badge>;
      case "seller":
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">بائع</Badge>;
      case "buyer":
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">مشتري</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold mb-2">لوحة تحكم الإدارة</h1>
          <p className="text-muted-foreground">إدارة شاملة للمنصة</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalSheep}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الأغنام</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pendingSheep}</p>
                  <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <ShoppingBag className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  <p className="text-sm text-muted-foreground">الطلبات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  <p className="text-sm text-muted-foreground">المستخدمون</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="pending" data-testid="tab-pending">
              قيد المراجعة ({pendingSheep.length})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all">
              جميع الأغنام
            </TabsTrigger>
            <TabsTrigger value="sellers" data-testid="tab-sellers">
              البائعون ({users.filter(u => u.role === "seller").length})
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              المستخدمون
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              الطلبات
            </TabsTrigger>
          </TabsList>

          {/* Pending Reviews Tab */}
          <TabsContent value="pending">
            {loading ? (
              <p className="text-center text-muted-foreground">جاري التحميل...</p>
            ) : pendingSheep.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg text-muted-foreground">
                    لا توجد قوائم قيد المراجعة
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingSheep.map(s => (
                  <Card key={s.id} className="overflow-hidden" data-testid={`card-pending-${s.id}`}>
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={s.images?.[0] || placeholderImage}
                        alt="خروف"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <Badge>{s.price.toLocaleString()} DA</Badge>
                        <Badge variant="secondary">{s.city}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {s.description}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedSheep(s)}
                          data-testid={`button-review-${s.id}`}
                        >
                          مراجعة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* All Sheep Tab */}
          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>جميع الأغنام ({sheep.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الصورة</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>المدينة</TableHead>
                      <TableHead>البائع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sheep.map(s => (
                      <TableRow key={s.id}>
                        <TableCell>
                          <img
                            src={s.images?.[0] || placeholderImage}
                            alt="خروف"
                            className="h-12 w-12 rounded object-cover"
                          />
                        </TableCell>
                        <TableCell>{s.price.toLocaleString()} DA</TableCell>
                        <TableCell>{s.city}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {s.sellerEmail || s.sellerId.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              s.status === "approved"
                                ? "bg-green-500/10 text-green-700"
                                : s.status === "pending"
                                ? "bg-yellow-500/10 text-yellow-700"
                                : "bg-red-500/10 text-red-700"
                            }
                          >
                            {s.status === "approved" ? "مقبول" : s.status === "pending" ? "قيد المراجعة" : "مرفوض"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {s.status === "approved" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSheep(s.id)}
                              disabled={reviewing}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sellers Tab */}
          <TabsContent value="sellers">
            <Card>
              <CardHeader>
                <CardTitle>البائعون - البيانات الشخصية ({users.filter(u => u.role === "seller").length})</CardTitle>
              </CardHeader>
              <CardContent>
                {users.filter(u => u.role === "seller").length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد بيانات بائعين
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">البريد الإلكتروني</TableHead>
                          <TableHead className="text-right">الاسم الكامل</TableHead>
                          <TableHead className="text-right">رقم الهاتف</TableHead>
                          <TableHead className="text-right">المدينة</TableHead>
                          <TableHead className="text-right">البلدية</TableHead>
                          <TableHead className="text-right">العنوان</TableHead>
                          <TableHead className="text-right">تاريخ التسجيل</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.filter(u => u.role === "seller").map(u => (
                          <TableRow key={u.uid}>
                            <TableCell className="font-medium">{u.email}</TableCell>
                            <TableCell>{u.fullName || "-"}</TableCell>
                            <TableCell>{u.phone || "-"}</TableCell>
                            <TableCell>{u.city || "-"}</TableCell>
                            <TableCell className="text-sm">{u.municipality || "-"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                              {u.address || "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(u.createdAt).toLocaleDateString('ar-SA')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>المستخدمون ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>رقم الجوال</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.uid}>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.phone || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString('ar-SA')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>الطلبات ({orders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المشتري</TableHead>
                      <TableHead>البائع</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map(o => (
                      <TableRow key={o.id}>
                        <TableCell className="text-sm">{o.buyerEmail || o.buyerId.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{o.sellerEmail || o.sellerId.slice(0, 8)}</TableCell>
                        <TableCell>{o.totalPrice.toLocaleString()} DA</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              o.status === "confirmed"
                                ? "bg-green-500/10 text-green-700"
                                : (!o.status || o.status === "pending")
                                ? "bg-yellow-500/10 text-yellow-700"
                                : "bg-red-500/10 text-red-700"
                            }
                          >
                            {!o.status || o.status === "pending" ? "قيد المراجعة" : o.status === "confirmed" ? "مؤكد" : "مرفوض"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          {(!o.status || o.status === "pending") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedOrder(o)}
                            >
                              مراجعة
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Review Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>مراجعة الطلب</DialogTitle>
              <DialogDescription>
                قم بمراجعة تفاصيل الطلب واتخاذ القرار بالقبول أو الرفض
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">المشتري</p>
                  <p className="font-semibold">{selectedOrder.buyerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">البائع</p>
                  <p className="font-semibold">{selectedOrder.sellerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">السعر</p>
                  <p className="font-semibold">{selectedOrder.totalPrice.toLocaleString()} DA</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">التاريخ</p>
                  <p className="font-semibold">{new Date(selectedOrder.createdAt).toLocaleDateString('ar-SA')}</p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                onClick={() => handleOrderReview(selectedOrder.id, false)}
                disabled={reviewing}
              >
                {reviewing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <XCircle className="ml-2 h-4 w-4" />}
                رفض
              </Button>
              <Button
                onClick={() => handleOrderReview(selectedOrder.id, true)}
                disabled={reviewing}
              >
                {reviewing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CheckCircle className="ml-2 h-4 w-4" />}
                قبول
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Sheep Review Dialog */}
      {selectedSheep && (
        <Dialog open={!!selectedSheep} onOpenChange={() => { setSelectedSheep(null); setRejectionReason(""); }}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>مراجعة الخروف</DialogTitle>
              <DialogDescription>
                قم بمراجعة التفاصيل واتخاذ القرار بالقبول أو الرفض
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <img
                  src={selectedSheep.images?.[0] || placeholderImage}
                  alt="خروف"
                  className="w-full aspect-square object-cover rounded-lg"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">السعر</p>
                  <p className="text-2xl font-bold">{selectedSheep.price.toLocaleString()} DA</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">العمر</p>
                    <p className="font-semibold">{selectedSheep.age} شهر</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الوزن</p>
                    <p className="font-semibold">{selectedSheep.weight} كجم</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المدينة</p>
                  <p className="font-semibold">{selectedSheep.city}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">البائع</p>
                  <p className="font-semibold">{selectedSheep.sellerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الوصف</p>
                  <p className="text-sm">{selectedSheep.description}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">إذا كنت ستقوم برفض، أضف سبب الرفض:</p>
                <textarea
                  placeholder="مثال: الصور غير واضحة، أو السعر غير مناسب، إلخ..."
                  className="w-full p-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                onClick={() => handleReview(selectedSheep.id, false, rejectionReason || "لم يتم تحديد سبب")}
                disabled={reviewing}
                data-testid="button-reject"
              >
                {reviewing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <XCircle className="ml-2 h-4 w-4" />}
                رفض
              </Button>
              <Button
                onClick={() => handleReview(selectedSheep.id, true)}
                disabled={reviewing}
                data-testid="button-approve"
              >
                {reviewing ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CheckCircle className="ml-2 h-4 w-4" />}
                قبول
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
