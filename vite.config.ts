import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // استخدام مسار فارغ أو نسبي لضمان عمل التطبيق في بيئات مختلفة (Android & GitHub Pages)
    base: '', 
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // التأكد من أن المسارات في ملفات الـ JS/CSS نسبية أيضاً
      modulePreload: {
        polyfill: true
      }
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
