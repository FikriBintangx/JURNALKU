import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const { paperId, abstract, title, model } = await request.json();
    const prompt = `AUTONOMOUS SCIENTIFIC TITLE GENERATOR:
Hasilkan 5 saran judul penelitian yang memiliki daya tarik tinggi untuk publikasi internasional (Scopus/Web of Science).

Pertimbangkan dalam pembuatan judul:
1. Novelty (Kebaruan penelitian)
2. Variabel utama dan hubungan antar variabel
3. Metodologi yang digunakan (Kuantitatif/Kualitatif/Eksperimen)
4. Fokus demografis atau teoritis
5. Pendekatan statistik atau gaya penulisan akademik yang elegan

Hasilkan variasi berikut:
- 1 Judul Scopus-Style (Elegan & Deskriptif)
- 1 Judul Metodologis (Menonjolkan metode)
- 1 Judul Novel (Menonjolkan kebaruan/gap)
- 1 Judul Ringkas (To the point)
- 1 Judul Provokatif (Menantang status quo akademik)

JAWAB DALAM BAHASA INDONESIA FORMAL. JANGAN GUNAKAN SIMBOL # ATAU *. Gunakan baris baru untuk memisahkan judul.`;

    const result = await geminiService.generateAI({
      paperId,
      type: 'title-generator',
      prompt,
      abstract,
      title,
      model
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}
