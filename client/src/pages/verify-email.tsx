import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const email = params.get("email");

        if (!token || !email) {
          setVerified(false);
          toast({
            title: "خطأ",
            description: "بيانات التحقق مفقودة",
            variant: "destructive",
          });
          return;
        }

        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });

        if (response.ok) {
          setVerified(true);
          toast({
            title: "تم التحقق بنجاح",
            description: "تم التحقق من بريدك الإلكتروني بنجاح",
          });
          setTimeout(() => setLocation("/login"), 3000);
        } else {
          setVerified(false);
          const error = await response.json();
          toast({
            title: "خطأ",
            description: error.error || "فشل التحقق من البريد",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        setVerified(false);
        toast({
          title: "خطأ",
          description: error.message || "حدث خطأ أثناء التحقق",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [setLocation, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">التحقق من البريد</CardTitle>
          <CardDescription>
            جاري التحقق من بريدك الإلكتروني
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {loading ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-center text-muted-foreground">جاري التحقق...</p>
            </>
          ) : verified ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div className="text-center">
                <p className="font-semibold text-green-700">تم التحقق بنجاح!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  سيتم توجيهك لصفحة تسجيل الدخول خلال قليل...
                </p>
              </div>
              <Button onClick={() => setLocation("/login")} className="w-full">
                الذهاب لتسجيل الدخول
              </Button>
            </>
          ) : (
            <>
              <XCircle className="h-12 w-12 text-red-500" />
              <div className="text-center">
                <p className="font-semibold text-red-700">فشل التحقق</p>
                <p className="text-sm text-muted-foreground mt-2">
                  تحقق من الرابط أو طلب بريد تحقق جديد
                </p>
              </div>
              <Button onClick={() => setLocation("/register")} className="w-full">
                العودة للتسجيل
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
