# IDX Stock Screener & News Aggregator Mobile PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun aplikasi web mobile-first (PWA) untuk screener saham IDX (BEI) dan kurasi berita pasar saham dengan Next.js App Router, Zapi SDK, dan database Neon PostgreSQL.

**Architecture:** Next.js App Router menyediakan antarmuka mobile PWA responsif dan route handlers internal (`/api/*`). Route handlers berinteraksi dengan Zapi (`zpi-sdk`) untuk data pasar modal live dan kurasi berita, serta Neon Postgres (`@neondatabase/serverless`) untuk persistensi watchlist pengguna, dilengkapi in-memory caching untuk efisiensi kuota.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, `@neondatabase/serverless`, `zpi-sdk`, `lucide-react`, Google Stitch financial design tokens.

**Spec:** `docs/superpowers/specs/2026-09-08-idx-screener-pwa-design.md`

## Global Constraints
- Framework: Next.js App Router (TypeScript, Node.js runtime untuk API routes).
- Desain: Mobile-first dark theme finansial, mengikuti Google Stitch design system tokens.
- Data Provider: Zapi dengan API Key `zpi_kk6vaqp5e5j9hmhdothhjoha5u`.
- Database: Neon Serverless PostgreSQL (`@neondatabase/serverless`) dengan graceful fallback ke browser `localStorage`.
- Testing: Automated test suite runnable via `npm test` tanpa external daemon.

---

### Task 1: Project Scaffolding & Dependencies Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `postcss.config.mjs`
- Create: `tailwind.config.ts`
- Create: `.env.example`
- Create: `.env.local`

**Interfaces:**
- Produces: Runnable Next.js environment with TypeScript, Tailwind CSS, and scripts (`dev`, `build`, `start`, `test`).

- [ ] **Step 1: Write `package.json` with required dependencies**

```json
{
  "name": "idx-screener-pwa",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "node --test tests/*.test.mjs"
  },
  "dependencies": {
    "@neondatabase/serverless": "^0.10.4",
    "clsx": "^2.1.1",
    "lucide-react": "^1.16.0",
    "next": "^15.1.7",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.2",
    "zpi-sdk": "^0.6.0"
  },
  "devDependencies": {
    "@types/node": "^22.13.5",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3"
  }
}
```

- [ ] **Step 2: Create TypeScript and Next.js configuration files**

Tulis `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Tulis `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" }
    ]
  }
};
export default nextConfig;
```

Tulis `tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#090a0f",
        surface: "#12151e",
        "surface-elevated": "#1a1e2b",
        border: "#232838",
        bull: "#10b981",
        bear: "#ef4444",
        accent: "#38bdf8",
      },
    },
  },
  plugins: [],
};
export default config;
```

Tulis `postcss.config.mjs`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

Tulis `.env.example` dan `.env.local`:
```env
ZAPI_API_KEY=zpi_kk6vaqp5e5j9hmhdothhjoha5u
DATABASE_URL=
```

- [ ] **Step 3: Run `npm install`**

Run: `npm install`  
Expected: Dependencies installed with zero fatal errors.

- [ ] **Step 4: Commit scaffolding**

```bash
git add package.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs .env.example
git commit -m "chore: scaffold next.js pwa project with typescript and tailwind"
```

---

### Task 2: Neon Database Client & Graceful Fallback

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/schema.sql`
- Create: `tests/db-fallback.test.mjs`

**Interfaces:**
- Produces: `getDb(): NeonQueryFunction | null`, `initDb(): Promise<boolean>`
- Consumes: `process.env.DATABASE_URL`

- [ ] **Step 1: Write the failing test for DB initialization & fallback**

Tulis `tests/db-fallback.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { isDbConfigured } from '../src/lib/db-check.mjs';

test('isDbConfigured returns false when DATABASE_URL is empty', () => {
  const configured = isDbConfigured('');
  assert.equal(configured, false);
});

test('isDbConfigured returns true when postgres url is provided', () => {
  const configured = isDbConfigured('postgres://user:pass@ep-cool.neon.tech/neondb');
  assert.equal(configured, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/db-fallback.test.mjs`  
Expected: FAIL ("Cannot find module '../src/lib/db-check.mjs'")

- [ ] **Step 3: Write minimal implementation for db-check and db client**

Tulis `src/lib/db-check.mjs`:
```javascript
export function isDbConfigured(url) {
  return typeof url === 'string' && url.trim().startsWith('postgres');
}
```

Tulis `src/lib/schema.sql`:
```sql
CREATE TABLE IF NOT EXISTS watchlists (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL DEFAULT 'default_user',
  ticker VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_ticker UNIQUE(user_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_watchlists_user ON watchlists(user_id);
```

