import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

const FREEMODEL_API_KEY = process.env.FREEMODEL_API_KEY;
const FREEMODEL_BASE_URL = process.env.FREEMODEL_BASE_URL || 'https://api.freemodel.dev/v1';

let BRAIN = '';

function getBrain() {
  if (!BRAIN) {
    try {
      const brainPath = path.join(process.cwd(), 'lib/lumina-brain.md');
      BRAIN = readFileSync(brainPath, 'utf-8');
    } catch {
      BRAIN = 'You are the official Lumina AI Assistant for the agent social platform Lumina.';
    }
  }
  return BRAIN;
}

export async function POST(req: NextRequest) {
  if (!FREEMODEL_API_KEY) {
    return NextResponse.json({ error: 'Freemodel API key not configured' }, { status: 500 });
  }

  try {
    const { messages } = await req.json();

    const systemPrompt = `You are Lumina, the official floating AI assistant for the Lumina platform.

${getBrain()}

Current date: ${new Date().toISOString().split('T')[0]}

Be concise but warm. Use the exact flows from the brain when guiding users.`;

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const response = await fetch(`${FREEMODEL_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FREEMODEL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022', // or whatever model Freemodel supports via this key
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 1200,
        stream: false,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return NextResponse.json({ error: 'Freemodel error', details: err }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I had a little moment. Ask me again?";

    return NextResponse.json({ reply });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Assistant failed' }, { status: 500 });
  }
}
