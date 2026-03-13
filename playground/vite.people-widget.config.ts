import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: resolve(__dirname, '../mcp-server/src/widget'),
    emptyOutDir: false,
    rollupOptions: {
      input: { people: resolve(__dirname, 'people-widget.html') },
    },
  },
})
