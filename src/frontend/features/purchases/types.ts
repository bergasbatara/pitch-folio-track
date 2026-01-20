export interface PurchaseCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  date: string;
  categoryId: string;
  itemName: string;
  supplier?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  notes?: string;
  createdAt: string;
}
