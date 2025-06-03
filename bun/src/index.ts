import docs from "./docs/index.html"
import root from "./public/index.html"
import { createMindServer } from "./server.js";

createMindServer();

const server = Bun.serve({
    development: true,
    port: 80,
    routes: {
        "/docs": docs,
        "/": root,
        // @ts-ignore
        "/openapi.json": Response(await Bun.file("./src/docs/example_openapi.json").text()),
    },
    fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/") return new Response("Home page!");
        if (url.pathname === "/blog") return new Response("Blog!");
        if (url.pathname === "/error") throw new Error("woops!");

        return new Response("404!");
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

