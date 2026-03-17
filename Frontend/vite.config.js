import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
	server: {
		port: 3000,
		proxy: {
			'/api': {
				// ⚠️ Update this URL when your ngrok URL changes!
				// Should match the URL in src/config/api.js
				// target: 'https://fix2an-production.up.railway.app/',
				target: 'http://localhost:4000/',
				changeOrigin: true,
				secure: true,
			},
		},
	},
})
