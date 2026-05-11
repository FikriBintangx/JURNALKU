import { NextResponse } from 'next/server';
import { embeddingService } from '@/services/embeddingService';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query) return NextResponse.json({ error: true, message: "Query diperlukan" }, { status: 400 });

    const queryEmbedding = await embeddingService.getEmbedding(query);

    // Vector similarity search in DB
    const results = await prisma.$queryRaw`
      SELECT id, title, abstract, citations, year, authors, source,
             (embedding <=> ${queryEmbedding}::vector) as distance
      FROM "Journal"
      ORDER BY distance ASC
      LIMIT 10
    `;

    return NextResponse.json({ data: results });
  } catch (error: any) {
    return NextResponse.json({ error: true, message: "Gagal melakukan pencarian semantik" }, { status: 500 });
  }
}
