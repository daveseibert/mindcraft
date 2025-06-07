import mineflayer from 'mineflayer';

const minecraft_args = {
    host: process.env.MINECRAFT_HOST,
    port: process.env.MINECRAFT_PORT,
    username: process.env.MINECRAFT_USERNAME,
    version: process.env.MINECRAFT_VERSION,
};

class SimpleBot {
    constructor(username) {
        this.username = username;
        this.host = minecraft_args["host"];
        this.port = minecraft_args["port"];
        this.version = minecraft_args["version"];

        // Initialize the bot
        this.initBot();
    }
    initBot() {
        this.bot = mineflayer.createBot({
            "username": this.username,
            "host": this.host,
            "port": this.port,
            "version": this.version
        });

        // Initialize bot events
        this.initEvents();
    }

    initEvents() {

        this.bot.on('login', () => {
            let botSocket = this.bot._client.socket;
            this.log(`Logged in to ${botSocket.server ? botSocket.server : botSocket._host}`);
        });

        this.bot.on('end', () => {
            this.log(`Disconnected`);
        });

        this.bot.on('error', (err) => {
            if (err.code == 'ECONNREFUSED') {
                this.log(`Failed to connect to ${err.address}:${err.port}`)
            } else {
                this.log(`Unhandled error: ${err}`);
            }
        });
    }
    log(...msg) {
        console.log(`[${this.username}]`, ...msg);
    }
}

class ReconnectingBot extends SimpleBot {
    initEvents() {
        super.initEvents();
        this.bot.on('end', (reason) => {
            console.log(`[${this.username}] Disconnected: ${reason}`);
            if (reason === "disconnect.quitting") {
                this.log("Will not try to join again. I quit.")
                return
            }
            this.log("Will re-init in 5000 milliseconds");
            setTimeout(() => this.initBot(), 5000);
        });
    }
}

class QuittingBot extends ReconnectingBot {
    initEvents() {
        super.initEvents();

        this.bot.on('spawn', async () => {
            this.log("Spawned in");
            this.bot.chat("Hello!");

            await this.bot.waitForTicks(60);
            this.bot.chat("Goodbye");
            this.bot.quit();
        });
    }
}

class ChatBot extends ReconnectingBot {
    initEvents() {
        super.initEvents();

        this.bot.on('chat', async (username, jsonMsg) => {
            this.chatLog(username, jsonMsg);
        });
    }
    chatLog(username, ...msg) {
        if(!botNames.includes(username)) {
            this.log((`<${username}>`), ...msg)
        }
    }
}


export class LookingBot extends ChatBot {
    chatLog(username, ...msg) {
        if (!botNames.includes(username)) {
            this.log((`<${username}>`), ...msg)

            let localPlayers = this.bot.players;
            let playerLocation = localPlayers[username].entity.position;

            this.log(`Player ${username} found at ${playerLocation}`);
            this.bot.lookAt(playerLocation);
        }
    }
}

class JumpingBot extends ChatBot {
    chatLog(username, ...msg) {
        if (!botNames.includes(username)) {
            this.log((`<${username}>`), ...msg)

            let localPlayers = this.bot.players;
            let playerLocation = localPlayers[username].entity.position;

            this.log(`Player ${username} found at ${playerLocation}`);
            this.bot.lookAt(playerLocation);
            this.runAndJump();
        }
    }

    async runAndJump() {
        this.bot.setControlState('forward', true);
        await this.bot.waitForTicks(1);
        this.bot.setControlState('sprint', true);
        this.bot.setControlState('jump', true);

        await this.bot.waitForTicks(11);
        this.bot.clearControlStates();
    }
}
