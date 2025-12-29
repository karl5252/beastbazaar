// vite.config.js
import {defineConfig} from 'vite'

export default defineConfig({
    plugins: [],
    server: {host: '0.0.0.0', port: 8000},
    clearScreen: false,

    // CRITICAL for itch.io HTML builds
    base: './',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            output: {
                entryFileNames: 'assets/index.js',
                chunkFileNames: 'assets/[name].js',
                assetFileNames: 'assets/[name].[ext]'
            }
        }
    },
    test: {
        environment: 'node',
        globals: true,
        include: ['tests/**/*.test.js'],
    },
})
