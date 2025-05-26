import { CompletionRequest } from './types/ai';

declare module 'express-serve-static-core' {
    interface Request {
        body: CompletionRequest;
    }
}
