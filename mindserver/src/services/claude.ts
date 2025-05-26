import { Anthropic } from '@anthropic-ai/sdk';
import { CacheService } from './cache.js';
import { CompletionOptions, CompletionResponse } from '../types/ai';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

export async function createCompletion(options: CompletionOptions): Promise<CompletionResponse> {
    const { model = 'claude-3-sonnet-20240229', messages, stop } = options;

    const hash = CacheService.hashRequest({ messages, stop });
    const cacheKey = CacheService.createKey('claude', model, hash);

    const cached = await CacheService.get<string>(cacheKey);
    if (cached) {
        return {
            content: cached,
            cached: true
        };
    }

    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const userMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

    const prompt = [systemMessage, userMessages].filter(Boolean).join('\n\n');

    try {
        const response = await anthropic.messages.create({
            model,
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
            stop_sequences: stop ? (Array.isArray(stop) ? stop : [stop]) : undefined
        });

        const content = response.content[0]?.type === 'text'
            ? response.content[0].text
            : '';

        if (content) {
            await CacheService.set(cacheKey, content);
        }

        return {
            content,
            cached: false
        };
    } catch (error) {
        console.error('Claude API error:', error);
        throw new Error(`Claude API error: ${error instanceof Error ? error.message : String(error)}`);
    }
}
