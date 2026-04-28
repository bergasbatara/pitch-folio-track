-- Allow multiple liabilitas/ekuitas opening balance items for the same account & date.
-- We keep a normal index for querying, but remove the uniqueness constraint.

DROP INDEX IF EXISTS "OpeningBalanceItem_companyId_kind_accountId_asOfDate_key";

