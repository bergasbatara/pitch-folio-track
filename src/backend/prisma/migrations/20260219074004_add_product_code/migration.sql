/*
  Warnings:

  - A unique constraint covering the columns `[companyId,code]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Product_companyId_code_key" ON "Product"("companyId", "code");
