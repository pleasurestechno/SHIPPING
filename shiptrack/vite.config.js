import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  // Add CSS import as part of Vite config to ensure it's processed
  css: {
    preprocessorOptions: {
      css: {
        // If you need PostCSS processing for something else, you might configure it here
        // For now, we are relying on direct CSS in index.css
      },
    },
  },
})
