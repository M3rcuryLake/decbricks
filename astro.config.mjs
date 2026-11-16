import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function webglPreloadIntegration() {
  return {
    name: 'decbricks-webgl-modulepreload',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const outDir = fileURLToPath(dir);
        const astroDir = path.join(outDir, '_astro');
        const indexHtml = path.join(outDir, 'index.html');
        if (!fs.existsSync(astroDir) || !fs.existsSync(indexHtml)) return;
        const implFile = fs
          .readdirSync(astroDir)
          .find((name) => /^impl\.[^.]+\.js$/.test(name));
        if (!implFile) return;
        const html = fs.readFileSync(indexHtml, 'utf8');
        if (html.includes('__DB_WEBGL_CHUNK__')) {
          fs.writeFileSync(
            indexHtml,
            html.replace(/__DB_WEBGL_CHUNK__/g, `/_astro/${implFile}`),
            'utf8'
          );
        }
      },
    },
  };
}

export default defineConfig({
  // Decbricks production origin; overridable via PUBLIC_SITE_URL (open-items A1).
  site: process.env.PUBLIC_SITE_URL || 'https://decbricks.com',
  compressHTML: true,
  integrations: [webglPreloadIntegration()],
  build: {
    inlineStylesheets: 'auto',
  },
  // BUG-012: the WebGL experience (three.js + site impl) is one
  // dynamically-imported vendor chunk (~557 kB min / ~140 kB gzip); splitting
  // it further would only add requests. 600 kB documents that choice.
  vite: {
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/gsap')) return 'gsap';
            if (id.includes('node_modules/lenis')) return 'lenis';
            return undefined;
          },
        },
      },
    },
  },
  // c7: always 'directory' URLs (`/about`), canonicals must match this policy.
  trailingSlash: 'never',
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
  devToolbar: { enabled: false },
});
