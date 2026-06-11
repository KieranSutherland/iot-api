import path from 'path';
import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [ react() ],
    resolve: {
        alias: {
            'iot-api': path.resolve(__dirname, '../iot-api/src')
        }
    }
})
