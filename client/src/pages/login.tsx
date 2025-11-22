import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth as firebaseAuth, db } from "@/lib/firebase";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "يرجى إدخال كلمة المرور"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const auth = useAuth();
  const { signInWithGoogle, user } = auth;
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [waitingForGoogleRedirect, setWaitingForGoogleRedirect] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginData) => {
    setLoading(true);
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        firebaseAuth,
        data.email,
        data.password
      );

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      
      if (!userDoc.exists()) {
        throw new Error("User data not found");
      }

      const userData = userDoc.data();
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك ${userData.email}`,
      });

      // Redirect based on role
      if (userData.role === "admin") {
        setLocation("/admin");
      } else if (userData.role === "seller") {
        setLocation("/seller");
      } else {
        setLocation("/browse");
      }
    } catch (error: any) {
      let errorMessage = "حدث خطأ أثناء تسجيل الدخول";
      
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found") {
        errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "تم تجاوز عدد المحاولات، يرجى المحاولة لاحقاً";
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

  // Handle user redirect after successful Google sign-in
  useEffect(() => {
    if (waitingForGoogleRedirect && user) {
      // User has been set by AuthContext, now redirect
      if (user.role === "admin") {
        setLocation("/admin");
      } else if (user.role === "seller") {
        setLocation("/seller");
      } else {
        setLocation("/browse");
      }
      setWaitingForGoogleRedirect(false);
    }
  }, [waitingForGoogleRedirect, user, setLocation]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setWaitingForGoogleRedirect(true);
    
    try {
      // Call AuthContext method without role (for existing users only)
      const result = await signInWithGoogle();
      
      // Check if this is a new user (regardless of success)
      if (result.userExists === false) {
        // New user, redirect to register
        setWaitingForGoogleRedirect(false);
        toast({
          title: "حساب جديد",
          description: "يرجى إنشاء حساب أولاً واختيار نوع الحساب",
          variant: "default",
        });
        setLocation("/register");
        return;
      }
      
      if (result.success && result.userExists === true) {
        // Existing user logged in successfully
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "مرحباً بك",
        });
        
        // useEffect will handle redirect when user updates
        // (waitingForGoogleRedirect is already set to true)
      } else if (!result.success) {
        // Error occurred
        setWaitingForGoogleRedirect(false);
        toast({
          title: "خطأ",
          description: result.error || "حدث خطأ أثناء تسجيل الدخول",
          variant: "destructive",
        });
      }
    } catch (error) {
      setWaitingForGoogleRedirect(false);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">تسجيل الدخول</CardTitle>
          <CardDescription>
            سجل دخولك للوصول إلى حسابك في أضحيتي
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
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
              <Label htmlFor="password">كلمة المرور</Label>
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

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || googleLoading}
              data-testid="button-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  تسجيل الدخول
                </>
              )}
            </Button>

            {/* Separator */}
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                أو
              </span>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={loading || googleLoading}
              data-testid="button-google-signin"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <FcGoogle className="mr-2 h-5 w-5" />
                  تسجيل الدخول بحساب Google
                </>
              )}
            </Button>

            {/* Register Link */}
            <div className="text-center text-sm">
              <span className="text-muted-foreground">ليس لديك حساب؟ </span>
              <button
                type="button"
                onClick={() => setLocation("/register")}
                className="text-primary hover:underline font-medium"
                data-testid="link-register"
              >
                إنشاء حساب جديد
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
