import { Elysia, t } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { OpenAI } from 'openai'
import { Redis } from 'ioredis'
import crypto from "crypto";

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
    return crypto
        .createHash('sha256')
        .update(JSON.stringify(data, Object.keys(data).sort()))
        .digest('hex');
}
const EmbeddingRequestType = {
    model: String,
    input: [String, [String]],
    provider: String
} as const
const CompletionRequestType = {
    model: String,
    messages: [{ role: String, content: String }],
    stop: [String, [String], null],
    // provider: String,
    // temperature: Number,
    // maxTokens: Number,
    // topP: Number,
    // systemMessage: String
} as const

function createKey(
    model: string,
    hash: string,
    type: string
): string {
    return `${type}:${model}:${hash}`;
}

const index = new Elysia()
    .use(swagger())
    .get('/health', () => ({ status: 'OK' }))
    .get('/coffee', ({ status }) => status(418, "Kirifuji Nagisa"))
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
                stop: req.stop
            })

        const cacheKey = createKey(req.model, hashed, 'comp')

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
    }, { body: CompletionRequestType })

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
    .listen(3000)

console.log(`🦊 Server is running at ${index.server?.hostname}:${index.server?.port}`)

