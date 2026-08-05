CREATE TYPE "SaleTransactionType" AS ENUM ('sale', 'sale_return', 'sale_cancellation');

CREATE TYPE "PurchaseTransactionType" AS ENUM ('purchase', 'purchase_return', 'purchase_cancellation');

ALTER TABLE "Sale"
ADD COLUMN "transactionType" "SaleTransactionType" NOT NULL DEFAULT 'sale',
ADD COLUMN "originSaleId" TEXT;

ALTER TABLE "Purchase"
ADD COLUMN "transactionType" "PurchaseTransactionType" NOT NULL DEFAULT 'purchase',
ADD COLUMN "originPurchaseId" TEXT;

CREATE INDEX "Sale_companyId_transactionType_idx" ON "Sale"("companyId", "transactionType");
CREATE INDEX "Sale_originSaleId_idx" ON "Sale"("originSaleId");
CREATE INDEX "Purchase_companyId_transactionType_idx" ON "Purchase"("companyId", "transactionType");
CREATE INDEX "Purchase_originPurchaseId_idx" ON "Purchase"("originPurchaseId");

ALTER TABLE "Sale"
ADD CONSTRAINT "Sale_originSaleId_fkey"
FOREIGN KEY ("originSaleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Purchase"
ADD CONSTRAINT "Purchase_originPurchaseId_fkey"
FOREIGN KEY ("originPurchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
