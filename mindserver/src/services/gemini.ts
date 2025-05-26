import { GoogleGenerativeAI, GenerativeModel, SafetySetting } from '@google/generative-ai';
import { CacheService } from './cache.js';
import { CompletionOptions, CompletionResponse, EmbeddingOptions, EmbeddingResponse, Message } from '../types/ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GeminiContent {
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
}

function prepareMessages(messages: Message[], systemMessage?: string): GeminiContent[] {
    const contents: GeminiContent[] = [];

    for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        if (i === 0 && message.role === 'user' && systemMessage) {
            contents.push({
                role: 'user',
                parts: [{ text: `${systemMessage}\n\n${message.content}` }]
            });
        } else {
            contents.push({
                role: message.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: message.content }]
            });
        }
    }

    return contents;
}

export async function createCompletion(options: CompletionOptions): Promise<CompletionResponse> {
    const {
        model = 'gemini-1.5-pro',
        messages,
        systemMessage,
        safetySettings = [],
        temperature = 0.7,
        maxTokens,
        topP,
        topK,
        stop
    } = options;

    const cacheKey = CacheService.createKey(
        'gemini',
        model,
        CacheService.hashRequest({ messages, systemMessage, temperature, maxTokens, topP, topK, stop })
    );

    const cached = await CacheService.get<string>(cacheKey);
    if (cached) {
        return { content: cached, cached: true };
    }

    try {
        const geminiModel: GenerativeModel = genAI.getGenerativeModel({
            model,
            generationConfig: {
                temperature,
                ...(maxTokens && { maxOutputTokens: maxTokens }),
                ...(topP && { topP }),
                ...(topK && { topK }),
                ...(stop && { stopSequences: Array.isArray(stop) ? stop : [stop] })
            },
            safetySettings: safetySettings as SafetySetting[]
        });

        const contents = prepareMessages(messages, systemMessage);
        const result = await geminiModel.generateContent({
            contents
        });

        const response = await result.response;
        const content = response.text();

        await CacheService.set(cacheKey, content);

        return { content, cached: false };
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error(`Gemini API error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function createEmbedding(options: EmbeddingOptions): Promise<EmbeddingResponse> {
    const { input, model = 'embedding-001' } = options;

    const cacheKey = CacheService.createKey(
        'gemini',
        model,
        CacheService.hashRequest({ input }),
        'embed'
    );

    const cached = await CacheService.get<number[]>(cacheKey);
    if (cached) {
        return { embedding: cached, cached: true };
    }

    try {
        const embeddingModel = genAI.getGenerativeModel({ model });
        const result = await embeddingModel.embedContent(input);
        const embedding = result.embedding.values;

        await CacheService.set(cacheKey, embedding);

        return { embedding, cached: false };
    } catch (error) {
        console.error('Gemini embedding error:', error);
        throw new Error(`Gemini embedding error: ${error instanceof Error ? error.message : String(error)}`);
    }
}
