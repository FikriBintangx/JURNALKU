import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Anda adalah asisten riset profesional. 
      Tugas Anda adalah mengambil kalimat topik penelitian dalam Bahasa Indonesia dan mengubahnya menjadi 3-5 kata kunci pencarian (keywords) dalam Bahasa Inggris yang paling relevan agar hasil pencarian di database jurnal internasional lebih akurat.

      Topik: "${query}"

      Berikan hasil dalam format JSON seperti ini:
      {
        "keywords": ["keyword1", "keyword2", "keyword3"],
        "explanation": "Penjelasan singkat kenapa kata kunci ini dipilih"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (sometimes Gemini adds markdown code blocks)
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (e) {
      console.error("JSON Parse Error:", text);
      data = { keywords: [], explanation: "Gagal memproses saran AI." };
    }

    return NextResponse.json({
      keywords: data.keywords || [],
      explanation: data.explanation || "Saran kata kunci dari AI."
    });
  } catch (error: any) {
    console.error("AI Query Optimization Error:", error);
    return NextResponse.json({ error: "Gagal mengoptimalkan query" }, { status: 500 });
  }
}
