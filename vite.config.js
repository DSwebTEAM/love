import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// relative base so the build works from any path (Cloudflare Pages, subfolders, file hosts)
export default defineConfig({ base: './', plugins: [react()], build: { target: 'es2020' } })
