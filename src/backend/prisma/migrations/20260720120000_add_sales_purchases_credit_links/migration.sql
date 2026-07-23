-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "settlementType" TEXT NOT NULL DEFAULT 'receivable';

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN "settlementType" TEXT NOT NULL DEFAULT 'payable';

-- AlterTable
ALTER TABLE "Receivable" ADD COLUMN "saleId" TEXT;

-- AlterTable
ALTER TABLE "Payable" ADD COLUMN "purchaseId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Receivable_saleId_key" ON "Receivable"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "Payable_purchaseId_key" ON "Payable"("purchaseId");

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payable" ADD CONSTRAINT "Payable_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
