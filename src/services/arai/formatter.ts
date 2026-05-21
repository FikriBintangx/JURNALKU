/**
 * ISAGI RESPONSE FORMATTING LAYER
 * 
 * Enforces the strict "No raw markdown symbols" rule.
 * Converts #, *, -, and other markers into clean, readable typography.
 */
class ResponseFormattingLayer {
  private static instance: ResponseFormattingLayer;

  private constructor() {}

  public static getInstance(): ResponseFormattingLayer {
    if (!ResponseFormattingLayer.instance) {
      ResponseFormattingLayer.instance = new ResponseFormattingLayer();
    }
    return ResponseFormattingLayer.instance;
  }

  /**
   * Cleans raw AI output to meet academic presentation standards
   */
  public format(text: string): string {
    if (!text) return "";

    let clean = text;

    // 1. Remove Headers (#, ##, ###)
    clean = clean.replace(/^#+\s*(.*)$/gm, (match, p1) => {
      return `\n\n${p1.toUpperCase()}\n`;
    });

    // 2. Remove Bold/Italic/Underline symbols (**, *, __)
    clean = clean.replace(/(\*\*|__)(.*?)\1/g, '$2');
    clean = clean.replace(/(\*|_)(.*?)\1/g, '$2');

    // 3. Normalize Lists (convert - or * to clean bullets or numbers)
    clean = clean.replace(/^[\s\t]*[-*+]\s+(.*)$/gm, '• $1');
    clean = clean.replace(/^[\s\t]*(\d+)\.\s+(.*)$/gm, '$1. $2');

    // 4. Remove Horizontal Rules (---)
    clean = clean.replace(/^-{3,}$/gm, '');
    clean = clean.replace(/^\s*([*_])(?:\s*\1){2,}\s*$/gm, '');

    // 5. Final Symbol Stripping (prevent leaks)
    clean = clean.replace(/[#*]/g, '');

    // 6. Normalize Multiple Newlines
    clean = clean.replace(/\n{3,}/g, '\n\n');

    return clean.trim();
  }

  /**
   * Helper to ensure the AI knows how to respond before we even format it
   */
  public getSystemPromptInjection(): string {
    return `
    INSTRUKSI BAHASA: Seluruh respon WAJIB menggunakan Bahasa Indonesia Akademik yang sangat formal dan elegan. JANGAN PERNAH menyisipkan istilah Bahasa Inggris kecuali jika itu adalah istilah teknis yang tidak memiliki padanan dalam Bahasa Indonesia.

    ATURAN BAHASA DAN FORMATTING MUTLAK:
    1. OUTPUT WAJIB 100% BAHASA INDONESIA FORMAL.
    2. JANGAN gunakan simbol markdown (#, ##, ***, **, *, ---).
    3. JANGAN gunakan tabel markdown mentah.
    4. Gunakan spasi dan baris baru untuk struktur.
    5. Tulis judul dengan HURUF KAPITAL tanpa simbol.
    6. Gunakan poin '•' untuk daftar.
    `;
  }
}

export const responseFormatter = ResponseFormattingLayer.getInstance();
