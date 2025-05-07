import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/blog-frontend/', // <-- ¡Pon aquí el nombre de tu repo!
})
