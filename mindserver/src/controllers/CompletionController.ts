import { Body, Post, Route, Tags, SuccessResponse } from 'tsoa';
import { CompletionRequest, CompletionResponse } from '../types/ai';
import * as openai from '../services/openai';
import * as claude from '../services/claude';
import * as gemini from '../services/gemini';

@Route('api/completions')
@Tags('AI')
export class CompletionController {
    /**
     * Create a completion using the specified AI provider
     */
    @SuccessResponse('201', 'Created')
    @Post()
    public async createCompletion(
        @Body() request: CompletionRequest
    ): Promise<CompletionResponse> {
        const { provider = 'openai', ...options } = request;

        try {
            switch (provider) {
                case 'claude':
                    return await claude.createCompletion(options);
                case 'gemini':
                    return await gemini.createCompletion(options);
                default:
                    return await openai.createCompletion(options);
            }
        } catch (error) {
            throw new Error(`AI Provider error: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
