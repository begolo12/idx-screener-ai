# Automated Market Analysis & Discord Dispatcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated market analysis generator (scheduled at 10:00 WIB & 15:00 WIB) with TradingView technical signals and automated Discord Webhook dispatching, complete with a dedicated UI dashboard in the PWA.

**Architecture:** TradingView Scanner API provides real-time IDX prices and technical indicators (RSI, MACD, EMAs). An analytics engine computes breakout, oversold, and index momentum signals. A report generator synthesizes these into Morning Pulse (10:00 WIB) and Market Wrap (15:00 WIB) reports. Reports are formatted as Discord Rich Embeds and pushed via Discord Webhook, triggered by Vercel Cron or on-demand from the UI.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, TradingView Scanner API, Discord Webhook API, Vercel Cron.

---

### Task 1: Technical Indicators Engine
- File: `src/lib/technical-analysis.ts`
- Fetch TradingView Scanner with columns: `name, close, change, RSI, MACD.macd, MACD.signal, Recommend.All, EMA20, EMA50, SMA200, volume, Value.Traded`.
- Functions: `getMarketTechnicalSummary()`, `getTopBreakoutStocks()`, `getOversoldReboundStocks()`.

### Task 2: Market Report Generator
- File: `src/lib/report-generator.ts`
- Generate morning report (10:00 WIB) and closing report (15:00 WIB).
- Combines IHSG status, top mover stocks, technical flags (Golden Cross, RSI alert), and top news headlines.

### Task 3: Discord Webhook Service
- File: `src/lib/discord-service.ts`
- Format Discord Embed payload (colors, fields, author, footer, timestamps).
- Deliver via native `fetch` to webhook URL. Handles error codes and validation.

### Task 4: API Endpoint & Cron Definition
- File: `src/app/api/cron/market-report/route.ts` & `vercel.json`
- Supports `GET /api/cron/market-report?session=morning` and `session=closing`.
- Allows test run with custom or configured webhook URL.

### Task 5: UI Dashboard & Tab
- File: `src/components/analysis/analysis-dashboard.tsx`
- Tab in bottom navigation ("Analisa").
- Displays live preview of latest generated report, countdown to next scheduled broadcast (10:00 / 15:00 WIB), Discord Webhook settings field, and "Kirim ke Discord Sekarang" test button.
