#!/usr/bin/env node

import { Command } from "commander";

import pkgJSON from "../package.json";
import fs from "fs";
import z from "zod";
import { getType } from "./utils";
const program = new Command();

program
	.name(pkgJSON.name)
	.description(pkgJSON.description)
	.version(pkgJSON.version)
	.option('-c, --config <path>', 'Path to the JSON config file');

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
try {
	const configFileContent = fs.readFileSync(options.config, 'utf8');
	const config = JSON.parse(configFileContent);

	const routeSchema = z.object({
		response: z.any().refine((value) => value !== undefined, { message: "Please provide response for all the routes." }),
		method: z.string().optional().default('GET').refine((method) => ['GET', 'POST', 'PUT', 'DELETE'].includes(method), { message: 'Invalid method' }),
		status: z.number().optional().default(200),
		delay: z.number().optional().default(0),
	},
	);

	const configSchema = z.record(z.string().startsWith("/", "Route must start with /"), routeSchema);

	const validatedConfig = configSchema.parse(config);

	if (getType(config) !== '[object Object]') {
		console.error(`Error: Config file is not a valid JSON object.`);
		process.exit(1);
	}
	const routes = Object.entries(validatedConfig).map(([path, routeDefinition]) => ({
		path,
		method: routeDefinition.method,
		response: routeDefinition.response,
		status: routeDefinition.status,
		delay: routeDefinition.delay,
	}));

	console.log(routes);
} catch (error) {
	if (error instanceof z.ZodError) {
		console.error(`Validation Error: ${error.errors.map((e) => e.message).join(', ')}`);
	} else {
		console.error(`Error: Config file is not a valid JSON. ${error}`);
	}
	process.exit(1);
}
