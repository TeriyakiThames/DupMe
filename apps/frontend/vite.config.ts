import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    netlify()
  ],

  base: '/',
  
  server: {
    port: 4173,
    strictPort: true,
    allowedHosts: ['dupme.poppoo.xyz']
  },

  resolve: {
        alias: {
           "@": path.resolve(__dirname, "./src"),
        },
  },
})
