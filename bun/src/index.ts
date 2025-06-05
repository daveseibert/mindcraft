import docs from "./docs/index.html"
import root from "./public/index.html"
import OpenAI from "openai";
import { createMindServer } from "./server.js";

createMindServer();

const openai = new OpenAI();

interface Message {
    role: 'system' | 'user' | 'assistant'
    content: string
}

interface CompletionRequest {
    model: string
    messages: Message[]
}
interface ResponseRequest {
    model: string
    input: Message[]
}

interface EmbeddingRequest {
    model: string
    input: string
}

const server = Bun.serve({
    development: {
        console: true,
    },
    port: 80,
    routes: {
        "/docs": docs,
        "/": root,
        // @ts-ignore
        "/openapi.json": Response(await Bun.file("./src/docs/example_openapi.json").text()),
        "/health": Response.json({status: "OK"}),
        "/completions": {
            POST: async req => {
                const { model, messages } = await req.json() as CompletionRequest
                const response = await openai.chat.completions.create({model, messages});
                return Response.json({ content: response.choices[0].message.content ?? ""});
            }
        },
        "/responses": {
            POST: async req => {
                const body = await req.json() as ResponseRequest;
                const response = await openai.responses.create(body);
                return Response.json({ content: response.output_text });
            }
        },
        "/embeddings": {
            POST: async req => {
                const body = await req.json() as EmbeddingRequest;
                const response = await openai.embeddings.create(body);
                return Response.json([{ embedding: response.data[0].embedding }]);
            }
        }
    },
    fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/") return new Response("Home page!");
        if (url.pathname === "/blog") return new Response("Blog!");
        if (url.pathname === "/error") throw new Error("woops!");

        return new Response("404!", { status: 404 });
    },
    error(error) {
        console.error(error);
        return new Response(`Internal Error: ${error}`, {
            status: 500,
            headers: {
                "Content-Type": "text/plain",
            },
        });
    },
});
console.log(`Listening on http://localhost:${server.port} ...`);
console.log(`Creating MindServer...`);

