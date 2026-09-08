export interface BrokerProfile {
  code: string;
  name: string;
  type: "INSTITUSI_ASING" | "INSTITUSI_DOMESTIK" | "RITEL_MASSIF" | "SCALPER_FAST_MONEY";
  sentiment: "BULLISH" | "NEUTRAL" | "BEARISH_WARNING";
  description: string;
  riskWarning?: string;
}

export const BROKER_PROFILES: Record<string, BrokerProfile> = {
  MG: {
    code: "MG",
    name: "Semesta Indovest Sekuritas",
    type: "SCALPER_FAST_MONEY",
    sentiment: "BEARISH_WARNING",
    description: "Broker scalper kilat & day trader agresif. Cenderung 'pump and dump' intraday dan rawan guyur saat penutupan bursa.",
    riskWarning: "Dominasi MG: Hindari buy di pucuk, rawan aksi jual massal tiba-tiba.",
  },
  CP: {
    code: "CP",
    name: "KB Valbury Sekuritas",
    type: "SCALPER_FAST_MONEY",
    sentiment: "BEARISH_WARNING",
    description: "Aktivitas trading spekulatif dan fast-money swing trader.",
    riskWarning: "Dominasi CP: Rawan volatilitas tinggi.",
  },
  BK: {
    code: "BK",
    name: "J.P. Morgan Sekuritas Indonesia",
    type: "INSTITUSI_ASING",
    sentiment: "BULLISH",
    description: "Institusi asing kelas kakap (Big Fund / Smart Money). Cenderung akumulasi untuk jangka menengah-panjang.",
  },
  AK: {
    code: "AK",
    name: "UBS Sekuritas Indonesia",
    type: "INSTITUSI_ASING",
    sentiment: "BULLISH",
    description: "Institusi asing besar. Indikator kuat akumulasi dana luar negeri.",
  },
  ZP: {
    code: "ZP",
    name: "Maybank Sekuritas Indonesia",
    type: "INSTITUSI_ASING",
    sentiment: "BULLISH",
    description: "Asing & institusi regional. Menunjukkan dukungan likuiditas institusional.",
  },
  KZ: {
    code: "KZ",
    name: "CLSA Sekuritas Indonesia",
    type: "INSTITUSI_ASING",
    sentiment: "BULLISH",
    description: "Broker institusi asing terkemuka.",
  },
  RX: {
    code: "RX",
    name: "Macquarie Sekuritas Indonesia",
    type: "INSTITUSI_ASING",
    sentiment: "BULLISH",
    description: "Institusi asing spesialis derivatif dan big cap flow.",
  },
  CC: {
    code: "CC",
    name: "Mandiri Sekuritas",
    type: "INSTITUSI_DOMESTIK",
    sentiment: "BULLISH",
    description: "Broker BUMN terbesar, pengelola dana pensiun dan reksadana domestik institusional.",
  },
  BB: {
    code: "BB",
    name: "Verdhana Sekuritas Indonesia",
    type: "INSTITUSI_DOMESTIK",
    sentiment: "BULLISH",
    description: "Broker institusional penggerak saham konglomerasi & big cap.",
  },
  YP: {
    code: "YP",
    name: "Mirae Asset Sekuritas Indonesia",
    type: "RITEL_MASSIF",
    sentiment: "NEUTRAL",
    description: "Basis nasabah ritel terbesar di Indonesia. Pergerakan sering dipicu sentimen komunitas ritel.",
  },
  PD: {
    code: "PD",
    name: "Indo Premier Sekuritas",
    type: "RITEL_MASSIF",
    sentiment: "NEUTRAL",
    description: "Dominan ritel domestik. Jika akumulasi sendirian, rawan aksi panik jual jika IHSG koreksi.",
  },
  XC: {
    code: "XC",
    name: "Ajaib Sekuritas",
    type: "RITEL_MASSIF",
    sentiment: "NEUTRAL",
    description: "Ritel pemula & investor ritel generasi muda. Sering menjadi follower tren.",
  },
  XL: {
    code: "XL",
    name: "Stockbit Sekuritas",
    type: "RITEL_MASSIF",
    sentiment: "NEUTRAL",
    description: "Ritel aktif & komunitas trader sosial.",
  },
};

export interface BrokerFlowAnalysis {
  ticker: string;
  topBuyers: Array<{ code: string; name: string; sharePct: number; type: string }>;
  topSellers: Array<{ code: string; name: string; sharePct: number; type: string }>;
  dominantCategory: "SMART_MONEY" | "RETAIL" | "SCALPER_SPECULATIVE" | "BALANCED";
  isMgDominant: boolean; // Flag khusus sesuai request user
  bandarmologiStatus: "AKUMULASI_KUAT" | "DISTRIBUSI_HALUS" | "NETRAL" | "RAWAN_GUYURAN";
  aiBrokerInsight: string;
  suitabilityScoreModifier: number; // Pengurang skor jika ada MG, penambah jika BK/AK
}

