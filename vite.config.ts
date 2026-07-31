import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    // استخدام './' لضمان عمل المسارات النسبية على Android و GitHub Pages
    base: './', 
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        // توجيه @ إلى مجلد src لضمان عمل الـ imports بشكل صحيح
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      modulePreload: true,
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
