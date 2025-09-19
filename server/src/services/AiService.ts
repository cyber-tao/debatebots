import { ApiConfig } from '../types';

export interface AiServiceResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export abstract class AiService {
  protected config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = config;
  }

  abstract generateResponse(prompt: string, context?: string): Promise<AiServiceResponse>;
  
  protected buildPrompt(instructions: string, context: string, prompt: string): string {
    return `${instructions}\n\nContext: ${context}\n\nPlease respond to: ${prompt}`;
  }

  protected enforceWordLimit(content: string, maxWords: number): string {
    const words = content.trim().split(/\s+/);
    if (words.length <= maxWords) {
      return content;
    }
    
    const truncated = words.slice(0, maxWords).join(' ');
    return truncated + '...';
  }

  protected countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }
}

export default AiService;