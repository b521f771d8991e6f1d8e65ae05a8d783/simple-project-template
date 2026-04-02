export function GET(): Response {
	const mode = (process.env.APP_MODE ?? "develop").toLowerCase();
	return Response.json({ mode });
}
