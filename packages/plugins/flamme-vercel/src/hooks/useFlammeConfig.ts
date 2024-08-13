import { type Loader, type Plugin } from 'esbuild'
import { loadConfig } from 'c12'
import { type SassPluginOptions, postcssModules } from 'esbuild-sass-plugin'
// @ts-ignore
import { stylusLoader } from 'esbuild-stylus-loader'

export interface IFlammeConfigFile {
    // base url
    root?: string
    // base path
    base?: string
    // server base url
    serverBaseUrl?: string

    // client directory
    clientDir?: string
    // server directory
    serverDir?: string
    // build directory
    buildDir?: string
    // public directory
    publicDir?: string
    // cache directory
    cacheDir?: string

    // development server port
    devServerPort?: number
    // hmr server port
    hmrServerPort?: number

    // env public prefix
    envPublicPrefix?: string

    // css options
    css: {
        // css modules options
        cssModules?: Parameters<typeof postcssModules>[0]
        // sass options
        sass?: SassPluginOptions
        // less options
        less?: Less.Options
        // stylus options
        stylus?: Parameters<typeof stylusLoader>[0]
        // tailwindcss options
        tailwindcss?: {
            configPath?: string
        }
    }

    // esbuild options
    esbuild?: {
        // esbuild log level
        loglevel?: 'info' | 'warning' | 'error' | 'silent' | 'debug' | 'verbose'
        // esbuild loaders
        loader?: Record<string, Loader>
        // esbuild plugins
        plugins: Plugin[]
    }
}

interface IUseFlammeConfigParams {
    currentDirectory: string
    configFile?: string
}

export async function useFlammeConfig({
    currentDirectory,
    configFile,
}: IUseFlammeConfigParams) {
    return await loadConfig<Required<IFlammeConfigFile>>({
        cwd: currentDirectory,
        name: 'flamme',
        configFile,
        dotenv: true,
        defaultConfig: {
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
                cssModules: {
                    localsConvention: 'camelCase',
                    scopeBehaviour: 'local',
                    hashPrefix: 'styles',
                },
                sass: {},
                less: {},
                stylus: {},
                tailwindcss: {},
            },

            esbuild: {
                loglevel: 'warning',
                plugins: [],
            },
        },
    })
}
