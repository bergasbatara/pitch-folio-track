CREATE TYPE "TransactionStatus" AS ENUM ('draft', 'posted', 'voided');

ALTER TABLE "Sale"
ADD COLUMN "status" "TransactionStatus" NOT NULL DEFAULT 'posted';

ALTER TABLE "Purchase"
ADD COLUMN "status" "TransactionStatus" NOT NULL DEFAULT 'posted';
