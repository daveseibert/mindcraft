export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface CompletionOptions {
    model?: string;
    messages: Message[];
    systemMessage?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
    stop?: string | string[];
    safetySettings?: any[];
}

export interface CompletionRequest {
    model?: string;
    messages: Message[];
    systemMessage?: string;
    stop?: string | string[];
    provider?: 'openai' | 'claude' | 'gemini';
}

export interface CompletionResponse {
    content: string;
    cached: boolean;
}

export interface EmbeddingOptions {
    model?: string;
    input: string;
}

export interface EmbeddingRequest {
    model?: string;
    input: string;
    provider?: 'openai' | 'gemini';
}

export interface EmbeddingResponse {
    embedding: number[];
    cached: boolean;
}