import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute, OnboardingRoute, LoginPage, RegisterPage, ProfilePage } from "@/features/auth";
import { ProductsPage } from "@/features/products";
import { SalesPage } from "@/features/sales";
import { PurchasesPage } from "@/features/purchases";
import { FinancialStatementsPage } from "@/features/financial-statements";
import { WelcomePage, CompanySetupPage } from "@/features/onboarding";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Onboarding routes */}
            <Route path="/onboarding/welcome" element={<OnboardingRoute><WelcomePage /></OnboardingRoute>} />
            <Route path="/onboarding/company-setup" element={<OnboardingRoute><CompanySetupPage /></OnboardingRoute>} />
            
            {/* Protected routes (require auth + completed onboarding) */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
            <Route path="/purchases" element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
            <Route path="/laporan-keuangan" element={<ProtectedRoute><FinancialStatementsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