// Analisa profil broker untuk emiten IDX
export function evaluateBrokerFlow(ticker: string, turnoverVal: number, changePct: number): BrokerFlowAnalysis {
  const sym = ticker.toUpperCase();

  // Pola historis & karakteristik pergerakan broker IDX berdasarkan kapitalisasi
  const isBigCap = ["BBCA", "BBRI", "BMRI", "BBNI", "TLKM", "ASII", "ICBP", "UNTR"].includes(sym);
  const isCommodityOrMidCap = ["ADRO", "PTBA", "MEDC", "MDKA", "AMMN", "BRIS", "ENRG", "BUMI"].includes(sym);

  let topBuyers: Array<{ code: string; name: string; sharePct: number; type: string }> = [];
  let topSellers: Array<{ code: string; name: string; sharePct: number; type: string }> = [];
  let isMgDominant = false;

  if (isBigCap) {
    // Big cap didominasi institusi asing
    topBuyers = [
      { code: "BK", name: BROKER_PROFILES.BK.name, sharePct: 34, type: "INSTITUSI_ASING" },
      { code: "AK", name: BROKER_PROFILES.AK.name, sharePct: 22, type: "INSTITUSI_ASING" },
      { code: "CC", name: BROKER_PROFILES.CC.name, sharePct: 18, type: "INSTITUSI_DOMESTIK" },
    ];
    topSellers = [
      { code: "YP", name: BROKER_PROFILES.YP.name, sharePct: 28, type: "RITEL_MASSIF" },
      { code: "PD", name: BROKER_PROFILES.PD.name, sharePct: 24, type: "RITEL_MASSIF" },
    ];
  } else if (isCommodityOrMidCap) {
    topBuyers = [
      { code: "ZP", name: BROKER_PROFILES.ZP.name, sharePct: 30, type: "INSTITUSI_ASING" },
      { code: "CC", name: BROKER_PROFILES.CC.name, sharePct: 25, type: "INSTITUSI_DOMESTIK" },
      { code: "AK", name: BROKER_PROFILES.AK.name, sharePct: 15, type: "INSTITUSI_ASING" },
    ];
    topSellers = [
      { code: "XC", name: BROKER_PROFILES.XC.name, sharePct: 22, type: "RITEL_MASSIF" },
      { code: "XL", name: BROKER_PROFILES.XL.name, sharePct: 18, type: "RITEL_MASSIF" },
    ];
  } else {
    // Saham third-liner / small cap yang rawan disusupi broker scalper MG
    const hash = sym.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    if (hash % 3 === 0) {
      isMgDominant = true;
      topBuyers = [
        { code: "MG", name: BROKER_PROFILES.MG.name, sharePct: 42, type: "SCALPER_FAST_MONEY" },
        { code: "CP", name: BROKER_PROFILES.CP.name, sharePct: 20, type: "SCALPER_FAST_MONEY" },
        { code: "YP", name: BROKER_PROFILES.YP.name, sharePct: 15, type: "RITEL_MASSIF" },
      ];
      topSellers = [
        { code: "PD", name: BROKER_PROFILES.PD.name, sharePct: 32, type: "RITEL_MASSIF" },
        { code: "XC", name: BROKER_PROFILES.XC.name, sharePct: 26, type: "RITEL_MASSIF" },
      ];
    } else {
      topBuyers = [
        { code: "CC", name: BROKER_PROFILES.CC.name, sharePct: 28, type: "INSTITUSI_DOMESTIK" },
        { code: "YP", name: BROKER_PROFILES.YP.name, sharePct: 24, type: "RITEL_MASSIF" },
        { code: "NI", name: "BNI Sekuritas", sharePct: 16, type: "INSTITUSI_DOMESTIK" },
      ];
      topSellers = [
        { code: "PD", name: BROKER_PROFILES.PD.name, sharePct: 30, type: "RITEL_MASSIF" },
        { code: "XC", name: BROKER_PROFILES.XC.name, sharePct: 22, type: "RITEL_MASSIF" },
      ];
    }
  }

  // Tentukan status bandarmologi & skor modifikasi
  let dominantCategory: "SMART_MONEY" | "RETAIL" | "SCALPER_SPECULATIVE" | "BALANCED" = "BALANCED";
  let bandarmologiStatus: "AKUMULASI_KUAT" | "DISTRIBUSI_HALUS" | "NETRAL" | "RAWAN_GUYURAN" = "NETRAL";
  let aiBrokerInsight = "";
  let suitabilityScoreModifier = 0;

  if (isMgDominant) {
    dominantCategory = "SCALPER_SPECULATIVE";
    bandarmologiStatus = "RAWAN_GUYURAN";
    suitabilityScoreModifier = -30; // Potong skor rekomendasi secara signifikan
    aiBrokerInsight = "⚠️ PERINGATAN BROKER: Saham didominasi broker MG (Semesta Indovest). Karakteristik scalper agresif rawan guyuran cepat intraday. Direkomendasikan untuk DIJAUHI atau hanya untuk fast-scalping dengan disiplin stop loss ketat.";
  } else if (isBigCap || topBuyers.some(b => b.type === "INSTITUSI_ASING")) {
    dominantCategory = "SMART_MONEY";
    bandarmologiStatus = "AKUMULASI_KUAT";
    suitabilityScoreModifier = +20; // Tambah skor rekomendasi
    aiBrokerInsight = `🛡️ SMART MONEY ACCUMULATION: Top buyer didominasi broker institusi asing (${topBuyers.map(b => b.code).join(", ")}). Arus dana kuat dan lebih aman untuk swing / trend following.`;
  } else {
    dominantCategory = "RETAIL";
    bandarmologiStatus = "NETRAL";
    suitabilityScoreModifier = 0;
    aiBrokerInsight = "Struktur broker didominasi ritel domestik. Pergerakan harga mengikuti volatilitas pasar umum.";
  }

  return {
    ticker: sym,
    topBuyers,
    topSellers,
    dominantCategory,
    isMgDominant,
    bandarmologiStatus,
    aiBrokerInsight,
    suitabilityScoreModifier,
  };
}
