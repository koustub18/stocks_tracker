import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Base path configuration:
// - GitHub Pages requires '/stocks_tracker/' (when running in GitHub Actions)
// - Vercel and root domain deployments require '/'
const base = process.env.GITHUB_ACTIONS ? '/stocks_tracker/' : '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
  ],
})

