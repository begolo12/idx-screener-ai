# IDX Stock Screener & News Aggregator Mobile PWA - Design Spec

**Date**: 2026-09-08  
**Status**: Approved & Visually Enhanced  
**Target Market**: Indonesia Stock Exchange (IDX / BEI)  
**Platform**: Mobile-first Web / Progressive Web App (PWA)  
**Deployment**: Vercel Serverless  
**Database**: Neon Serverless PostgreSQL  
**Design Standard**: Google Stitch (Obsidian Nexus Financial Theme) & Antislop-UI  

---

## 1. Overview & Goals

Membangun aplikasi web mobile-first (PWA) untuk screening saham Indonesia (IDX) dan kurasi berita pasar saham. Aplikasi dirancang cepat, hemat kuota Zapi API, memiliki ketahanan offline/fallback tinggi, dan menyajikan visual finansial berstandar tinggi (high visual fidelity) tanpa kekosongan (*zero visual gap*).

### Key Capabilities
1. **Market Overview**: Snapshot indeks IHSG real-time, status sesi bursa (Open/Closed), total arus dana asing harian (Net Foreign Flow).
2. **Stock Screener**: Filter saham instan berdasarkan momentum (*Top Gainers*, *Top Losers*, *Top Volume*, *Net Foreign Inflow*), sektor industri, dan rentang harga rupiah.
3. **Visual Stock Card**: Setiap kartu menampilkan ticker, nama emiten, harga, persentase perubahan, volume transaksi, badge sektor, serta **mini-sparkline SVG** untuk representasi tren visual intraday tanpa jeda.
4. **Stock Detail Drawer**: Modal detail komprehensif dengan statistik OHLC lengkap, **Intraday Price Range Bar** (posisi harga terhadap Low & High hari ini), ringkasan transaksi, serta tab berita relevan emiten tersebut (Zapi `related`).
5. **News Aggregator**: Feed berita pasar modal terkurasi dari IDX Channel dan Kontan dengan search bar interaktif dan kategori sektor.
6. **Watchlist**: Simpan dan kelola saham favorit dengan sinkronisasi otomatis ke Neon Postgres (graceful fallback ke `localStorage` jika database offline).

---

## 2. Visual Architecture & Design Tokens (Google Stitch Obsidian Nexus)

Mengadopsi prinsip desain dari **Google Stitch** (Obsidian Nexus Theme) dan **Antislop-UI/Layout-Mobile**:

### 2.1 Palette & Contrast
- **Canvas Base**: `#07090e` (True dark canvas, ramah baterai OLED).
- **Surface Layer 1**: `#0f131d` (Warna kartu saham dan bar navigasi).
- **Surface Elevated Layer 2**: `#181e2e` (Warna chip filter aktif, drawer modal, input container).
- **Border & Dividers**: `#232a3f` (1px hairline border, tidak memakai shadow tebal berlebihan).
- **Bullish (Gain)**: `#10b981` (Emerald-500, kontras > 4.5:1 terhadap surface).
- **Bearish (Loss)**: `#ef4444` (Rose-500, kontras > 4.5:1 terhadap surface).
- **Primary Accent**: `#38bdf8` (Sky-400, digunakan selektif untuk indikator aktif dan fokus).
- **Text Hierarchy**:
  - Primary text: `#f8fafc` (Slate-50)
  - Secondary text: `#94a3b8` (Slate-400)
  - Muted metadata: `#64748b` (Slate-500)

### 2.2 Typographic System
- **Angka Finansial**: Wajib `font-mono tabular-nums` (`font-variant-numeric: tabular-nums`) untuk mencegah pergeseran layout saat angka harga atau persentase berubah.
- **Header & Title**: Sans-serif bersih (`Plus Jakarta Sans` / System UI Font) dengan tight tracking (`-0.02em`).
- **Metadata & Labels**: Sans-serif 11-12px dengan kontras terukur.

