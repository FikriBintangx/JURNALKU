import { NextResponse } from 'next/server';
import { recommendationEngine } from '@/services/recommendationEngine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: true, message: "User ID diperlukan" }, { status: 400 });
  }

  try {
    const recommendations = await recommendationEngine.getPersonalizedRecommendations(userId);
    return NextResponse.json({ data: recommendations });
  } catch (error: any) {
    return NextResponse.json({ error: true, message: "Gagal memuat rekomendasi" }, { status: 500 });
  }
}
