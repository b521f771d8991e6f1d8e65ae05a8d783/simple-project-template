import { createRequestHandler, type RequestHandler } from "expo-server/adapter/workerd";

console.log("cwd:", new URL(".", import.meta.url).pathname);
const handler: RequestHandler = createRequestHandler({
	build: "./server",
});

export default { fetch: handler };
