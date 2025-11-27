import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Sistema de Gestión Excel - Laboratorio',
        short_name: 'LabExcel',
        description: 'Sistema automatizado de gestión y manipulación de archivos Excel',
        theme_color: '#1f2937',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'react': resolve(__dirname, './node_modules/react'),
      'react-dom': resolve(__dirname, './node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 3001,
    host: true, // Permite acceso desde cualquier host
    allowedHosts: [
      'sublustrous-odelia-uninsured.ngrok-free.dev',
      '.ngrok-free.dev', // Permite cualquier subdominio de ngrok
      '.ngrok.io', // Permite también dominios .ngrok.io
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
