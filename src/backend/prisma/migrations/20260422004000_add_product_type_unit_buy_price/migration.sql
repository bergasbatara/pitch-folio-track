-- Add product metadata fields used by the frontend (type/unit/buyPrice).

ALTER TABLE "Product"
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'barang',
ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'pcs',
ADD COLUMN "buyPrice" INTEGER NOT NULL DEFAULT 0;

