import { createMindServer } from './server.js';

const port = process.env.MINDSERVER_PORT || 8080;
const server = createMindServer(port);
