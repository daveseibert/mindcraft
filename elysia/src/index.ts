import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { OpenAI } from 'openai'
import { Redis } from 'ioredis'
import crypto from "crypto";
import { cors } from '@elysiajs/cors'  // You might need to install this package

interface Message {
    role: 'system' | 'user' | 'assistant'
    content: string
}

interface CompletionRequest {
    model: string
    messages: Message[]
    stop?: string | string[] | null
    provider?: 'openai' | 'claude' | 'gemini'
    temperature?: number
    maxTokens?: number
    topP?: number
    systemMessage?: string
}

interface CompletionResponse {
    content: string
}

interface EmbeddingRequest {
    model?: string
    input: string | string[]
    provider?: 'openai' | 'gemini'
}

interface EmbeddingResponse {
    embedding: number[]
}

// Initialize Redis client
const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
})

const openai = new OpenAI();


function hash(data: Record<string, any>): string {
    const jsonString = JSON.stringify(data, (key, value) => {
        if (value !== undefined) {
            return value;
        }
    });
    return crypto
        .createHash('sha256')
        .update(jsonString)
        .digest('hex');
}

const EmbeddingRequestType = {
    model: String,
    input: [String, [String]],
    provider: String
} as const

const CompletionRequestType = t.Object({
    model: t.String(),
    messages: t.Array(
        t.Object({
            role: t.String(),
            content: t.String()
        })
    ),
    stop: t.Optional(
        t.Union([
            t.String(),
            t.Array(t.String()),
            t.Null()
        ])
    )
})

function createKey(
    model: string,
    hash: string,
    type: string
): string {
    return `${type}:${model}:${hash}`;
}

const index = new Elysia()
    .use(swagger({
        provider: "swagger-ui",
    }))
    .use(cors())
    .onAfterHandle(({ request, set }) => {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const method = request.method;
        const path = new URL(request.url).pathname;
        const status = set.status || 200;

        console.log(`INFO   ${ip} - "${method} ${path} HTTP/1.1" ${status}`);
    })
    .options('*', () => new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    }))
    .get('/health', () => ({ status: 'OK' }))
    .get('/coffee', ({ status }: { status: (status_code: number, msg: string) => void }) => status(418, "Kirifuji Nagisa"))
    .get('/', ({ redirect }) => {
        return redirect('/swagger')
    })
    .get('/docs', ({ redirect }) => {
        return redirect('/swagger')
    })
    // Completions endpoint
    .post('/completions', async ({ body, set }) => {
        const req = body as CompletionRequest

        const hashed = hash({
            messages: req.messages,
            model: req.model,
            stop: req.stop,
            temperature: req.temperature,
            maxTokens: req.maxTokens,
            topP: req.topP,
            systemMessage: req.systemMessage
            })

        const cacheKey = createKey(req.model, hashed, 'comp');
        console.log('Cache key:', cacheKey);


        const cached = await redis.get(cacheKey)
        if (cached) {
            const cachedContent = JSON.parse(cached)
            if (cachedContent === null) {
                set.status = 200
                return { content: "" }
            }
            set.status = 200
            return { content: cachedContent }
        }

        try {
            const response = await openai.chat.completions.create({
                model: req.model,
                messages: req.messages,
                stop: req.stop || undefined,
            })

            const content = response.choices[0]?.message?.content || "No response generated"

            if (content) {
                await redis.set(cacheKey, JSON.stringify(content))
            }

            set.status = 201
            return { content }
        } catch (error) {
            set.status = 500
            return { error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }, { body: CompletionRequestType,
        detail: { examples: {
            request: {
                body: {
                    model: 'text-embedding-3-small',
                    input: 'Hello world',
                    provider: 'openai'
                }
            }

            , responses: {
                    '201': {
                        description: 'Successful response',
                        content: {
                            'application/json': {
                                example: {
                                    embedding: [0.0023, -0.0045, 0.0012] // shortened for brevity
                                }
                            }
                        }
                    }

                }
            }
    }
    })

    // Embeddings endpoint
    .post('/embeddings', async ({ body, set }) => {
        const req = body as EmbeddingRequest

        const hashed = crypto.createHash('sha256')
            .update(JSON.stringify(req.input))
            .digest('hex')

        const cacheKey = `emb:${req.model}:${hashed}`

        const cached = await redis.get(cacheKey)
        if (cached) {
            set.status = 200
            return [{ embedding: JSON.parse(cached) }]
        }

        try {
            const response = await openai.embeddings.create({
                model: req.model,
                input: req.input,
                encoding_format: "float"
            })

            const embedding = response.data[0].embedding
            await redis.set(cacheKey, JSON.stringify(embedding))

            set.status = 201
            return [{ embedding }]
        } catch (error) {
            set.status = 500
            return { error: error instanceof Error ? error.message : 'Unknown error' }
        }
    }, { body: EmbeddingRequestType })
    .listen(80)

console.log(`🦊 Server is running at ${index.server?.hostname}:${index.server?.port}`)

