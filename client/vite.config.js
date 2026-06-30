import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [
        react()
    ],
    server: {
        port: 3000,
        host: true,
        allowedHosts: ['unpracticable-annice-bizonal.ngrok-free.dev', '.ngrok-free.dev', '.ngrok.io'],
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true
            }
        }
    }
})
