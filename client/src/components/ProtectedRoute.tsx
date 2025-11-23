import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
  allowGuest?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireAuth = true,
  allowGuest = false 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  const [, setLocation] = useLocation();
  const isGuest = localStorage.getItem("guestMode") === "true";

  useEffect(() => {
    if (!loading) {
      // السماح للزائرين بدخول صفحة browse و sheep-detail إذا كانت الخاصية allowGuest مفعلة
      const canAccessAsGuest = allowGuest && isGuest;

      if (requireAuth && !user && !canAccessAsGuest) {
        // إذا لم يكن مسجل دخول وليس زائر، وحاول الوصول إلى صفحة محمية، أعده إلى login
        setLocation("/login");
      } else if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        // إذا كان لديه role لكنه لا يملك وصول، أعده إلى dashboard حسب الدور الخاص به
        if (user.role === "admin") {
          setLocation("/admin");
        } else if (user.role === "seller") {
          setLocation("/seller");
        } else {
          setLocation("/browse");
        }
      }
    }
  }, [user, loading, requireAuth, allowedRoles, setLocation, isGuest, allowGuest]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // السماح للزائرين بالوصول إلى browse و sheep detail إذا كانت allowGuest مفعلة
  const canAccessAsGuest = allowGuest && isGuest;

  if (requireAuth && !user && !canAccessAsGuest) {
    return null;
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
