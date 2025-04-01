import polka, { Polka } from 'polka';
import { Route } from './configSchema';

type ServerOptions = {
	host: string;
	port: number;
};

type HttpMethod = Lowercase<Route['method']>;

function registerRoutes(app: Polka, routes: Array<Route>, isRandomize: boolean) {
	routes.forEach(({ path, method, response, delay }) => {
		const httpMethod = method.toLowerCase() as HttpMethod;
		app[httpMethod](path, (req: any, res: any) => {
			const outcome = isRandomize ? (Math.random() < 0.5 ? 'success' : 'error') : 'success';
			const status = response[outcome].status;
			const responseBody = response[outcome];
			const log = `[${status}] ${method.toUpperCase()} ${path}${delay ? ` (delay: ${delay}ms)` : ''}`;
			console.log(log);
			if (delay) {
				setTimeout(() => {
					res.writeHead(status, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify(responseBody));
				}, delay);
			} else {
				res.writeHead(status, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(responseBody));
			}
		});
	});
}

export function createServer({ host, port }: ServerOptions, config: Route[], isRandomize: boolean) {
	const app = polka();

	return new Promise<void>((resolve, reject) => {
		registerRoutes(app, config, isRandomize);
		app.listen(port, host, (err?: Error) => {
			if (err) {
				console.error(`❌ Failed to start server:`, err.message);
				reject(err);
			} else {
				console.log(`✅ Mock server running at http://${host}:${port}`);
				resolve();
			}
		});
	});
}
