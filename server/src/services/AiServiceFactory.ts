import { ApiConfig } from '../types';
import { AiService } from './AiService';
import { OpenAiService, AnthropicService, CustomService } from './AiProviders';

export class AiServiceFactory {
  static createService(config: ApiConfig): AiService {
    switch (config.provider) {
      case 'openai':
        return new OpenAiService(config);
      case 'anthropic':
        return new AnthropicService(config);
      case 'custom':
        return new CustomService(config);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }
}

export default AiServiceFactory;