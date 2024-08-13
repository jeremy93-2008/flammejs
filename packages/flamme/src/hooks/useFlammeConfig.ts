import { type Loader, type Plugin } from 'esbuild'
import { loadConfig } from 'c12'
import { useFlammeCurrentDirectory } from './useFlammeCurrentDirectory'
import { useFlammeCacheDirEntries } from './useFlammeCacheDirEntries'
import { useFlammeArgs } from './useFlammeArgs'
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

export async function useFlammeConfig() {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    // set args to global flamme args
    const [args] = useFlammeArgs()

    const c12 = await loadConfig<Required<IFlammeConfigFile>>({
        cwd: currentDirectory,
        name: 'flamme',
        dotenv: true,
        configFile: args?.configFile,
        // @ts-ignore
        overrides: args,
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
                    generateScopedName: 'styles__[local]__[hash:base64:6]',
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

    // Add cache dir entry
    const [_cacheDirEntries, addCacheDirEntry] = useFlammeCacheDirEntries()
    addCacheDirEntry(c12.config.cacheDir)

    return c12
}
