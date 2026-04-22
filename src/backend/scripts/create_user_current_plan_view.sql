-- Computes the "current" company for each user using the same rule as GET /companies/current:
-- the earliest CompanyMember by createdAt. Then joins the company's Subscription + Plan.
--
-- Usage:
--   psql "$DATABASE_URL" -f src/backend/scripts/create_user_current_plan_view.sql

CREATE OR REPLACE VIEW "UserCurrentPlan" AS
WITH current_company AS (
  SELECT DISTINCT ON (cm."userId")
    cm."userId",
    cm."companyId"
  FROM "CompanyMember" cm
  ORDER BY cm."userId", cm."createdAt" ASC
)
SELECT
  u.id AS "userId",
  u.email AS "email",
  cc."companyId" AS "companyId",
  s."planId" AS "planId",
  p."name" AS "planName",
  s."status" AS "subscriptionStatus",
  s."startsAt" AS "startsAt",
  s."endsAt" AS "endsAt"
FROM "User" u
LEFT JOIN current_company cc ON cc."userId" = u.id
LEFT JOIN "Subscription" s ON s."companyId" = cc."companyId"
LEFT JOIN "Plan" p ON p.id = s."planId";

