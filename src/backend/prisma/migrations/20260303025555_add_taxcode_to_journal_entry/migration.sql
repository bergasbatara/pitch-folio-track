-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "taxCodeId" TEXT;

-- CreateIndex
CREATE INDEX "JournalEntry_taxCodeId_idx" ON "JournalEntry"("taxCodeId");

-- AddForeignKey
ALTER TABLE "JournalEntry" ADD CONSTRAINT "JournalEntry_taxCodeId_fkey" FOREIGN KEY ("taxCodeId") REFERENCES "TaxCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
