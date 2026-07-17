import { LLMProvider } from './interfaces';

export class GroqProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey?: string, model: string = 'llama-3.3-70b-versatile') {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || '';
    this.model = model;
  }

  async generateText(prompt: string, context?: Record<string, any>): Promise<string> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured. Please add it to your environment variables.');
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: context?.temperature || 0.7,
      })
    });

    if (!res.ok) {
      const errData = await res.text();
      throw new Error(`Groq Error ${res.status}: ${res.statusText} - ${errData}`);
    }

    const data = await res.json();
    return data.choices[0].message.content;
  }

  async generateJSON<T>(prompt: string, schema?: any): Promise<T> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured. Please add it to your environment variables.');
    }

    const jsonPrompt = `${prompt}\n\nYou must return only valid JSON matching this schema/intent.`;
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: jsonPrompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) throw new Error('Groq JSON Error');
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content) as T;
  }

  async streamText(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY is not configured. Please add it to your environment variables.');
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        stream: true
      })
    });

    if (!res.ok) {
      const errData = await res.text();
      throw new Error(`Groq Error ${res.status}: ${res.statusText} - ${errData}`);
    }

    if (!res.body) throw new Error('ReadableStream not supported in this environment');

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
              onChunk(data.choices[0].delta.content);
            }
          } catch (e) {
            // Ignore parse errors on incomplete chunks
          }
        }
      }
    }
  }
}
