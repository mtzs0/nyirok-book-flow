
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Ensure consistent file names for easier embedding
        entryFileNames: 'assets/reservation-system.[hash].js',
        chunkFileNames: 'assets/reservation-system-chunk.[hash].js',
        assetFileNames: 'assets/reservation-system.[hash].[ext]'
      }
    },
    // Only minify in production, not in development
    minify: mode === 'production' ? 'terser' : false,
    sourcemap: false,
    cssCodeSplit: false,
  }
}));
