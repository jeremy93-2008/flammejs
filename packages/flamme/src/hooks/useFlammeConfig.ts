import { type Loader, type Plugin } from 'esbuild'
import { loadConfig } from 'c12'
import { useFlammeCurrentDirectory } from './useFlammeCurrentDirectory'
import CSSModules from 'esbuild-css-modules-plugin'
import { type SassPluginOptions } from 'esbuild-sass-plugin'
// @ts-ignore
import { stylusLoader } from 'esbuild-stylus-loader'
import { useFlammeCacheDirEntries } from './useFlammeCacheDirEntries'

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
        cssModules?: Parameters<typeof CSSModules>[0]
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

    const c12 = await loadConfig<Required<IFlammeConfigFile>>({
        cwd: currentDirectory,
        name: 'flamme',
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
                    // @see https://github.com/indooorsman/esbuild-css-modules-plugin/blob/main/index.d.ts for more details
                    force: true,
                    emitDeclarationFile: false,
                    localsConvention: 'camelCaseOnly',
                    namedExports: true,
                    inject: false,
                },
                sass: {
                    filter: /\.scss$/,
                    type: 'css',
                },
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
