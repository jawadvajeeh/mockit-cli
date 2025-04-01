import polka, { Polka } from 'polka';
import { Route } from './configSchema';

type ServerOptions = {
	host: string;
	port: number;
};

type HttpMethod = Lowercase<Route['method']>;

function registerRoutes(app: Polka, routes: Array<Route>) {
	routes.forEach(({ path, method, response, status, delay }) => {
		const httpMethod = method.toLowerCase() as HttpMethod;
		app[httpMethod](path, (req: any, res: any) => {
			const log = `[${status}] ${method.toUpperCase()} ${path}${delay ? ` (delay: ${delay}ms)` : ''}`;
			console.log(log);
			if (delay) {
				setTimeout(() => {
					res.writeHead(status, { 'Content-Type': 'application/json' });
					res.end(JSON.stringify(response));
				}, delay);
			} else {
				res.writeHead(status, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(response));
			}
		});
	});
}

export function createServer({ host, port }: ServerOptions, config: Route[]) {
	const app = polka();

	return new Promise<void>((resolve, reject) => {
		registerRoutes(app, config);
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
