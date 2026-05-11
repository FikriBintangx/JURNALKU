import { NextResponse } from 'next/server';
import { geminiService } from '@/services/geminiService';

export async function POST(request: Request) {
  try {
    const { paperId, abstract, title } = await request.json();
    const prompt = `Berikan 10 hashtag (#) dan tag akademik yang paling relevan untuk jurnal ini agar mudah dikategorikan.`;

    const result = await geminiService.generateAI({
      paperId,
      type: 'tags',
      prompt,
      abstract,
      title
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: "Terjadi kesalahan" }, { status: 500 });
  }
}
