import { NextResponse } from 'next/server';
import { DORMIO_SYSTEM_CONTEXT } from '@/lib/dormio-context';

const GEMINI_API_KEY = "AQ.Ab8RN6LnZ9CSBpMqmLp56X-JdrMcpyTR8SS9mccvB3s1m0fx9A";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
    }

    // Filter out the initial welcome message from the client
    let filteredMessages = messages;
    if (filteredMessages.length > 0 && filteredMessages[0].role === 'assistant') {
      filteredMessages = filteredMessages.slice(1);
    }

    // Prepare history and merge consecutive roles to satisfy Gemini API requirements
    const rawContents = filteredMessages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const contents: any[] = [];
    for (const msg of rawContents) {
      if (contents.length > 0 && contents[contents.length - 1].role === msg.role) {
        contents[contents.length - 1].parts[0].text += `\n${msg.parts[0].text}`;
      } else {
        contents.push(msg);
      }
    }

    // Ensure the conversation starts with a user message
    if (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    // Inject system prompt into the very first user message
    if (contents.length > 0 && contents[0].role === 'user') {
      const originalText = contents[0].parts[0].text;
      // Only inject if it hasn't been injected yet
      if (!originalText.includes('[SYSTEM CONTEXT START]')) {
        contents[0].parts[0].text = `[SYSTEM CONTEXT START]\n${DORMIO_SYSTEM_CONTEXT}\n[SYSTEM CONTEXT END]\n\nNgười dùng: ${originalText}`;
      }
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch(e) {
        errorData = errorText;
      }
      console.error('Gemini API Error details:', errorData);
      return NextResponse.json({ error: 'Failed to communicate with AI', details: errorData }, { status: 500 });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Xin lỗi, tôi không thể trả lời lúc này.";

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', message: error.message, stack: error.stack }, { status: 500 });
  }
}
