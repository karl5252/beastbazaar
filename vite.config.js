import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [],
	server: { host: '0.0.0.0', port: 8000 },
	clearScreen: false,
    test: {
        environment: 'node',
        globals: true,
        include: ['tests/**/*.test.js'],
    },
})