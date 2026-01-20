# Asia Global Financial

Aplikasi manajemen keuangan bisnis yang komprehensif untuk UMKM Indonesia. Mencatat penjualan, pembelian, mengelola piutang/hutang, dan menghasilkan laporan keuangan lengkap.

## Fitur Utama

### 📊 Dashboard
- **Arus Kas** - Grafik combo untuk memantau kas masuk, kas keluar, dan perpindahan kas bersih
- **Penjualan Terhutang** - Visualisasi piutang dari penjualan kredit
- **Piutang Usaha** - Tren piutang bulanan
- **Hutang Usaha** - Tren hutang ke supplier
- **Biaya Operasional** - Distribusi pengeluaran berdasarkan kategori
- **Laba Rugi** - Perbandingan pendapatan vs pengeluaran
- **Kas** - Grafik saldo kas
- **Produk Terlaris** - Daftar produk paling laku

### 💰 Manajemen Transaksi
- **Penjualan** - Catat transaksi penjualan dengan detail produk dan harga
- **Pembelian** - Kelola pembelian supplier dengan kategori biaya
- **Produk** - Inventaris produk dengan stok dan harga

### 📈 Piutang & Hutang
- **Piutang (Receivables)** - Kelola tagihan ke pelanggan
- **Hutang (Payables)** - Kelola kewajiban ke supplier

### 📑 Laporan Keuangan
- **Laba Rugi** - Laporan pendapatan dan beban
- **Neraca** - Laporan posisi keuangan
- **Arus Kas** - Laporan pergerakan kas
- **Ekuitas** - Laporan perubahan modal
- **HPP** - Harga Pokok Penjualan
- **Catatan Keuangan** - Catatan atas laporan keuangan
- **Export PDF** - Ekspor laporan ke format PDF

### 🔐 Autentikasi & Onboarding
- Sistem login/registrasi pengguna
- Alur onboarding untuk pengguna baru
- Pengaturan profil perusahaan

### 💎 Langganan
- Paket Business, Professional, dan Premium
- Fitur berbeda per tier langganan

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack React Query
- **Routing**: React Router v6
- **Charts**: Recharts
- **PDF Export**: jsPDF
- **Data Persistence**: LocalStorage (untuk prototyping)

## Pengembangan Lokal

### Prasyarat

- Node.js 18+
- npm atau bun

### Instalasi

```bash
# Clone repository
git clone <your-repo-url>
cd <project-folder>

# Install dependencies
npm install
# atau
bun install
```

### Menjalankan Development Server

```bash
npm run dev
# atau
bun dev
```

Aplikasi akan tersedia di `http://localhost:8080`

### Kredensial Test

- **Email**: `admin@test.com`
- **Password**: `password123`

## Struktur Proyek

```
src/
├── components/                    # Komponen UI bersama
│   ├── layout/                    # Layout (MainLayout, Sidebar)
│   └── ui/                        # Komponen shadcn/ui
├── features/                      # Modul berbasis fitur
│   ├── auth/                      # Autentikasi
│   ├── dashboard/                 # Dashboard & widget
│   │   └── components/            # Chart components
│   ├── financial-statements/      # Laporan keuangan
│   ├── onboarding/                # Alur onboarding
│   ├── products/                  # Manajemen produk
│   ├── purchases/                 # Manajemen pembelian
│   ├── receivables/               # Piutang & hutang
│   ├── sales/                     # Manajemen penjualan
│   └── subscription/              # Paket langganan
├── pages/                         # Halaman top-level
└── shared/                        # Hook & utilitas bersama
    ├── data/                      # Demo data generator
    └── hooks/                     # Custom hooks
```

## Alur Aplikasi

1. **Login/Register** → Autentikasi pengguna
2. **Onboarding** → Selamat datang → Pengaturan profil perusahaan
3. **Dashboard** → Ringkasan bisnis dengan semua widget
4. **Fitur** → Akses ke semua modul (penjualan, pembelian, laporan, dll.)

## Data Demo

Aplikasi sudah dilengkapi dengan data demo untuk menampilkan contoh realistis:
- 180 transaksi penjualan
- 80 transaksi pembelian
- 25 piutang dari berbagai pelanggan
- 20 hutang ke berbagai supplier
- 8 produk makanan/minuman Indonesia

## Build untuk Produksi

```bash
npm run build
# atau
bun run build
```

Output build akan ada di folder `dist/`.

## Lisensi

Private - Hak cipta dilindungi.
