import { MainLayout } from '@/components/layout/MainLayout';
import { useSales } from '@/features/sales';
import { usePurchases, usePurchaseCategories } from '@/features/purchases/hooks/usePurchases';
import { useReceivables, usePayables } from '@/features/receivables';
import { 
  CashFlowChart, 
  ReceivablesChart, 
  AccountsTable, 
  BusinessReceivablesChart,
  BusinessPayablesChart,
  OperationalCostsChart,
  ProfitLossChart,
  CashChart,
  TopSellingProducts
} from '@/features/dashboard/components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

export default function Index() {
  const { sales } = useSales();
  const { purchases } = usePurchases();
  const { categories } = usePurchaseCategories();
  const { receivables } = useReceivables();
  const { payables } = usePayables();

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Lainnya';
  };

  const salesData = sales.map(s => ({
    date: s.soldAt instanceof Date ? s.soldAt.toISOString() : new Date(s.soldAt).toISOString(),
    total: s.totalPrice,
    productName: s.productName,
    quantity: s.quantity,
  }));

  const purchasesData = purchases.map(p => ({
    date: p.date,
    total: p.totalCost,
    category: getCategoryName(p.categoryId),
  }));

  const receivablesData = receivables.map(r => ({
    date: r.dueDate,
    amount: r.amount,
    status: r.status,
  }));

  const payablesData = payables.map(p => ({
    date: p.dueDate,
    amount: p.amount,
    status: p.status,
  }));

  return (
    <MainLayout>
      <div className="page-header">
        <h1 className="page-title">Ringkasan Bisnis</h1>
      </div>

      <Tabs defaultValue="ringkasan" className="mb-6">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-4 h-auto p-0">
          <TabsTrigger 
            value="ringkasan" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3"
          >
            Ringkasan
          </TabsTrigger>
          <TabsTrigger 
            value="insight" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0 pb-3 flex items-center gap-2"
          >
            Insight
            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">Baru</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ringkasan" className="mt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <span>Baru saja diperbarui.</span>
            <button className="text-primary hover:underline flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              Perbarui ringkasan
            </button>
          </div>

          {/* Row 1: Cash Flow + Receivables Sales */}
          <div className="grid gap-6 lg:grid-cols-3 mb-6">
            <CashFlowChart sales={salesData} purchases={purchasesData} />
            <ReceivablesChart receivables={receivablesData} />
          </div>

          {/* Row 2: Accounts Table + Business Receivables + Payables */}
          <div className="grid gap-6 lg:grid-cols-3 mb-6">
            <AccountsTable sales={salesData} purchases={purchasesData} receivables={receivablesData} />
            <BusinessReceivablesChart receivables={receivablesData} />
            <BusinessPayablesChart payables={payablesData} />
          </div>

          {/* Row 3: Operational Costs + Profit/Loss */}
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <OperationalCostsChart purchases={purchasesData} />
            <ProfitLossChart sales={salesData} purchases={purchasesData} />
          </div>

          {/* Row 4: Cash + Top Products */}
          <div className="grid gap-6 lg:grid-cols-2 mb-6">
            <CashChart sales={salesData} purchases={purchasesData} />
            <TopSellingProducts sales={salesData} />
          </div>
        </TabsContent>

        <TabsContent value="insight" className="mt-6">
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">Fitur Insight Segera Hadir</p>
              <p className="text-sm">Analisis bisnis cerdas untuk membantu keputusan Anda</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