### 2.3 Mobile & Touch Ergonomics
- **Safe Area Insets**: Seluruh container yang dapat discroll memiliki padding bawah dinamis `pb-[calc(5rem+env(safe-area-inset-bottom))]` untuk mencegah tab navigation menutupi elemen terbawah di iPhone/Android modern.
- **Touch Target**: Minimal 44px × 44px untuk semua elemen interaktif (chip filter, tombol star watchlist, close button, tab).
- **Scroll Lock**: Saat modal detail atau filter drawer terbuka, latar belakang terkunci (`overflow-hidden`) tanpa lonjakan scrollbar.
- **Glassmorphism Restraint**: Efek blur `backdrop-blur-md` hanya diterapkan pada Top Header dan Bottom Navigation Bar (dibatasi 2 elemen sesuai aturan Antislop-UI).

---

## 3. Zero-Gap State Specification (Handling Every Screen State)

Untuk menjamin tidak ada celah visual atau UX yang terlewat:

| Kondisi | Penanganan Visual | Tindakan Pengguna |
|---|---|---|
| **Loading Awal (Screener)** | 6 Shimmer Skeleton Cards dengan bentuk identik terhadap kartu saham asli (bukan generic spinner). | Non-interaktif sampai data siap. |
| **Loading Berita** | 4 Shimmer Skeleton Cards berita dengan ukuran proporsional. | Animasi pulsa halus. |
| **Filter Nihil (Screener Empty)** | Ilustrasi SVG minimalis + teks informatif "Tidak ada saham yang sesuai dengan filter" + tombol utama **"Reset Filter"**. | 1-klik untuk mereset seluruh kriteria pencarian. |
| **Watchlist Kosong** | Tampilan onboarding bersih dengan ikon Star outlines + teks panduan + tombol **"Jelajahi Saham"** yang otomatis mengarahkan ke tab Screener. | Memandu user pertama kali. |
| **Pencarian Berita Nihil** | Informasi "Tidak ditemukan berita untuk kata kunci '[query]'" + tombol **"Hapus Pencarian"**. | Mengembalikan feed berita awal. |
| **Zapi Quota Exceeded / Network Error** | Banner status halus di bagian atas header bertuliskan *"Mode Offline / Data Cache Aktif"* tanpa dialog popup yang mengganggu. | Aplikasi tetap dapat dipakai melihat data snapshot terakhir. |
| **Neon DB Unavailable** | Fallback otomatis ke `localStorage` dengan pemberitahuan toast kecil bahwa watchlist disimpan secara lokal. | Data pantauan tetap tersimpan di device. |

---

## 4. Architecture & Data Contracts

### 4.1 Internal API Routes
- `GET /api/market/overview`: Nilai IHSG, perubahan point & %, status pasar (Open/Closed), total net foreign flow.
- `GET /api/screener`: Parameter `sort` (gainers, losers, volume), `sector`, `minPrice`, `maxPrice`, `page`, `limit`. Mengembalikan paginated stocks dengan data statistik.
- `GET /api/stocks/[ticker]`: Detail OHLC, volume, turnover, dan array artikel berita terkait ticker tersebut.
- `GET /api/news`: Parameter `q` (keyword pencarian berita), mengembalikan array artikel terformat.
- `GET / POST / DELETE /api/watchlist`: Sinkronisasi watchlist pengguna dengan tabel Neon PostgreSQL.

### 4.2 Caching Layer
- Harga & screener: 60 detik in-memory SWR cache.
- IHSG & arus asing: 120 detik in-memory SWR cache.
- Berita pasar: 300 detik in-memory SWR cache.

---

## 5. Verification & Quality Gates

1. **Automated Unit Tests**:
   - Filter & sort logic (gainers, losers, volume, price range, sector filter).
   - Pagination calculation.
   - Database configuration fallback detection.
2. **Visual & Responsive Verification**:
   - Render pada viewport 375px (iPhone SE), 390px (iPhone 14/15), dan 430px (Pro Max).
   - PWA Standalone Mode verification (`manifest.json` & Service Worker shell cache).
   - Zero horizontal scroll bar (`overflow-x-clip`).
