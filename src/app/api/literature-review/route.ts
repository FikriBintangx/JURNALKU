import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

export async function POST(request: Request) {
  try {
    const { papers } = await request.json();

    if (!papers || papers.length === 0) {
      return NextResponse.json({ error: 'Tidak ada jurnal untuk diulas.' }, { status: 400 });
    }

    const context = papers.map((p: any, i: number) => `
    Paper ${i + 1}:
    Judul: ${p.title}
    Penulis: ${p.authors?.map((a: any) => a.name).join(', ')}
    Tahun: ${p.year}
    Abstrak: ${p.abstract}
    `).join('\n\n');

    const prompt = `Anda adalah seorang profesor senior. Berdasarkan jurnal-jurnal berikut, buatlah sebuah "Tinjauan Pustaka" (Literature Review) yang komprehensif dalam Bahasa Indonesia.
    
    Struktur ulasan:
    1. Pendahuluan: Gambaran umum topik riset.
    2. Sintesis: Hubungkan temuan dari paper-paper tersebut (apa persamaannya, apa perbedaannya).
    3. Metodologi: Rangkum pendekatan yang sering digunakan.
    4. Kesimpulan & Gap: Apa yang masih kurang dari penelitian-penelitian ini?

    Jurnal:
    ${context}

    Gunakan gaya bahasa akademik yang sangat formal.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({ review: text });
  } catch (error: any) {
    console.error('Lit Review API Error:', error);
    return NextResponse.json({ 
      error: 'Gagal membuat tinjauan pustaka.',
      details: error.message 
    }, { status: 500 });
  }
}
