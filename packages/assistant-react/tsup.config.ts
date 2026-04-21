import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
  },
  format: 'esm',
  dts: true,
  clean: true,
  sourcemap: true,
  outDir: 'dist',
  external: [
    'react',
    'react-dom',
    '@radix-ui/react-tooltip',
    '@routepilot/engine',
    '@routepilot/react',
    '@routepilot/assistant',
  ],
});
