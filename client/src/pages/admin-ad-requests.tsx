
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdRequest } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, Clock, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminAdRequestsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<AdRequest | null>(null);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: adRequests = [], isLoading } = useQuery({
    queryKey: ["/api/ad-requests"],
    queryFn: async () => {
      const response = await fetch("/api/ad-requests");
      return response.json() as Promise<AdRequest[]>;
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async ({ requestId, durationDays }: { requestId: string; durationDays: number }) => {
      // تحديث حالة الطلب
      await fetch(`/api/ad-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "approved",
          durationDays,
          reviewedBy: user?.uid,
        }),
      });

      // إنشاء الإعلان
      const request = adRequests.find(r => r.id === requestId);
      if (!request) throw new Error("Request not found");

      const response = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: request.image,
          companyName: request.companyName,
          link: request.link,
          description: request.description,
          durationDays,
        }),
      });

      if (!response.ok) throw new Error("Failed to create ad");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم قبول الطلب وإنشاء الإعلان بنجاح" });
      queryClient.invalidateQueries({ queryKey: ["/api/ad-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      setDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل قبول الطلب", variant: "destructive" });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const response = await fetch(`/api/ad-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "rejected",
          rejectionReason: reason,
          reviewedBy: user?.uid,
        }),
      });
      if (!response.ok) throw new Error("Failed to reject request");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "تم رفض الطلب" });
      queryClient.invalidateQueries({ queryKey: ["/api/ad-requests"] });
      setDialogOpen(false);
      setSelectedRequest(null);
    },
    onError: () => {
      toast({ title: "خطأ", description: "فشل رفض الطلب", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 ml-1" />قيد المراجعة</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 ml-1" />مقبول</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 ml-1" />مرفوض</Badge>;
      default:
        return null;
    }
  };

  const pendingRequests = adRequests.filter(r => r.status === "pending");
  const reviewedRequests = adRequests.filter(r => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">طلبات الإعلانات</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingRequests.length}</p>
                <p className="text-sm text-muted-foreground">قيد المراجعة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{adRequests.filter(r => r.status === "approved").length}</p>
                <p className="text-sm text-muted-foreground">مقبول</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{adRequests.filter(r => r.status === "rejected").length}</p>
                <p className="text-sm text-muted-foreground">مرفوض</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            جاري التحميل...
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">طلبات قيد المراجعة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4 space-y-3">
                      <img
                        src={request.image}
                        alt="إعلان"
                        className="w-full h-40 object-cover rounded-md"
                      />
                      <div>
                        <p className="font-bold text-lg">{request.companyName}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                      </div>
                      {getStatusBadge(request.status)}
                      <div className="text-sm space-y-1">
                        <p><strong>الهاتف:</strong> {request.contactPhone}</p>
                        {request.contactEmail && <p><strong>البريد:</strong> {request.contactEmail}</p>}
                        <p className="text-xs text-muted-foreground">
                          تاريخ الطلب: {new Date(request.createdAt).toLocaleDateString("ar-DZ")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 ml-2" />
                          مراجعة
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Reviewed Requests */}
          {reviewedRequests.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">طلبات تمت مراجعتها</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviewedRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4 space-y-3">
                      <img
                        src={request.image}
                        alt="إعلان"
                        className="w-full h-40 object-cover rounded-md"
                      />
                      <div>
                        <p className="font-bold text-lg">{request.companyName}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                      </div>
                      {getStatusBadge(request.status)}
                      {request.status === "approved" && request.durationDays && (
                        <p className="text-sm"><strong>المدة:</strong> {request.durationDays} يوم</p>
                      )}
                      {request.status === "rejected" && request.rejectionReason && (
                        <p className="text-sm text-red-600"><strong>سبب الرفض:</strong> {request.rejectionReason}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>مراجعة طلب الإعلان</DialogTitle>
            <DialogDescription>
              راجع تفاصيل الطلب وقرر قبوله أو رفضه
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <img
                src={selectedRequest.image}
                alt="إعلان"
                className="w-full h-48 object-cover rounded-md"
              />
              
              <div className="space-y-2">
                <div>
                  <Label>اسم الشركة</Label>
                  <p className="text-sm">{selectedRequest.companyName}</p>
                </div>
                
                <div>
                  <Label>الوصف</Label>
                  <p className="text-sm">{selectedRequest.description}</p>
                </div>

                {selectedRequest.link && (
                  <div>
                    <Label>الرابط</Label>
                    <p className="text-sm">{selectedRequest.link}</p>
                  </div>
                )}

                <div>
                  <Label>رقم الهاتف</Label>
                  <p className="text-sm">{selectedRequest.contactPhone}</p>
                </div>

                {selectedRequest.contactEmail && (
                  <div>
                    <Label>البريد الإلكتروني</Label>
                    <p className="text-sm">{selectedRequest.contactEmail}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t pt-4">
                <div>
                  <Label htmlFor="duration">مدة الإعلان (بالأيام)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value))}
                    min={1}
                  />
                </div>

                <div>
                  <Label htmlFor="rejection">سبب الرفض (إذا تم الرفض)</Label>
                  <Textarea
                    id="rejection"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="اكتب سبب رفض الإعلان..."
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => approveRequestMutation.mutate({
                      requestId: selectedRequest.id,
                      durationDays,
                    })}
                    disabled={approveRequestMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {approveRequestMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <CheckCircle className="h-4 w-4 ml-2" />
                    )}
                    قبول
                  </Button>
                  <Button
                    onClick={() => rejectRequestMutation.mutate({
                      requestId: selectedRequest.id,
                      reason: rejectionReason,
                    })}
                    disabled={rejectRequestMutation.isPending || !rejectionReason}
                    variant="destructive"
                    className="flex-1"
                  >
                    {rejectRequestMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <XCircle className="h-4 w-4 ml-2" />
                    )}
                    رفض
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
