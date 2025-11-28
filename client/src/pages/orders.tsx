import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface Order {
  id: string;
  totalPrice: number;
  status: string;
  createdAt: number;
  sheepPrice?: number;
  buyerName?: string;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const q = query(collection(db, "orders"), where("buyerId", "==", user.uid));
        const snapshot = await getDocs(q);
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setOrders(ordersData.sort((a, b) => b.createdAt - a.createdAt));
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, setLocation]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "delivered": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "قيد الانتظار";
      case "confirmed": return "مؤكد";
      case "delivered": return "تم التسليم";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold mb-8">طلباتي</h1>

        {loading ? (
          <p className="text-center text-muted-foreground">جاري التحميل...</p>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-lg text-muted-foreground mb-4">لم تقم بأي طلبات حتى الآن</p>
              <Button onClick={() => setLocation("/browse")}>تصفح الأغنام</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">معرف الطلب</p>
                      <p className="font-mono text-sm">{order.id.slice(0, 12)}...</p>
                    </div>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusLabel(order.status)}
                    </Badge>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">المبلغ</p>
                      <p className="font-semibold">{order.totalPrice.toLocaleString()} DA</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">التاريخ</p>
                      <p className="font-semibold">
                        {new Date(order.createdAt).toLocaleDateString("ar-DZ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">المشتري</p>
                      <p className="font-semibold">{order.buyerName || "المشتري"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
