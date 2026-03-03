export interface JournalLine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  memo?: string;
  account: { id: string; code: string; name: string };
}

export interface JournalEntry {
  id: string;
  date: string;
  memo?: string;
  source?: string;
  sourceId?: string;
  lines: JournalLine[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalLineFormData {
  accountId: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalFormData {
  date: string;
  memo?: string;
  lines: JournalLineFormData[];
}
