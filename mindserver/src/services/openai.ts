import OpenAI from 'openai';
import { CacheService } from './cache.js';
import { CompletionOptions, CompletionResponse, EmbeddingOptions, EmbeddingResponse } from '../types/ai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function createCompletion(options: CompletionOptions): Promise<CompletionResponse> {
    const {
        model = 'gpt-4-turbo-preview',
        messages,
        temperature = 0.7,
        maxTokens,
        topP,
        stop
    } = options;

    const cacheKey = CacheService.createKey(
        'openai',
        model,
        CacheService.hashRequest({ messages, temperature, maxTokens, topP, stop })
    );

    const cached = await CacheService.get<string>(cacheKey);
    if (cached) {
        return { content: cached, cached: true };
    }

    try {
        const response = await openai.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            top_p: topP,
            stop,
        });

        const content = response.choices[0]?.message?.content || '';

        if (content) {
            await CacheService.set(cacheKey, content);
        }

        return {
            content,
            cached: false
        };
    } catch (error) {
        console.error('OpenAI API error:', error);
        throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function createEmbedding(options: EmbeddingOptions): Promise<EmbeddingResponse> {
    const { input, model = 'text-embedding-3-small' } = options;

    const cacheKey = CacheService.createKey(
        'openai',
        model,
        CacheService.hashRequest({ input }),
        'embed'
    );

    const cached = await CacheService.get<number[]>(cacheKey);
    if (cached) {
        return { embedding: cached, cached: true };
    }

    try {
        const response = await openai.embeddings.create({
            model,
            input,
            encoding_format: 'float'
        });

        const embedding = response.data[0].embedding;

        await CacheService.set(cacheKey, embedding);

        return {
            embedding,
            cached: false
        };
    } catch (error) {
        console.error('OpenAI embedding error:', error);
        throw new Error(`OpenAI embedding error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Helper function to calculate tokens usage for billing and rate limiting
 * @param text - The text to calculate tokens for
 * @returns The number of tokens
 */
export function calculateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
}

/**
 * Validates if the model name is supported by OpenAI
 * @param model - The model name to validate
 * @returns boolean indicating if the model is supported
 */
export function isSupportedModel(model: string): boolean {
    const supportedModels = [
        'gpt-4-turbo-preview',
        'gpt-4',
        'gpt-3.5-turbo',
        'text-embedding-3-small',
        'text-embedding-3-large'
    ];
    return supportedModels.includes(model);
}

/**
 * Gets the token limit for a specific model
 * @param model - The model name
 * @returns The maximum number of tokens the model supports
 */
export function getModelTokenLimit(model: string): number {
    const limits: Record<string, number> = {
        'gpt-4-turbo-preview': 128000,
        'gpt-4': 8192,
        'gpt-3.5-turbo': 4096,
        'text-embedding-3-small': 8191,
        'text-embedding-3-large': 8191
    };
    return limits[model] || 4096; // Default to 4096 if model not found
}
