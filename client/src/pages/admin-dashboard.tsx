import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { collection, query, getDocs, doc, updateDoc, deleteDoc, where, orderBy, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Sheep, Order, User, VIPStatus, VIP_PACKAGES, algeriaCities } from "@shared/schema";
import { uploadMultipleImagesToImgBB } from "@/lib/imgbb";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPaymentTab from "@/components/admin-payment-tab";
import AdminAdsPage from "@/pages/admin-ads";
import {
  CheckCircle,
  XCircle,
  Package,
  Users,
  ShoppingBag,
  Clock,
  Loader2,
  Trash2,
  Crown,
  Edit2,
  CreditCard,
  Megaphone,
  Upload,
  Globe,
  X,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import placeholderImage from "@assets/generated_images/sheep_product_placeholder.png";

export default function AdminDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sheep, setSheep] = useState<Sheep[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSheep, setSelectedSheep] = useState<Sheep | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedUserVIP, setSelectedUserVIP] = useState<User | null>(null);
  const [vipExpiryDate, setVipExpiryDate] = useState("");
  const [vipStatus, setVipStatus] = useState<VIPStatus>("none");
  const [updatingVIP, setUpdatingVIP] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<User | null>(null);

  // Foreign sheep form state
  const [foreignSheepForm, setForeignSheepForm] = useState({
    price: "",
    age: "",
    weight: "",
    city: "",
    description: "",
  });
  const [foreignSheepImages, setForeignSheepImages] = useState<File[]>([]);
  const [foreignSheepImagePreviews, setForeignSheepImagePreviews] = useState<string[]>([]);
  const [addingForeignSheep, setAddingForeignSheep] = useState(false);

  // Active tab state for controlled Tabs
  const [activeTab, setActiveTab] = useState("pending");

  // Filter state for all sheep tab
  const [allSheepOriginFilter, setAllSheepOriginFilter] = useState<"all" | "local" | "foreign">("all");
  const [allSheepVIPFilter, setAllSheepVIPFilter] = useState<"all" | "vip" | "normal">("all");

  // Filter state for orders tab
  const [ordersOriginFilter, setOrdersOriginFilter] = useState<"all" | "local" | "foreign">("all");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState<"all" | "pending" | "confirmed" | "rejected">("all");

  // Filter state for users tab
  const [usersRoleFilter, setUsersRoleFilter] = useState<"all" | "seller" | "buyer" | "admin">("all");

  // Filter state for payments tab
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");

  // Handle pie chart segment click
  const handleChartSegmentClick = (chartType: string, segmentName: string) => {
    switch (chartType) {
      case "orders":
        setActiveTab("orders");
        setOrdersOriginFilter("all"); // Reset origin filter
        if (segmentName === "معلق") setOrdersStatusFilter("pending");
        else if (segmentName === "مؤكد") setOrdersStatusFilter("confirmed");
        else if (segmentName === "مرفوض") setOrdersStatusFilter("rejected");
        else setOrdersStatusFilter("all");
        break;
      case "users":
        setActiveTab("users");
        if (segmentName === "مشترين") setUsersRoleFilter("buyer");
        else if (segmentName === "بائعين") setUsersRoleFilter("seller");
        else if (segmentName === "مدراء") setUsersRoleFilter("admin");
        else setUsersRoleFilter("all");
        break;
      case "origin":
        setActiveTab("all");
        setAllSheepVIPFilter("all"); // Reset VIP filter
        if (segmentName === "محلية") setAllSheepOriginFilter("local");
        else if (segmentName === "أجنبية") setAllSheepOriginFilter("foreign");
        else setAllSheepOriginFilter("all");
        break;
      case "type":
        setActiveTab("all");
        setAllSheepOriginFilter("all"); // Reset origin filter
        if (segmentName === "أغنام VIP") setAllSheepVIPFilter("vip");
        else if (segmentName === "أغنام عادية") setAllSheepVIPFilter("normal");
        else setAllSheepVIPFilter("all");
        break;
      case "payments":
        setActiveTab("payments");
        if (segmentName === "معلق") setPaymentsStatusFilter("pending");
        else if (segmentName === "مؤكد") setPaymentsStatusFilter("verified");
        else if (segmentName === "مرفوض") setPaymentsStatusFilter("rejected");
        else setPaymentsStatusFilter("all");
        break;
    }
  };

  // Helper function to format date as Gregorian (Miladi)
  const formatGregorianDate = (date: any) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

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

    console.log("🐑 عدد الأضاحي المجلوبة:", sheepData.length);

    // عرض ملخص الأضاحي حسب البائع
    const sheepBySeller: Record<string, number> = {};
    const sheepByStatus: Record<string, number> = {};

    sheepData.forEach(s => {
      if (s.sellerId) {
        sheepBySeller[s.sellerId] = (sheepBySeller[s.sellerId] || 0) + 1;
      }
      if (s.status) {
        sheepByStatus[s.status] = (sheepByStatus[s.status] || 0) + 1;
      }
    });

    console.log("🏪 ملخص الأضاحي حسب البائع:", sheepBySeller);
    console.log("📊 ملخص الأضاحي حسب الحالة:", sheepByStatus);

    setSheep(sheepData);
  };

  const fetchOrders = async () => {
    try {
      const snapshot = await getDocs(collection(db, "orders"));
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      console.log("🔍 عدد الطلبات المجلوبة:", ordersData.length);

      // عرض ملخص الطلبات حسب المشتري والبائع
      const ordersByBuyer: Record<string, number> = {};
      const ordersBySeller: Record<string, number> = {};

      ordersData.forEach(order => {
        if (order.buyerId) {
          ordersByBuyer[order.buyerId] = (ordersByBuyer[order.buyerId] || 0) + 1;
        }
        if (order.sellerId) {
          ordersBySeller[order.sellerId] = (ordersBySeller[order.sellerId] || 0) + 1;
        }
      });

      console.log("👥 ملخص طلبات المشترين:", ordersByBuyer);
      console.log("🏪 ملخص طلبات البائعين:", ordersBySeller);

      setOrders(ordersData);
    } catch (error) {
      console.error("❌ خطأ في جلب الطلبات:", error);
    }
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

  const handleToggleVIP = async (sheepId: string, isCurrentlyVIP: boolean) => {
    setReviewing(true);
    try {
      await updateDoc(doc(db, "sheep", sheepId), {
        isVIP: !isCurrentlyVIP,
        updatedAt: Date.now(),
      });

      toast({
        title: isCurrentlyVIP ? "تم إلغاء VIP للخروف" : "تم تفعيل VIP للخروف",
        description: isCurrentlyVIP ? "تم إلغاء ميزة VIP بنجاح" : "تم تفعيل ميزة VIP بنجاح",
      });

      fetchSheep();
    } catch (error) {
      console.error("Error toggling VIP:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تفعيل/إلغاء VIP",
        variant: "destructive",
      });
    } finally {
      setReviewing(false);
    }
  };

  const pendingSheep = sheep.filter(s => s.status === "pending");

  // Filter sheep based on origin and VIP status for "All Sheep" tab
  const filteredAllSheep = sheep.filter(s => {
    // Filter by origin
    if (allSheepOriginFilter !== "all") {
      const sheepOrigin = s.origin || "local";
      if (sheepOrigin !== allSheepOriginFilter) return false;
    }
    // Filter by VIP status
    if (allSheepVIPFilter !== "all") {
      if (allSheepVIPFilter === "vip" && !s.isVIP) return false;
      if (allSheepVIPFilter === "normal" && s.isVIP) return false;
    }
    return true;
  });

  // Helper function to get sheep origin from sheepId
  const getSheepOrigin = (sheepId: string): "local" | "foreign" => {
    const foundSheep = sheep.find(s => s.id === sheepId);
    return (foundSheep?.origin || "local") as "local" | "foreign";
  };

  // Filter orders based on origin and status for "Orders" tab
  const filteredOrders = orders.filter(o => {
    // Filter by origin
    if (ordersOriginFilter !== "all") {
      const orderOrigin = getSheepOrigin(o.sheepId);
      if (orderOrigin !== ordersOriginFilter) return false;
    }
    // Filter by status
    if (ordersStatusFilter !== "all") {
      if (o.status !== ordersStatusFilter) return false;
    }
    return true;
  });

  // Count orders by origin
  const localOrdersCount = orders.filter(o => getSheepOrigin(o.sheepId) === "local").length;
  const foreignOrdersCount = orders.filter(o => getSheepOrigin(o.sheepId) === "foreign").length;

  // Filter users based on role (includes admin)
  const filteredUsers = users.filter(u => {
    if (usersRoleFilter === "all") return true;
    return u.role === usersRoleFilter;
  });

  const stats = {
    totalSheep: sheep.length,
    pendingSheep: pendingSheep.length,
    totalOrders: orders.length,
    totalUsers: users.length,
  };

  // بيانات الدوائر الإحصائية
  const ordersStatusData = [
    { name: "معلق", value: orders.filter(o => o.status === "pending").length, color: "#eab308" },
    { name: "مؤكد", value: orders.filter(o => o.status === "confirmed").length, color: "#22c55e" },
    { name: "مرفوض", value: orders.filter(o => o.status === "rejected").length, color: "#ef4444" },
  ].filter(item => item.value > 0);

  const usersRoleData = [
    { name: "مشترين", value: users.filter(u => u.role === "buyer").length, color: "#22c55e" },
    { name: "بائعين", value: users.filter(u => u.role === "seller").length, color: "#3b82f6" },
    { name: "مدراء", value: users.filter(u => u.role === "admin").length, color: "#a855f7" },
  ].filter(item => item.value > 0);

  const sheepOriginData = [
    { name: "محلية", value: sheep.filter(s => (s.origin || "local") === "local").length, color: "#3b82f6" },
    { name: "أجنبية", value: sheep.filter(s => s.origin === "foreign").length, color: "#8b5cf6" },
  ].filter(item => item.value > 0);

  const sheepTypeData = [
    { name: "أغنام عادية", value: sheep.filter(s => !s.isVIP).length, color: "#6b7280" },
    { name: "أغنام VIP", value: sheep.filter(s => s.isVIP).length, color: "#f59e0b" },
  ].filter(item => item.value > 0);

  // بيانات حالة المدفوعات
  const [allPayments, setAllPayments] = useState<any[]>([]);

  useEffect(() => {
    const fetchAllPayments = async () => {
      try {
        const paymentsSnapshot = await getDocs(collection(db, "payments"));
        const paymentsData = paymentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllPayments(paymentsData);
      } catch (error) {
        console.error("Error fetching payments:", error);
      }
    };

    fetchAllPayments();
  }, []);

  const paymentsStatusData = [
    { name: "معلق", value: allPayments.filter(p => p.status === "pending").length, color: "#eab308" },
    { name: "مؤكد", value: allPayments.filter(p => p.status === "verified" || p.status === "completed").length, color: "#22c55e" },
    { name: "مرفوض", value: allPayments.filter(p => p.status === "rejected").length, color: "#ef4444" },
  ].filter(item => item.value > 0);


  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "مدير";
      case "seller": return "بائع";
      case "buyer": return "مشتري";
      default: return role;
    }
  };

  // حساب إحصائيات المستخدم
  const getUserStats = (userId: string, userRole: string) => {
    console.log("📊 حساب إحصائيات المستخدم:", userId, "الدور:", userRole);
    console.log("📦 إجمالي الطلبات المتاحة:", orders.length);
    console.log("🐑 إجمالي الأضاحي المتاحة:", sheep.length);

    const userOrders = orders.filter(o => {
      if (userRole === "buyer") {
        return o.buyerId === userId;
      } else if (userRole === "seller") {
        return o.sellerId === userId;
      }
      return false;
    });

    const userSheep = sheep.filter(s => s.sellerId === userId);

    console.log("👤 طلبات المستخدم:", userOrders.length);
    console.log("🐏 أضاحي المستخدم:", userSheep.length);

    const stats = {
      totalOrders: userOrders.length,
      pendingOrders: userOrders.filter(o => o.status === "pending").length,
      completedOrders: userOrders.filter(o => o.status === "confirmed").length,
      totalSheep: userSheep.length,
      approvedSheep: userSheep.filter(s => s.status === "approved").length,
      pendingSheep: userSheep.filter(s => s.status === "pending").length,
      rejectedSheep: userSheep.filter(s => s.status === "rejected").length,
    };

    console.log("📈 الإحصائيات النهائية:", stats);
    return stats;
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

  const handleVIPUpdate = async () => {
    if (!selectedUserVIP) return;

    setUpdatingVIP(true);
    try {
      const updateData: any = {
        vipStatus: vipStatus,
        updatedAt: Date.now(),
      };

      if (vipStatus !== "none") {
        updateData.vipUpgradedAt = selectedUserVIP.vipUpgradedAt || Date.now();
        if (vipExpiryDate) {
          const expiryTime = new Date(vipExpiryDate).getTime();
          updateData.vipExpiresAt = expiryTime;
        }
      } else {
        updateData.vipExpiresAt = null;
      }

      await updateDoc(doc(db, "users", selectedUserVIP.uid), updateData);

      toast({
        title: "تم التحديث بنجاح",
        description: `تم تحديث حالة VIP للمستخدم ${selectedUserVIP.email}`,
      });

      setSelectedUserVIP(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating VIP:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة VIP",
        variant: "destructive",
      });
    } finally {
      setUpdatingVIP(false);
    }
  };

  // Handle foreign sheep image selection
  const handleForeignSheepImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + foreignSheepImages.length > 5) {
      toast({
        title: "خطأ",
        description: "يمكن تحميل 5 صور كحد أقصى",
        variant: "destructive",
      });
      return;
    }

    setForeignSheepImages(prev => [...prev, ...files]);

    // Create previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setForeignSheepImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove foreign sheep image
  const removeForeignSheepImage = (index: number) => {
    setForeignSheepImages(prev => prev.filter((_, i) => i !== index));
    setForeignSheepImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Add foreign sheep
  const handleAddForeignSheep = async () => {
    // Validate form
    const price = Number(foreignSheepForm.price);
    const age = Number(foreignSheepForm.age);
    const weight = Number(foreignSheepForm.weight);

    if (!price || price <= 0) {
      toast({ title: "خطأ", description: "السعر يجب أن يكون أكبر من صفر", variant: "destructive" });
      return;
    }
    if (!age || age <= 0) {
      toast({ title: "خطأ", description: "العمر يجب أن يكون أكبر من صفر", variant: "destructive" });
      return;
    }
    if (!weight || weight <= 0) {
      toast({ title: "خطأ", description: "الوزن يجب أن يكون أكبر من صفر", variant: "destructive" });
      return;
    }
    if (!foreignSheepForm.city) {
      toast({ title: "خطأ", description: "يجب اختيار الولاية", variant: "destructive" });
      return;
    }
    if (!foreignSheepForm.description || foreignSheepForm.description.length < 10) {
      toast({ title: "خطأ", description: "الوصف يجب أن يكون 10 أحرف على الأقل", variant: "destructive" });
      return;
    }
    if (foreignSheepImages.length === 0) {
      toast({ title: "خطأ", description: "يجب تحميل صورة واحدة على الأقل", variant: "destructive" });
      return;
    }

    setAddingForeignSheep(true);
    try {
      console.log("🔄 بدء رفع الصور...");
      // Upload images to ImgBB
      const imageUrls = await uploadMultipleImagesToImgBB(foreignSheepImages);
      console.log("✅ تم رفع الصور:", imageUrls);

      if (!imageUrls || imageUrls.length === 0) {
        throw new Error("فشل رفع الصور");
      }

      // Create sheep data with origin="foreign" and status="approved"
      const sheepData = {
        sellerId: user?.uid || "admin",
        sellerEmail: user?.email || "admin@aldhahia.dz",
        price,
        age,
        weight,
        city: foreignSheepForm.city,
        municipality: foreignSheepForm.city, // Use city as municipality for foreign sheep
        description: foreignSheepForm.description,
        images: imageUrls,
        status: "approved", // Foreign sheep are approved immediately
        origin: "foreign", // Mark as foreign sheep
        createdAt: Date.now(),
      };

      console.log("🔄 إضافة الأضحية إلى قاعدة البيانات...");
      await addDoc(collection(db, "sheep"), sheepData);
      console.log("✅ تمت إضافة الأضحية بنجاح");

      toast({
        title: "تم إضافة الأضحية الأجنبية بنجاح",
        description: "الأضحية متاحة الآن للمشترين",
      });

      // Reset form
      setForeignSheepForm({
        price: "",
        age: "",
        weight: "",
        city: "",
        description: "",
      });
      setForeignSheepImages([]);
      setForeignSheepImagePreviews([]);

      // Refresh sheep list
      fetchSheep();
    } catch (error: any) {
      console.error("❌ خطأ في إضافة الأضحية:", error);
      let errorMessage = "حدث خطأ أثناء إضافة الأضحية";

      if (error?.message?.includes("ImgBB")) {
        errorMessage = "فشل رفع الصور. تأكد من وجود API key صحيح";
      } else if (error?.message?.includes("permission")) {
        errorMessage = "ليس لديك صلاحية لإضافة أضاحي";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setAddingForeignSheep(false);
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

        {/* Stats Charts */}
        {isMobile ? (
          <div className="mb-8">
            <Carousel className="w-full">
              <CarouselContent>
                {/* إحصائيات المستخدمين */}
                <CarouselItem className="basis-1/2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-500" />
                        المستخدمون ({stats.totalUsers})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {usersRoleData.length > 0 ? (
                        <div className="h-[180px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={usersRoleData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={55}
                                paddingAngle={5}
                                dataKey="value"
                                onClick={(data) => handleChartSegmentClick("users", data.name)}
                                style={{ cursor: "pointer" }}
                              >
                                {usersRoleData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: "pointer" }} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend
                                verticalAlign="bottom"
                                height={30}
                                wrapperStyle={{ fontSize: '10px' }}
                                formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-8">لا توجد بيانات</p>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* إحصائيات أصل الأغنام */}
                <CarouselItem className="basis-1/2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Globe className="h-4 w-4 text-purple-500" />
                        أصل الأغنام
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sheepOriginData.length > 0 ? (
                        <div className="h-[180px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={sheepOriginData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={55}
                                paddingAngle={5}
                                dataKey="value"
                                onClick={(data) => handleChartSegmentClick("origin", data.name)}
                                style={{ cursor: "pointer" }}
                              >
                                {sheepOriginData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: "pointer" }} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend
                                verticalAlign="bottom"
                                height={30}
                                wrapperStyle={{ fontSize: '10px' }}
                                formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-8">لا توجد بيانات</p>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* إحصائيات نوع الأغنام (عادية/VIP) */}
                <CarouselItem className="basis-1/2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        نوع الأغنام
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {sheepTypeData.length > 0 ? (
                        <div className="h-[180px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={sheepTypeData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={55}
                                paddingAngle={5}
                                dataKey="value"
                                onClick={(data) => handleChartSegmentClick("type", data.name)}
                                style={{ cursor: "pointer" }}
                              >
                                {sheepTypeData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: "pointer" }} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend
                                verticalAlign="bottom"
                                height={30}
                                wrapperStyle={{ fontSize: '10px' }}
                                formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-8">لا توجد بيانات</p>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>

                {/* إحصائيات المدفوعات */}
                <CarouselItem className="basis-1/2">
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => handleChartSegmentClick("payments", "all")}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-500" />
                        المدفوعات ({allPayments.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {paymentsStatusData.length > 0 ? (
                        <div className="h-[180px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={paymentsStatusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={55}
                                paddingAngle={5}
                                dataKey="value"
                                onClick={(data) => handleChartSegmentClick("payments", data.name)}
                                style={{ cursor: "pointer" }}
                              >
                                {paymentsStatusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: "pointer" }} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend
                                verticalAlign="bottom"
                                height={30}
                                wrapperStyle={{ fontSize: '10px' }}
                                formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-8">لا توجد بيانات</p>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              </CarouselContent>
            </Carousel>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* إحصائيات المستخدمين */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-500" />
                  المستخدمون ({stats.totalUsers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {usersRoleData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={usersRoleData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          onClick={(data) => handleChartSegmentClick("users", data.name)}
                          style={{ cursor: "pointer" }}
                        >
                          {usersRoleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: "pointer" }} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
                )}
              </CardContent>
            </Card>

            {/* إحصائيات أصل الأغنام */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-500" />
                  أصل الأغنام
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sheepOriginData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sheepOriginData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          onClick={(data) => handleChartSegmentClick("origin", data.name)}
                          style={{ cursor: "pointer" }}
                        >
                          {sheepOriginData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: "pointer" }} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
                )}
              </CardContent>
            </Card>

            {/* إحصائيات نوع الأغنام (عادية/VIP) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  نوع الأغنام
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sheepTypeData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sheepTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          onClick={(data) => handleChartSegmentClick("type", data.name)}
                          style={{ cursor: "pointer" }}
                        >
                          {sheepTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: "pointer" }} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
                )}
              </CardContent>
            </Card>

            {/* إحصائيات المدفوعات */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleChartSegmentClick("payments", "all")}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                  المدفوعات ({allPayments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentsStatusData.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentsStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          onClick={(data) => handleChartSegmentClick("payments", data.name)}
                          style={{ cursor: "pointer" }}
                        >
                          {paymentsStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: "pointer" }} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value, entry: any) => `${value}: ${entry.payload.value}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">لا توجد بيانات</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-max gap-2 p-1">
              <TabsTrigger value="pending" data-testid="tab-pending">
                قيد المراجعة ({pendingSheep.length})
              </TabsTrigger>
              <TabsTrigger value="all" data-testid="tab-all">
                جميع الأغنام
              </TabsTrigger>
              <TabsTrigger value="orders" data-testid="tab-orders">
                <ShoppingBag className="h-4 w-4 ml-1" />
                الطلبات ({orders.length})
              </TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">
                المستخدمون
              </TabsTrigger>
              <TabsTrigger value="vip" data-testid="tab-vip">
                إدارة VIP ({users.filter(u => u.vipStatus && u.vipStatus !== "none").length})
              </TabsTrigger>
              <TabsTrigger value="payments" data-testid="tab-payments">
                <CreditCard className="h-4 w-4 ml-1" />
                الدفع
              </TabsTrigger>
              <TabsTrigger value="ads" data-testid="tab-ads">
                <Megaphone className="h-4 w-4 ml-1" />
                الإعلانات
              </TabsTrigger>
              <TabsTrigger value="foreign" data-testid="tab-foreign">
                <Globe className="h-4 w-4 ml-1" />
                أضاحي أجنبية
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Foreign Sheep Management Tab */}
          <TabsContent value="foreign">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  إضافة أضاحي أجنبية
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6">
                  الأضاحي الأجنبية تُضاف مباشرة وتظهر للمشترين بدون مراجعة
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <Label>صور الأضحية (حتى 5 صور)</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleForeignSheepImageChange}
                        className="hidden"
                        id="foreign-sheep-images"
                        data-testid="input-foreign-sheep-images"
                      />
                      <label
                        htmlFor="foreign-sheep-images"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          اضغط لتحميل الصور
                        </span>
                      </label>
                    </div>

                    {/* Image Previews */}
                    {foreignSheepImagePreviews.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {foreignSheepImagePreviews.map((preview, index) => (
                          <div key={index} className="relative aspect-square">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover rounded-md"
                            />
                            <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => removeForeignSheepImage(index)}
                              data-testid={`button-remove-image-${index}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="foreign-price">السعر (دج)</Label>
                        <Input
                          id="foreign-price"
                          type="number"
                          placeholder="مثال: 45000"
                          value={foreignSheepForm.price}
                          onChange={(e) => setForeignSheepForm(prev => ({ ...prev, price: e.target.value }))}
                          data-testid="input-foreign-price"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="foreign-age">العمر (شهر)</Label>
                        <Input
                          id="foreign-age"
                          type="number"
                          placeholder="مثال: 12"
                          value={foreignSheepForm.age}
                          onChange={(e) => setForeignSheepForm(prev => ({ ...prev, age: e.target.value }))}
                          data-testid="input-foreign-age"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="foreign-weight">الوزن (كجم)</Label>
                        <Input
                          id="foreign-weight"
                          type="number"
                          placeholder="مثال: 35"
                          value={foreignSheepForm.weight}
                          onChange={(e) => setForeignSheepForm(prev => ({ ...prev, weight: e.target.value }))}
                          data-testid="input-foreign-weight"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="foreign-city">الولاية</Label>
                        <Select
                          value={foreignSheepForm.city}
                          onValueChange={(value) => setForeignSheepForm(prev => ({ ...prev, city: value }))}
                        >
                          <SelectTrigger id="foreign-city" data-testid="select-foreign-city">
                            <SelectValue placeholder="اختر الولاية" />
                          </SelectTrigger>
                          <SelectContent>
                            {algeriaCities.map(city => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="foreign-description">الوصف</Label>
                      <Textarea
                        id="foreign-description"
                        placeholder="وصف الأضحية (10 أحرف على الأقل)"
                        value={foreignSheepForm.description}
                        onChange={(e) => setForeignSheepForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        data-testid="input-foreign-description"
                      />
                    </div>

                    <Button
                      onClick={handleAddForeignSheep}
                      disabled={addingForeignSheep}
                      className="w-full"
                      data-testid="button-add-foreign-sheep"
                    >
                      {addingForeignSheep ? (
                        <>
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                          جاري الإضافة...
                        </>
                      ) : (
                        <>
                          <Globe className="ml-2 h-4 w-4" />
                          إضافة أضحية أجنبية
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Management Tab */}
          <TabsContent value="payments">
            <AdminPaymentTab statusFilter={paymentsStatusFilter} />
          </TabsContent>

          {/* Ads Management Tab */}
          <TabsContent value="ads">
            <AdminAdsPage />
          </TabsContent>

          {/* VIP Management Tab */}
          <TabsContent value="vip">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  إدارة ميزة VIP
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground">جاري التحميل...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>البريد الإلكتروني</TableHead>
                          <TableHead>الاسم</TableHead>
                          <TableHead>نوع الحساب</TableHead>
                          <TableHead>حالة VIP</TableHead>
                          <TableHead>تاريخ البداية</TableHead>
                          <TableHead>تاريخ الانتهاء</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map(user => (
                          <TableRow key={user.uid}>
                            <TableCell className="font-medium">{user.email}</TableCell>
                            <TableCell>{user.fullName || "-"}</TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>
                              {user.vipStatus === "none" || !user.vipStatus ? (
                                <Badge variant="outline">عادي</Badge>
                              ) : (
                                <Badge className="bg-amber-500/10 text-amber-700">
                                  <Crown className="h-3 w-3 ml-1" />
                                  {user.vipStatus && VIP_PACKAGES[user.vipStatus as keyof typeof VIP_PACKAGES]
                                    ? VIP_PACKAGES[user.vipStatus as keyof typeof VIP_PACKAGES].nameAr
                                    : "VIP"}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {user.vipUpgradedAt ? formatGregorianDate(user.vipUpgradedAt) : "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {user.vipExpiresAt ? formatGregorianDate(user.vipExpiresAt) : "-"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUserVIP(user);
                                  setVipStatus(user.vipStatus || "none");
                                  setVipExpiryDate(user.vipExpiresAt ? new Date(user.vipExpiresAt).toISOString().split("T")[0] : "");
                                }}
                                data-testid={`button-edit-vip-${user.uid}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
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
                {/* Origin Filter Buttons */}
                <div className="flex gap-3 mb-6">
                  <Button
                    variant={allSheepOriginFilter === "all" ? "default" : "outline"}
                    onClick={() => setAllSheepOriginFilter("all")}
                    size="sm"
                    data-testid="button-all-sheep-all"
                  >
                    الكل ({sheep.length})
                  </Button>
                  <Button
                    variant={allSheepOriginFilter === "local" ? "default" : "outline"}
                    onClick={() => setAllSheepOriginFilter("local")}
                    size="sm"
                    data-testid="button-all-sheep-local"
                  >
                    أضاحي محلية ({sheep.filter(s => (s.origin || "local") === "local").length})
                  </Button>
                  <Button
                    variant={allSheepOriginFilter === "foreign" ? "default" : "outline"}
                    onClick={() => setAllSheepOriginFilter("foreign")}
                    size="sm"
                    data-testid="button-all-sheep-foreign"
                  >
                    <Globe className="ml-2 h-4 w-4" />
                    أضاحي أجنبية ({sheep.filter(s => s.origin === "foreign").length})
                  </Button>
                </div>

                {/* VIP Filter Buttons */}
                <div className="flex gap-3 mb-6">
                  <Button
                    variant={allSheepVIPFilter === "all" ? "default" : "outline"}
                    onClick={() => setAllSheepVIPFilter("all")}
                    size="sm"
                    data-testid="button-all-sheep-vip-all"
                  >
                    جميع الأنواع ({sheep.length})
                  </Button>
                  <Button
                    variant={allSheepVIPFilter === "vip" ? "default" : "outline"}
                    onClick={() => setAllSheepVIPFilter("vip")}
                    size="sm"
                    data-testid="button-all-sheep-vip-only"
                  >
                    <Crown className="ml-2 h-4 w-4 text-amber-500" />
                    أغنام VIP ({sheep.filter(s => s.isVIP).length})
                  </Button>
                  <Button
                    variant={allSheepVIPFilter === "normal" ? "default" : "outline"}
                    onClick={() => setAllSheepVIPFilter("normal")}
                    size="sm"
                    data-testid="button-all-sheep-normal-only"
                  >
                    أغنام عادية ({sheep.filter(s => !s.isVIP).length})
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الصورة</TableHead>
                      <TableHead>السعر</TableHead>
                      <TableHead>المدينة</TableHead>
                      <TableHead>البائع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>VIP</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAllSheep.map(s => (
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
                          {s.isVIP ? (
                            <Badge className="bg-amber-500 text-white">
                              <Crown className="h-3 w-3 mr-1" />
                              VIP
                            </Badge>
                          ) : (
                            <Badge variant="outline">عادي</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {s.status === "approved" && (
                              <>
                                <Button
                                  variant={s.isVIP ? "outline" : "default"}
                                  size="sm"
                                  onClick={() => handleToggleVIP(s.id, s.isVIP || false)}
                                  disabled={reviewing}
                                  className={s.isVIP ? "" : "bg-amber-500 hover:bg-amber-600"}
                                >
                                  <Crown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteSheep(s.id)}
                                  disabled={reviewing}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
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
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-blue-500" />
                  الطلبات ({orders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Origin Filter Buttons */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <Button
                    variant={ordersOriginFilter === "all" ? "default" : "outline"}
                    onClick={() => setOrdersOriginFilter("all")}
                    size="sm"
                    data-testid="button-orders-origin-all"
                  >
                    الكل ({orders.length})
                  </Button>
                  <Button
                    variant={ordersOriginFilter === "local" ? "default" : "outline"}
                    onClick={() => setOrdersOriginFilter("local")}
                    size="sm"
                    data-testid="button-orders-origin-local"
                  >
                    أضاحي محلية ({localOrdersCount})
                  </Button>
                  <Button
                    variant={ordersOriginFilter === "foreign" ? "default" : "outline"}
                    onClick={() => setOrdersOriginFilter("foreign")}
                    size="sm"
                    data-testid="button-orders-origin-foreign"
                  >
                    <Globe className="ml-2 h-4 w-4" />
                    أضاحي أجنبية ({foreignOrdersCount})
                  </Button>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <Button
                    variant={ordersStatusFilter === "all" ? "default" : "outline"}
                    onClick={() => setOrdersStatusFilter("all")}
                    size="sm"
                    data-testid="button-orders-status-all"
                  >
                    جميع الحالات ({orders.length})
                  </Button>
                  <Button
                    variant={ordersStatusFilter === "pending" ? "default" : "outline"}
                    onClick={() => setOrdersStatusFilter("pending")}
                    size="sm"
                    data-testid="button-orders-status-pending"
                  >
                    <Clock className="ml-2 h-4 w-4 text-yellow-500" />
                    معلق ({orders.filter(o => o.status === "pending").length})
                  </Button>
                  <Button
                    variant={ordersStatusFilter === "confirmed" ? "default" : "outline"}
                    onClick={() => setOrdersStatusFilter("confirmed")}
                    size="sm"
                    data-testid="button-orders-status-confirmed"
                  >
                    <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                    مؤكد ({orders.filter(o => o.status === "confirmed").length})
                  </Button>
                  <Button
                    variant={ordersStatusFilter === "rejected" ? "default" : "outline"}
                    onClick={() => setOrdersStatusFilter("rejected")}
                    size="sm"
                    data-testid="button-orders-status-rejected"
                  >
                    <XCircle className="ml-2 h-4 w-4 text-red-500" />
                    مرفوض ({orders.filter(o => o.status === "rejected").length})
                  </Button>
                </div>

                {loading ? (
                  <p className="text-center text-muted-foreground">جاري التحميل...</p>
                ) : filteredOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد طلبات</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الطلب</TableHead>
                        <TableHead>المشتري</TableHead>
                        <TableHead>البائع</TableHead>
                        <TableHead>السعر</TableHead>
                        <TableHead>الأصل</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                          <TableCell>{order.buyerEmail || order.buyerId}</TableCell>
                          <TableCell>{order.sellerEmail || order.sellerId}</TableCell>
                          <TableCell>{order.price?.toLocaleString()} DA</TableCell>
                          <TableCell>
                            {getSheepOrigin(order.sheepId) === "foreign" ? (
                              <Badge className="bg-purple-500/10 text-purple-700">
                                <Globe className="h-3 w-3 ml-1" />
                                أجنبية
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-500/10 text-blue-700">محلية</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {order.status === "pending" && (
                              <Badge className="bg-yellow-500/10 text-yellow-700">
                                <Clock className="h-3 w-3 ml-1" />
                                معلق
                              </Badge>
                            )}
                            {order.status === "confirmed" && (
                              <Badge className="bg-green-500/10 text-green-700">
                                <CheckCircle className="h-3 w-3 ml-1" />
                                مؤكد
                              </Badge>
                            )}
                            {order.status === "rejected" && (
                              <Badge className="bg-red-500/10 text-red-700">
                                <XCircle className="h-3 w-3 ml-1" />
                                مرفوض
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {order.createdAt ? formatGregorianDate(order.createdAt) : "-"}
                          </TableCell>
                          <TableCell>
                            {order.status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleOrderReview(order.id, true)}
                                  disabled={reviewing}
                                  data-testid={`button-confirm-order-${order.id}`}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleOrderReview(order.id, false)}
                                  disabled={reviewing}
                                  data-testid={`button-reject-order-${order.id}`}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                {/* Role Filter Buttons */}
                <div className="flex gap-3 mb-6">
                  <Button
                    variant={usersRoleFilter === "all" ? "default" : "outline"}
                    onClick={() => setUsersRoleFilter("all")}
                    size="sm"
                    data-testid="button-users-all"
                  >
                    الكل ({users.length})
                  </Button>
                  <Button
                    variant={usersRoleFilter === "seller" ? "default" : "outline"}
                    onClick={() => setUsersRoleFilter("seller")}
                    size="sm"
                    data-testid="button-users-sellers"
                  >
                    البائعون ({users.filter(u => u.role === "seller").length})
                  </Button>
                  <Button
                    variant={usersRoleFilter === "buyer" ? "default" : "outline"}
                    onClick={() => setUsersRoleFilter("buyer")}
                    size="sm"
                    data-testid="button-users-buyers"
                  >
                    المشترون ({users.filter(u => u.role === "buyer").length})
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead>رقم الجوال</TableHead>
                      <TableHead>تاريخ التسجيل</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => (
                      <TableRow key={u.uid} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{getRoleBadge(u.role)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.phone || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatGregorianDate(u.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUserDetails(u)}
                            data-testid={`button-view-user-${u.uid}`}
                          >
                            <Users className="h-4 w-4 ml-1" />
                            عرض التفاصيل
                          </Button>
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

      {/* User Details Dialog */}
      {selectedUserDetails && (
        <Dialog open={!!selectedUserDetails} onOpenChange={() => setSelectedUserDetails(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Users className="h-6 w-6" />
                معلومات المستخدم
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* المعلومات الشخصية */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">المعلومات الشخصية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                      <p className="font-semibold">{selectedUserDetails.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">الاسم الكامل</p>
                      <p className="font-semibold">{selectedUserDetails.fullName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                      <p className="font-semibold">{selectedUserDetails.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">نوع الحساب</p>
                      <div className="mt-1">{getRoleBadge(selectedUserDetails.role)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">المدينة</p>
                      <p className="font-semibold">{selectedUserDetails.city || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">البلدية</p>
                      <p className="font-semibold">{selectedUserDetails.municipality || "-"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">العنوان</p>
                      <p className="font-semibold">{selectedUserDetails.address || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">تاريخ التسجيل</p>
                      <p className="font-semibold">{formatGregorianDate(selectedUserDetails.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">حالة VIP</p>
                      <div className="mt-1">
                        {selectedUserDetails.vipStatus === "none" || !selectedUserDetails.vipStatus ? (
                          <Badge variant="outline">عادي</Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-700">
                            <Crown className="h-3 w-3 ml-1" />
                            {VIP_PACKAGES[selectedUserDetails.vipStatus as keyof typeof VIP_PACKAGES]?.nameAr || "VIP"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* إحصائيات الطلبات */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    إحصائيات الطلبات
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const stats = getUserStats(selectedUserDetails.uid, selectedUserDetails.role);
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="bg-muted/50 p-4 rounded-lg">
                          <p className="text-2xl font-bold text-primary">{stats.totalOrders}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedUserDetails.role === "buyer" ? "إجمالي الطلبات" : "إجمالي المبيعات"}
                          </p>
                        </div>
                        <div className="bg-yellow-500/10 p-4 rounded-lg">
                          <p className="text-2xl font-bold text-yellow-700">{stats.pendingOrders}</p>
                          <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                        </div>
                        <div className="bg-green-500/10 p-4 rounded-lg">
                          <p className="text-2xl font-bold text-green-700">{stats.completedOrders}</p>
                          <p className="text-sm text-muted-foreground">مكتملة</p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* إحصائيات الأضاحي (للبائعين فقط) */}
              {selectedUserDetails.role === "seller" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      إحصائيات الأضاحي
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const stats = getUserStats(selectedUserDetails.uid, selectedUserDetails.role);
                      return (
                        <div className="space-y-4">
                          {/* إجمالي الأضاحي */}
                          <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/20">
                            <p className="text-4xl font-bold text-primary mb-1">{stats.totalSheep}</p>
                            <p className="text-sm font-semibold text-muted-foreground">إجمالي عدد الأضاحي</p>
                          </div>

                          {/* التفاصيل */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="bg-green-500/10 p-3 rounded-lg text-center">
                              <p className="text-2xl font-bold text-green-700">{stats.approvedSheep}</p>
                              <p className="text-xs text-muted-foreground mt-1">مقبولة</p>
                            </div>
                            <div className="bg-yellow-500/10 p-3 rounded-lg text-center">
                              <p className="text-2xl font-bold text-yellow-700">{stats.pendingSheep}</p>
                              <p className="text-xs text-muted-foreground mt-1">قيد المراجعة</p>
                            </div>
                            <div className="bg-red-500/10 p-3 rounded-lg text-center">
                              <p className="text-2xl font-bold text-red-700">{stats.rejectedSheep}</p>
                              <p className="text-xs text-muted-foreground mt-1">مرفوضة</p>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedUserDetails(null)}
              >
                إغلاق
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* VIP Management Dialog */}
      {selectedUserVIP && (
        <Dialog open={!!selectedUserVIP} onOpenChange={() => setSelectedUserVIP(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>إدارة VIP للمستخدم</DialogTitle>
              <DialogDescription>
                {selectedUserVIP.email}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="block mb-2 font-semibold">حالة VIP</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(["none", "silver", "gold", "platinum"] as const).map(status => (
                    <Button
                      key={status}
                      variant={vipStatus === status ? "default" : "outline"}
                      onClick={() => setVipStatus(status)}
                      className="text-xs"
                    >
                      {status === "none"
                        ? "عادي"
                        : VIP_PACKAGES[status as keyof typeof VIP_PACKAGES]?.nameAr}
                    </Button>
                  ))}
                </div>
              </div>

              {vipStatus !== "none" && (
                <div>
                  <Label htmlFor="vip-expiry" className="block mb-2 font-semibold">
                    تاريخ انتهاء الاشتراك
                  </Label>
                  <Input
                    id="vip-expiry"
                    type="date"
                    value={vipExpiryDate}
                    onChange={(e) => setVipExpiryDate(e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    اتركه فارغاً للاشتراك المدى الطويل
                  </p>
                </div>
              )}

              {selectedUserVIP.vipUpgradedAt && (
                <div className="bg-muted p-3 rounded-lg text-sm">
                  <p className="text-muted-foreground">تاريخ الترقية:</p>
                  <p className="font-semibold">{formatGregorianDate(selectedUserVIP.vipUpgradedAt)}</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedUserVIP(null)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleVIPUpdate}
                disabled={updatingVIP}
              >
                {updatingVIP ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <CheckCircle className="ml-2 h-4 w-4" />}
                تحديث
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
                  <p className="font-semibold">{formatGregorianDate(selectedOrder.createdAt)}</p>
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