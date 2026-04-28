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
import { SubscriptionPage, PaymentPage, PlanGate } from "@/features/subscription";
import { ReceivablesPage, PayablesPage } from "@/features/receivables";
import { CustomersPage } from "@/features/customers";
import { SuppliersPage } from "@/features/suppliers";
import { FixedAssetsPage } from "@/features/fixed-assets";
import { TaxesPage } from "@/features/taxes";
import { AccountsPage } from "@/features/accounts";
import { JournalsPage } from "@/features/journals";
import { OpeningBalancesPage } from "@/features/opening-balances";
import {
  AuditDraftPage,
  FinancialRatiosPage,
  TrendAnalysisPage,
  AdvancedAnalysisPage,
  FinancialModelingPage,
  PriorityConsultingPage,
} from "@/features/premium-features";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SecurityCheck from "./pages/SecurityCheck";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

// Helper: gated protected route
const Gated = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <PlanGate>{children}</PlanGate>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ErrorBoundary>
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

            {/* Always-available authed routes */}
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/langganan" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
            <Route path="/pembayaran" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SecurityCheck /></ProtectedRoute>} />

            {/* Business-tier routes */}
            <Route path="/sales" element={<Gated><SalesPage /></Gated>} />
            <Route path="/purchases" element={<Gated><PurchasesPage /></Gated>} />
            <Route path="/products" element={<Gated><ProductsPage /></Gated>} />
            <Route path="/pelanggan" element={<Gated><CustomersPage /></Gated>} />
            <Route path="/supplier" element={<Gated><SuppliersPage /></Gated>} />
            <Route path="/aset-tetap" element={<Gated><FixedAssetsPage /></Gated>} />
            <Route path="/pajak" element={<Gated><TaxesPage /></Gated>} />
            <Route path="/laba-rugi" element={<Gated><FinancialStatementsPage /></Gated>} />
            <Route path="/neraca" element={<Gated><BalanceSheetPage /></Gated>} />
            <Route path="/arus-kas" element={<Gated><CashFlowPage /></Gated>} />
            <Route path="/ekuitas" element={<Gated><EquityStatementPage /></Gated>} />
            <Route path="/hpp" element={<Gated><COGSPage /></Gated>} />
            <Route path="/catatan-keuangan" element={<Gated><NotesFSPage /></Gated>} />
            <Route path="/piutang" element={<Gated><ReceivablesPage /></Gated>} />
            <Route path="/hutang" element={<Gated><PayablesPage /></Gated>} />
            <Route path="/akun" element={<Gated><AccountsPage /></Gated>} />
            <Route path="/jurnal" element={<Gated><JournalsPage /></Gated>} />
            <Route path="/liabilitas-ekuitas" element={<Gated><OpeningBalancesPage /></Gated>} />

            {/* Professional-tier routes */}
            <Route path="/audit-draft" element={<Gated><AuditDraftPage /></Gated>} />
            <Route path="/rasio-keuangan" element={<Gated><FinancialRatiosPage /></Gated>} />
            <Route path="/analisis-tren" element={<Gated><TrendAnalysisPage /></Gated>} />

            {/* Premium-tier routes */}
            <Route path="/analisis-lanjutan" element={<Gated><AdvancedAnalysisPage /></Gated>} />
            <Route path="/modeling-proyeksi" element={<Gated><FinancialModelingPage /></Gated>} />
            <Route path="/konsultasi" element={<Gated><PriorityConsultingPage /></Gated>} />

            <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
