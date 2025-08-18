
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'embed-dist',
    rollupOptions: {
      input: './src/embed.tsx',
      output: {
        entryFileNames: 'assets/reservation-system.[hash].js',
        chunkFileNames: 'assets/reservation-system-chunk.[hash].js',
        assetFileNames: 'assets/reservation-system.[hash].[ext]'
      }
    },
    minify: 'terser',
    sourcemap: false,
    cssCodeSplit: false,
  }
});
