export interface PurchaseCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  date: string;
  categoryId: string;
  categoryName?: string;
  productId?: string | null;
  productName?: string | null;
  itemName: string;
  supplier?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes?: string;
  createdAt: string;
}

export interface PurchaseFormData {
  date: string;
  categoryId: string;
  productId?: string | null;
  itemName: string;
  supplier?: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}
