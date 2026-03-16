import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/dashboard': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: path => path.replace(/^\/dashboard/, '/dashboard'),
      }
    }
  }
});
