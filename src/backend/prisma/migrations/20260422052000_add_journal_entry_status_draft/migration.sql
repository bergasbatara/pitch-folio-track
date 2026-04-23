-- Support draft journal entries (can be unbalanced) vs posted entries (must be balanced).

-- Prisma enum in Postgres will be created as a custom type.
CREATE TYPE "JournalEntryStatus" AS ENUM ('draft', 'posted');

ALTER TABLE "JournalEntry"
ADD COLUMN "status" "JournalEntryStatus" NOT NULL DEFAULT 'posted';

