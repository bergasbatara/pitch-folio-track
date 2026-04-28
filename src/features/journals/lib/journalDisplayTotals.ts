import type { JournalEntry } from '../types';

// These codes must stay in sync with backend DEFAULT_ACCOUNT_CODES.
// We only use them to display a more helpful "impact" amount for system-generated journals.
const ACCOUNT_CODES = {
  cash: '1001',
  receivable: '1101',
  fixedAsset: '1301',
  accumulatedDepreciation: '1401',
  payable: '2001',
} as const;

const PERANTARA_CODE = '3999';

function sumDebitByCode(e: JournalEntry, code: string) {
  return e.lines.filter((l) => l.account?.code === code).reduce((s, l) => s + (l.debit ?? 0), 0);
}

function sumCreditByCode(e: JournalEntry, code: string) {
  return e.lines.filter((l) => l.account?.code === code).reduce((s, l) => s + (l.credit ?? 0), 0);
}

function sumCreditExcludingCode(e: JournalEntry, excludeCode: string) {
  return e.lines
    .filter((l) => l.account?.code !== excludeCode)
    .reduce((s, l) => s + (l.credit ?? 0), 0);
}

export function getDisplayTotals(e: JournalEntry): { totalDebit: number; totalCredit: number } {
  // Default: show real totals.
  const totalDebit = e.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = e.lines.reduce((s, l) => s + l.credit, 0);

  if (!e.source) return { totalDebit, totalCredit };

  // For certain system sources, show a "primary impact" value to match how users think
  // when inputting opening balances / operational modules.
  switch (e.source) {
    case 'opening_balance_item_le': {
      // Liabilities/Equity opening balance items are created as a balanced journal:
      // debit perantara 3999, credit the selected L/E account.
      // For display in Jurnal Umum, show only the credit impact.
      const credit = sumCreditExcludingCode(e, PERANTARA_CODE);
      return { totalDebit: 0, totalCredit: credit || totalCredit };
    }
    case 'fixed_asset': {
      // Show only the asset acquisition amount (debit fixed assets), ignore cash credit.
      const debit = sumDebitByCode(e, ACCOUNT_CODES.fixedAsset);
      return { totalDebit: debit || totalDebit, totalCredit: 0 };
    }
    case 'depreciation': {
      // Depreciation reduces asset value: show accumulated depreciation (credit) only.
      const credit = sumCreditByCode(e, ACCOUNT_CODES.accumulatedDepreciation);
      return { totalDebit: 0, totalCredit: credit || totalCredit };
    }
    case 'receivable': {
      // Show only receivable increase (debit AR), ignore revenue credit.
      const debit = sumDebitByCode(e, ACCOUNT_CODES.receivable);
      return { totalDebit: debit || totalDebit, totalCredit: 0 };
    }
    case 'payable': {
      // Show only liability increase (credit AP), ignore expense debit.
      const credit = sumCreditByCode(e, ACCOUNT_CODES.payable);
      return { totalDebit: 0, totalCredit: credit || totalCredit };
    }
    case 'receivable_payment': {
      // Show both: cash increases (debit) and receivable decreases (credit).
      const debit = sumDebitByCode(e, ACCOUNT_CODES.cash);
      const credit = sumCreditByCode(e, ACCOUNT_CODES.receivable);
      return {
        totalDebit: debit || totalDebit,
        totalCredit: credit || totalCredit,
      };
    }
    case 'payable_payment': {
      // Show both: payable decreases (debit) and cash decreases (credit).
      const debit = sumDebitByCode(e, ACCOUNT_CODES.payable);
      const credit = sumCreditByCode(e, ACCOUNT_CODES.cash);
      return {
        totalDebit: debit || totalDebit,
        totalCredit: credit || totalCredit,
      };
    }
    default:
      return { totalDebit, totalCredit };
  }
}

export function getDisplayTotalsForEntries(entries: JournalEntry[]) {
  return entries.reduce(
    (acc, e) => {
      const t = getDisplayTotals(e);
      acc.totalDebit += t.totalDebit;
      acc.totalCredit += t.totalCredit;
      return acc;
    },
    { totalDebit: 0, totalCredit: 0 },
  );
}
