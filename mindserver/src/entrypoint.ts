import { createMindServer } from './index.js';

const port = parseInt(process.env.MINDSERVER_PORT || '8080', 10);
const server = createMindServer(port);
