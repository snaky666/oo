import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import LandingPage from "@/pages/landing";
import BrowseSheep from "@/pages/browse";
import SheepDetail from "@/pages/sheep-detail";
import SellerDashboard from "@/pages/seller-dashboard";
import SellerProfile from "@/pages/seller-profile";
import AdminDashboard from "@/pages/admin-dashboard";
import ContactPage from "@/pages/contact";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicRoute from "@/components/PublicRoute";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>
      <Route path="/login">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>
      <Route path="/landing" component={LandingPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/register">
        <PublicRoute>
          <Register />
        </PublicRoute>
      </Route>
      
      {/* Buyer routes */}
      <Route path="/browse">
        <ProtectedRoute allowedRoles={["buyer", "admin", "seller"]} allowGuest={true}>
          <BrowseSheep />
        </ProtectedRoute>
      </Route>
      <Route path="/sheep/:id">
        <ProtectedRoute allowedRoles={["buyer", "admin", "seller"]} allowGuest={true}>
          <SheepDetail />
        </ProtectedRoute>
      </Route>
      
      {/* Seller routes */}
      <Route path="/seller">
        <ProtectedRoute allowedRoles={["seller"]}>
          <SellerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/seller/profile">
        <ProtectedRoute allowedRoles={["seller"]}>
          <SellerProfile />
        </ProtectedRoute>
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin">
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
