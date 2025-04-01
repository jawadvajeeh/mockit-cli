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
	.version(pkgJSON.version);

program
	.command('start')
	.description('Start the mock server')
	.option('-c, --config <path>', 'Path to the mock config file')
	.option('-h, --host <host>', 'Host to bind the server to', 'localhost')
	.option('-p, --port <port>', 'Port to bind the server to', '3000')
	.option('-r, --randomize', 'Randomize success/failure response')
	.action((options) => {
		if (!options.config) {
			console.error(`Error: No config file provided. Use -c or --config to specify the path to the JSON config file.
Use --help for more information.`);
			process.exit(1);
		}

		if (!fs.existsSync(options.config)) {
			console.error(`Error: Config file not found at ${options.config}`);
			process.exit(1);
		}

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
				delay: routeDefinition.delay,
			}));

			const host = options.host;
			const port = options.port;
			console.log(`Here`, options.randomize);
			createServer({ host, port }, routes, options.randomize)
				.then(() => {
					console.log(`Server running at http://${host}:${port}`);
				})
				.catch((error) => {
					console.error(`Error starting server: ${error.message}`);
				});
		} catch (error) {
			if (error instanceof z.ZodError) {
				console.error(`Validation Error: ${error.errors.map((e) => e.message).join(', ')}`);
			} else {
				console.error(`Error: Config file is not a valid JSON. ${error}`);
			}
			process.exit(1);
		}
	});

program
	.command('generate')
	.description('Generate a JSON config file with example routes')
	.option('-n, --endpoints <number>', 'Number of endpoints to generate', '5')
	.action((options) => {
		const count = parseInt(options.endpoints, 10);
		if (isNaN(count) || count <= 0) {
			console.error('Error: Invalid number of endpoints. Please provide a positive integer.');
			process.exit(1);
		}
		const config: Record<string, any> = {};
		for (let i = 1; i <= count; i++) {
			config[`/endpoint${i}`] = {
				method: 'GET',
				delay: 0,
				response: {
					success: {
						status: 200
					},
					error: {
						status: 500
					}

				}
			};
		}

		console.log(JSON.stringify(config, null, 2));
	});

program.parse();
