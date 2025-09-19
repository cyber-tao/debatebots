import axios from 'axios';
import { AiService, AiServiceResponse } from './AiService';
import { ApiConfig } from '../types';

export class OpenAiService extends AiService {
  constructor(config: ApiConfig) {
    super(config);
  }

  async generateResponse(prompt: string, context?: string): Promise<AiServiceResponse> {
    try {
      const messages = [
        {
          role: 'system',
          content: this.config.parameters ? JSON.stringify(this.config.parameters) : 'You are a helpful AI assistant.'
        }
      ];

      if (context) {
        messages.push({
          role: 'user',
          content: `Context: ${context}`
        });
      }

      messages.push({
        role: 'user',
        content: prompt
      });

      const response = await axios.post(
        `${this.config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`,
        {
          model: this.config.model,
          messages,
          temperature: this.config.parameters.temperature || 0.7,
          max_tokens: this.config.parameters.maxTokens || 1000,
          top_p: this.config.parameters.topP || 1,
          frequency_penalty: this.config.parameters.frequencyPenalty || 0,
          presence_penalty: this.config.parameters.presencePenalty || 0
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0]?.message?.content || '';
      
      return {
        content,
        usage: response.data.usage ? {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens
        } : undefined
      };
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      throw new Error(`OpenAI API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

export class AnthropicService extends AiService {
  constructor(config: ApiConfig) {
    super(config);
  }

  async generateResponse(prompt: string, context?: string): Promise<AiServiceResponse> {
    try {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
      
      const response = await axios.post(
        `${this.config.baseUrl || 'https://api.anthropic.com'}/v1/messages`,
        {
          model: this.config.model,
          max_tokens: this.config.parameters.maxTokens || 1000,
          temperature: this.config.parameters.temperature || 0.7,
          messages: [
            {
              role: 'user',
              content: fullPrompt
            }
          ]
        },
        {
          headers: {
            'x-api-key': this.config.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        }
      );

      const content = response.data.content[0]?.text || '';
      
      return {
        content,
        usage: response.data.usage ? {
          promptTokens: response.data.usage.input_tokens,
          completionTokens: response.data.usage.output_tokens,
          totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens
        } : undefined
      };
    } catch (error: any) {
      console.error('Anthropic API Error:', error);
      throw new Error(`Anthropic API Error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

export class CustomService extends AiService {
  constructor(config: ApiConfig) {
    super(config);
  }

  async generateResponse(prompt: string, context?: string): Promise<AiServiceResponse> {
    try {
      const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
      
      const response = await axios.post(
        this.config.baseUrl!,
        {
          prompt: fullPrompt,
          model: this.config.model,
          ...this.config.parameters
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.content || response.data.response || '',
        usage: response.data.usage
      };
    } catch (error: any) {
      console.error('Custom API Error:', error);
      throw new Error(`Custom API Error: ${error.response?.data?.error || error.message}`);
    }
  }
}