
export interface Message {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export interface CompletionRequest {
    model?: string
    messages: Message[]
    stop?: string | string[] | null
    provider?: 'openai' | 'claude' | 'gemini'
    temperature?: number
    maxTokens?: number
    topP?: number
    systemMessage?: string
}

export interface CompletionResponse {
    content: string
}

export interface EmbeddingRequest {
    model?: string
    input: string | string[]
    provider?: 'openai' | 'gemini'
}

export interface EmbeddingResponse {
    embedding: number[]
}