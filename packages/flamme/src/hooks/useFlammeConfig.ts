import { type Loader, type Plugin } from 'esbuild'
import { loadConfig } from 'c12'
import { useFlammeCurrentDirectory } from './useFlammeCurrentDirectory'
import CSSModules from 'esbuild-css-modules-plugin'
import { type SassPluginOptions } from 'esbuild-sass-plugin'
// @ts-ignore
import { stylusLoader } from 'esbuild-stylus-loader'

export interface IFlammeConfigFile {
    // base url
    root?: string
    // base path
    base?: string
    // server base url
    serverBaseUrl?: string
    // assets base url
    assetsBaseUrl?: string
    // assets public url
    assetsPublicUrl?: string

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
        // esbuild loaders
        loader?: Record<string, Loader>
        // esbuild plugins
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
                plugins: [],
            },
        },
    })
}
