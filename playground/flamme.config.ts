import { defineFlammeConfig } from 'flamme'

export default defineFlammeConfig({
    clientDir: 'src/client',
    serverDir: 'src/server',

    baseUrl: '',
    serverBaseUrl: '/api',

    buildDir: 'dist',
    publicDir: 'public',
    publicPath: '/',

    devServerPort: 3000,

    css: {
        tailwindcss: {
            configPath: 'tailwind.config.js',
        },
    },

    esbuild: {
        plugins: [],
    },
})
