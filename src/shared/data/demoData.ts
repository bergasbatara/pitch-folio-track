import { subDays, subMonths, format } from 'date-fns';
import { Sale } from '@/features/sales/types';
import { Purchase, PurchaseCategory } from '@/features/purchases/types';
import { Receivable, Payable } from '@/features/receivables/types';
import { Product } from '@/features/products/types';

// Products
export const DEMO_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Kopi Arabika Premium', price: 45000, stock: 150, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p2', name: 'Teh Hijau Organik', price: 35000, stock: 200, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p3', name: 'Gula Aren Murni', price: 28000, stock: 300, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p4', name: 'Madu Hutan Asli', price: 85000, stock: 75, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p5', name: 'Minyak Kelapa VCO', price: 65000, stock: 100, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p6', name: 'Beras Merah Organik', price: 32000, stock: 250, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p7', name: 'Kacang Mete Panggang', price: 55000, stock: 120, createdAt: new Date(), updatedAt: new Date() },
  { id: 'p8', name: 'Keripik Singkong', price: 18000, stock: 400, createdAt: new Date(), updatedAt: new Date() },
];

// Generate sales for the past 6 months
export const generateDemoSales = (): Sale[] => {
  const sales: Sale[] = [];
  const now = new Date();
  
  for (let i = 0; i < 180; i++) {
    const daysAgo = Math.floor(Math.random() * 180);
    const product = DEMO_PRODUCTS[Math.floor(Math.random() * DEMO_PRODUCTS.length)];
    const quantity = Math.floor(Math.random() * 10) + 1;
    
    sales.push({
      id: `sale-${i}`,
      productId: product.id,
      productName: product.name,
      quantity,
      pricePerUnit: product.price,
      totalPrice: quantity * product.price,
      soldAt: subDays(now, daysAgo),
    });
  }
  
  return sales.sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());
};

// Purchase categories
export const DEMO_CATEGORIES: PurchaseCategory[] = [
  { id: 'cat1', name: 'Bahan Baku', createdAt: new Date().toISOString() },
  { id: 'cat2', name: 'Kemasan', createdAt: new Date().toISOString() },
  { id: 'cat3', name: 'Peralatan', createdAt: new Date().toISOString() },
  { id: 'cat4', name: 'Transportasi', createdAt: new Date().toISOString() },
  { id: 'cat5', name: 'Utilitas', createdAt: new Date().toISOString() },
  { id: 'cat6', name: 'Marketing', createdAt: new Date().toISOString() },
];

