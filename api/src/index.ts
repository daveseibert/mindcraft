import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { Redis } from 'ioredis'

// Initialize Redis client
const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
})

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
    .listen(3000)

console.log(`🦊 Server is running at ${index.server?.hostname}:${index.server?.port}`)

