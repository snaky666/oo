import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { Link, useLocation } from "wouter";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Header() {
  const { user, signOut } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setLocation("/");
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === "admin") return "/admin";
    if (user.role === "seller") return "/seller";
    return "/browse";
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "مدير";
      case "seller": return "بائع";
      case "buyer": return "مشتري";
      default: return role;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover-elevate px-2 py-1 rounded-md" data-testid="link-home">
            <img 
              src="/logo.png" 
              alt="أضحيتي" 
              className="h-14 md:h-16 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {/* الرئيسية */}
            <Link href="/" className={cn("rounded-md hover-elevate", isActive("/") && "bg-accent/10")}>
              <Button 
                variant="ghost" 
                data-testid="link-home-nav"
                className={cn(isActive("/") && "text-primary font-semibold")}
              >
                الرئيسية
              </Button>
            </Link>

            {/* الأضاحي */}
            <Link href="/browse" className={cn("rounded-md hover-elevate", isActive("/browse") && "bg-accent/10")}>
              <Button 
                variant="ghost" 
                data-testid="link-sheep"
                className={cn(isActive("/browse") && "text-primary font-semibold")}
              >
                الأضاحي
              </Button>
            </Link>

            {/* لوحة تحكم البائع - فقط للبائعين */}
            {user?.role === "seller" && (
              <Link href="/seller" className={cn("rounded-md hover-elevate", isActive("/seller") && "bg-accent/10")}>
                <Button 
                  variant="ghost" 
                  data-testid="link-seller-dashboard"
                  className={cn(isActive("/seller") && "text-primary font-semibold")}
                >
                  لوحة تحكم البائع
                </Button>
              </Link>
            )}

            {/* لوحة تحكم الإدارة - فقط للمسؤول */}
            {user?.role === "admin" && (
              <Link href="/admin" className={cn("rounded-md hover-elevate", isActive("/admin") && "bg-accent/10")}>
                <Button 
                  variant="ghost" 
                  data-testid="link-admin-dashboard"
                  className={cn(isActive("/admin") && "text-primary font-semibold")}
                >
                  لوحة تحكم الإدارة
                </Button>
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {getRoleLabel(user.role)}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} data-testid="button-signout">
                    <LogOut className="ml-2 h-4 w-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="hidden sm:block" data-testid="link-login">
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link href="/register">
                  <Button data-testid="link-register">
                    إنشاء حساب
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-2">
            {/* الرئيسية */}
            <Link href="/">
              <Button
                variant="ghost"
                className={cn("w-full justify-start", isActive("/") && "bg-accent/10 text-primary font-semibold")}
                onClick={() => setMobileMenuOpen(false)}
              >
                الرئيسية
              </Button>
            </Link>

            {/* الأضاحي */}
            <Link href="/browse">
              <Button
                variant="ghost"
                className={cn("w-full justify-start", isActive("/browse") && "bg-accent/10 text-primary font-semibold")}
                onClick={() => setMobileMenuOpen(false)}
              >
                الأضاحي
              </Button>
            </Link>

            {/* لوحة تحكم البائع - فقط للبائعين */}
            {user?.role === "seller" && (
              <Link href="/seller">
                <Button
                  variant="ghost"
                  className={cn("w-full justify-start", isActive("/seller") && "bg-accent/10 text-primary font-semibold")}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  لوحة تحكم البائع
                </Button>
              </Link>
            )}

            {/* لوحة تحكم الإدارة - فقط للمسؤول */}
            {user?.role === "admin" && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className={cn("w-full justify-start", isActive("/admin") && "bg-accent/10 text-primary font-semibold")}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  لوحة تحكم الإدارة
                </Button>
              </Link>
            )}

            {/* تسجيل الدخول - فقط إذا لم يكن مسجل دخول */}
            {!user && (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    تسجيل الدخول
                  </Button>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
