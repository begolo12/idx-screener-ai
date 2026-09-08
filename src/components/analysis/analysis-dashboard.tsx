"use client";

import { useState, useEffect } from "react";
import { Send, Newspaper, CheckCircle2, Clock, RotateCcw, Sparkles } from "lucide-react";

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
  const [koranWebhookUrl, setKoranWebhookUrl] = useState(
    "https://discordapp.com/api/webhooks/1546828851198435359/4L4bvtR2MoKVPdVja--roBVaJw6pOBUCSH_qQS6A9GrTtJO9i9a4izII6T60PFDvtTXW"
  );
  const [isSaved, setIsSaved] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [publishingKoran, setPublishingKoran] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [koranResult, setKoranResult] = useState<{ success: boolean; message: string } | null>(null);
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
    const savedKoran = localStorage.getItem("idx_koran_webhook");
    if (savedKoran) {
      setKoranWebhookUrl(savedKoran);
    }
  }, []);

  // Countdown timer to next session (10:00 or 15:00 WIB)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
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
    localStorage.setItem("idx_koran_webhook", koranWebhookUrl.trim());
    setIsSaved(true);
    setTestResult({ success: true, message: "Webhook URL berhasil disimpan di peramban." });
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
          ? "Laporan 6 sektor lengkap berhasil dibuat dan dikirim ke Discord!"
          : "Laporan berhasil dibuat (Discord: " + (data.report.discordError || "periksa URL Webhook") + ").";
        setTestResult({ success: data.report.discordDispatched, message: msg });
      } else {
        setTestResult({ success: false, message: data.error || "Gagal menghasilkan analisa." });
      }
    } catch {
      setTestResult({ success: false, message: "Gagal memanggil generator analisa." });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handlePublishKoran = async () => {
    setPublishingKoran(true);
    setKoranResult(null);
    try {
      const res = await fetch("/api/cron/koran-saham", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: koranWebhookUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.koran?.discordDispatched) {
        setKoranResult({
          success: true,
          message: `Koran Harian Saham berhasil diterbitkan ke Discord! Headline: "${data.koran.headlineStory.slice(0, 70)}..."`,
        });
      } else {
        setKoranResult({
          success: false,
          message: data.koran?.discordError || data.error || "Gagal menerbitkan koran harian.",
        });
      }
    } catch {
      setKoranResult({ success: false, message: "Gagal menghubungi server penerbitan koran." });
    } finally {
      setPublishingKoran(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 w-full max-w-md mx-auto">
      {/* Header Info Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Otomatisasi Laporan Pasar & Discord
              </h2>
            </div>
            <div className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{countdown || "Menghitung..."}</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Terjadwal otomatis tiap sesi bursa: 10:00 WIB (Sesi 1) & 15:00 WIB (Penutupan).
          </p>
        </div>
      </div>

      {/* Discord Webhook Setup Card (Analisa Pasar) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              DC
            </div>
            <h3 className="text-xs font-bold text-slate-900">Webhook Laporan Analisa</h3>
          </div>
          {isSaved && (
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Tersimpan
            </span>
          )}
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => {
              setWebhookUrl(e.target.value);
              setIsSaved(false);
            }}
            placeholder="https://discord.com/api/webhooks/..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none transition"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveWebhook}
              className="flex-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
            >
              Simpan
            </button>
            <button
              onClick={handleTestWebhook}
              disabled={testingWebhook || !webhookUrl}
              className="flex-1 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5"
            >
              {testingWebhook ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Send className="w-3 h-3" />
                  <span>Tes Ping</span>
                </>
              )}
            </button>
          </div>
        </div>

        {testResult && (
          <div
            className={`text-xs p-2.5 rounded-xl border ${
              testResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {testResult.message}
          </div>
        )}
      </div>

      {/* Koran Harian Saham Webhook Setup Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Newspaper className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Koran Harian Pasar Modal</h3>
              <p className="text-[11px] text-slate-500">
                Berita utama pasar, kurs rupiah, komoditas, dan aksi korporasi.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={koranWebhookUrl}
            onChange={(e) => setKoranWebhookUrl(e.target.value)}
            placeholder="URL Webhook Koran Discord..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none transition"
          />
          <button
            onClick={handlePublishKoran}
            disabled={publishingKoran}
            className="w-full rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            {publishingKoran ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Menerbitkan Koran...</span>
              </>
            ) : (
              <>
                <Newspaper className="w-3.5 h-3.5" />
                <span>Terbitkan Koran Harian Sekarang</span>
              </>
            )}
          </button>
        </div>

        {koranResult && (
          <div
            className={`text-xs p-2.5 rounded-xl border ${
              koranResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-medium"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            {koranResult.message}
          </div>
        )}
      </div>

      {/* Manual Trigger & Session Selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900">Kirim Laporan Analisa 6 Sektor (On-Demand)</h3>
        <div className="space-y-2.5">
          <div className="p-1 bg-slate-100 rounded-xl flex gap-1 text-xs">
            <button
              onClick={() => setSelectedSession("morning")}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition ${
                selectedSession === "morning"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sesi 1 (10:00 WIB)
            </button>
            <button
              onClick={() => setSelectedSession("closing")}
              className={`flex-1 py-1.5 rounded-lg text-center font-semibold transition ${
                selectedSession === "closing"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sesi 2 (15:00 WIB)
            </button>
          </div>

          <button
            onClick={handleGenerateReport}
            disabled={generatingReport}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-1.5 shadow-xs"
          >
            {generatingReport ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Memproses Analisa 6 Sektor & DeepSeek...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate & Kirim Laporan Lengkap</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Generated Report Preview */}
      {report && (
        <div className="rounded-2xl border border-emerald-200 bg-white p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                {report.session === "morning" ? "Laporan Sesi 1 (10:00 WIB)" : "Laporan Penutupan (15:00 WIB)"}
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-1">
                IHSG {report.ihsg.value} ({report.ihsg.change} / {report.ihsg.changePct})
              </h4>
            </div>
            <div className="text-right text-[11px] text-slate-400 font-mono">
              Terbit: {report.generatedAt} WIB
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Arus Dana Asing:</span>
              <p className="font-semibold text-slate-900 mt-0.5">{report.foreignFlow}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
              <span className="text-[10px] text-slate-500 block">AI Strategy Lab:</span>
              <p className="font-semibold text-blue-700 mt-0.5">{report.activeScheme} ({report.winRate}% Win)</p>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-xs leading-relaxed text-slate-800 whitespace-pre-line max-h-96 overflow-y-auto">
            {report.aiAnalysis}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
            <span>Status Discord:</span>
            <span className={report.discordDispatched ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
              {report.discordDispatched ? "✓ Berhasil Terkirim ke Webhook" : "Gagal kirim: " + (report.discordError || "periksa webhook")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
