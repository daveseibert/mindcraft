import { LookingBot } from './bots.js'
import root from "./public/index.html"

const lookingBot = new LookingBot("todd3")


function checkHealth(bot) {
    return bot.health;
}
function checkPosition(bot) {
    return bot.entity.position;
}
function checkInventory(bot) {
    let inventory = {};
    for (const item of bot.inventory.items()) {
        if (item != null) {
            if (inventory[item.name] == null) {
                inventory[item.name] = 0;
            }
            inventory[item.name] += item.count;
        }
    }
    return inventory;
}

const server = Bun.serve({
    development: {
        console: true,
    },
    port: 80,
    routes: {
        "/": root,
        "/health": Response.json({status: "OK"}),
        "/inventory": {
            GET: async req => {
                const inventory = checkInventory(lookingBot.bot);
                console.log(`Inventory: ${inventory}`);
                const output = {inventory: inventory};
                console.log(output)
                return Response.json(output);
            }
        },
        "/hp": {
            GET: async req => {
                const hp = checkHealth(lookingBot.bot);
                console.log(`HP: ${hp}`);
                return Response.json({ hp: hp});
            }
        },
        "/position": {
            GET: async req => {
                const position = checkPosition(lookingBot.bot);
                console.log(`Position: ${position}`);
                return Response.json({ position: position});
            }
        },
    },
    fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/error") throw new Error("woops!");
        if (server.upgrade(req)) {
            return; // do not return a Response
        }
        return new Response("Upgrade failed", { status: 500 });
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
    websocket: {
        message(ws, message) {
            console.log(`Websocket received message: ${message}`);
        },
        open(ws) {
            console.log(`Websocket opened`)
            ws.subscribe("chat")
        },
        close(ws, code, message) {
            console.log(`Websocket closed with code ${code} and message: ${message}`)
        },
        drain(ws) {
            console.log(`Websocket drained`)
        },
    }
});
console.log(`Listening on http://localhost:${server.port} ...`);
console.log(`Starting bot`);

lookingBot.bot.on('health', () => {
    console.log(`"Health Event!`);
    const data = {channel: "hp", data: {"hp": lookingBot.bot.health}}
    const stringified = JSON.stringify(data);
    server.publish("chat", stringified);
});
lookingBot.bot.on('spawn', () => {
    console.log(`"Spawned!`);
    updateInventory(lookingBot.bot);
});

function updateInventory(bot) {
    const inventory = checkInventory(bot)
    const data = {channel: "inventory", data: {"inventory": inventory}}
    const stringified = JSON.stringify(data);
    server.publish("chat", stringified);

}

lookingBot.bot.on('move', () => {
    const { x, y, z } = lookingBot.bot.entity.velocity;
    if (x === 0 && z === 0 && y === -0.0784000015258789) {
        return;
    }
    const data = {channel: "move", data: {"position": lookingBot.bot.entity.position}}
    const stringified = JSON.stringify(data);
    server.publish("chat", stringified);
    updateInventory(lookingBot.bot);
});
