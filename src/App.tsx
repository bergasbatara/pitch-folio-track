import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, ProtectedRoute, OnboardingRoute, LoginPage, RegisterPage, ProfilePage } from "@/features/auth";
import { ProductsPage } from "@/features/products";
import { SalesPage } from "@/features/sales";
import { PurchasesPage } from "@/features/purchases";
import { FinancialStatementsPage, BalanceSheetPage, CashFlowPage, EquityStatementPage, COGSPage, NotesFSPage } from "@/features/financial-statements";
import { WelcomePage, CompanySetupPage } from "@/features/onboarding";
import { SubscriptionPage } from "@/features/subscription";
import { ReceivablesPage, PayablesPage } from "@/features/receivables";
import { CustomersPage } from "@/features/customers";
import { SuppliersPage } from "@/features/suppliers";
import { FixedAssetsPage } from "@/features/fixed-assets";
import { TaxesPage } from "@/features/taxes";
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
            <Route path="/pelanggan" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
            <Route path="/supplier" element={<ProtectedRoute><SuppliersPage /></ProtectedRoute>} />
            <Route path="/aset-tetap" element={<ProtectedRoute><FixedAssetsPage /></ProtectedRoute>} />
            <Route path="/pajak" element={<ProtectedRoute><TaxesPage /></ProtectedRoute>} />
            <Route path="/laporan-keuangan" element={<ProtectedRoute><FinancialStatementsPage /></ProtectedRoute>} />
            <Route path="/neraca" element={<ProtectedRoute><BalanceSheetPage /></ProtectedRoute>} />
            <Route path="/arus-kas" element={<ProtectedRoute><CashFlowPage /></ProtectedRoute>} />
            <Route path="/ekuitas" element={<ProtectedRoute><EquityStatementPage /></ProtectedRoute>} />
            <Route path="/hpp" element={<ProtectedRoute><COGSPage /></ProtectedRoute>} />
            <Route path="/catatan-keuangan" element={<ProtectedRoute><NotesFSPage /></ProtectedRoute>} />
            <Route path="/piutang" element={<ProtectedRoute><ReceivablesPage /></ProtectedRoute>} />
            <Route path="/hutang" element={<ProtectedRoute><PayablesPage /></ProtectedRoute>} />
            <Route path="/langganan" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
