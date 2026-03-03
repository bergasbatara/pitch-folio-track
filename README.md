# Asia Global Financial

A comprehensive business financial management application for Indonesian SMEs. Track sales, purchases, manage receivables/payables, and generate complete financial reports.

## Key Features

### 📊 Dashboard
- **Cash Flow** - Combo chart monitoring cash in, cash out, and net cash movement
- **Outstanding Sales** - Visualization of credit sales receivables
- **Business Receivables** - Monthly receivables trends
- **Business Payables** - Payables to suppliers trends
- **Operational Costs** - Expense distribution by category
- **Profit & Loss** - Revenue vs expenses comparison
- **Cash Balance** - Cash balance chart
- **Top Selling Products** - Best performing products list

### 💰 Transaction Management
- **Sales** - Record sales transactions with product details and pricing
- **Purchases** - Manage supplier purchases with expense categories
- **Products** - Product inventory with stock and pricing
- **Stock Updates** - Purchases increase stock, sales decrease stock

### 📈 Receivables & Payables
- **Receivables (Piutang)** - Manage customer invoices and collections
- **Payables (Hutang)** - Manage supplier obligations
- **Payment Posting** - Record payments; paidAmount updates and journal entries are auto-generated

### 📑 Financial Reports
- **Profit & Loss** - Income and expense statement
- **Balance Sheet** - Financial position statement
- **Cash Flow** - Cash movement statement
- **Equity Statement** - Changes in equity report
- **COGS** - Cost of Goods Sold
- **Notes to Financial Statements** - Supplementary notes
- **PDF Export** - Export reports to PDF format

### 📚 Accounting Core
- **Chart of Accounts (COA)** - System and custom accounts
- **Journal Entries** - Manual and auto-posted entries
- **Auto Posting** - Sales, purchases, receivables/payables, taxes, fixed assets

### 🧾 Taxes (Pajak)
- **Tax Codes** - CRUD for tax codes
- **Tax Settlement Posting** - Post tax payment journals with selected tax code

### 🏢 Customers & Suppliers
- **Customers** - CRUD for customer master data
- **Suppliers** - CRUD for supplier master data

### 🏗️ Fixed Assets (Aset Tetap)
- **Assets CRUD** - Acquisition data, useful life, depreciation method
- **Depreciation Posting (backend ready)** - Journal posting support

### 🔐 Authentication & Onboarding
- User login/registration system
- Onboarding flow for new users
- Company profile setup
- **Profile Updates** - Update User + Company data

### 💎 Subscription Plans
- Business, Professional, and Premium tiers
- Different features per subscription tier
- **Backend plan/subscription API** - Company subscription persisted in DB

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack React Query
- **Routing**: React Router v6
- **Charts**: Recharts
- **PDF Export**: jsPDF
- **Backend**: NestJS + Prisma + PostgreSQL
- **Data Persistence**: PostgreSQL (LocalStorage only for auth tokens and temporary UI state)

## Database Schema (Backend)

The backend uses a single PostgreSQL database with multi-tenant tables scoped by `companyId`.

- `User`: Login accounts with auth fields + profile data.
- `Company`: Business profile (name, address, phone, email, taxId, currency).
- `CompanyMember`: User-to-company membership with role.
- `Product`: Inventory items owned by a company.
- `Sale`: Sales transactions for products (auto journal posting).
- `PurchaseCategory`: Purchase/expense categories per company.
- `Purchase`: Purchase transactions tied to categories (auto journal posting).
- `Receivable`: Customer receivables (amount, paidAmount, dueDate, status + payment journal).
- `Payable`: Supplier payables (amount, paidAmount, dueDate, status + payment journal).
- `Customer`: Customer master data.
- `Supplier`: Supplier master data.
- `TaxCode`: Tax codes (PPN, PPh, etc).
- `Account`: COA accounts (system + custom).
- `JournalEntry`, `JournalLine`: Double-entry ledger (source-linked).
- `FixedAsset`: Assets with depreciation support.
- `Plan`, `Subscription`: Company plan catalog and active subscription.

### Reporting APIs (Backend)
- Daily Financial Statement: `GET /companies/:id/reports/daily?date=YYYY-MM-DD`

## Local Development

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd <project-folder>

# Install dependencies
npm install
# or
bun install
```

### Running Development Server

```bash
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:8080`

## Backend Quickstart

### Prerequisites
- PostgreSQL (local or Docker)
- Node.js 18+

### Environment
Create `src/backend/.env`:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/pitch_folio_track
JWT_ACCESS_SECRET=dev_access_secret
JWT_REFRESH_SECRET=dev_refresh_secret
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
PORT=3000
FRONTEND_URL=http://localhost:8080
```

### Install + Run Backend
```bash
cd src/backend
npm install
npm run prisma:migrate:dev -- --name init
npm run prisma:seed
npm run start:dev
```

## Backend API (Key Endpoints)

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `PATCH /auth/profile`
- `PATCH /profile` (combined User + Company update)

