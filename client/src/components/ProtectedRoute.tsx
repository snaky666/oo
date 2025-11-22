import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        setLocation("/login");
      } else if (user && allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect based on user role
        if (user.role === "admin") {
          setLocation("/admin");
        } else if (user.role === "seller") {
          setLocation("/seller");
        } else {
          setLocation("/browse");
        }
      }
    }
  }, [user, loading, requireAuth, allowedRoles, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
