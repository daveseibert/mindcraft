import { Server as SocketIOServer, Socket } from 'socket.io';
// import * as express from "express";
import express from 'express';
import type { Express } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import router from './routes/apiRoutes.js';
import { Agent, AgentManagers, InGameAgents, AgentMessage } from './types';
// @ts-ignore
import { RegisterRoutes } from './routes/routes.js';
import morgan from 'morgan';

// Module-level variables
let io: SocketIOServer;
let server: http.Server;
const registeredAgents: Set<string> = new Set();
const inGameAgents: InGameAgents = {};
const agentManagers: AgentManagers = {};

export function createMindServer(port: number = 8080): http.Server {
    const app: Express = express();
    server = http.createServer(app);
    io = new SocketIOServer(server);

    app.use(morgan('dev'))
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));


    // Serve static files
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    app.use(express.static(path.join(__dirname, '..', 'public')));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    });

    // Socket.io connection handling
    io.on('connection', (socket: Socket) => {
        let curAgentName: string | null = null;
        console.log('Client connected');

        agentsUpdate(socket);

        socket.on('register-agents', (agentNames: string[]) => {
            console.log(`Registering agents: ${agentNames}`);
            agentNames.forEach(name => registeredAgents.add(name));
            for (let name of agentNames) {
                agentManagers[name] = socket;
            }
            socket.emit('register-agents-success');
            agentsUpdate();
        });

        socket.on('login-agent', (agentName: string) => {
            if (curAgentName && curAgentName !== agentName) {
                console.warn(`Agent ${agentName} already logged in as ${curAgentName}`);
                return;
            }
            if (registeredAgents.has(agentName)) {
                curAgentName = agentName;
                inGameAgents[agentName] = socket;
                agentsUpdate();
            } else {
                console.warn(`Agent ${agentName} not registered`);
            }
        });

        socket.on('logout-agent', (agentName: string) => {
            if (inGameAgents[agentName]) {
                delete inGameAgents[agentName];
                agentsUpdate();
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
            if (curAgentName && inGameAgents[curAgentName]) {
                delete inGameAgents[curAgentName];
                agentsUpdate();
            }
        });

        socket.on('chat-message', (agentName: string, json: AgentMessage) => {
            if (!inGameAgents[agentName]) {
                console.warn(`Agent ${agentName} tried to send a message but is not logged in`);
                return;
            }
            console.log(`${curAgentName} sending message to ${agentName}: ${json.message}`);
            inGameAgents[agentName].emit('chat-message', curAgentName, json);
        });

        socket.on('restart-agent', (agentName: string) => {
            console.log(`Restarting agent: ${agentName}`);
            inGameAgents[agentName]?.emit('restart-agent');
        });

        socket.on('stop-agent', (agentName: string) => {
            const manager = agentManagers[agentName];
            if (manager) {
                manager.emit('stop-agent', agentName);
            } else {
                console.warn(`Stopping unregistered agent ${agentName}`);
            }
        });

        socket.on('start-agent', (agentName: string) => {
            const manager = agentManagers[agentName];
            if (manager) {
                manager.emit('start-agent', agentName);
            } else {
                console.warn(`Starting unregistered agent ${agentName}`);
            }
        });

        socket.on('stop-all-agents', () => {
            console.log('Killing all agents');
            stopAllAgents();
        });

        socket.on('shutdown', () => {
            console.log('Shutting down');
            Object.values(agentManagers).forEach(manager => {
                manager.emit('shutdown');
            });
            setTimeout(() => {
                process.exit(0);
            }, 2000);
        });

        socket.on('send-message', (agentName: string, message: string) => {
            if (!inGameAgents[agentName]) {
                console.warn(`Agent ${agentName} not logged in, cannot send message via MindServer.`);
                return;
            }
            try {
                console.log(`Sending message to agent ${agentName}: ${message}`);
                inGameAgents[agentName].emit('send-message', agentName, message);
            } catch (error) {
                console.error('Error: ', error);
            }
        });
    });

    // Middleware

    // API Documentation
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(undefined, {
        swaggerUrl: '/swagger.json',
        swaggerOptions: {
            url: "/swagger.json"
        }
    }));

    // API Routes

    RegisterRoutes(app);
    // app.use('/api', router);

    server.listen(port, '0.0.0.0', () => {
        console.log(`MindServer running on port ${port}`);
    });


    // Handle server errors
    server.on('error', (error) => {
        console.error('Server error:', error);
    });


    return server;
}

function agentsUpdate(socket: Socket | SocketIOServer = io): void {
    const agents: Agent[] = Array.from(registeredAgents).map(name => ({
        name,
        in_game: !!inGameAgents[name]
    }));
    socket.emit('agents-update', agents);
}

function stopAllAgents(): void {
    Object.entries(inGameAgents).forEach(([agentName, _]) => {
        const manager = agentManagers[agentName];
        if (manager) {
            manager.emit('stop-agent', agentName);
        }
    });
}


// Handle process termination
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Gracefully shutdown
    server.close(() => {
        process.exit(1);
    });
});

export const getIO = (): SocketIOServer => io;
export const getServer = (): http.Server => server;
