import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { apiKey, adminPassword } = await req.json();

    // Proteksi sandi admin sederhana (bisa diganti sesuai keinginan)
    if (adminPassword !== 'jurnalstar2026') {
      return NextResponse.json({ error: 'Unauthorized: Invalid Admin Password' }, { status: 401 });
    }

    if (!apiKey || !apiKey.startsWith('AIza')) {
      return NextResponse.json({ error: 'Format API Key Google tidak valid.' }, { status: 400 });
    }

    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Cek apakah GEMINI_API_KEY sudah ada
    const regex = /^GEMINI_API_KEY=(.*)$/m;
    const match = envContent.match(regex);

    if (match) {
      const existingKeys = match[1].trim();
      // Jangan tambahkan jika sudah ada
      if (!existingKeys.includes(apiKey)) {
        const newKeys = existingKeys ? `${existingKeys},${apiKey}` : apiKey;
        envContent = envContent.replace(regex, `GEMINI_API_KEY=${newKeys}`);
      }
    } else {
      // Jika tidak ada, tambahkan di baris baru
      envContent += `\nGEMINI_API_KEY=${apiKey}\n`;
    }

    // Tulis kembali ke .env.local
    fs.writeFileSync(envPath, envContent, 'utf-8');

    return NextResponse.json({ 
      success: true, 
      message: 'API Key berhasil disuntikkan ke dalam sistem (Rotasi Kunci ditambahkan)!' 
    });

  } catch (error: any) {
    console.error('[ADMIN_API] Error injecting key:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
