export default {
    clientDir: 'src/client',
    serverDir: 'src/server',

    baseUrl: '',
    serverBaseUrl: '/api',

    buildDir: 'dist',
    publicDir: 'public',
    publicPath: '/',

    devServerPort: 3000,

    tailwindcss: {
        enabled: true,
        configPath: 'tailwind.config.js',
    },

    esbuild: {
        plugins: [],
    },
}
