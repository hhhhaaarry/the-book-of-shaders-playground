import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: true
  },
  assetsInclude: ['**/*.glsl'],
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.glsl')) {
            return 'assets/shaders/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  }
}); 