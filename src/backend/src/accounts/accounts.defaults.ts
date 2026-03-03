export const DEFAULT_ACCOUNTS = [
  { code: "1001", name: "Kas", type: "asset", normalBalance: "debit", isSystem: true },
  { code: "1101", name: "Piutang Usaha", type: "asset", normalBalance: "debit", isSystem: true },
  { code: "1201", name: "Persediaan", type: "asset", normalBalance: "debit", isSystem: true },
  { code: "1301", name: "Aset Tetap", type: "asset", normalBalance: "debit", isSystem: true },
  { code: "1401", name: "Akumulasi Penyusutan", type: "asset", normalBalance: "credit", isSystem: true },
  { code: "2001", name: "Hutang Usaha", type: "liability", normalBalance: "credit", isSystem: true },
  { code: "2101", name: "Hutang Pajak", type: "liability", normalBalance: "credit", isSystem: true },
  { code: "3001", name: "Modal", type: "equity", normalBalance: "credit", isSystem: true },
  { code: "4001", name: "Penjualan", type: "revenue", normalBalance: "credit", isSystem: true },
  { code: "5001", name: "Pembelian", type: "expense", normalBalance: "debit", isSystem: true },
  { code: "5002", name: "HPP", type: "expense", normalBalance: "debit", isSystem: true },
  { code: "6001", name: "Beban Penyusutan", type: "expense", normalBalance: "debit", isSystem: true },
];

export const DEFAULT_ACCOUNT_CODES = {
  cash: "1001",
  receivable: "1101",
  fixedAsset: "1301",
  accumulatedDepreciation: "1401",
  payable: "2001",
  taxPayable: "2101",
  revenue: "4001",
  purchases: "5001",
  depreciationExpense: "6001",
};
