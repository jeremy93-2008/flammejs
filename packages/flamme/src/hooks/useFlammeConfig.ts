import { type Plugin } from 'esbuild'
import { loadConfig } from 'c12'
import { useFlammeCurrentDirectory } from './useFlammeCurrentDirectory'

export interface IFlammeConfigFile {
    clientDir?: string
    serverDir?: string

    baseUrl?: string
    serverBaseUrl?: string

    buildDir?: string
    publicDir?: string
    publicPath?: string

    devServerPort?: number

    tailwindcss?: {
        enabled: boolean
        configPath?: string
    }

    esbuild?: {
        plugins: Plugin[]
    }
}

export async function useFlammeConfig() {
    const { currentDirectory } = await useFlammeCurrentDirectory()

    return await loadConfig<Required<IFlammeConfigFile>>({
        cwd: currentDirectory,
        name: 'flamme',
        dotenv: true,
        defaultConfig: {
            clientDir: 'src/client',
            serverDir: 'src/server',

            baseUrl: '',
            serverBaseUrl: '/api',

            buildDir: '.flamme',
            publicDir: 'public',
            publicPath: '/',

            devServerPort: 3000,

            tailwindcss: {
                enabled: false,
            },

            esbuild: {
                plugins: [],
            },
        },
    })
}
