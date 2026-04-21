import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: process.env.VITE_PUBLIC_BASE ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@routepilot/engine': path.resolve(__dirname, '../../packages/engine/src'),
      '@routepilot/react': path.resolve(__dirname, '../../packages/react/src'),
      '@routepilot/assistant': path.resolve(__dirname, '../../packages/assistant/src'),
      '@routepilot/assistant-react': path.resolve(__dirname, '../../packages/assistant-react/src'),
    },
  },
  optimizeDeps: {
    exclude: ['@routepilot/engine', '@routepilot/react', '@routepilot/assistant', '@routepilot/assistant-react'],
  },
});
