# Asia Global Financial

A comprehensive retail business management application for tracking sales, purchases, products, and generating financial reports.

## Features

- **Authentication**: User login and registration system with protected routes
- **Onboarding Flow**: Welcome page and company profile setup for new users
- **Dashboard**: Overview of key business metrics (revenue, units sold, low stock alerts)
- **Sales Management**: Record and track sales transactions with charts and analytics
- **Purchase Management**: Manage supplier purchases and inventory restocking
- **Product Management**: Inventory tracking with stock levels and pricing
- **Financial Statements**: Daily revenue, expenses, profit/loss summaries with PDF export

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: TanStack React Query
- **Routing**: React Router v6
- **Charts**: Recharts
- **PDF Export**: jsPDF

## Local Development

### Prerequisites

- Node.js 18+ 
- npm or bun

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd <project-folder>

# Install dependencies
npm install
# or
bun install
```

### Running the Development Server

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
├── components/          # Shared UI components
│   ├── layout/          # Layout components (MainLayout, Sidebar)
│   └── ui/              # shadcn/ui components
├── features/            # Feature-based modules
│   ├── auth/            # Authentication (login, register, profile)
│   ├── dashboard/       # Main dashboard
│   ├── financial-statements/  # Financial reports
│   ├── onboarding/      # Welcome & company setup flow
│   ├── products/        # Product/inventory management
│   ├── purchases/       # Purchase management
│   └── sales/           # Sales management
├── pages/               # Top-level pages
└── shared/              # Shared hooks and utilities
```

## Application Flow

1. **Login/Register** → User authentication
2. **Onboarding** → Welcome page → Company profile setup (first-time users)
3. **Dashboard** → Main app with access to all features
4. **Protected Routes** → All business features require authentication

## Building for Production

```bash
npm run build
# or
bun run build
```

The production build will be output to the `dist/` folder.

## License

Private - All rights reserved.
