import { NextRequest } from 'next/server';
import { aiEngine } from '@/lib/ai/orchestrator';
import { FeatureType } from '@/lib/ai/schemas';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { feature, context, options } = await req.json();

    if (!feature || !context) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial agent status
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'initializing', agent: 'Orchestrator' })}\n\n`));
        
        try {
           // Simulate agent reasoning steps before the actual AI call
           const agents = ['Researcher', 'Critic', 'Synthesizer'];
           for (const agent of agents) {
             await new Promise(r => setTimeout(r, 800));
             controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'thinking', agent, message: `Agent ${agent} is analyzing context...` })}\n\n`));
           }

           // Call the actual AI engine
           // Note: In a real streaming scenario, we'd use a streaming-capable AI call.
           // For now, we simulate the 'thinking' and then deliver the result.
           const result = await aiEngine.executeAIFeature(feature as FeatureType, context, options);
           
           controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'completed', data: result })}\n\n`));
        } catch (err: any) {
           controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status: 'error', error: err.message })}\n\n`));
        } finally {
           controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
