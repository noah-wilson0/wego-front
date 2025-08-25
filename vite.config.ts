import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/images": {                    // ✅ 백엔드 정적 파일 프록시
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
