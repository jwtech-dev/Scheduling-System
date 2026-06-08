import { resolve, join } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { cpSync, mkdirSync, readdirSync } from 'fs'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

/**
 * Inline Vite plugin that copies SQL migration files to the output directory.
 * The migrator reads these at runtime via readdirSync/readFileSync, so they
 * must exist on disk alongside the bundled main process code.
 */
function copyMigrationsPlugin(): Plugin {
  return {
    name: 'copy-migrations',
    closeBundle() {
      const src = resolve('src/main/database/migrations')
      const dest = resolve('out/main/migrations')
      try {
        mkdirSync(dest, { recursive: true })
        for (const file of readdirSync(src).filter((f) => f.endsWith('.sql'))) {
          cpSync(join(src, file), join(dest, file))
        }
        console.log('Migrations copied to out/main/migrations/')
      } catch (err) {
        console.warn('Could not copy migrations:', err)
      }
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyMigrationsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react()],
    css: {
      postcss: resolve('postcss.config.js')
    }
  }
})
