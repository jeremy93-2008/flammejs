import { type Plugin } from 'esbuild'
import { loadConfig } from 'c12'
import { useFlammeCurrentDirectory } from './useFlammeCurrentDirectory'
import CSSModules from 'esbuild-css-modules-plugin'
import { type SassPluginOptions } from 'esbuild-sass-plugin'
// @ts-ignore
import { stylusLoader } from 'esbuild-stylus-loader'

export interface IFlammeConfigFile {
    clientDir?: string
    serverDir?: string

    baseUrl?: string
    serverBaseUrl?: string

    buildDir?: string
    publicDir?: string
    publicPath?: string

    devServerPort?: number

    css: {
        cssModules?: Parameters<typeof CSSModules>[0]
        sass?: SassPluginOptions
        less?: Less.Options
        stylus?: Parameters<typeof stylusLoader>[0]
        tailwindcss?: {
            configPath?: string
        }
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