### Company & Onboarding
- `POST /companies`
- `GET /companies/current`
- `PATCH /companies/:companyId`

### Products
- `GET /companies/:companyId/products`
- `POST /companies/:companyId/products`
- `PATCH /companies/:companyId/products/:productId`
- `DELETE /companies/:companyId/products/:productId`

### Sales
- `GET /companies/:companyId/sales`
- `POST /companies/:companyId/sales`
- `PATCH /companies/:companyId/sales/:saleId`
- `DELETE /companies/:companyId/sales/:saleId`

### Purchases & Categories
- `GET /companies/:companyId/purchases`
- `POST /companies/:companyId/purchases`
- `PATCH /companies/:companyId/purchases/:purchaseId`
- `DELETE /companies/:companyId/purchases/:purchaseId`
- `GET /companies/:companyId/purchase-categories`
- `POST /companies/:companyId/purchase-categories`
- `PATCH /companies/:companyId/purchase-categories/:categoryId`
- `DELETE /companies/:companyId/purchase-categories/:categoryId`

### Receivables & Payables
- `GET /companies/:companyId/receivables`
- `POST /companies/:companyId/receivables`
- `PATCH /companies/:companyId/receivables/:receivableId`
- `DELETE /companies/:companyId/receivables/:receivableId`
- `GET /companies/:companyId/payables`
- `POST /companies/:companyId/payables`
- `PATCH /companies/:companyId/payables/:payableId`
- `DELETE /companies/:companyId/payables/:payableId`

### Customers & Suppliers
- `GET /companies/:companyId/customers`
- `POST /companies/:companyId/customers`
- `PATCH /companies/:companyId/customers/:customerId`
- `DELETE /companies/:companyId/customers/:customerId`
- `GET /companies/:companyId/suppliers`
- `POST /companies/:companyId/suppliers`
- `PATCH /companies/:companyId/suppliers/:supplierId`
- `DELETE /companies/:companyId/suppliers/:supplierId`

### Taxes
- `GET /companies/:companyId/tax-codes`
- `POST /companies/:companyId/tax-codes`
- `PATCH /companies/:companyId/tax-codes/:taxCodeId`
- `DELETE /companies/:companyId/tax-codes/:taxCodeId`
- `POST /companies/:companyId/taxes/settlement`

### Fixed Assets
- `GET /companies/:companyId/fixed-assets`
- `POST /companies/:companyId/fixed-assets`
- `PATCH /companies/:companyId/fixed-assets/:assetId`
- `DELETE /companies/:companyId/fixed-assets/:assetId`
- `POST /companies/:companyId/fixed-assets/:assetId/depreciation`

### COA & Journal Entries
- `GET /companies/:companyId/accounts`
- `POST /companies/:companyId/accounts`
- `PATCH /companies/:companyId/accounts/:accountId`
- `DELETE /companies/:companyId/accounts/:accountId`
- `GET /companies/:companyId/journals`
- `POST /companies/:companyId/journals`
- `PATCH /companies/:companyId/journals/:entryId`
- `DELETE /companies/:companyId/journals/:entryId`

### Plans & Subscriptions
- `GET /plans`
- `GET /companies/:companyId/subscription`
- `POST /companies/:companyId/subscription`
- `PATCH /companies/:companyId/subscription`

### Reporting
- `GET /companies/:companyId/reports/daily?date=YYYY-MM-DD`

## Reporting Roadmap
- **Profit & Loss API** (`/reports/profit-loss`)
- **Balance Sheet API** (`/reports/balance-sheet`)
- **Cash Flow API** (`/reports/cash-flow`)
- **Trial Balance API** (`/reports/trial-balance`)

### Test Credentials

- **Email**: `bergaspurboyo@gmail.com`
- **Password**: `indo789`

## Project Structure

```
src/
├── components/                    # Shared UI components
│   ├── layout/                    # Layout (MainLayout, Sidebar)
│   └── ui/                        # shadcn/ui components
├── features/                      # Feature-based modules
│   ├── auth/                      # Authentication
│   ├── dashboard/                 # Dashboard & widgets
│   │   └── components/            # Chart components
│   ├── financial-statements/      # Financial reports
│   ├── onboarding/                # Onboarding flow
│   ├── products/                  # Product management
│   ├── purchases/                 # Purchase management
│   ├── receivables/               # Receivables & payables
│   ├── sales/                     # Sales management
│   └── subscription/              # Subscription plans
├── pages/                         # Top-level pages
└── shared/                        # Shared hooks & utilities
    ├── data/                      # Demo data generator
    └── hooks/                     # Custom hooks
```

## Application Flow

1. **Login/Register** → User authentication
2. **Onboarding** → Welcome → Company profile setup
3. **Dashboard** → Business summary with all widgets
4. **Features** → Access to all modules (sales, purchases, reports, etc.)

## Building for Production

```bash
npm run build
# or
bun run build
```

Build output will be in the `dist/` folder.

## License

Private - All rights reserved.
