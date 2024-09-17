import { build, type Loader, type Plugin } from 'esbuild'
import path from 'node:path'
import * as fs from 'node:fs'
import * as fsExtra from 'fs-extra'
import { rimraf } from 'rimraf'
import { sassPlugin, postcssModules } from 'esbuild-sass-plugin'
import { lessLoader } from 'esbuild-plugin-less'
// @ts-ignore
import { stylusLoader } from 'esbuild-stylus-loader'
import { copy } from 'esbuild-plugin-copy'
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import { AcceptedPlugin } from 'postcss'
import { getEnv } from './env'
import { useFlammeCurrentDirectory } from '../hooks/useFlammeCurrentDirectory'
import { useFlammeBuildMode } from '../hooks/useFlammeBuildMode'
import { IFlammeConfigFile, useFlammeConfig } from '../hooks/useFlammeConfig'
import { useFlammeCacheDirEntries } from '../hooks/useFlammeCacheDirEntries'
import { useFlammeBuildLoader } from '../hooks/useFlammeBuildLoader'
import { useFlammeBuildInputFiles } from '../hooks/useFlammeBuildInputFiles'
import * as os from 'node:os'
import { sync as resolveSync } from 'resolve'
import { mkdirpSync } from 'fs-extra'

export interface IBuildEndpointParams {
    hashKey: string
    entryPointClientContent: string
    entryPointServerContent: string
    buildClientPath: string
    buildServerPath: string
}

export interface ISingleClientBuildEndpointParams {
    mode: 'production' | 'development'
    entryPointContent: string
    buildPath: string
    alias: Record<string, string>
    plugins: Plugin[]
    loader: Record<string, Loader>
}

export interface ISingleServerBuildEndpointParams {
    mode: 'production' | 'development'
    entryPointContent: string
    buildPath: string
    plugins: Plugin[]
    loader: Record<string, Loader>
}

export interface IManifestEndpointParams {
    mode: 'production' | 'development'
    hashKey: string
}

