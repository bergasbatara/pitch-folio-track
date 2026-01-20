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

### 📈 Receivables & Payables
- **Receivables (Piutang)** - Manage customer invoices and collections
- **Payables (Hutang)** - Manage supplier obligations

### 📑 Financial Reports
- **Profit & Loss** - Income and expense statement
- **Balance Sheet** - Financial position statement
- **Cash Flow** - Cash movement statement
- **Equity Statement** - Changes in equity report
- **COGS** - Cost of Goods Sold
- **Notes to Financial Statements** - Supplementary notes
- **PDF Export** - Export reports to PDF format

### 🔐 Authentication & Onboarding
- User login/registration system
- Onboarding flow for new users
- Company profile setup

### 💎 Subscription Plans
- Business, Professional, and Premium tiers
- Different features per subscription tier

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack React Query
- **Routing**: React Router v6
- **Charts**: Recharts
- **PDF Export**: jsPDF
- **Data Persistence**: LocalStorage (for prototyping)

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

### Test Credentials

- **Email**: `admin@test.com`
- **Password**: `password123`

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

## Demo Data

The application comes preloaded with demo data to display realistic examples:
- 180 sales transactions
- 80 purchase transactions
- 25 receivables from various customers
- 20 payables to various suppliers
- 8 Indonesian food/beverage products

## Building for Production

```bash
npm run build
# or
bun run build
```

Build output will be in the `dist/` folder.

## License

Private - All rights reserved.
