import { build, type Loader, type Plugin } from 'esbuild'
import path from 'node:path'
import * as fs from 'node:fs'
import { rimraf } from 'rimraf'
import { useFlammeCurrentDirectory } from '../hooks/useFlammeCurrentDirectory'
import { useFlammeBuildMode } from '../hooks/useFlammeBuildMode'
import CssModulesPlugin from 'esbuild-css-modules-plugin'
import { sassPlugin } from 'esbuild-sass-plugin'
import { lessLoader } from 'esbuild-plugin-less'
// @ts-ignore
import { stylusLoader } from 'esbuild-stylus-loader'
import { tailwindPlugin } from 'esbuild-plugin-tailwindcss'
import { copy } from 'esbuild-plugin-copy'
import { IFlammeConfigFile, useFlammeConfig } from '../hooks/useFlammeConfig'
import { getEnv, getPublicEnv } from './env'

export interface IBuildEndpointParams {
    entryPointClientContent: string
    entryPointServerContent: string
    buildClientPath: string
    buildServerPath: string
}

export interface ISingleBuildEndpointParams {
    mode: 'production' | 'development'
    entryPointContent: string
    buildPath: string
    plugins: Plugin[]
    loader: Record<string, Loader>
}

// browser client build + server - ssr build
export async function buildEndpoint({
    entryPointClientContent,
    entryPointServerContent,
    buildClientPath,
    buildServerPath,
}: IBuildEndpointParams) {
    // get current directory
    const { currentDirectory } = await useFlammeCurrentDirectory()
    // get config
    const { config } = await useFlammeConfig()
    // get build mode
    const [mode] = useFlammeBuildMode()

    // clean build
    if (mode === 'development') await cleanBuildEndpoint()

    const loader = getBuildLoader(config)
    const plugins = getBuildPlugins(currentDirectory, config)

    // browser client build
    await buildClientEndpoint({
        mode: mode ?? 'development',
        entryPointContent: entryPointClientContent,
        buildPath: buildClientPath,
        loader,
        plugins,
    })

    // server + ssr build
    await buildServerEndpoint({
        mode: mode ?? 'development',
        entryPointContent: entryPointServerContent,
        buildPath: buildServerPath,
        loader,
        plugins,
    })
}

export async function cleanBuildEndpoint() {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    const { config } = await useFlammeConfig()

    await rimraf.rimraf(path.resolve(currentDirectory, config.cacheDir))
}

function getBuildPlugins(
    currentDirectory: string,
    config: Required<IFlammeConfigFile>
) {
    const [mode] = useFlammeBuildMode()

    // Create plugin array for esbuild, based on the configuration
    const plugins: Plugin[] = [
        CssModulesPlugin(config.css.cssModules),
        sassPlugin(config.css.sass),
        lessLoader(config.css.less),
        stylusLoader(config.css.stylus),
    ]

    // Add public folder copy plugin if exists
    if (fs.existsSync(path.resolve(currentDirectory, config.publicDir))) {
        plugins.push(
            copy({
                watch: mode === 'development',
                assets: [
                    {
                        from: path.resolve(
                            currentDirectory,
                            config.publicDir,
                            '**',
                            '*'
                        ),
                        to: path.resolve(
                            currentDirectory,
                            mode === 'development'
                                ? config.cacheDir
                                : config.buildDir
                        ),
                    },
                ],
            })
        )
    }

    // Tailwindcss configuration path
    const tailwindcssConfigPath = path.resolve(
        currentDirectory,
        config.css.tailwindcss?.configPath ?? 'tailwind.config.js'
    )

    // Add tailwindcss plugin if enabled and configuration file exists
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

const getBuildLoader = (
    config: Required<IFlammeConfigFile>
): Record<string, Loader> => {
    return {
        '.png': 'file',
        '.jpg': 'file',
        '.gif': 'file',
        '.svg': 'file',
        '.woff': 'file',
        '.woff2': 'file',
        '.eot': 'file',
        '.ttf': 'file',
        '.otf': 'file',
        '.mp4': 'file',
        '.webm': 'file',
        '.wav': 'file',
        '.mp3': 'file',
        '.m4a': 'file',
        '.aac': 'file',
        '.oga': 'file',
        ...config.esbuild.loader,
    }
}

export async function buildClientEndpoint({
    mode,
    entryPointContent,
    buildPath,
    plugins,
    loader,
}: ISingleBuildEndpointParams) {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    const { config } = await useFlammeConfig()

    return await build({
        stdin: {
            contents: entryPointContent,
            resolveDir: currentDirectory,
            sourcefile: 'client.ts',
            loader: 'ts',
        },
        absWorkingDir: currentDirectory,
        bundle: true,
        define: {
            NODE_ENV: mode,
            ...(await getPublicEnv()),
        },
        outfile: buildPath,
        sourceRoot: '../../',
        sourcemap: mode === 'development',
        minify: mode === 'production',
        jsx: 'transform',
        platform: 'browser',
        format: 'esm',
        treeShaking: true,
        allowOverwrite: true,
        logLevel: config.esbuild.loglevel,
        publicPath: config.assetsPublicUrl,
        loader,
        plugins,
    })
}

export async function buildServerEndpoint({
    mode,
    entryPointContent,
    buildPath,
    plugins,
    loader,
}: ISingleBuildEndpointParams) {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    const { config } = await useFlammeConfig()

    return await build({
        stdin: {
            contents: entryPointContent,
            resolveDir: currentDirectory,
            sourcefile: 'server.ts',
            loader: 'ts',
        },
        absWorkingDir: currentDirectory,
        bundle: true,
        define: {
            NODE_ENV: mode,
            ...(await getEnv()),
        },
        outfile: buildPath,
        sourceRoot: '../../',
        sourcemap: mode === 'development',
        minify: mode === 'production',
        platform: 'node',
        format: 'cjs',
        treeShaking: true,
        allowOverwrite: true,
        logLevel: config.esbuild.loglevel,
        publicPath: config.assetsPublicUrl,
        loader,
        plugins,
    })
}
