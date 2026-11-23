import process from 'node:process';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// Serves the Vercel function api/love.js on the local dev server (Vercel runs it
// in production). With Upstash credentials in .env.local it talks to the real
// store; without them it uses a small in-memory stand-in, so the Total Love
// button can be tried locally. The stand-in exists only in `vite` dev mode; it
// is never part of the build.
function loveApiDevServer() {
  return {
    name: 'love-api-dev-server',
    apply: 'serve',
    async configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      for (const key of ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'LOVE_SALT']) {
        if (env[key]) process.env[key] = env[key];
      }
      const { createLoveHandler, default: realHandler } = await server.ssrLoadModule('/api/love.js');
      const hasStore = Boolean(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL);

      let handler = realHandler;
      if (!hasStore) {
        server.config.logger.info('  [love] No Upstash credentials in .env.local: using an in-memory counter for local development.');
        const data = new Map();
        const timers = new Map();
        const run = async (commands) =>
          commands.map(([command, key, value]) => {
            if (command === 'GET') return data.get(key) ?? null;
            if (command === 'INCRBY') {
              const next = (data.get(key) ?? 0) + Number(value);
              data.set(key, next);
              return next;
            }
            // EXPIRE key seconds NX: set a timeout only if the key has none yet.
            if (!timers.has(key)) {
              timers.set(key, setTimeout(() => (data.delete(key), timers.delete(key)), Number(value) * 1000).unref());
            }
            return 1;
          });
        handler = createLoveHandler(() => ({ run, salt: 'dev' }));
      }

      server.middlewares.use('/api/love', (req, res) => handler(req, res));
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), loveApiDevServer()],
});
