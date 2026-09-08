"use client";

import React, { useEffect, useState } from "react";
import { Search, X, RotateCcw } from "lucide-react";
import { SkeletonCard } from "@/components/ui/skeleton-card";
import { Button } from "@/components/ui/button";

export function NewsView() {
  const [news, setNews] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(search);
    fetchNews(search);
  };

  const handleResetSearch = () => {
    setSearch("");
    setSubmittedQuery("");
    fetchNews();
  };

  return (
    <div className="p-4 space-y-4 pb-28 w-full max-w-md mx-auto">
      <form onSubmit={handleSearch} className="relative flex items-center">
        <input
          type="text"
          placeholder="Cari berita atau kode saham..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-surface border border-border text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
        {search && (
          <button
            type="button"
            onClick={handleResetSearch}
            className="p-2 min-h-[44px] min-w-[44px] absolute right-1 text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {loading ? (
        <SkeletonCard type="news" count={4} />
      ) : news.length === 0 ? (
        <div className="py-16 text-center px-4 bg-surface rounded-xl border border-border">
          <p className="text-sm text-slate-300 font-medium">
            Tidak ditemukan berita untuk &quot;{submittedQuery}&quot;
          </p>
          <p className="text-xs text-slate-500 mt-1">Coba kata kunci lain atau tampilkan seluruh berita pasar.</p>
          <div className="mt-4">
            <Button variant="secondary" onClick={handleResetSearch} className="mx-auto">
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Kembalikan Berita Utama
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((item, idx) => (
            <a
              key={idx}
              href={item.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-xl bg-surface border border-border hover:border-slate-600 transition duration-150"
            >
              <div className="flex items-center justify-between text-[11px] text-sky-400 font-medium mb-1.5">
                <span>{item.source || "IDX Channel"}</span>
                <span className="text-slate-500 font-mono">{item.time || "Terkini"}</span>
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
