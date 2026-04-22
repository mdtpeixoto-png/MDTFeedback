import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import LoginPage from "./pages/LoginPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import AdminDashboard from "./pages/AdminDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import DevDashboard from "./pages/DevDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  // Simplified: Default to 'seller' if no role is assigned
  const userRole = user.role || "seller";

  // Build a compatible User object for legacy dashboard components
  const legacyUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: userRole as "developer" | "admin" | "seller",
    avatar: user.avatar,
  };

  const handleLogout = async () => {
    const { signOut } = await import("@/contexts/AuthContext").then(m => {
      // This is a workaround; we use the hook inside the component tree
      return { signOut: () => {} };
    });
  };

  return <AuthenticatedRoutes legacyUser={legacyUser} />;
}

function AuthenticatedRoutes({ legacyUser }: { legacyUser: { id: string; name: string; email: string; role: "developer" | "admin" | "seller"; avatar?: string } }) {
  const { signOut } = useAuth();
  const role = legacyUser.role;

  const homePath = role === "developer" ? "/dev" : role === "admin" ? "/admin" : "/seller";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homePath} />} />
      <Route path="/admin/*" element={role === "admin" ? <AdminDashboard user={legacyUser} onLogout={signOut} /> : <Navigate to="/" />} />
      <Route path="/seller/*" element={role === "seller" ? <SellerDashboard user={legacyUser} onLogout={signOut} /> : <Navigate to="/" />} />
      <Route path="/dev/*" element={role === "developer" ? <DevDashboard user={legacyUser} onLogout={signOut} /> : <Navigate to="/" />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
