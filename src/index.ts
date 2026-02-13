/**
 * Valentine's Games Worker
 *
 * Routes:
 * - / -> valentines.html (index.html)
 * - /games.html -> game picker
 * - /chase.html -> Winter Heart Chase game
 * - /snake.html -> Snake game
 * - /catch-hearts.html -> Catch Hearts game
 * - /assets/* -> static game assets
 */

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// All routes are handled by the ASSETS binding
		// Routes:
		// - / serves index.html (valentines page)
		// - /games.html, /chase.html, /snake.html, /catch-hearts.html
		// - /assets/* for game sprites and images
		// - /app.js, /chase.js for game scripts
		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
