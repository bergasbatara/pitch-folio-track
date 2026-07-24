ALTER TABLE "Sale"
ADD COLUMN "taxCodeId" TEXT,
ADD COLUMN "subtotalAmount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "taxAmount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Sale"
SET "subtotalAmount" = "quantity" * "pricePerUnit",
    "taxRate" = 0,
    "taxAmount" = GREATEST("totalPrice" - ("quantity" * "pricePerUnit"), 0);

ALTER TABLE "Sale"
ADD CONSTRAINT "Sale_taxCodeId_fkey"
FOREIGN KEY ("taxCodeId") REFERENCES "TaxCode"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Sale_taxCodeId_idx" ON "Sale"("taxCodeId");

ALTER TABLE "Purchase"
ADD COLUMN "taxCodeId" TEXT,
ADD COLUMN "subtotalCost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "taxAmount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Purchase"
SET "subtotalCost" = "quantity" * "unitCost",
    "taxRate" = 0,
    "taxAmount" = GREATEST("totalCost" - ("quantity" * "unitCost"), 0);

ALTER TABLE "Purchase"
ADD CONSTRAINT "Purchase_taxCodeId_fkey"
FOREIGN KEY ("taxCodeId") REFERENCES "TaxCode"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Purchase_taxCodeId_idx" ON "Purchase"("taxCodeId");
