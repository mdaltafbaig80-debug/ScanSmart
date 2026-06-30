import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
    plugins: [
        react(),
        basicSsl()
    ],
    server: {
        port: 3000,
        host: true,
        https: true,
        allowedHosts: ['unpracticable-annice-bizonal.ngrok-free.dev', '.ngrok-free.dev', '.ngrok.io'],
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true
            }
        }
    }
})
