import { GoogleGenerativeAI, GenerationConfig } from "@google/generative-ai";
import { aiKeyManager } from "./AIKeyManager";

const MODEL_NAME = "gemini-2.0-flash";

const generationConfig: GenerationConfig = {
  temperature: 0.2,
  topP: 0.8,
  topK: 40,
  maxOutputTokens: 1024,
};

/**
 * ISAGI Vision Service
 * Powers visual data extraction from research paper screenshots/images
 */
export const visionService = {
  /**
   * Analyzes an image (base64) to extract data from tables or charts
   */
  async analyzeResearchImage(base64Image: string, task: 'extract_table' | 'explain_chart' | 'ocr'): Promise<any> {
    const apiKey = aiKeyManager.getBestKey();
    if (!apiKey) throw new Error("No AI keys available for Vision tasks.");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME, generationConfig });

    let prompt = "";
    if (task === 'extract_table') {
      prompt = "Ekstrak data dari tabel dalam gambar ini dan kembalikan dalam format Markdown yang rapi. Berikan analisis singkat mengenai data tersebut dalam Bahasa Indonesia.";
    } else if (task === 'explain_chart') {
      prompt = "Jelaskan isi grafik/bagan ini secara detail dalam Bahasa Indonesia. Apa temuan utamanya? Berikan poin-poin penting.";
    } else {
      prompt = "Lakukan OCR pada gambar ini dan berikan teks lengkapnya secara terstruktur.";
    }

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image.split(',').pop() || base64Image,
            mimeType: "image/jpeg",
          },
        },
      ]);

      return {
        success: true,
        data: result.response.text(),
      };
    } catch (err: any) {
      console.error("[VISION SERVICE] Analysis failed:", err.message);
      return {
        success: false,
        message: err.message,
      };
    }
  }
};
