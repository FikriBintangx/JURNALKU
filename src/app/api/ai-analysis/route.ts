import { NextRequest, NextResponse } from 'next/server';
import { aiEngine } from '@/lib/ai/orchestrator';
import { FeatureType } from '@/lib/ai/schemas';

export async function POST(req: NextRequest) {
  try {
    const { feature, context, options } = await req.json();

    if (!feature || !context) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await aiEngine.executeAIFeature(feature as FeatureType, context, options);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API_AI_ANALYSIS] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}
