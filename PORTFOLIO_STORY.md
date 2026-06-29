# Pitch Folio Track: Recruiter Portfolio Story

## One-line summary

Pitch Folio Track is a full-stack accounting and business finance platform for small and midsize companies, built to manage transactions, master data, journals, financial statements, subscription plans, and security-sensitive user flows in one product.

## Recruiter-ready intro

I built Pitch Folio Track as an end-to-end finance operations product, not just a UI demo. The application covers the core workflow of a growing business: onboarding a company, authenticating users securely, managing products and counterparties, recording sales and purchases, tracking receivables and payables, maintaining accounts and journal entries, generating financial reports, and gating advanced features through a subscription model.

What makes this project strong as a portfolio piece is the breadth of real engineering decisions behind it. The frontend is a structured React application with feature-based modules and route protection. The backend is a NestJS API with Prisma and PostgreSQL, including JWT auth, refresh-token rotation, CSRF protection, rate limiting, audit logging, role checks, plan-based access control, and payment integration.

## What the product does

### Core business workflows

- User registration, login, password reset, profile management
- Company onboarding and company profile setup
- Product, customer, and supplier management
- Sales and purchase entry
- Receivables and payables tracking
- Chart of accounts and journal entry management
- Opening balances for liabilities and equity
- Fixed asset recording
- Tax code management
- Financial statements and reporting
- Subscription purchase and renewal flows

### Reporting and finance outputs

- Profit and loss
- Balance sheet snapshot
- Cash flow view
- Equity statement
- Cost of goods sold view
- Notes to financial statements
- Account-level report breakdowns

### Commercial product mechanics

- Tiered plans: business, professional, premium
- Feature gating on the frontend and backend
- Payment flows for card, QRIS, and GoPay through Midtrans
- Renewal flow and subscription activation logic

## Tech stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS
- shadcn/ui + Radix UI
- Recharts
- React Hook Form
- Zod
- Vitest
- Playwright

### Backend

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT authentication
- bcrypt
- Nodemailer
- Jest

### Deployment and ops

- Docker
- Docker Compose
- Nginx
- Caddy
- Production docs for VPS and AWS-style deployment paths

## Architecture story

The frontend is organized by feature domains such as auth, sales, purchases, journals, subscriptions, taxes, and financial statements. Each feature owns its pages, hooks, types, and components, which keeps the app scalable as product scope grows.

The backend follows a modular NestJS structure, with separate modules for auth, companies, products, sales, purchases, receivables, journals, reports, subscriptions, payments, taxes, fixed assets, and audit logging. Prisma provides a strongly typed data layer and a schema that models business entities with company scoping and relational integrity.

This separation makes the codebase read like a real product codebase rather than a tutorial app.

## Security and engineering depth

This project stands out because it includes concerns that are usually missing from portfolio projects:

- CSRF protection across authenticated state-changing requests
- Refresh-token rotation and invalidation logic
- Login lockout handling after repeated failed attempts
- Helmet security headers
- Request body limits and DTO validation
- Rate limiting with Nest throttling
- Audit log capture through an interceptor
- Role and membership checks for company-scoped data
- Environment validation for production-safe auth settings
- Security verification page plus backend security scripts

## Testing story

The repository includes meaningful automated coverage across both application layers.

- Frontend: 44 test files overall in the `src` tree, with unit/integration coverage for auth guards, hooks, subscription flows, journals, and security checks
- Backend: 18 spec files, with service-level coverage for auth, payments, journals, reports, subscriptions, taxes, receivables, and other modules
- Browser E2E: Playwright flows for onboarding, subscriptions, accounting, commerce, password reset, and multi-company behavior

Current test snapshot from inspection:

- Backend tests passed fully
- Frontend tests were mostly green, with one failing auth-context test caused by an unmocked CSRF fetch path during login

That failure is useful portfolio evidence too: the codebase is test-driven enough that integration assumptions surface quickly.

## Honest scope assessment

This is not a polished SaaS launch yet. It is stronger as an engineering portfolio piece than as a fully finished commercial product today.

What is clearly implemented:

- Core accounting and transaction flows
- Auth and onboarding
- Subscription logic and payment integration
- Reporting services and PDF export
- Deployment scaffolding
- Security controls and backend validations

What is still partially productized:

- Several premium/professional screens are placeholder pages
- The dashboard includes an “Insight” tab marked as coming soon
- The backend README is still the default Nest starter doc and should be replaced
- `LIVE_URL.txt` is still unset

## Outcome statement

The outcome is a serious full-stack finance application prototype that demonstrates product thinking, systems design, API architecture, secure authentication, company-scoped multi-entity data modeling, and strong test awareness. It shows the ability to build beyond CRUD into operational business software with real constraints.

## Resume bullets

- Built a full-stack accounting and finance platform using React, TypeScript, NestJS, Prisma, and PostgreSQL to support onboarding, transactions, journals, receivables/payables, financial reporting, and subscription billing.
- Designed a modular feature-based frontend and domain-oriented backend architecture covering auth, reporting, accounting, payments, and company-scoped business entities.
- Implemented security controls including JWT auth, refresh-token rotation, CSRF protection, rate limiting, validation pipes, login lockout, and audit logging.
- Added automated coverage across frontend hooks/components, backend services, and Playwright end-to-end flows for onboarding, payments, and accounting scenarios.
- Integrated tier-based product access and Midtrans payment flows for card, QRIS, and GoPay subscription purchases.

## Recruiter presentation script

Here is the short version I would use in an interview:

“Pitch Folio Track is a full-stack finance platform I built for SMB accounting workflows. On the frontend, I used React, TypeScript, Vite, Tailwind, and shadcn to build a modular product with onboarding, transaction entry, reporting, and subscription flows. On the backend, I used NestJS, Prisma, and PostgreSQL to model company-scoped accounting entities and expose secure APIs for journals, reports, subscriptions, and payments. I also implemented production-minded concerns like JWT rotation, CSRF, rate limiting, audit logs, and deployment setup. The strongest part of the project is that it behaves like a real business system rather than a design mockup.”

## Best angle for recruiters

Position this project as:

- A full-stack product engineering case study
- Evidence you can design beyond frontend screens
- Evidence you understand security, backend modeling, and production concerns
- Evidence you can work on complex business software with many entities and workflows

Do not position it as:

- A fully launched SaaS with all premium features complete
- A pixel-perfect design showcase
- A pure accounting compliance platform

## Suggested portfolio framing

Title:

`Pitch Folio Track | Full-Stack SMB Finance Platform`

Subtitle:

`Built a secure accounting workflow app with reporting, subscriptions, payment integration, and company-scoped financial operations.`

## Optional “what I’d do next”

- Replace placeholder premium screens with real analytics workflows
- Add observability and error tracking
- Harden auth and payment flows with broader E2E coverage
- Improve backend docs and API documentation
- Publish a live demo and seeded evaluator environment
