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
import AdminDashboard from "@/pages/admin-dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Buyer routes */}
      <Route path="/browse">
        <ProtectedRoute allowedRoles={["buyer", "admin"]}>
          <BrowseSheep />
        </ProtectedRoute>
      </Route>
      <Route path="/sheep/:id">
        <ProtectedRoute allowedRoles={["buyer", "admin"]}>
          <SheepDetail />
        </ProtectedRoute>
      </Route>
      
      {/* Seller routes */}
      <Route path="/seller">
        <ProtectedRoute allowedRoles={["seller"]}>
          <SellerDashboard />
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
