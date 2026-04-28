-- Opening balance line-items for liabilities & equity (long-term source of truth for the page).

CREATE TYPE "OpeningBalanceKind" AS ENUM ('liability', 'equity');

CREATE TABLE "OpeningBalanceItem" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "kind" "OpeningBalanceKind" NOT NULL,
  "accountId" TEXT NOT NULL,
  "asOfDate" TIMESTAMP(3) NOT NULL,
  "amount" INTEGER NOT NULL,
  "memo" TEXT,
  "journalEntryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OpeningBalanceItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OpeningBalanceItem_journalEntryId_key" ON "OpeningBalanceItem"("journalEntryId");
CREATE UNIQUE INDEX "OpeningBalanceItem_companyId_kind_accountId_asOfDate_key"
  ON "OpeningBalanceItem"("companyId", "kind", "accountId", "asOfDate");

CREATE INDEX "OpeningBalanceItem_companyId_idx" ON "OpeningBalanceItem"("companyId");
CREATE INDEX "OpeningBalanceItem_companyId_asOfDate_idx" ON "OpeningBalanceItem"("companyId", "asOfDate");

ALTER TABLE "OpeningBalanceItem"
  ADD CONSTRAINT "OpeningBalanceItem_companyId_fkey"
  FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OpeningBalanceItem"
  ADD CONSTRAINT "OpeningBalanceItem_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OpeningBalanceItem"
  ADD CONSTRAINT "OpeningBalanceItem_journalEntryId_fkey"
  FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill existing liabilitas/ekuitas opening balances that were previously stored as tagged journal entries.
-- We reuse JournalEntry.id as OpeningBalanceItem.id to avoid needing a UUID function in SQL.
INSERT INTO "OpeningBalanceItem" (
  "id",
  "companyId",
  "kind",
  "accountId",
  "asOfDate",
  "amount",
  "memo",
  "journalEntryId",
  "createdAt",
  "updatedAt"
)
SELECT
  je."id" AS "id",
  je."companyId" AS "companyId",
  CASE
    WHEN a."type" = 'liability' THEN 'liability'::"OpeningBalanceKind"
    ELSE 'equity'::"OpeningBalanceKind"
  END AS "kind",
  jl."accountId" AS "accountId",
  je."date" AS "asOfDate",
  jl."credit" AS "amount",
  je."memo" AS "memo",
  je."id" AS "journalEntryId",
  je."createdAt" AS "createdAt",
  je."updatedAt" AS "updatedAt"
FROM "JournalEntry" je
JOIN "JournalLine" jl ON jl."entryId" = je."id"
JOIN "Account" a ON a."id" = jl."accountId"
WHERE je."source" = 'liabilitas-ekuitas'
  AND jl."credit" > 0
  AND a."code" <> '3999'
ON CONFLICT DO NOTHING;
