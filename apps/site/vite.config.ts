import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Dev-only plugin that serves the embedded guided-tour-demo SPA under /demo/*.
 *
 * Without this, Vite's built-in SPA fallback intercepts any /demo/* request
 * that isn't an exact static asset and serves the landing page's root
 * index.html — causing the "Try Live Demo" iframe to show the landing page
 * itself instead of the demo.
 *
 * This middleware runs BEFORE Vite's internal middlewares (no return fn),
 * so it claims /demo/* requests first and serves public/demo/index.html for
 * any non-asset path, mimicking a scoped SPA fallback for the demo.
 */
function serveEmbeddedDemoPlugin(): Plugin {
  return {
    name: 'serve-embedded-demo',
    configureServer(server) {
      const demoIndexPath = path.resolve(__dirname, 'public/demo/index.html');

      server.middlewares.use((req, _res, next) => {
        if (!req.url) return next();

        // Parse pathname without query
        const pathname = req.url.split('?')[0] ?? '';

        // Only care about /demo and /demo/... requests
        if (pathname !== '/demo' && !pathname.startsWith('/demo/')) {
          return next();
        }

        // Let Vite's public-dir middleware handle hashed assets and any
        // request that targets a file (has a dot in the final segment).
        const lastSegment = pathname.split('/').pop() ?? '';
        if (lastSegment.includes('.')) return next();

        // SPA fallback for the demo: serve public/demo/index.html
        if (!existsSync(demoIndexPath)) return next();

        try {
          const html = readFileSync(demoIndexPath, 'utf-8');
          _res.setHeader('Content-Type', 'text/html; charset=utf-8');
          _res.end(html);
        } catch {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveEmbeddedDemoPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@routepilot/engine': path.resolve(__dirname, '../../packages/engine/src'),
      '@routepilot/react': path.resolve(__dirname, '../../packages/react/src'),
    },
  },
  server: {
    port: 5175,
  },
});
