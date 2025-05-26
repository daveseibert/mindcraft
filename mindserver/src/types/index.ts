import { Socket, Server } from 'socket.io';

export interface Agent {
    name: string;
    in_game: boolean;
}

export interface AgentMessage {
    message: string;
    [key: string]: any;
}

export interface AgentManagers {
    [key: string]: Socket;
}

export interface InGameAgents {
    [key: string]: Socket;
}