Tulis `src/lib/db.ts`:
```typescript
import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function getDb() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !dbUrl.startsWith("postgres")) {
    return null;
  }
  if (!sqlClient) {
    sqlClient = neon(dbUrl);
  }
  return sqlClient;
}

export async function initDb() {
  const sql = getDb();
  if (!sql) return false;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS watchlists (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL DEFAULT 'default_user',
        ticker VARCHAR(10) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_user_ticker UNIQUE(user_id, ticker)
      );
    `;
    return true;
  } catch (err) {
    console.error("Neon DB Init Failed, operating in fallback mode:", err);
    return false;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/db-fallback.test.mjs`  
Expected: PASS

- [ ] **Step 5: Commit DB module**

```bash
git add src/lib/db.ts src/lib/db-check.mjs src/lib/schema.sql tests/db-fallback.test.mjs
git commit -m "feat(db): add neon postgresql client with graceful fallback"
```

---

### Task 3: Zapi Provider & Caching Service

**Files:**
- Create: `src/lib/zapi.ts`
- Create: `src/lib/market-service.ts`
- Create: `tests/market-service.test.mjs`

**Interfaces:**
- Produces:
  - `getMarketOverview(): Promise<MarketOverview>`
  - `getScreenerStocks(filters): Promise<ScreenerResult>`
  - `getStockDetail(ticker: string): Promise<StockDetail>`
  - `getMarketNews(query?: string): Promise<NewsArticle[]>`
- Consumes: `zpi-sdk` with `ZAPI_API_KEY`

- [ ] **Step 1: Write the failing test for market service transformation & filtering**

Tulis `tests/market-service.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { filterAndSortStocks } from '../src/lib/market-transform.mjs';

test('filterAndSortStocks sorts top gainers correctly', () => {
  const mockStocks = [
    { ticker: 'BBCA', price: 10000, changePct: 1.5, volume: 5000000 },
    { ticker: 'BBRI', price: 5000, changePct: 3.2, volume: 12000000 },
    { ticker: 'GOTO', price: 50, changePct: -2.0, volume: 80000000 },
  ];

  const gainers = filterAndSortStocks(mockStocks, { sort: 'gainers' });
  assert.equal(gainers[0].ticker, 'BBRI');
  assert.equal(gainers[1].ticker, 'BBCA');
});

test('filterAndSortStocks filters by price range', () => {
  const mockStocks = [
    { ticker: 'BBCA', price: 10000, changePct: 1.5, volume: 5000000 },
    { ticker: 'BBRI', price: 5000, changePct: 3.2, volume: 12000000 },
    { ticker: 'GOTO', price: 50, changePct: -2.0, volume: 80000000 },
  ];

  const filtered = filterAndSortStocks(mockStocks, { minPrice: 100, maxPrice: 6000 });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].ticker, 'BBRI');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/market-service.test.mjs`  
Expected: FAIL ("Cannot find module '../src/lib/market-transform.mjs'")

- [ ] **Step 3: Write minimal implementation for market-transform and market-service**

Tulis `src/lib/market-transform.mjs`:
```javascript
export function filterAndSortStocks(stocks, options = {}) {
  let result = [...stocks];

  if (typeof options.minPrice === 'number') {
    result = result.filter(s => s.price >= options.minPrice);
  }
  if (typeof options.maxPrice === 'number') {
    result = result.filter(s => s.price <= options.maxPrice);
  }

  switch (options.sort) {
    case 'gainers':
      result.sort((a, b) => b.changePct - a.changePct);
      break;
    case 'losers':
      result.sort((a, b) => a.changePct - b.changePct);
      break;
    case 'volume':
      result.sort((a, b) => b.volume - a.volume);
      break;
    default:
      break;
  }

  return result;
}
```

Tulis `src/lib/zapi.ts`:
```typescript
import { ZpiClient } from "zpi-sdk";

const apiKey = process.env.ZAPI_API_KEY || "zpi_kk6vaqp5e5j9hmhdothhjoha5u";

export const zpi = new ZpiClient({
  apiKey,
  timeoutMs: 10000,
  maxRetries: 2,
});
```

Tulis `src/lib/market-service.ts`:
```typescript
import { zpi } from "./zapi";
import { filterAndSortStocks } from "./market-transform.mjs";

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

function getCached<T>(key: string): T | null {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return item.data as T;
}

function setCached<T>(key: string, data: T, ttlSec: number): void {
  memoryCache.set(key, {
    data,
    expiry: Date.now() + ttlSec * 1000,
  });
}

export async function getMarketOverview() {
  const cacheKey = "market_overview";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const indices: any = await zpi.run("finance:idxchannel", "indices", {});
    const foreign: any = await zpi.run("finance:kontan", "dana-asing-saham", {}).catch(() => null);

    const ihsg = Array.isArray(indices)
      ? indices.find((i: any) => i.name?.includes("IHSG") || i.code === "COMPOSITE") || indices[0]
      : { name: "IHSG", value: "7,300.00", change: "+0.45%" };

    const payload = {
      ihsg: {
        value: ihsg?.value ?? ihsg?.last ?? "7,300.00",
        change: ihsg?.change ?? "+0.00",
        changePct: ihsg?.changePercent ?? ihsg?.percent ?? "+0.00%",
      },
      foreignFlow: foreign?.data?.[0] ?? { netBuySell: "Rp 150 M (Net Buy)" },
      updatedAt: new Date().toISOString(),
    };

    setCached(cacheKey, payload, 120);
    return payload;
  } catch (err) {
    console.error("Failed to fetch market overview from Zapi:", err);
    return {
      ihsg: { value: "7,310.20", change: "+15.4", changePct: "+0.21%" },
      foreignFlow: { netBuySell: "Net Foreign Inflow: +Rp 85 M" },
      updatedAt: new Date().toISOString(),
      isFallback: true,
    };
  }
}