// Generate purchases for the past 6 months
export const generateDemoPurchases = (): Purchase[] => {
  const purchases: Purchase[] = [];
  const now = new Date();
  
  const items = [
    { name: 'Biji Kopi Mentah', categoryId: 'cat1', unitCost: 120000, supplier: 'PT Kopi Nusantara' },
    { name: 'Daun Teh Kering', categoryId: 'cat1', unitCost: 85000, supplier: 'CV Teh Hijau' },
    { name: 'Gula Aren', categoryId: 'cat1', unitCost: 45000, supplier: 'UD Gula Manis' },
    { name: 'Kardus Packaging', categoryId: 'cat2', unitCost: 5000, supplier: 'PT Karton Jaya' },
    { name: 'Plastik Vacuum', categoryId: 'cat2', unitCost: 3500, supplier: 'CV Plastik Indah' },
    { name: 'Label Stiker', categoryId: 'cat2', unitCost: 1500, supplier: 'Percetakan Mandiri' },
    { name: 'Mesin Roasting', categoryId: 'cat3', unitCost: 15000000, supplier: 'PT Mesin Indo' },
    { name: 'Timbangan Digital', categoryId: 'cat3', unitCost: 850000, supplier: 'Toko Alat Ukur' },
    { name: 'Bensin Operasional', categoryId: 'cat4', unitCost: 500000, supplier: 'SPBU Pertamina' },
    { name: 'Listrik Bulanan', categoryId: 'cat5', unitCost: 2500000, supplier: 'PLN' },
    { name: 'Internet & Telepon', categoryId: 'cat5', unitCost: 500000, supplier: 'Telkom' },
    { name: 'Iklan Facebook', categoryId: 'cat6', unitCost: 1500000, supplier: 'Meta Ads' },
    { name: 'Brosur & Flyer', categoryId: 'cat6', unitCost: 750000, supplier: 'Percetakan Mandiri' },
  ];
  
  for (let i = 0; i < 80; i++) {
    const daysAgo = Math.floor(Math.random() * 180);
    const item = items[Math.floor(Math.random() * items.length)];
    const quantity = item.categoryId === 'cat3' ? 1 : Math.floor(Math.random() * 20) + 1;
    
    purchases.push({
      id: `purchase-${i}`,
      date: format(subDays(now, daysAgo), 'yyyy-MM-dd'),
      categoryId: item.categoryId,
      itemName: item.name,
      supplier: item.supplier,
      quantity,
      unitCost: item.unitCost,
      totalCost: quantity * item.unitCost,
      createdAt: subDays(now, daysAgo).toISOString(),
    });
  }
  
  return purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Generate receivables
export const generateDemoReceivables = (): Receivable[] => {
  const customers = [
    'Toko Serba Ada',
    'Minimarket Sejahtera',
    'CV Maju Bersama',
    'PT Retail Indonesia',
    'UD Berkah Jaya',
    'Supermarket Prima',
    'Warung Bu Siti',
    'Koperasi Makmur',
  ];
  
  const receivables: Receivable[] = [];
  const now = new Date();
  
  for (let i = 0; i < 25; i++) {
    const daysAgo = Math.floor(Math.random() * 120);
    const dueDaysFromNow = Math.floor(Math.random() * 60) - 30;
    const amount = (Math.floor(Math.random() * 50) + 5) * 100000;
    const paidAmount = Math.random() > 0.4 ? Math.floor(amount * Math.random()) : 0;
    
    receivables.push({
      id: `recv-${i}`,
      customerName: customers[Math.floor(Math.random() * customers.length)],
      description: `Penjualan barang - Invoice #INV${String(1000 + i).padStart(4, '0')}`,
      amount,
      dueDate: format(subDays(now, -dueDaysFromNow), 'yyyy-MM-dd'),
      status: paidAmount >= amount ? 'paid' : paidAmount > 0 ? 'partial' : dueDaysFromNow < 0 ? 'overdue' : 'pending',
      paidAmount,
      createdAt: subDays(now, daysAgo).toISOString(),
      updatedAt: subDays(now, daysAgo).toISOString(),
    });
  }
  
  return receivables;
};

// Generate payables
export const generateDemoPayables = (): Payable[] => {
  const suppliers = [
    'PT Kopi Nusantara',
    'CV Teh Hijau',
    'UD Gula Manis',
    'PT Karton Jaya',
    'CV Plastik Indah',
    'Percetakan Mandiri',
    'PT Mesin Indo',
    'PLN',
  ];
  
  const payables: Payable[] = [];
  const now = new Date();
  
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 120);
    const dueDaysFromNow = Math.floor(Math.random() * 60) - 30;
    const amount = (Math.floor(Math.random() * 30) + 5) * 100000;
    const paidAmount = Math.random() > 0.5 ? Math.floor(amount * Math.random()) : 0;
    
    payables.push({
      id: `pay-${i}`,
      supplierName: suppliers[Math.floor(Math.random() * suppliers.length)],
      description: `Pembelian barang - PO #PO${String(2000 + i).padStart(4, '0')}`,
      amount,
      dueDate: format(subDays(now, -dueDaysFromNow), 'yyyy-MM-dd'),
      status: paidAmount >= amount ? 'paid' : paidAmount > 0 ? 'partial' : dueDaysFromNow < 0 ? 'overdue' : 'pending',
      paidAmount,
      createdAt: subDays(now, daysAgo).toISOString(),
      updatedAt: subDays(now, daysAgo).toISOString(),
    });
  }
  
  return payables;
};
