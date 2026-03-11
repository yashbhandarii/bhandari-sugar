import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: 'build', // Match CRA output dir for Vercel
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    charts: ['recharts'],
                    pdf: ['jspdf', 'jspdf-autotable'],
                },
            },
        },
    },
    // Env vars: Vite exposes VITE_* vars via import.meta.env
    // We also define process.env shim for compatibility
    define: {
        'process.env.PUBLIC_URL': JSON.stringify(''),
    },
});
