import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { Link, useLocation } from "wouter";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Header() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const isGuest = typeof window !== 'undefined' && localStorage.getItem("guestMode") === "true";

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/landing" className="flex items-center gap-2 px-2 py-1 rounded-md">
            <img 
              src="/logo.png" 
              alt="أضحيتي" 
              className="h-14 md:h-16 w-auto object-contain animate-bounce hover:animate-spin transition-all duration-300 cursor-pointer drop-shadow-lg hover:drop-shadow-2xl"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 mr-auto ml-8">
            <Link href="/landing">
              <Button
                variant={isActive("/landing") ? "default" : "ghost"}
                size="sm"
              >
                الرئيسية
              </Button>
            </Link>
            <Link href="/browse">
              <Button
                variant={isActive("/browse") ? "default" : "ghost"}
                size="sm"
              >
                الأضاحي
              </Button>
            </Link>
            {user && (user.role === "buyer" || user.role === "seller") && (
              <Link href="/orders">
                <Button
                  variant={isActive("/orders") ? "default" : "ghost"}
                  size="sm"
                >
                  طلباتي
                </Button>
              </Link>
            )}
            {user?.role === "seller" && (
              <Link href="/seller">
                <Button
                  variant={isActive("/seller") ? "default" : "ghost"}
                  size="sm"
                >
                  لوحتي
                </Button>
              </Link>
            )}
            {user?.role === "admin" && (
              <Link href="/admin">
                <Button
                  variant={isActive("/admin") ? "default" : "ghost"}
                  size="sm"
                >
                  الإدارة
                </Button>
              </Link>
            )}
            <Link href="/contact">
              <Button
                variant={isActive("/contact") ? "default" : "ghost"}
                size="sm"
              >
                تواصل
              </Button>
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            
            {/* VIP Button */}
            {user && (user.role === "buyer" || user.role === "seller") && (
              <Link href="/vip-packages">
                <Button
                  variant={isActive("/vip-packages") || isActive("/vip-upgrade") ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "gap-2 transition-all duration-300",
                    (isActive("/vip-packages") || isActive("/vip-upgrade")) && "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white"
                  )}
                >
                  <Crown className="h-5 w-5" />
                  <span className="hidden sm:inline">VIP</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
