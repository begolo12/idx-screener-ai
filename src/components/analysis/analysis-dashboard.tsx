"use client";

import { useState, useEffect } from "react";

interface AnalysisReport {
  session: "morning" | "closing";
  generatedAt: string;
  ihsg: {
    value: string;
    change: string;
    changePct: string;
  };
  foreignFlow: string;
  aiAnalysis: string;
  activeScheme: string;
  winRate: number;
  discordDispatched: boolean;
  discordError?: string;
}

export function AnalysisDashboard() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedSession, setSelectedSession] = useState<"morning" | "closing">("morning");
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [countdown, setCountdown] = useState("");

  // Load saved webhook on mount
  useEffect(() => {
    const saved = localStorage.getItem("idx_discord_webhook");
    if (saved) {
      setWebhookUrl(saved);
      setIsSaved(true);
    }
  }, []);

  // Countdown timer to next session (10:00 or 15:00 WIB)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // WIB is UTC+7
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const wib = new Date(utc + 7 * 3600000);

      const hour = wib.getHours();
      const minute = wib.getMinutes();
      const second = wib.getSeconds();

      let targetHour = 10;
      let targetLabel = "Sesi 1 (10:00 WIB)";

      if (hour < 10) {
        targetHour = 10;
        targetLabel = "Sesi 1 (10:00 WIB)";
      } else if (hour < 15) {
        targetHour = 15;
        targetLabel = "Sesi 2 (15:00 WIB)";
      } else {
        targetHour = 34; // next day 10:00 WIB
        targetLabel = "Besok (10:00 WIB)";
      }

      const currentTotalSec = hour * 3600 + minute * 60 + second;
      const targetTotalSec = targetHour * 3600;
      const diffSec = targetTotalSec - currentTotalSec;

      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      const s = diffSec % 60;

      setCountdown(
        `${targetLabel}: ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveWebhook = () => {
    localStorage.setItem("idx_discord_webhook", webhookUrl.trim());
    setIsSaved(true);
    setTestResult({ success: true, message: "Webhook URL berhasil disimpan di browser." });
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      setTestResult({ success: false, message: "Masukkan URL Discord Webhook terlebih dahulu." });
      return;
    }
    setTestingWebhook(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/discord/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: webhookUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: "Pesan uji berhasil terkirim ke Discord!" });
      } else {
        setTestResult({ success: false, message: data.error || "Gagal mengirim ke Discord." });
      }
    } catch {
      setTestResult({ success: false, message: "Koneksi ke server gagal." });
    } finally {
      setTestingWebhook(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/cron/market-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session: selectedSession,
          webhookUrl: webhookUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
        const msg = data.report.discordDispatched
          ? "Analisa berhasil dibuat dan dikirim ke Discord!"
          : "Analisa berhasil dibuat (belum terkirim ke Discord: periksa URL Webhook).";
        setTestResult({ success: true, message: msg });
      } else {
        setTestResult({ success: false, message: data.error || "Gagal menghasilkan analisa." });
      }
    } catch {
      setTestResult({ success: false, message: "Gagal memanggil generator analisa." });
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Info Banner */}
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-card to-secondary/30 p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Otomatisasi Analisa Pasar & Discord
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Jadwal harian pukul 10:00 WIB (Sesi 1) & 15:00 WIB (Sesi 2 penutupan).
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-mono font-medium text-emerald-400">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {countdown || "Menghitung jadwal..."}
          </div>
        </div>
      </div>

      {/* Discord Webhook Setup Card */}
      <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5865F2]/20 text-[#5865F2]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-foreground">Discord Webhook Target</h3>
          </div>
          {isSaved && (
            <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Tersimpan
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => {
              setWebhookUrl(e.target.value);
              setIsSaved(false);
            }}
            placeholder="https://discord.com/api/webhooks/..."
            className="flex-1 rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveWebhook}
              className="rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Simpan
            </button>
            <button
              onClick={handleTestWebhook}
              disabled={testingWebhook || !webhookUrl}
              className="rounded-lg bg-[#5865F2] px-3 py-2 text-xs font-medium text-white hover:bg-[#4752C4] disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {testingWebhook ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                "Tes Ping"
              )}
            </button>
          </div>
        </div>

        {testResult && (
          <div
            className={`text-xs p-2.5 rounded-lg border ${
              testResult.success
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}
          >
            {testResult.message}
          </div>
        )}
      </div>

      {/* Manual Trigger & Session Selector */}
      <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground">Kirim Laporan Manual (On-Demand)</h3>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg bg-secondary/50 p-1 border border-border">
            <button
              onClick={() => setSelectedSession("morning")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedSession === "morning"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sesi 1 (10:00 WIB)
            </button>
            <button
              onClick={() => setSelectedSession("closing")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                selectedSession === "closing"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sesi 2 (15:00 WIB)
            </button>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            {generatingReport ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Memproses Data TradingView & DeepSeek...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate & Kirim ke Discord</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Generated Report Preview */}
      {report && (
        <div className="rounded-xl border border-emerald-500/30 bg-card p-4 space-y-3 shadow-md">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                {report.session === "morning" ? "Laporan Pagi (10:00 WIB)" : "Laporan Penutupan (15:00 WIB)"}
              </span>
              <h4 className="text-sm font-bold text-foreground mt-1">
                IHSG {report.ihsg.value} ({report.ihsg.change} / {report.ihsg.changePct})
              </h4>
            </div>
            <div className="text-right text-[11px] text-muted-foreground font-mono">
              Terbit: {report.generatedAt} WIB
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-secondary/30 p-2.5 border border-border/50">
              <span className="text-[11px] text-muted-foreground">Arus Dana Asing:</span>
              <p className="font-semibold text-foreground mt-0.5">{report.foreignFlow}</p>
            </div>
            <div className="rounded-lg bg-secondary/30 p-2.5 border border-border/50">
              <span className="text-[11px] text-muted-foreground">AI Strategy Lab:</span>
              <p className="font-semibold text-emerald-400 mt-0.5">{report.activeScheme} ({report.winRate}% Win)</p>
            </div>
          </div>

          <div className="rounded-lg bg-secondary/20 p-3.5 border border-border/40 text-xs leading-relaxed text-foreground whitespace-pre-line font-sans">
            {report.aiAnalysis}
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
            <span>Status Pengiriman Discord:</span>
            <span className={report.discordDispatched ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
              {report.discordDispatched ? "✓ Berhasil Terkirim ke Webhook" : "Tidak terkirim (Webhook belum diisi)"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
