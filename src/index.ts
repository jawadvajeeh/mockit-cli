#!/usr/bin/env node

import { Command } from "commander";

import pkgJSON from "../package.json";
import fs from "fs";
import z from "zod";
import { getType } from "./utils";
import { createServer } from "./createServer";
import { configSchema, Route } from "./configSchema";
const program = new Command();

program
	.name(pkgJSON.name)
	.description(pkgJSON.description)
	.version(pkgJSON.version)
	.option('-c, --config <path>', 'Path to the JSON config file')
	.option('-h, --host <host>', 'Host to bind the server to', 'localhost')
	.option('-p, --port <port>', 'Port to bind the server to', '3000');

program.parse();


// parse options
const options = program.opts();

// check if config file is provided
if (!options.config) {
	console.error(`Error: No config file provided. Use -c or --config to specify the path to the JSON config file.
Use --help for more information.`);
	process.exit(1);
}
// check if config file exists
if (!fs.existsSync(options.config)) {
	console.error(`Error: Config file not found at ${options.config}`);
	process.exit(1);
}



// check if config file is a valid JSON
let routes: Route[] = [];
try {
	const configFileContent = fs.readFileSync(options.config, 'utf8');
	const config = JSON.parse(configFileContent);

	const validatedConfig = configSchema.parse(config);

	if (getType(config) !== '[object Object]') {
		console.error(`Error: Config file is not a valid JSON object.`);
		process.exit(1);
	}
	routes = Object.entries(validatedConfig).map(([path, routeDefinition]) => ({
		path,
		method: routeDefinition.method,
		response: routeDefinition.response,
		status: routeDefinition.status,
		delay: routeDefinition.delay,
	}));
} catch (error) {
	if (error instanceof z.ZodError) {
		console.error(`Validation Error: ${error.errors.map((e) => e.message).join(', ')}`);
	} else {
		console.error(`Error: Config file is not a valid JSON. ${error}`);
	}
	process.exit(1);
}



function startServer() {
	const host = options.host;
	const port = options.port;

	createServer({ host, port }, routes)
		.then(() => {
			console.log(`Server running at http://${host}:${port}`);
		})
		.catch((error) => {
			console.error(`Error starting server: ${error.message}`);
		});
}

startServer();
