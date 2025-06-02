import settings from './settings.js';
import {Agent} from "./src/agent/agent.js";

async function main() {
    const { load_memory, init_message , profiles} = settings;
    const profile = profiles[0];

    try {
        console.log('Starting agent with profile:', profile);
        const agent = new Agent();
        await agent.start(profile, load_memory, init_message, 0);
    } catch (error) {
        console.error('Failed to start agent process:');
        console.error(error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

try {
    main();
} catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
}