// browser client build + server - ssr build
export async function buildEndpoint({
    hashKey,
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

    // create alias externals
    const aliasExternals = await createAliasExternals()

    const loader = getBuildLoader(config)
    const plugins = getBuildPlugins(currentDirectory, aliasExternals, config)

    try {
        // clean temp build
        await cleanTempBuildEndpoint()
        // We copy the cacheDir to tempDir, if something goes wrong we can restore the cacheDir
        await saveTempBuildEndpoint()
        // clean build
        if (mode === 'development') await cleanBuildEndpoint()

        // browser client build
        const clientBuildResult = await buildClientEndpoint({
            mode: mode ?? 'development',
            entryPointContent: entryPointClientContent,
            buildPath: buildClientPath,
            alias: aliasExternals,
            loader,
            plugins,
        })

        // server + ssr build
        const serverBuildResult = await buildServerEndpoint({
            mode: mode ?? 'development',
            entryPointContent: entryPointServerContent,
            buildPath: buildServerPath,
            loader,
            plugins,
        })

        // build manifest
        await buildManifestEndpoint({
            mode: mode ?? 'development',
            hashKey,
        })

        await saveBuildInputFilesToWatch({
            ...clientBuildResult.metafile.inputs,
            ...serverBuildResult.metafile.inputs,
        })

        return { error: false }
    } catch (error) {
        console.error(error)
        await restoreTempBuildEndpoint()
        return { error: true }
    }
}

export async function cleanTempBuildEndpoint() {
    const [cacheDirEntries] = useFlammeCacheDirEntries()
    for (const cacheDir of cacheDirEntries) {
        if (fs.existsSync(path.resolve(os.tmpdir(), cacheDir))) {
            fsExtra.rmSync(path.resolve(os.tmpdir(), cacheDir), {
                recursive: true,
                force: true,
            })
        }
    }
}

export async function saveTempBuildEndpoint() {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    const [cacheDirEntries] = useFlammeCacheDirEntries()
    for (const cacheDir of cacheDirEntries) {
        if (fs.existsSync(path.resolve(currentDirectory, cacheDir))) {
            fsExtra.copySync(
                path.resolve(currentDirectory, cacheDir),
                path.resolve(os.tmpdir(), cacheDir)
            )
        }
    }
}

export async function restoreTempBuildEndpoint() {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    const [cacheDirEntries] = useFlammeCacheDirEntries()
    for (const cacheDir of cacheDirEntries) {
        if (fs.existsSync(path.resolve(os.tmpdir(), cacheDir))) {
            fsExtra.copySync(
                path.resolve(os.tmpdir(), cacheDir),
                path.resolve(currentDirectory, cacheDir)
            )
        }
    }
}

export async function cleanBuildEndpoint() {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    const [cacheDirEntries] = useFlammeCacheDirEntries()

    // clean all cache directories
    for (const cacheDir of cacheDirEntries) {
        if (fs.existsSync(path.resolve(currentDirectory, cacheDir))) {
            await rimraf.rimraf(path.resolve(currentDirectory, cacheDir))
        }
    }
}

// We save the build input files to watch them on development mode
async function saveBuildInputFilesToWatch(inputFiles: Record<string, any>) {
    // get current directory
    const { currentDirectory } = await useFlammeCurrentDirectory()

    // get/set build inputs
    const [_, setBuildInputFiles] = useFlammeBuildInputFiles()

    // get inputs files to watch
    const inputFilesToWatch = new Set(
        Object.keys(inputFiles).map((input) => {
            // we check if a plugin prefix exist on the file
            if (input.includes(':')) {
                // we split the input by the plugin prefix
                const splitInput = input.split(':')
                // we get the file from the split input - the last element
                const file = splitInput[splitInput.length - 1]
                // we resolve the file path
                return path.resolve(currentDirectory, file)
            }
            return path.resolve(currentDirectory, input)
        })
    )

    // set build input files
    setBuildInputFiles([...inputFilesToWatch])
}

async function createAliasExternals() {
    //get mode
    const [mode] = useFlammeBuildMode()
    return {
        react:
            mode === 'development'
                ? '/node_modules/react/cjs/react.development.js'
                : '/node_modules/react/cjs/react.production.min.js',
        'react-dom':
            mode === 'development'
                ? '/node_modules/react-dom/cjs/react-dom.development.js'
                : '/node_modules/react-dom/cjs/react-dom.production.min.js',
        'react-dom/client':
            mode === 'development'
                ? '/node_modules/react-dom/cjs/react-dom.development.js'
                : '/node_modules/react-dom/cjs/react-dom.production.min.js',
        'react-router-dom/server.js':
            '/node_modules/react-router-dom/server.js',
        'react-router-dom':
            mode === 'development'
                ? '/node_modules/react-router-dom/dist/react-router-dom.development.js'
                : '/node_modules/react-router-dom/dist/react-router-dom.production.min.js',
    }
}

function getBuildPlugins(
    currentDirectory: string,
    alias: Record<string, string>,
    config: Required<IFlammeConfigFile>
) {
    const [mode] = useFlammeBuildMode()

    // Create empty plugin array
    const plugins: Plugin[] = []

    const [buildLoader] = useFlammeBuildLoader()

    // Create postcss plugins array
    const postcssPlugins: AcceptedPlugin[] = [autoprefixer()]

    // Tailwindcss configuration path
    const tailwindcssConfigPath = path.resolve(
        currentDirectory,
        config.css.tailwindcss?.configPath ??
            (buildLoader === 'ts' ? 'tailwind.config.ts' : 'tailwind.config.js')
    )

    // Add tailwindcss plugin if tailwindcss configuration exists
    if (fs.existsSync(tailwindcssConfigPath)) {
        postcssPlugins.push(tailwindcss({ config: tailwindcssConfigPath }))
    }

    // add sass, less, stylus plugins by order
    plugins.push(
        lessLoader(config.css.less),
        stylusLoader(config.css.stylus),
        sassPlugin({
            ...config.css.sass,
            filter: /\.s?css$/,
            transform: postcssModules(
                {
                    ...config.css.cssModules,
                    globalModulePaths: [/(?<!\.module)\.s?css$/],
                },
                postcssPlugins
            ),
            type: 'css',
        }),
        lessLoader(config.css.less),
        stylusLoader(config.css.stylus)
    )

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

    // Add alias modules files by copying them to the cache/build directory
    for (const [key, value] of Object.entries(alias)) {
        fsExtra.mkdirpSync(
            path.resolve(
                currentDirectory,
                mode === 'development' ? config.cacheDir : config.buildDir,
                'node_modules',
                key
            )
        )
        console.log(resolveSync(key))
        plugins.push(
            copy({
                watch: mode === 'development',
                assets: [
                    {
                        from: resolveSync(key)
                            .split('/')
                            .slice(0, -1)
                            .join('/'),
                        to: path.resolve(
                            currentDirectory,
                            mode === 'development'
                                ? config.cacheDir
                                : config.buildDir,
                            'node_modules',
                            key
                        ),
                    },
                ],
                verbose: true,
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
    alias,
    plugins,
    loader,
}: ISingleClientBuildEndpointParams) {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    const { config } = await useFlammeConfig()

    return await build({
        stdin: {
            contents: entryPointContent,
            resolveDir: currentDirectory,
            sourcefile: 'client.ts',
            loader: 'tsx',
        },
        absWorkingDir: currentDirectory,
        bundle: true,
        define: {
            NODE_ENV: mode,
        },
        publicPath: config.base,
        outfile: buildPath,
        sourcemap: mode === 'development',
        minify: mode === 'production',
        jsx: 'transform',
        platform: 'browser',
        format: 'esm',
        metafile: true,
        treeShaking: true,
        allowOverwrite: true,
        logLevel: config.esbuild.loglevel,
        alias,
        external: [
            ...Object.entries(alias)
                .map(([key, value]) => [key, value])
                .flat(),
        ],
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
}: ISingleServerBuildEndpointParams) {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    const { config } = await useFlammeConfig()

    return await build({
        stdin: {
            contents: entryPointContent,
            resolveDir: currentDirectory,
            sourcefile: 'server.mts',
            loader: 'tsx',
        },
        absWorkingDir: currentDirectory,
        bundle: true,
        define: {
            NODE_ENV: mode,
            ...(await getEnv()),
        },
        publicPath: config.base,
        outfile: buildPath,
        sourcemap: mode === 'development',
        minify: mode === 'production',
        platform: 'node',
        format: 'esm',
        metafile: true,
        treeShaking: true,
        allowOverwrite: true,
        logLevel: config.esbuild.loglevel,
        external: ['react', 'react-dom', 'react-router-dom', 'mime-types'],
        loader,
        plugins,
    })
}

export async function buildManifestEndpoint({
    mode,
    hashKey,
}: IManifestEndpointParams) {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    const { config } = await useFlammeConfig()
    fs.writeFileSync(
        path.resolve(
            currentDirectory,
            mode === 'development' ? config.cacheDir : config.buildDir,
            '_buildManifest.js'
        ),
        'module.exports = ' + JSON.stringify({ hashKey })
    )
}
