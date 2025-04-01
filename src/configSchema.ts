import { z } from "zod";

const routeSchema = z.object({
	response: z.object({
		success: z.object({ status: z.number().default(200) }).refine((value) => value !== undefined, { message: "Empty response" }),
		error: z.object({ status: z.number() })
	}),
	method: z.enum(["GET", "POST", "PUT", "DELETE"], { message: "Invalid method!" }).optional().default('GET'),
	delay: z.number().optional().default(0),
},
);

export const configSchema = z.record(z.string().startsWith("/", "Route must start with /"), routeSchema);

export type RouteDefinition = z.infer<typeof routeSchema>;
export type Route = RouteDefinition & { path: string; };