import { geminiService } from "./geminiService";

export interface ResearchRoadmap {
  title: string;
  phases: Array<{
    name: string;
    duration: string;
    tasks: string[];
    description: string;
  }>;
  estimatedTotalTime: string;
}

/**
 * ISAGI Roadmap Service
 * Automatically generates a research timeline based on user topic or conversation
 */
export const roadmapService = {
  async generateRoadmap(query: string, context?: string): Promise<string> {
    const prompt = `Generate a detailed 12-month Research Roadmap for this topic: "${query}".
    
    Context from previous discussion: ${context || 'N/A'}
    
    Tugas:
    Buat rencana penelitian yang terbagi dalam 4 fase (Fase 1: Persiapan, Fase 2: Pelaksanaan, Fase 3: Analisis, Fase 4: Publikasi).
    
    Format output:
    ## 🗺️ Research Roadmap: [Judul]
    
    ### Fase 1: [Nama] ([Durasi])
    - [Tugas 1]
    - [Tugas 2]
    *Deskripsi singkat tujuan fase ini.*
    
    [Lanjutkan sampai Fase 4]
    
    **Estimasi Total Waktu:** [X] Bulan
    **Tips Sukses:** [Berikan 2 tips spesifik untuk topik ini]
    
    Gunakan Bahasa Indonesia yang profesional. Langsung ke format markdown.`;

    try {
      const res = await geminiService.generateAI({
        paperId: 'roadmap-gen',
        type: 'roadmap',
        prompt,
        title: query
      });

      return res.data || "Gagal menghasilkan roadmap. Silakan coba lagi.";
    } catch (err) {
      console.error("[ROADMAP SERVICE] Generation failed:", err);
      return "Layanan Roadmap sedang sibuk. Coba sesaat lagi.";
    }
  }
};