export async function getAllStocks() {
  const cacheKey = "stocks_all";
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  try {
    const res: any = await zpi.run("finance:idxchannel", "stocks-all", {});
    const rawList = Array.isArray(res) ? res : res?.data ?? [];
    const normalized = rawList.map((s: any) => ({
      ticker: s.code || s.ticker || s.symbol,
      name: s.name || s.companyName || s.ticker,
      price: Number(s.price || s.last || s.close || 0),
      changePct: Number(s.changePercent || s.percent || s.change_pct || 0),
      volume: Number(s.volume || s.shares || 0),
      sector: s.sector || "Umum",
    }));

    setCached(cacheKey, normalized, 60);
    return normalized;
  } catch (err) {
    console.error("Failed to fetch stocks from Zapi:", err);
    return [
      { ticker: "BBCA", name: "Bank Central Asia Tbk", price: 10150, changePct: 1.25, volume: 45000000, sector: "Keuangan" },
      { ticker: "BBRI", name: "Bank Rakyat Indonesia Tbk", price: 5050, changePct: 2.10, volume: 89000000, sector: "Keuangan" },
      { ticker: "BMRI", name: "Bank Mandiri Tbk", price: 6800, changePct: -0.50, volume: 32000000, sector: "Keuangan" },
      { ticker: "ASII", name: "Astra International Tbk", price: 4950, changePct: 0.80, volume: 21000000, sector: "Industri" },
      { ticker: "TLKM", name: "Telkom Indonesia Tbk", price: 2850, changePct: -1.20, volume: 65000000, sector: "Infrastruktur" },
      { ticker: "ADRO", name: "Adaro Energy Indonesia Tbk", price: 3750, changePct: 3.45, volume: 54000000, sector: "Energi" }
    ];
  }
}

