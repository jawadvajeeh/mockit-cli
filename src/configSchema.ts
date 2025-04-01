import { z } from "zod";

const routeSchema = z.object({
	response: z.any().refine((value) => value !== undefined, { message: "Please provide response for all the routes." }),
	method: z.enum(["GET", "POST", "PUT", "DELETE"], { message: "Invalid method!" }).optional().default('GET'),
	status: z.number().optional().default(200),
	delay: z.number().optional().default(0),
},
);

export const configSchema = z.record(z.string().startsWith("/", "Route must start with /"), routeSchema);

export type RouteDefinition = z.infer<typeof routeSchema>;
export type Route = RouteDefinition & { path: string; };