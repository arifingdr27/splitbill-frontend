import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appName = env.APP_NAME?.trim() || "Arifin's SplitBill"

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-app-name',
        transformIndexHtml(html) {
          return html.replace(/%APP_NAME%/g, appName)
        },
      },
    ],
    // Expose APP_NAME to the client (in addition to default VITE_*).
    envPrefix: ['VITE_', 'APP_'],
    define: {
      'import.meta.env.APP_NAME': JSON.stringify(appName),
    },
  }
})
