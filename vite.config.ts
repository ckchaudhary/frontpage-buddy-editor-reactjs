import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
  },
  build: {
	sourcemap: true,
    // Generate a library bundle instead of an app bundle
    lib: {
      entry: 'src/main.tsx',
      name: 'LayoutEditor',
      formats: ['iife'],
      fileName: () => 'layout-editor.js'
    },
    rollupOptions: {
      // Make sure React is treated as external and loaded from WordPress
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        // Minimize the bundle
        compact: true,
        // Add WordPress plugin prefix to avoid conflicts
        extend: true,
        inlineDynamicImports: true
      }
    },
    // Output to a directory that makes sense for WordPress
    outDir: 'dist',
    emptyOutDir: true
  }
});