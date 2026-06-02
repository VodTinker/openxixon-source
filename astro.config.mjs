import { defineConfig } from 'astro/config'
import node from '@astrojs/node'
import react from '@astrojs/react'

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  security: { checkOrigin: false },
  vite: {
    ssr: {
      external: [
        'recharts',
        'react',
        'react-dom',
        '@supabase/supabase-js',
        '@supabase/ssr',
        'leaflet',
        'chart.js'
      ]
    }
  }
})
