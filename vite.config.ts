import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves the app from /<repo>/ — override with VITE_BASE for other hosts.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/imperial-clocktower/',
  plugins: [react(), tailwindcss()],
  test: { environment: 'node' },
})
