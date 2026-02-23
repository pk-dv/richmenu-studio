import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
    return {
      base: '/richmenu-studio/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: true
      },
      plugins: [react()],
      // define: {
      //   'process.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL),
      //   'process.env.LIFF_ID': JSON.stringify(env.LIFF_ID)
      // },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
