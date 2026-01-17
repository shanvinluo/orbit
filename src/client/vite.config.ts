import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.join(__dirname, 'src/client'), // Tell Vite where index.html is
  build: {
    outDir: path.join(__dirname, 'dist/client'), // Output to dist/client
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});