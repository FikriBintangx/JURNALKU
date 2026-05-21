import { FeatureType } from './schemas';

export const HEURISTIC_FALLBACKS: Record<FeatureType, (context: string) => any> = {
  summary: (ctx) => ({
    overview: "Gagal menghasilkan ringkasan AI. Menampilkan ringkasan ekstraktif sederhana.",
    keyFindings: ctx.split('.').slice(0, 3).map(s => s.trim()).filter(s => s.length > 20),
    methodology: "Metodologi tidak dapat diekstraksi secara otomatis.",
    limitations: ["Data tidak lengkap untuk analisis batasan."]
  }),

  keywords: (ctx) => {
    const commonWords = ctx.toLowerCase().match(/\b\w{6,}\b/g) || [];
    const unique = Array.from(new Set(commonWords)).slice(0, 5);
    return {
      keywords: unique,
      categories: ["General Research"],
      relevanceScores: Object.fromEntries(unique.map(k => [k, 0.5]))
    };
  },

  titles: (ctx) => ({
    suggestedTitles: [
      `Analisis Mendalam: ${ctx.slice(0, 50)}...`,
      "Studi Komprehensif Berdasarkan Data Literatur",
      "Perspektif Baru dalam Bidang Terkait"
    ],
    analysis: "Judul dihasilkan secara heuristik karena kegagalan AI."
  }),

  citation: () => ({
    explanation: "Penjelasan sitasi tidak tersedia.",
    format: "Unknown",
    context: "N/A"
  }),

  recommendations: () => ({
    relatedPapers: [],
    futureDirections: ["Eksplorasi lebih lanjut diperlukan."]
  }),

  comparison: () => ({
    similarities: ["Kemiripan tidak dapat dianalisis."],
    differences: ["Perbedaan tidak dapat dianalisis."],
    uniqueContributions: ["Kontribusi unik belum teridentifikasi."]
  }),

  critic: () => ({
    credibilityScore: 0,
    risks: ["Analisis risiko gagal."],
    strengths: ["Analisis kekuatan gagal."],
    weaknesses: ["Analisis kelemahan gagal."],
    replicationChance: "Low"
  }),

  graph: () => ({
    entities: [],
    relations: []
  })
};
