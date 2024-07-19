import { build, Plugin } from 'esbuild'
import path from 'node:path'
import { rimraf } from 'rimraf'
import { useFlammeCurrentDirectory } from '../hooks/useFlammeCurrentDirectory'
import { useFlammeBuildMode } from '../hooks/useFlammeBuildMode'
import CssModulesPlugin from 'esbuild-css-modules-plugin'
import { sassPlugin } from 'esbuild-sass-plugin'
import { lessLoader } from 'esbuild-plugin-less'
// @ts-ignore
import { stylusLoader } from 'esbuild-stylus-loader'
import { tailwindPlugin } from 'esbuild-plugin-tailwindcss'
import { IFlammeConfigFile, useFlammeConfig } from '../hooks/useFlammeConfig'
import * as fs from 'node:fs'

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
    // get current directory
    const { currentDirectory } = await useFlammeCurrentDirectory()
    // get config
    const { config } = await useFlammeConfig()
    // get build mode
    const [mode] = useFlammeBuildMode()

    // clean build
    if (mode === 'development') await cleanBuildEndpoint()

    const plugins = getBuildPlugins(currentDirectory, config)

    // browser client build
    await buildClientEndpoint({
        mode: mode ?? 'development',
        entryPointContent: entryPointClientContent,
        buildClientPath,
        plugins,
    })

    // server + ssr build
    await buildServerEndpoint({
        mode: mode ?? 'development',
        entryPointContent: entryPointServerContent,
        buildServerPath,
        plugins,
    })
}

export async function cleanBuildEndpoint() {
    const { currentDirectory } = await useFlammeCurrentDirectory()

    await rimraf.rimraf(path.resolve(currentDirectory, '.flamme'))
}

function getBuildPlugins(
    currentDirectory: string,
    config: Required<IFlammeConfigFile>
) {
    // create plugin array for esbuild, based on the configuration
    const plugins: Plugin[] = [
        CssModulesPlugin(config.css.cssModules),
        sassPlugin(config.css.sass),
        lessLoader(config.css.less),
        stylusLoader(config.css.stylus),
    ]

    // tailwindcss configuration path
    const tailwindcssConfigPath = path.resolve(
        currentDirectory,
        config.css.tailwindcss?.configPath ?? 'tailwind.config.js'
    )

    // add tailwindcss plugin if enabled and configuration file exists
    if (fs.existsSync(tailwindcssConfigPath)) {
        plugins.push(
            tailwindPlugin({
                cssModulesEnabled: true,
                configPath: tailwindcssConfigPath,
            })
        )
    }
    return [...plugins, ...config.esbuild.plugins]
}

export async function buildClientEndpoint({
    mode,
    entryPointContent,
    buildClientPath,
    plugins,
}: {
    mode: 'production' | 'development'
    entryPointContent: string
    buildClientPath: string
    plugins: Plugin[]
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
        plugins,
    })
}

export async function buildServerEndpoint({
    mode,
    entryPointContent,
    buildServerPath,
    plugins,
}: {
    mode: 'production' | 'development'
    entryPointContent: string
    buildServerPath: string
    plugins: Plugin[]
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
        plugins,
    })
}
