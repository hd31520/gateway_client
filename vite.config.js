import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const LIVE_GATEWAY_API_URL = 'https://payment-gateway-server-ten.vercel.app';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gatewayApiUrl = (env.VITE_PAYMENT_GATEWAY_API_URL || LIVE_GATEWAY_API_URL).replace(/\/+$/, '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: gatewayApiUrl,
          changeOrigin: true,
          secure: true
        }
      }
    },
    preview: {
      port: 4173
    }
  };
});
