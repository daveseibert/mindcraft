// import { AgentProcess } from './src/process/agent_process.js';
import settings from './settings.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
// import { mainProxy } from './src/process/main_proxy.js';
import { readFileSync } from 'fs';
import {Agent} from "./src/agent/agent.js";

function parseArguments() {
    // eslint-disable-next-line no-undef
    return yargs(hideBin(process.argv))
        .option('profiles', {
            type: 'array',
            describe: 'List of agent profile paths',
        })
        .option('task_path', {
            type: 'string',
            describe: 'Path to task file to execute'
        })
        .option('task_id', {
            type: 'string',
            describe: 'Task ID to execute'
        })
        .help()
        .alias('help', 'h')
        .parse();
}

function getProfiles(args) {
    return args.profiles || settings.profiles;
}

async function main() {
    // const args = parseArguments();
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
