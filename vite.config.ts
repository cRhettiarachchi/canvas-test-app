import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

function getBase() {
  const buildEnv = process.env.BUILD_ENV

  const CDN_BASE = {
    production: 'https://dop5fq635s7uz.cloudfront.net/', // Your CloudFront domain
    dev: 'https://dop5fq635s7uz.cloudfront.net/',
    staging: 'asdlksdakjsldilm',
    int: 'asdlksdakjsldilm',
  }

  if (
    buildEnv === 'production' ||
    buildEnv === 'dev' ||
    buildEnv === 'staging' ||
    buildEnv === 'int'
  ) {
    return CDN_BASE[buildEnv]
  }

  return '/'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  base: getBase(),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
