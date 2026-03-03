export const DEFAULT_ACCOUNTS = [
  { code: "1001", name: "Kas", type: "asset", normalBalance: "debit", isSystem: true },
  { code: "1101", name: "Piutang Usaha", type: "asset", normalBalance: "debit", isSystem: true },
  { code: "1201", name: "Persediaan", type: "asset", normalBalance: "debit", isSystem: true },
  { code: "2001", name: "Hutang Usaha", type: "liability", normalBalance: "credit", isSystem: true },
  { code: "3001", name: "Modal", type: "equity", normalBalance: "credit", isSystem: true },
  { code: "4001", name: "Penjualan", type: "revenue", normalBalance: "credit", isSystem: true },
  { code: "5001", name: "Pembelian", type: "expense", normalBalance: "debit", isSystem: true },
  { code: "5002", name: "HPP", type: "expense", normalBalance: "debit", isSystem: true },
];

export const DEFAULT_ACCOUNT_CODES = {
  cash: "1001",
  revenue: "4001",
  purchases: "5001",
};
