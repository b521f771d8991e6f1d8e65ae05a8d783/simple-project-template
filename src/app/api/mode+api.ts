export function GET(): Response {
	const mode = (process.env.APP_MODE ?? "build").toLowerCase();
	return Response.json({ mode });
}
