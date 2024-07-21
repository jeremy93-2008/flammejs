import { defineFlammeConfig } from 'flamme'

export default defineFlammeConfig({
    root: '/',
    base: './',
    serverBaseUrl: '/api',
    assetsBaseUrl: '/_flamme/assets',
    assetsPublicUrl: './_flamme/assets',

    clientDir: 'src/client',
    serverDir: 'src/server',
    buildDir: 'dist',
    publicDir: 'public',
    cacheDir: '.flamme',

    devServerPort: 3000,

    envPublicPrefix: 'PUBLIC_',

    css: {
        tailwindcss: {
            configPath: 'tailwind.config.js',
        },
    },

    esbuild: {
        plugins: [],
    },
})
