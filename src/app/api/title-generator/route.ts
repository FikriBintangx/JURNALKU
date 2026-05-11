import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const { paperId, abstract, title } = await request.json();
    const prompt = `Berdasarkan isi jurnal ini, buatkan 5 saran judul penelitian baru yang lebih modern, menarik, dan berpotensi tembus jurnal internasional.`;

    const result = await geminiService.generateAI({
      paperId,
      type: 'title-generator',
      prompt,
      abstract,
      title
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}
