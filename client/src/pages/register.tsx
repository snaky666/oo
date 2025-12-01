import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser, userRoles } from "@shared/schema";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, ShoppingCart, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import loginBgGif from "@assets/images/login-bg.gif";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"buyer" | "seller" | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
  });

  const onSubmit = async (data: InsertUser) => {
    if (!selectedRole) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار نوع الحساب",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Generate verification token
      const verificationToken = Math.random().toString(36).substring(2, 15);
      const tokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      // Create user document in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: data.email,
        role: selectedRole,
        phone: data.phone || "",
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiry: tokenExpiry,
        createdAt: Date.now(),
      });

      // Send verification email
      await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          token: verificationToken,
        }),
      });

      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: "تحقق من بريدك الإلكتروني لتفعيل الحساب",
      });

      // Redirect to login page
      setLocation("/login");
    } catch (error: any) {
      let errorMessage = "حدث خطأ أثناء إنشاء الحساب";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "البريد الإلكتروني مستخدم بالفعل";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "البريد الإلكتروني غير صالح";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "كلمة المرور ضعيفة جداً";
      }

      toast({
        title: "خطأ",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div 
      className="min-h-screen w-full flex flex-col"
      style={{
        backgroundImage: `url('${loginBgGif}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold">إنشاء حساب جديد</CardTitle>
            <CardDescription>
              انضم إلى أضحيتي وابدأ في بيع أو شراء الأغنام
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">نوع الحساب *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole("buyer");
                      setValue("role", "buyer");
                    }}
                    data-testid="button-role-buyer"
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-md border-2 transition-all hover-elevate",
                      selectedRole === "buyer"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                    )}
                  >
                    <ShoppingCart className="h-8 w-8 mb-2 text-primary" />
                    <span className="font-semibold">مشتري</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      أريد شراء أغنام
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRole("seller");
                      setValue("role", "seller");
                    }}
                    data-testid="button-role-seller"
                    className={cn(
                      "flex flex-col items-center justify-center p-6 rounded-md border-2 transition-all hover-elevate",
                      selectedRole === "seller"
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card"
                    )}
                  >
                    <Store className="h-8 w-8 mb-2 text-primary" />
                    <span className="font-semibold">بائع</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      أريد بيع أغنام
                    </span>
                  </button>
                </div>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@domain.com"
                  data-testid="input-email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  data-testid="input-password"
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Phone (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الجوال (اختياري)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="05xxxxxxxx"
                  data-testid="input-phone"
                  dir="ltr"
                  {...register("phone")}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                data-testid="button-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري إنشاء الحساب...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    إنشاء حساب
                  </>
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">لديك حساب بالفعل؟ </span>
                <button
                  type="button"
                  onClick={() => setLocation("/login")}
                  className="text-primary hover:underline font-medium"
                  data-testid="link-login"
                >
                  تسجيل الدخول
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
