import { defineFlammeConfig } from 'flamme'

export default defineFlammeConfig({
    root: '/',
    base: './',
    serverBaseUrl: '/api',

    clientDir: 'src/client',
    serverDir: 'src/server',
    buildDir: 'dist',
    publicDir: 'public',
    cacheDir: '.flamme',

    devServerPort: 3000,
    hmrServerPort: 3001,

    envPublicPrefix: 'PUBLIC_',

    css: {
        tailwindcss: {
            configPath: 'tailwind.config.ts',
        },
    },

    esbuild: {
        loglevel: 'warning',
        plugins: [],
    },
})
