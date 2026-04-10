import { createRequestHandler, type RequestHandler } from "expo-server/adapter/workerd";

// https://developers.cloudflare.com/workers/runtime-apis/nodejs/ - node:sqlite will be supported

const handler: RequestHandler = createRequestHandler({
	build: "./server",
});

export default { fetch: handler };
