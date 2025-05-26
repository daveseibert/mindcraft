import express, { Router } from 'express';
import { Route, Get, Post, Body, Controller, Response } from 'tsoa';
import * as openai from '../services/openai.js';
import * as claude from '../services/claude.js';
import * as gemini from '../services/gemini.js';
import { CacheService } from '../services/cache.js';
import { CompletionOptions, CompletionResponse, EmbeddingOptions, EmbeddingResponse } from '../types/ai.js';

type Role = 'system' | 'user' | 'assistant';

interface Message {
    role: Role;
    content: string;
}

// Types
interface CompletionRequest {
    model?: string;
    messages: Message[];
    stop?: string | string[] | null;
    provider?: 'openai' | 'claude' | 'gemini';
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    systemMessage?: string;
}

interface EmbeddingsRequest {
    model?: string;
    input: string | string[];
    provider?: 'openai' | 'gemini';
}

interface ErrorResponse {
    message: string;
    status: number;
}

@Route('api')
export class ApiController extends Controller {
    @Get('health')
    public async healthCheck(): Promise<{ status: string }> {
        return { status: 'OK' };
    }

    @Response<ErrorResponse>(418)
    @Get('coffee')
    public getCoffee(): void {
        this.setStatus(418);
        throw new Error("I'm a teapot");
    }

    @Post('create_completions')
    public async createCompletions(
        @Body() req: CompletionRequest
    ): Promise<{ content: string }> {
        const provider = req.provider || 'openai';

        const options: CompletionOptions = {
            model: req.model,
            messages: req.messages,
            stop: req.stop || undefined,
            temperature: req.temperature,
            maxTokens: req.maxTokens,
            topP: req.topP,
            systemMessage: req.systemMessage
        };

        const hash = CacheService.hashRequest(options);
        const cacheKey = CacheService.createKey(provider, options.model || '', hash);

        // Check cache
        const cached = await CacheService.get<string>(cacheKey);
        if (cached !== null) {
            return { content: cached };
        }

        try {
            let response: CompletionResponse;

            switch (provider) {
                case 'openai':
                    response = await openai.createCompletion(options);
                    break;
                case 'claude':
                    response = await claude.createCompletion(options);
                    break;
                case 'gemini':
                    response = await gemini.createCompletion(options);
                    break;
                default:
                    throw new Error(`Unknown provider: ${provider}`);
            }

            if (response.content) {
                await CacheService.set(cacheKey, response.content);
            }

            this.setStatus(201);
            return { content: response.content };
        } catch (error) {
            this.setStatus(500);
            throw error;
        }
    }

    @Post('embeddings')
    public async getEmbeddings(
        @Body() req: EmbeddingsRequest
    ): Promise<{ embedding: number[] }[]> {
        const provider = req.provider || 'openai';
        const model = req.model || 'text-embedding-3-small';
        const input = typeof req.input === 'string' ? req.input : req.input[0];
        const options: EmbeddingOptions = {
            model,
            input
        };

        const hash = CacheService.hashRequest({ input: req.input });
        const cacheKey = CacheService.createKey(provider, model, hash, 'emb');

        // Check cache
        const cached = await CacheService.get<number[]>(cacheKey);
        if (cached !== null) {
            return [{ embedding: cached }];
        }

        try {
            let response: EmbeddingResponse;

            if (provider === 'openai') {
                response = await openai.createEmbedding(options);
            } else if (provider === 'gemini') {
                response = await gemini.createEmbedding(options);
            } else {
                throw new Error(`Unsupported embedding provider: ${provider}`);
            }

            if (response.embedding) {
                await CacheService.set(cacheKey, response.embedding);
            }

            this.setStatus(201);
            return [{ embedding: response.embedding }];
        } catch (error) {
            console.error('Embedding error:', error);
            this.setStatus(500);
            throw error;
        }
    }
}

const router = Router();
export default router;
