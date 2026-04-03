// Dynamically import API route modules.
// Each module exports named functions (GET, POST, PUT, DELETE).
const routes: Record<string, () => Promise<Record<string, Function>>> = {
	"/api/mode": () => import("./app/api/mode+api"),
};

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const method = request.method;

		// Try API routes
		const loader = routes[url.pathname];
		if (loader) {
			const mod = await loader();
			const handler = mod[method];
			if (handler) {
				try {
					return await handler(request);
				} catch (err) {
					if (err instanceof Response) return err;
					throw err;
				}
			}
			return new Response("Method Not Allowed", { status: 405 });
		}

		// Static assets are served automatically by Cloudflare's asset binding
		// (configured via assets.directory in wrangler.jsonc). If no route matched,
		// return 404 — the request already bypassed static asset serving.
		return new Response("Not Found", { status: 404 });
	},
};
