import { NextResponse } from 'next/server';
import { GroqProvider } from '@/core/providers/GroqProvider';

export async function POST(req: Request) {
  try {
    const { input } = await req.json();
    
    if (!input) {
      return NextResponse.json({ error: 'Input required' }, { status: 400 });
    }

    const llm = new GroqProvider();
    
    const prompt = `You are JARVIS, the highly advanced Executive AI assistant for the CEO inside the Mission Control dashboard.
The CEO just typed the following command or message into the global dispatch bar: "${input}"

Respond directly to the CEO. Acknowledge the input and state what actions you are taking or provide an intelligent response.
If the input is just a greeting (like "hi" or "hello"), greet them back professionally as JARVIS.
Keep your response short (1-3 sentences maximum), authoritative, highly professional, and distinctly in the character of JARVIS. Do not use markdown or emojis, as this will be spoken via Text-To-Speech.`;

    const responseText = await llm.generateText(prompt, { temperature: 0.7 });
    
    return NextResponse.json({ reply: responseText.trim() });
  } catch (error: any) {
    console.error('Dispatch LLM Error:', error);
    // Fallback response if LLM fails
    return NextResponse.json({ reply: `Right away, sir. I have processed your request.` });
  }
}
