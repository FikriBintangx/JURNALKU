import { NextRequest } from 'next/server';
import { streamingOrchestrator } from '@/services/arai/streamingOrchestrator';

// Enable Node.js edge/streaming runtime capabilities
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { query, userId = 'session_workspace', mode = 'synthesis' } = await req.json();

    if (!query) {
      return new Response('Query is required', { status: 400 });
    }

    // Set up Server-Sent Events (SSE) headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    });

    const stream = new ReadableStream({
      async start(controller) {
        // Helper to send SSE formatted messages
        const sendEvent = (event: string, data: any) => {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(new TextEncoder().encode(payload));
        };

        try {
          await streamingOrchestrator.runWorkspaceSession(userId, query, mode, {
            onStatus: (status) => {
              sendEvent('status', { message: status });
            },
            onAgentActivity: (agent, activity) => {
              sendEvent('agent', { agent, activity });
            },
            onToken: (token) => {
              sendEvent('token', { text: token });
            },
            onGapDetected: (gap) => {
              sendEvent('gap', { message: gap });
            },
            onGraphUpdate: (graph) => {
              sendEvent('graph', { message: graph });
            }
          });
          
          sendEvent('done', { message: 'Stream complete' });
          controller.close();
        } catch (error) {
          sendEvent('error', { message: 'Internal stream error occurred.' });
          controller.close();
        }
      }
    });

    return new Response(stream, { headers });

  } catch (error: any) {
    console.error('[API_WORKSPACE_CHAT] Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to start stream' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