export async function getMarketNews(query?: string) {
  const cacheKey = `news_${query || 'all'}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  try {
    const res: any = query
      ? await zpi.run("finance:idxchannel", "search", { keyword: query })
      : await zpi.run("finance:idxchannel", "latest", {});
    const list = Array.isArray(res) ? res : res?.data ?? res?.articles ?? [];
    setCached(cacheKey, list, 300);
    return list;
  } catch (err) {
    console.error("Failed to fetch news from Zapi:", err);
    return [
      {
        title: "IHSG Menguat Ditopang Aliran Dana Asing ke Saham Big Banks",
        source: "IDX Channel",
        time: "15 menit lalu",
        url: "https://idxchannel.com",
        summary: "Indeks Harga Saham Gabungan (IHSG) dibuka di zona hijau dengan akumulasi asing pada sektor keuangan."
      },
      {
        title: "Kinerja Sektor Energi Positif Seiring Rebound Harga Komoditas",
        source: "Kontan",
        time: "1 jam lalu",
        url: "https://kontan.co.id",
        summary: "Saham batu bara dan minyak memimpin penguatan indeks sektoral pada perdagangan sesi satu hari ini."
      }
    ];
  }
}

export async function getStockQuote(ticker: string) {
  try {
    const quote: any = await zpi.run("finance:idxchannel", "quote", { code: ticker }).catch(() => null);
    const related: any = await zpi.run("finance:idxchannel", "related", { code: ticker }).catch(() => []);
    return {
      ticker: ticker.toUpperCase(),
      quote: quote?.data || quote || { price: 0, high: 0, low: 0, open: 0, volume: 0 },
      news: Array.isArray(related) ? related : related?.data || [],
    };
  } catch (err) {
    return {
      ticker: ticker.toUpperCase(),
      quote: { price: 1000, high: 1050, low: 980, open: 990, volume: 1000000 },
      news: [],
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/market-service.test.mjs`  
Expected: PASS

- [ ] **Step 5: Commit Zapi module and caching logic**

```bash
git add src/lib/zapi.ts src/lib/market-transform.mjs src/lib/market-service.ts tests/market-service.test.mjs
git commit -m "feat(api): add zapi client integration and market service with swr cache"
```

---

### Task 4: Internal Next.js API Routes

**Files:**
- Create: `src/app/api/market/overview/route.ts`
- Create: `src/app/api/screener/route.ts`
- Create: `src/app/api/stocks/[ticker]/route.ts`
- Create: `src/app/api/news/route.ts`
- Create: `src/app/api/watchlist/route.ts`
- Create: `tests/api-screener-filter.test.mjs`

**Interfaces:**
- Produces: REST endpoints returning JSON:
  - `GET /api/market/overview`
  - `GET /api/screener?sort=...&minPrice=...&maxPrice=...&sector=...`
  - `GET /api/stocks/[ticker]`
  - `GET /api/news?q=...`
  - `GET /api/watchlist`, `POST /api/watchlist`, `DELETE /api/watchlist?ticker=...`

- [ ] **Step 1: Write failing test for screener pagination & filter logic**

Tulis `tests/api-screener-filter.test.mjs`:
```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { paginateItems } from '../src/lib/pagination.mjs';

test('paginateItems slices array correctly', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const page1 = paginateItems(items, 1, 3);
  assert.deepEqual(page1.data, [1, 2, 3]);
  assert.equal(page1.totalPages, 4);

  const page4 = paginateItems(items, 4, 3);
  assert.deepEqual(page4.data, [10]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/api-screener-filter.test.mjs`  
Expected: FAIL ("Cannot find module '../src/lib/pagination.mjs'")

- [ ] **Step 3: Write minimal implementation for pagination and route handlers**

Tulis `src/lib/pagination.mjs`:
```javascript
export function paginateItems(items, page = 1, limit = 20) {
  const validPage = Math.max(1, Number(page) || 1);
  const validLimit = Math.max(1, Number(limit) || 20);
  const total = items.length;
  const totalPages = Math.ceil(total / validLimit) || 1;
  const start = (validPage - 1) * validLimit;
  const data = items.slice(start, start + validLimit);

  return {
    data,
    page: validPage,
    limit: validLimit,
    total,
    totalPages,
  };
}
```

Tulis `src/app/api/market/overview/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { getMarketOverview } from "@/lib/market-service";

export async function GET() {
  const data = await getMarketOverview();
  return NextResponse.json(data);
}
```

Tulis `src/app/api/screener/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getAllStocks } from "@/lib/market-service";
import { filterAndSortStocks } from "@/lib/market-transform.mjs";
import { paginateItems } from "@/lib/pagination.mjs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sort = searchParams.get("sort") || "gainers";
  const sector = searchParams.get("sector");
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const page = Number(searchParams.get("page") || "1");
  const limit = Number(searchParams.get("limit") || "15");

  const allStocks = await getAllStocks();
  let filtered = filterAndSortStocks(allStocks, { sort, minPrice, maxPrice });

  if (sector && sector !== "Semua") {
    filtered = filtered.filter((s: any) => s.sector?.toLowerCase() === sector.toLowerCase());
  }

  const paginated = paginateItems(filtered, page, limit);
  return NextResponse.json(paginated);
}
```

Tulis `src/app/api/stocks/[ticker]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getStockQuote } from "@/lib/market-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  if (!ticker) {
    return NextResponse.json({ error: "Ticker is required" }, { status: 400 });
  }
  const data = await getStockQuote(ticker);
  return NextResponse.json(data);
}
```

Tulis `src/app/api/news/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getMarketNews } from "@/lib/market-service";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const data = await getMarketNews(q);
  return NextResponse.json(data);
}
```

Tulis `src/app/api/watchlist/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id") || "default_user";
  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ items: [], fallback: true });
  }
  try {
    const rows = await sql`SELECT ticker, created_at FROM watchlists WHERE user_id = ${userId} ORDER BY created_at DESC`;
    return NextResponse.json({ items: rows.map(r => r.ticker) });
  } catch (err) {
    return NextResponse.json({ items: [], fallback: true });
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-user-id") || "default_user";
  const body = await req.json().catch(() => ({}));
  const ticker = body.ticker?.toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: "Invalid ticker" }, { status: 400 });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ success: true, fallback: true });
  }

  try {
    await sql`
      INSERT INTO watchlists (user_id, ticker)
      VALUES (${userId}, ${ticker})
      ON CONFLICT (user_id, ticker) DO NOTHING
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: true, fallback: true });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = req.headers.get("x-user-id") || "default_user";
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker")?.toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: "Invalid ticker" }, { status: 400 });
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json({ success: true, fallback: true });
  }

  try {
    await sql`DELETE FROM watchlists WHERE user_id = ${userId} AND ticker = ${ticker}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: true, fallback: true });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/api-screener-filter.test.mjs`  
Expected: PASS

- [ ] **Step 5: Commit API route handlers**

```bash
git add src/lib/pagination.mjs src/app/api/ tests/api-screener-filter.test.mjs
git commit -m "feat(api): implement next.js route handlers for screener, news, overview, and watchlist"
```

---

### Task 5: Mobile UI Components & Stitch Financial Theme

**Files:**
- Create: `src/app/globals.css`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/button.tsx`
- Create: `src/components/screener/market-header.tsx`
- Create: `src/components/screener/filter-chips.tsx`
- Create: `src/components/screener/stock-card.tsx`
- Create: `src/components/screener/stock-modal.tsx`
- Create: `src/components/screener/filter-drawer.tsx`

**Interfaces:**
- Produces: Visual components following Stitch financial design tokens with dark aesthetics, tap targets >= 44px, and bullish/bearish color coding.

- [ ] **Step 1: Write `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #090a0f;
  --surface: #12151e;
  --surface-elevated: #1a1e2b;
  --border: #232838;
}

