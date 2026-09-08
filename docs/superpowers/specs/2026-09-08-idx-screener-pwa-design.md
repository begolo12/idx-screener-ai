# IDX Stock Screener & News Aggregator Mobile PWA - Design Spec

**Date**: 2026-09-08  
**Status**: Approved  
**Target Market**: Indonesia Stock Exchange (IDX / BEI)  
**Platform**: Mobile-first Web / Progressive Web App (PWA)  
**Deployment**: Vercel Serverless  
**Database**: Neon Serverless PostgreSQL  

---

## 1. Overview & Goals

Membangun aplikasi web mobile-first (PWA) untuk screening saham Indonesia (IDX) dan kurasi berita pasar saham. Aplikasi dirancang cepat, hemat kuota Zapi API, dan memiliki penyimpanan watchlist yang persisten via Neon Postgres.

### Key Capabilities
1. **Market Overview**: Snapshot indeks IHSG, status sesi bursa, total arus dana asing (net foreign buy/sell).
2. **Stock Screener**: Filter saham berdasarkan momentum (Top Gainers, Top Losers, Top Volume, Net Foreign Buy), sektor industri, dan rentang harga.
3. **Stock Detail Drawer**: Statistik harian emiten (OHLC, volume, pergerakan asing) dan tab berita terkait spesifik emiten tersebut.
4. **News Aggregator**: Feed berita pasar modal terkurasi dari IDX Channel dan Kontan.
5. **Watchlist**: Simpan dan kelola saham favorit dengan sinkronisasi ke Neon Postgres (graceful fallback ke `localStorage` jika offline/error).

---

## 2. Architecture & Tech Stack

```
[ Mobile Browser / PWA Shell ]
        |
        v (HTTPS / SWR)
[ Next.js App Router on Vercel ]
   ├── Client Components (UI / Stitch Design System / Tailwind CSS)
   └── Route Handlers (/api/market, /api/screener, /api/stocks, /api/news, /api/watchlist)
        ├── [ In-Memory / Stale-While-Revalidate Cache ] (60s - 300s TTL)
        ├── [ Neon PostgreSQL Driver ] (@neondatabase/serverless over HTTP)
        └── [ Zapi SDK Client ] (zpi-sdk with key zpi_kk6vaqp5e5j9hmhdothhjoha5u)
                ├── finance:idxchannel (stocks-all, quote, indices, related, latest)
                └── finance:kontan (dana-asing-saham, indeks-sektoral, feed)
```

### Stack Components
- **Framework**: Next.js 15 (App Router, Node.js runtime for API handlers).
- **Styling & UI**: Tailwind CSS, Lucide Icons, Google Stitch financial design tokens (dark theme default).
- **Data SDK**: `zpi-sdk` (TypeScript, zero-dependency).
- **Database**: `@neondatabase/serverless` with Drizzle ORM.
- **PWA**: Web App Manifest (`manifest.json`), service worker for offline app shell.

---

## 3. Data Contracts & External Integrations

### 3.1 Zapi Endpoints
- **IDX Channel** (`finance:idxchannel`):
  - `stocks-all`: Snapshot seluruh ticker aktif dengan last price, change %, dan volume.
  - `quote`: Detail OHLC dan volume harian ticker tertentu.
  - `indices`: Indeks gabungan (IHSG).
  - `latest`: Feed berita terkini.
  - `related`: Berita spesifik berdasarkan kode ticker.
- **Kontan** (`finance:kontan`):
  - `dana-asing-saham`: Arus modal asing harian (net foreign buy/sell).
  - `indeks-sektoral`: Kinerja indeks sektoral (energi, finansial, dsb).
  - `feed`: RSS berita bisnis dan investasi.

### 3.2 Caching Strategy
- `stocks-all` & screener data: 60 detik TTL.
- `market/overview` (IHSG & dana asing): 120 detik TTL.
- `news` & feed: 300 detik TTL.
- Fallback resilience: jika Zapi merespons status 429 atau 5xx, sajikan data cache terakhir (stale data) tanpa menghentikan aplikasi.

---

## 4. Neon Database Schema

```sql
CREATE TABLE IF NOT EXISTS watchlists (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL DEFAULT 'default_user',
  ticker VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_ticker UNIQUE(user_id, ticker)
);

CREATE TABLE IF NOT EXISTS market_cache (
  cache_key VARCHAR(64) PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 5. UI / UX Design & Navigation (Mobile-First)

- **Layout**: Fixed Top Bar (IHSG ticker + market status) + Fixed Bottom Navigation Bar (Screener, Berita, Watchlist).
- **Screen 1: Screener (Home)**
  - Quick filter chips: Top Gainers, Top Losers, Top Volume, Foreign Inflow.
  - Filter trigger modal (range harga, pilihan sektor).
  - Infinite/paginated stock list cards: Ticker, Nama Emiten, Harga Terakhir, Perubahan %, Volume, Tag Sektor.
- **Screen 2: Berita**
  - Search bar berita & filter kategori (Pasar, Emiten, Makro).
  - Card artikel: Judul, sumber (IDX Channel / Kontan), waktu publish, thumbnail, preview isi.
- **Screen 3: Watchlist**
  - Daftar saham pantauan pengguna, quick toggle add/remove.
- **Stock Detail Bottom Sheet**:
  - Modal swipeable saat ticker ditekan: statistik harga, volume, arus asing, dan feed berita relevan emiten tersebut.

---

## 6. Error Handling & Reliability

1. **Zapi Rate Limiting (429)**: Cache layer mengembalikan data terakhir yang valid jika kuota tercapai.
2. **Neon Cold Start / Connection Disruption**: Watchlist fallback otomatis ke `localStorage` browser jika query database gagal.
3. **Network Offline**: Service worker menyajikan app shell dan memberitahukan status koneksi offline pada header.

---

## 7. Verification Plan

1. **Unit Tests**: Filter logic (sorting gainers/losers/volume, sector filter).
2. **API Route Tests**: Mocking Zapi response, checking cache headers and response shapes.
3. **Database Tests**: Test Neon connection, migration, and watchlist CRUD operations.
4. **PWA & Mobile Verification**: Validasi manifest, meta tags responsif, render lancar pada viewport mobile 375px - 430px.
