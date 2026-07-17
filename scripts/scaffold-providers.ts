import * as fs from 'fs';
import * as path from 'path';

const baseDir = path.join(__dirname, '../src/core/providers');

const providers = [
  { dir: 'search', name: 'ExaProvider', type: 'search', interface: 'ISearchProvider' },
  { dir: 'search', name: 'SerperProvider', type: 'search', interface: 'ISearchProvider' },
  { dir: 'llm', name: 'GroqProvider', type: 'llm', interface: 'ILLMProvider' },
  { dir: 'llm', name: 'GeminiProvider', type: 'llm', interface: 'ILLMProvider' },
  { dir: 'llm', name: 'OpenAIProvider', type: 'llm', interface: 'ILLMProvider' },
  { dir: 'speech', name: 'DeepgramProvider', type: 'speech', interface: 'ISpeechProvider' },
  { dir: 'speech', name: 'WhisperProvider', type: 'speech', interface: 'ISpeechProvider' },
  { dir: 'embeddings', name: 'VoyageProvider', type: 'embeddings', interface: 'IEmbeddingsProvider' },
  { dir: 'embeddings', name: 'OpenAIEmbeddingProvider', type: 'embeddings', interface: 'IEmbeddingsProvider' },
  { dir: 'vector', name: 'PineconeProvider', type: 'vector', interface: 'IVectorProvider' },
  { dir: 'vector', name: 'ChromaProvider', type: 'vector', interface: 'IVectorProvider' },
];

for (const p of providers) {
  const dirPath = path.join(baseDir, p.dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const content = `import { ${p.interface}, ProviderCapabilities, ProviderMetrics } from '../types';

export class ${p.name} implements ${p.interface} {
  public readonly id = '${p.name.toLowerCase().replace('provider', '')}';
  public readonly name = '${p.name.replace('Provider', '')}';
  public readonly type = '${p.type}' as const;
  
  public readonly capabilities: ProviderCapabilities = {
    supportsStreaming: false,
    supportsMarkdown: false,
    supportsImages: false,
    supportsNews: false,
    supportsDeepSearch: false,
    supportsCrawling: false,
    supportsPDF: false,
    supportsOCR: false,
  };

  public getMetrics(): ProviderMetrics {
    return {
      status: 'offline',
      latency: 0,
      successRate: 0,
      lastFailure: null,
      lastSuccess: null,
      avgResponseTime: 0,
      quotaRemaining: null,
      rateLimit: null,
    };
  }

  public async ping(): Promise<boolean> {
    return false;
  }

  // Stubs for ${p.interface}
  ${p.type === 'search' ? `
  public async webSearch() { return []; }
  public async newsSearch() { return []; }
  public async companySearch() { return []; }
  public async personSearch() { return []; }
  public async competitorSearch() { return []; }
  public async marketResearch() { return []; }
  public async factCheck() { return []; }
  public async websiteSearch() { return []; }
  public async searchAndAnswer() { return { answer: '', sources: [] }; }
  ` : p.type === 'llm' ? `
  public async generateText() { return 'Stub response'; }
  ` : p.type === 'speech' ? `
  public async transcribe() { return 'Stub transcription'; }
  ` : p.type === 'embeddings' ? `
  public async embed() { return [0, 0, 0]; }
  ` : p.type === 'vector' ? `
  public async upsert() { return; }
  public async query() { return []; }
  ` : ''}
}
`;
  
  fs.writeFileSync(path.join(dirPath, `${p.name}.ts`), content);
}

console.log('Provider stubs generated successfully.');
