import { AgentProcess } from './src/process/agent_process.js';
import settings from './settings.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createMindServer } from './src/server/mind_server.js';
import { mainProxy } from './src/process/main_proxy.js';
import { readFileSync } from 'fs';
import * as logfire from "logfire";
import * as logfire_api from "@pydantic/logfire-api";

logfire.configure({
    serviceName: "agent",
    otelScope: "logfire",
    nodeAutoInstrumentations: {
        '@opentelemetry/instrumentation-http': {
            enabled: false,
        },
        '@opentelemetry/instrumentation-fs': {
            enabled: false,
        }
    }
});

function parseArguments() {
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

async function connectToMindServer() {
    console.log('Connecting to MindServer...');
    if (settings.host_mindserver) {
        const mindServer = createMindServer(settings.mindserver_port);
    }
    try {
        const url = await mainProxy.connect();
        console.log(`Connected to main proxy at: ${url}`);
    } catch (error) {
        console.error('Failed to connect to main process:', error);
        throw error;
    }
}

async function setup_agent(profile_path, agent_json, i, task_path, task_id) {
    const agent_process = new AgentProcess();
    logfire.info('Registering:', agent_json.name);
    mainProxy.registerAgent(agent_json.name, agent_process);
    logfire.info('Starting:', agent_json.name);
    const { load_memory, init_message } = settings;
    agent_process.start(profile_path, load_memory, init_message, i, task_path, task_id);
    logfire.info('Started:', agent_json.name);
    logfire.info('Waiting for 1000 ms');
    await new Promise(resolve => setTimeout(resolve, 1000));
    logfire.info('Done waiting 1000 ms');
}


async function main() {
    await connectToMindServer();

    const args = parseArguments();
    const profiles = getProfiles(args);
    await logfire.info(`Using profiles: ${profiles}`, {"profiles": profiles});

    logfire.info("Using profiles: ", profiles.join(","));
    for (let i=0; i<profiles.length; i++) {
        const agent_profile = profiles[i];
        const agent_json = JSON.parse(readFileSync(agent_profile, 'utf8'));
        const agent_name = agent_json.name;
        await logfire_api.span(`Setting up agent ${agent_name} with profile ${agent_profile}`, {
            agent_name: agent_name,
            agent_profile: agent_profile}, {
            level: logfire.Level.Info,
        }, async (span) => {
            await setup_agent(profiles[i], agent_json, i, args.task_path, args.task_id);
            await span.end();
        });
    }
    console.log("main.js: leaving main()");
}

try {
    main();
} catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
}
