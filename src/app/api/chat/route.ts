import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(request: Request) {
  try {
    const { messages, context, title } = await request.json();

    if (!messages || !messages.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    // System prompt with context from the paper
    const systemPrompt = `You are an AI research assistant helping a user understand a scientific paper titled "${title}".
    Use the following abstract/context to answer questions accurately:
    
    CONTEXT:
    ${context}
    
    Instructions:
    1. Be concise but informative.
    2. If the answer isn't in the context, say you don't know based on the abstract, but offer general knowledge if relevant.
    3. Use a helpful, academic tone.`;

    // Convert messages to Gemini format
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Understood. I am ready to help you analyze this paper." }] },
        ...messages.slice(0, -1).map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }))
      ],
    });

    const lastMessage = messages[messages.length - 1].content;
    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ content: text });
  } catch (error: any) {
    console.error('Gemini Chat Error:', error);
    return NextResponse.json({ error: 'Failed to chat with Gemini.' }, { status: 500 });
  }
}