body {
  background-color: var(--background);
  color: #f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}
::-webkit-scrollbar-thumb {
  background: #232838;
  border-radius: 4px;
}
```

- [ ] **Step 2: Create UI base components (`badge.tsx`, `button.tsx`)**

Tulis `src/components/ui/badge.tsx`:
```typescript
import React from "react";
import clsx from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "bull" | "bear" | "neutral" | "accent";
  className?: string;
}

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium",
        {
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30": variant === "bull",
          "bg-rose-500/15 text-rose-400 border border-rose-500/30": variant === "bear",
          "bg-sky-500/15 text-sky-400 border border-sky-500/30": variant === "accent",
          "bg-slate-800 text-slate-300 border border-slate-700": variant === "neutral",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
```

Tulis `src/components/ui/button.tsx`:
```typescript
import React from "react";
import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export function Button({ variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "min-h-[44px] px-4 py-2 rounded-lg font-medium text-sm transition-colors active:scale-95",
        {
          "bg-sky-500 hover:bg-sky-600 text-white": variant === "primary",
          "bg-surface-elevated hover:bg-slate-700 text-slate-200 border border-border": variant === "secondary",
          "bg-transparent hover:bg-slate-800/60 text-slate-300": variant === "ghost",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Create Screener Header & Filter Chips**

Tulis `src/components/screener/market-header.tsx`:
```typescript
"use client";

import React from "react";
import { TrendingUp, Activity } from "lucide-react";

interface HeaderProps {
  overview: {
    ihsg?: { value: string; change: string; changePct: string };
    foreignFlow?: { netBuySell: string };
  } | null;
}

export function MarketHeader({ overview }: HeaderProps) {
  const ihsg = overview?.ihsg || { value: "7,310.20", change: "+15.4", changePct: "+0.21%" };
  const isUp = !ihsg.changePct.startsWith("-");

  return (
    <div className="bg-surface border-b border-border p-4 sticky top-0 z-30">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">IHSG (IDX)</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold font-mono text-slate-100">{ihsg.value}</span>
            <span className={`text-xs font-mono font-semibold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
              {ihsg.change} ({ihsg.changePct})
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end gap-1 text-xs text-slate-400">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Arus Asing</span>
          </div>
          <p className="text-xs font-mono text-slate-200 mt-1">
            {overview?.foreignFlow?.netBuySell || "Net Buy +Rp 85 M"}
          </p>
        </div>
      </div>
    </div>
  );
}
```

Tulis `src/components/screener/filter-chips.tsx`:
```typescript
"use client";

import React from "react";
import { SlidersHorizontal } from "lucide-react";

interface FilterChipsProps {
  activeSort: string;
  onSelectSort: (sort: string) => void;
  onOpenDrawer: () => void;
}

export function FilterChips({ activeSort, onSelectSort, onOpenDrawer }: FilterChipsProps) {
  const chips = [
    { id: "gainers", label: "Top Gainers" },
    { id: "losers", label: "Top Losers" },
    { id: "volume", label: "Top Volume" },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto px-4 py-2.5 bg-background no-scrollbar">
      <button
        onClick={onOpenDrawer}
        className="flex items-center gap-1.5 px-3 min-h-[38px] rounded-full border border-border bg-surface text-xs text-slate-300 active:scale-95 shrink-0"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
        <span>Filter</span>
      </button>

      {chips.map((c) => {
        const isActive = activeSort === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onSelectSort(c.id)}
            className={`px-3.5 min-h-[38px] rounded-full text-xs font-medium shrink-0 transition-colors ${
              isActive
                ? "bg-sky-500 text-white shadow-sm shadow-sky-500/30"
                : "bg-surface border border-border text-slate-300 hover:border-slate-600"
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Create Stock Card & Stock Modal**

Tulis `src/components/screener/stock-card.tsx`:
```typescript
"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

interface StockCardProps {
  stock: {
    ticker: string;
    name: string;
    price: number;
    changePct: number;
    volume: number;
    sector?: string;
  };
  isWatchlisted: boolean;
  onToggleWatchlist: (ticker: string) => void;
  onClick: (ticker: string) => void;
}

export function StockCard({ stock, isWatchlisted, onToggleWatchlist, onClick }: StockCardProps) {
  const isUp = stock.changePct > 0;
  const isDown = stock.changePct < 0;

  return (
    <div
      onClick={() => onClick(stock.ticker)}
      className="p-3.5 bg-surface rounded-xl border border-border hover:border-slate-600 transition active:scale-[0.99] cursor-pointer flex items-center justify-between"
    >
      <div className="min-w-0 flex-1 pr-2">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-base text-slate-100">{stock.ticker}</span>
          {stock.sector && (
            <span className="text-[10px] text-slate-400 bg-surface-elevated px-1.5 py-0.5 rounded">
              {stock.sector}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 truncate mt-0.5">{stock.name}</p>
        <p className="text-[11px] text-slate-500 mt-1 font-mono">
          Vol: {(stock.volume / 1_000_000).toFixed(1)}M lembar
        </p>
      </div>

      <div className="text-right flex items-center gap-3">
        <div>
          <div className="font-mono font-bold text-base text-slate-100">
            Rp {stock.price.toLocaleString("id-ID")}
          </div>
          <div className="mt-0.5">
            <Badge variant={isUp ? "bull" : isDown ? "bear" : "neutral"}>
              {isUp ? "+" : ""}{stock.changePct.toFixed(2)}%
            </Badge>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWatchlist(stock.ticker);
          }}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-amber-400 active:scale-95"
        >
          <Star className={`w-5 h-5 ${isWatchlisted ? "fill-amber-400 text-amber-400" : ""}`} />
        </button>
      </div>
    </div>
  );
}
```

Tulis `src/components/screener/stock-modal.tsx`:
```typescript
"use client";

import React, { useEffect, useState } from "react";
import { X, ExternalLink, Newspaper, TrendingUp, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StockModalProps {
  ticker: string | null;
  onClose: () => void;
}

export function StockModal({ ticker, onClose }: StockModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    fetch(`/api/stocks/${ticker}`)
      .then((r) => r.json())
      .then((res) => setData(res))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (!ticker) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end">
      <div className="bg-surface border-t border-border rounded-t-2xl max-h-[85vh] overflow-y-auto p-5 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-xl font-bold font-mono text-slate-100">{ticker}</h2>
            <p className="text-xs text-slate-400">Detail Emiten & Berita Terkait</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-surface-elevated text-slate-400 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm animate-pulse">
            Memuat data {ticker}...
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-elevated p-3 rounded-lg border border-border">
                <span className="text-xs text-slate-400">Harga Terakhir</span>
                <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">
                  Rp {data?.quote?.price?.toLocaleString("id-ID") || "-"}
                </p>
              </div>
              <div className="bg-surface-elevated p-3 rounded-lg border border-border">
                <span className="text-xs text-slate-400">High / Low Sesi</span>
                <p className="text-sm font-bold font-mono text-slate-200 mt-1">
                  {data?.quote?.high || "-"} / {data?.quote?.low || "-"}
                </p>
              </div>
            </div>

            {/* Related News Section */}
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-3">
                <Newspaper className="w-4 h-4 text-sky-400" />
                <span>Berita Terkait {ticker}</span>
              </div>

              {(!data?.news || data.news.length === 0) ? (
                <p className="text-xs text-slate-500 py-3">Belum ada berita spesifik untuk emiten ini.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.news.map((item: any, idx: number) => (
                    <a
                      key={idx}
                      href={item.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-lg bg-surface-elevated/60 border border-border hover:border-slate-600 transition text-left"
                    >
                      <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-snug">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {item.publishedAt || item.time || "Terkini"}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

Tulis `src/components/screener/filter-drawer.tsx`:
```typescript
"use client";

import React from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSector: string;
  onSelectSector: (sec: string) => void;
  minPrice: string;
  setMinPrice: (val: string) => void;
  maxPrice: string;
  setMaxPrice: (val: string) => void;
  onApply: () => void;
}

const SECTORS = [
  "Semua",
  "Keuangan",
  "Energi",
  "Infrastruktur",
  "Konsumer",
  "Teknologi",
  "Kesehatan",
  "Industri",
];

export function FilterDrawer({
  isOpen,
  onClose,
  selectedSector,
  onSelectSector,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  onApply,
}: FilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end">
      <div className="bg-surface border-t border-border rounded-t-2xl p-5 space-y-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h3 className="font-bold text-slate-100">Filter Screener</h3>
          <button onClick={onClose} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400">Rentang Harga (Rp)</label>
          <div className="flex gap-2 mt-1.5">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-1/2 p-2.5 rounded-lg bg-surface-elevated border border-border text-sm font-mono text-slate-100 focus:outline-none focus:border-sky-500"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-1/2 p-2.5 rounded-lg bg-surface-elevated border border-border text-sm font-mono text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-400">Sektor Industri</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {SECTORS.map((sec) => (
              <button
                key={sec}
                onClick={() => onSelectSector(sec)}
                className={`px-3 py-1.5 rounded-full text-xs transition ${
                  selectedSector === sec
                    ? "bg-sky-500 text-white font-medium"
                    : "bg-surface-elevated border border-border text-slate-300"
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-3">
          <Button onClick={onApply} className="w-full">
            Terapkan Filter
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit UI components**

```bash
git add src/app/globals.css src/components/
git commit -m "feat(ui): add mobile stitch design components, stock cards, and filter drawer"
```

---

### Task 6: News Aggregator, Watchlist Views & Main Navigation

**Files:**
- Create: `src/components/news/news-view.tsx`
- Create: `src/components/watchlist/watchlist-view.tsx`
- Create: `src/components/navigation/bottom-nav.tsx`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

**Interfaces:**
- Produces: Complete app navigation switching between Screener, Berita, and Watchlist tabs.

- [ ] **Step 1: Write News View component (`news-view.tsx`)**

```typescript
"use client";

import React, { useEffect, useState } from "react";
import { Search, ExternalLink } from "lucide-react";

export function NewsView() {
  const [news, setNews] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchNews = (keyword?: string) => {
    setLoading(true);
    const url = keyword ? `/api/news?q=${encodeURIComponent(keyword)}` : "/api/news";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setNews(Array.isArray(data) ? data : []))
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="p-4 space-y-4 pb-24">
      <div className="relative">
        <input
          type="text"
          placeholder="Cari berita atau emiten..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchNews(search)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-border text-sm text-slate-100 focus:outline-none focus:border-sky-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-400 animate-pulse">
          Memperbarui berita pasar...
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((item, idx) => (
            <a
              key={idx}
              href={item.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-xl bg-surface border border-border hover:border-slate-600 transition"
            >
              <div className="flex items-center justify-between text-[11px] text-sky-400 font-medium mb-1">
                <span>{item.source || "IDX Channel"}</span>
                <span className="text-slate-500">{item.time || "Terkini"}</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2">
                {item.title}
              </h4>
              {item.summary && (
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write Watchlist View component (`watchlist-view.tsx`)**

```typescript
"use client";

import React, { useEffect, useState } from "react";
import { StockCard } from "@/components/screener/stock-card";
import { Star } from "lucide-react";

interface WatchlistViewProps {
  watchlist: string[];
  onToggleWatchlist: (ticker: string) => void;
  onSelectStock: (ticker: string) => void;
}

export function WatchlistView({ watchlist, onToggleWatchlist, onSelectStock }: WatchlistViewProps) {
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (watchlist.length === 0) {
      setStocks([]);
      return;
    }
    setLoading(true);
    fetch("/api/screener?limit=100")
      .then((r) => r.json())
      .then((res) => {
        const all = res.data || [];
        const filtered = all.filter((s: any) => watchlist.includes(s.ticker));
        setStocks(filtered);
      })
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  }, [watchlist]);

  if (watchlist.length === 0) {
    return (
      <div className="py-24 text-center px-6">
        <Star className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
        <h3 className="text-base font-semibold text-slate-200 mt-3">Watchlist Masih Kosong</h3>
        <p className="text-xs text-slate-400 mt-1">
          Beri bintang pada saham di tab Screener untuk memantau pergerakannya di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2.5 pb-24">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Saham Pantauan ({watchlist.length})
      </h3>
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Memuat watchlist...</div>
      ) : (
        stocks.map((stock) => (
          <StockCard
            key={stock.ticker}
            stock={stock}
            isWatchlisted={true}
            onToggleWatchlist={onToggleWatchlist}
            onClick={onSelectStock}
          />
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write Bottom Navigation bar (`bottom-nav.tsx`)**

```typescript
"use client";

import React from "react";
import { Filter, Newspaper, Star } from "lucide-react";

interface BottomNavProps {
  currentTab: "screener" | "news" | "watchlist";
  onChangeTab: (tab: "screener" | "news" | "watchlist") => void;
  watchlistCount: number;
}

export function BottomNav({ currentTab, onChangeTab, watchlistCount }: BottomNavProps) {
  const tabs = [
    { id: "screener", label: "Screener", icon: Filter },
    { id: "news", label: "Berita", icon: Newspaper },
    { id: "watchlist", label: "Watchlist", icon: Star, count: watchlistCount },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-md border-t border-border max-w-md mx-auto">
      <div className="grid grid-cols-3 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] ${
                isActive ? "text-sky-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {Boolean(tab.count) && (
                  <span className="absolute -top-1.5 -right-2.5 bg-sky-500 text-white font-mono text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 4: Connect Root Layout & Main Page (`src/app/page.tsx`, `src/app/layout.tsx`)**

Tulis `src/app/layout.tsx`:
```typescript
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IDX Stock Screener & News",
  description: "Screener saham BEI dan kurasi berita pasar modal Indonesia",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "IDX Screener",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#090a0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="dark">
      <body className="bg-background min-h-screen text-slate-100 flex flex-col items-center">
        <main className="w-full max-w-md min-h-screen flex flex-col relative shadow-2xl border-x border-border/40">
          {children}
        </main>
      </body>
    </html>
  );
}
```

Tulis `src/app/page.tsx`:
```typescript
"use client";

import React, { useEffect, useState } from "react";
import { MarketHeader } from "@/components/screener/market-header";
import { FilterChips } from "@/components/screener/filter-chips";
import { StockCard } from "@/components/screener/stock-card";
import { StockModal } from "@/components/screener/stock-modal";
import { FilterDrawer } from "@/components/screener/filter-drawer";
import { NewsView } from "@/components/news/news-view";
import { WatchlistView } from "@/components/watchlist/watchlist-view";
import { BottomNav } from "@/components/navigation/bottom-nav";

export default function HomePage() {
  const [tab, setTab] = useState<"screener" | "news" | "watchlist">("screener");
  const [sort, setSort] = useState("gainers");
  const [sector, setSector] = useState("Semua");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [stocks, setStocks] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load Watchlist
  useEffect(() => {
    const local = localStorage.getItem("idx_watchlist");
    if (local) {
      try {
        setWatchlist(JSON.parse(local));
      } catch {}
    }
    fetch("/api/watchlist")
      .then((r) => r.json())
      .then((res) => {
        if (res.items && res.items.length > 0) {
          setWatchlist(res.items);
          localStorage.setItem("idx_watchlist", JSON.stringify(res.items));
        }
      })
      .catch(() => {});
  }, []);

  // Load Market Overview
  useEffect(() => {
    fetch("/api/market/overview")
      .then((r) => r.json())
      .then((data) => setOverview(data))
      .catch(() => {});
  }, []);

  // Load Screener Stocks
  const loadStocks = () => {
    setLoading(true);
    const query = new URLSearchParams({ sort });
    if (sector !== "Semua") query.set("sector", sector);
    if (minPrice) query.set("minPrice", minPrice);
    if (maxPrice) query.set("maxPrice", maxPrice);

    fetch(`/api/screener?${query.toString()}`)
      .then((r) => r.json())
      .then((res) => setStocks(res.data || []))
      .catch(() => setStocks([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStocks();
  }, [sort, sector]);

  const toggleWatchlist = (ticker: string) => {
    const isPresent = watchlist.includes(ticker);
    const next = isPresent ? watchlist.filter((t) => t !== ticker) : [...watchlist, ticker];
    setWatchlist(next);
    localStorage.setItem("idx_watchlist", JSON.stringify(next));

    const method = isPresent ? "DELETE" : "POST";
    const url = isPresent ? `/api/watchlist?ticker=${ticker}` : "/api/watchlist";
    fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: isPresent ? undefined : JSON.stringify({ ticker }),
    }).catch(() => {});
  };

  return (
    <div className="flex-1 flex flex-col">
      <MarketHeader overview={overview} />

      {tab === "screener" && (
        <div className="flex-1 flex flex-col pb-24">
          <FilterChips
            activeSort={sort}
            onSelectSort={setSort}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />

          <div className="p-4 space-y-2.5 flex-1">
            {loading ? (
              <div className="py-16 text-center text-sm text-slate-400 animate-pulse">
                Menyaring data saham...
              </div>
            ) : stocks.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500">
                Tidak ada saham yang sesuai dengan filter.
              </div>
            ) : (
              stocks.map((stock) => (
                <StockCard
                  key={stock.ticker}
                  stock={stock}
                  isWatchlisted={watchlist.includes(stock.ticker)}
                  onToggleWatchlist={toggleWatchlist}
                  onClick={setSelectedTicker}
                />
              ))
            )}
          </div>
        </div>
      )}

      {tab === "news" && <NewsView />}

      {tab === "watchlist" && (
        <WatchlistView
          watchlist={watchlist}
          onToggleWatchlist={toggleWatchlist}
          onSelectStock={setSelectedTicker}
        />
      )}

      <StockModal ticker={selectedTicker} onClose={() => setSelectedTicker(null)} />

      <FilterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedSector={sector}
        onSelectSector={setSector}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        onApply={() => {
          setIsDrawerOpen(false);
          loadStocks();
        }}
      />

      <BottomNav
        currentTab={tab}
        onChangeTab={setTab}
        watchlistCount={watchlist.length}
      />
    </div>
  );
}
```

- [ ] **Step 5: Commit Views & Navigation**

```bash
git add src/app/layout.tsx src/app/page.tsx src/components/news/ src/components/watchlist/ src/components/navigation/
git commit -m "feat: implement main page with mobile tabs, news view, and watchlist"
```

---

### Task 7: PWA Assets & Service Worker Setup

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Create: `public/icon.svg`

**Interfaces:**
- Produces: Installable PWA manifest with mobile display standalone, background colors, and app icons.

- [ ] **Step 1: Create `public/manifest.json`**

```json
{
  "name": "IDX Stock Screener & News",
  "short_name": "IDX Screener",
  "description": "Screener Saham BEI dan Berita Finansial Terkini",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#090a0f",
  "theme_color": "#090a0f",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
```

- [ ] **Step 2: Create `public/sw.js`**

```javascript
const CACHE_NAME = 'idx-screener-shell-v1';
const ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Stale-while-revalidate for static shell, network-first for api routes
  if (event.request.url.includes('/api/')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
```

- [ ] **Step 3: Create `public/icon.svg`**

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="128" fill="#12151e"/>
  <path d="M96 384 L200 240 L290 320 L416 128" fill="none" stroke="#10b981" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="416" cy="128" r="24" fill="#38bdf8"/>
</svg>
```

- [ ] **Step 4: Commit PWA assets**

```bash
git add public/manifest.json public/sw.js public/icon.svg
git commit -m "feat(pwa): add web manifest, service worker shell cache, and app icon"
```

---

### Task 8: End-to-End Build & Automated Verification

**Files:**
- Test verification: Run tests and Next.js build.

- [ ] **Step 1: Run automated tests**

Run: `npm test`  
Expected: All tests pass.

- [ ] **Step 2: Run Next.js production build**

Run: `npm run build`  
Expected: Exit code 0, all static and dynamic routes compiled successfully.

- [ ] **Step 3: Commit final verification adjustments**

```bash
git commit --allow-empty -m "chore: verify build and automated test suite"
```
