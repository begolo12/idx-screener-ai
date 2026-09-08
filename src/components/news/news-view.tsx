"use client";

import React, { useEffect, useState } from "react";
import { Search, X, RotateCcw, Newspaper, ExternalLink } from "lucide-react";
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
    <div className="p-4 space-y-3 pb-28 w-full max-w-md mx-auto">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative flex items-center">
        <input
          type="text"
          placeholder="Cari berita pasar atau emiten..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        {search && (
          <button
            type="button"
            onClick={handleResetSearch}
            className="p-1.5 absolute right-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* News List */}
      {loading ? (
        <SkeletonCard type="news" count={4} />
      ) : news.length === 0 ? (
        <div className="py-16 text-center px-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Newspaper className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-800">
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
        <div className="space-y-2.5">
          {news.map((item, idx) => (
            <a
              key={idx}
              href={item.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition duration-150 active:scale-[0.99] space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px] font-semibold text-blue-700">
                <span>{item.source || "IDX Channel"}</span>
                <span className="text-slate-400 font-normal">{item.time || "Terkini"}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                {item.title}
              </h4>
              {item.summary && (
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
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
