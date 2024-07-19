import { build } from 'esbuild'
import path from 'node:path'
import { listen } from 'listhen'
import { toNodeListener } from 'h3'
import colors from 'colors/safe'
import { rimraf } from 'rimraf'
import { useFlammeCurrentDirectory } from '../hooks/useFlammeCurrentDirectory'
import { useFlammeBuildMode } from '../hooks/useFlammeBuildMode'
import { tailwindPlugin } from 'esbuild-plugin-tailwindcss'
import CssModulesPlugin from 'esbuild-css-modules-plugin'

// browser client build + server - ssr build
export async function buildEndpoint({
    entryPointClientContent,
    entryPointServerContent,
    buildClientPath,
    buildServerPath,
}: {
    entryPointClientContent: string
    entryPointServerContent: string
    buildClientPath: string
    buildServerPath: string
}) {
    // get build mode
    const [mode] = useFlammeBuildMode()

    // clean build
    if (mode === 'development') await cleanBuildEndpoint()

    // browser client build
    await buildClientEndpoint({
        mode: mode ?? 'development',
        entryPointContent: entryPointClientContent,
        buildClientPath,
    })

    // server + ssr build
    await buildServerEndpoint({
        mode: mode ?? 'development',
        entryPointContent: entryPointServerContent,
        buildServerPath,
    })
}

export async function cleanBuildEndpoint() {
    const { currentDirectory } = await useFlammeCurrentDirectory()

    await rimraf.rimraf(path.resolve(currentDirectory, '.flamme'))
}

export async function buildClientEndpoint({
    mode,
    entryPointContent,
    buildClientPath,
}: {
    mode: 'production' | 'development'
    entryPointContent: string
    buildClientPath: string
}) {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    return await build({
        stdin: {
            contents: entryPointContent,
            resolveDir: currentDirectory,
            sourcefile: 'client.ts',
            loader: 'ts',
        },
        absWorkingDir: currentDirectory,
        bundle: true,
        outfile: buildClientPath,
        minify: mode === 'production',
        jsx: 'transform',
        platform: 'browser',
        allowOverwrite: true,
        plugins: [
            CssModulesPlugin({
                // @see https://github.com/indooorsman/esbuild-css-modules-plugin/blob/main/index.d.ts for more details
                force: true,
                emitDeclarationFile: false,
                localsConvention: 'camelCaseOnly',
                namedExports: true,
                inject: false,
            }),
            tailwindPlugin({
                cssModulesEnabled: true,
                configPath: path.resolve(
                    currentDirectory,
                    'tailwind.config.js'
                ),
            }),
        ],
    })
}

export async function buildServerEndpoint({
    mode,
    entryPointContent,
    buildServerPath,
}: {
    mode: 'production' | 'development'
    entryPointContent: string
    buildServerPath: string
}) {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    return await build({
        stdin: {
            contents: entryPointContent,
            resolveDir: currentDirectory,
            sourcefile: 'server.ts',
            loader: 'ts',
        },
        absWorkingDir: currentDirectory,
        bundle: true,
        outfile: buildServerPath,
        minify: mode === 'production',
        platform: 'node',
        allowOverwrite: true,
        plugins: [
            CssModulesPlugin({
                // @see https://github.com/indooorsman/esbuild-css-modules-plugin/blob/main/index.d.ts for more details
                force: true,
                emitDeclarationFile: false,
                localsConvention: 'camelCaseOnly',
                namedExports: true,
                inject: false,
            }),
        ],
    })
}

export async function listenServer({
    buildServerPath,
    port,
    reload,
}: {
    buildServerPath: string
    port: number
    reload?: boolean
}) {
    // @ts-ignore
    const import_app = await import(buildServerPath)

    const listener = await listen(toNodeListener(import_app.default.default), {
        port,
        _entry: buildServerPath,
        showURL: !reload,
    })

    if (reload) console.log(`🔄 Server reload at`, colors.blue(listener.url))

    return listener
}
