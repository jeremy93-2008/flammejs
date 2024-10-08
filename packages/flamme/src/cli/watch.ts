import type { Listener } from 'listhen'
import chokidar from 'chokidar'
import colors from 'colors/safe'
import path from 'node:path'
import {
    type IFlammeConfigFile,
    useFlammeConfig,
} from '../hooks/useFlammeConfig'
import { buildEndpoint } from './build'
import { listenServer } from './listen'
import { formatShortDate } from '../utils/formatShortDate'
import { serveAndListenHMRFlamme, WS_ERROR_MESSAGE } from './hmr'
import { createFlamme } from './flamme'
import { debounce } from '../utils/debounce'
import { useFlammeBuildInputFiles } from '../hooks/useFlammeBuildInputFiles'
import { useFlammeCurrentDirectory } from '../hooks/useFlammeCurrentDirectory'

interface IWatchAndListenFlammeParams {
    currentDirectory: string
    buildClientPath: (hash: string) => string
    buildServerPath: (hash: string) => string
    hashKey: string
    config: Required<IFlammeConfigFile>
    port: number
    open: boolean
    isProduction?: boolean
    isPublic?: boolean
    hasTunnel?: boolean
    qr?: boolean
}

export async function watchAndListenFlamme(
    params: IWatchAndListenFlammeParams
) {
    const { buildServerPath, hashKey, config, port } = params
    let listener: Listener

    const { currentDirectory } = await useFlammeCurrentDirectory()

    // c12 - flamme config - get metadata
    const c12 = await useFlammeConfig()

    // get build input files to watch
    const [buildInputFiles] = useFlammeBuildInputFiles()

    // hmr server
    const hmr = await serveAndListenHMRFlamme()

    const watcher = chokidar
        .watch([
            path.resolve(currentDirectory, c12.configFile ?? ''),
            ...buildInputFiles,
        ])
        .on('change', async (pathname, stats) => {
            if (pathname.includes(config.buildDir)) return
            if (
                !pathname.includes('/src') &&
                !pathname.includes('flamme.config')
            )
                return

            const {
                hashKey: newHashKey,
                buildClientPath: nextBuildClientPath,
                buildServerPath: nextBuildServerPath,
                getEntryPointClientContent: nextGetEntryPointClientContent,
                getEntryPointServerContent: nextGetEntryPointServerContent,
            } = await createFlamme()
            const { config: nextConfig } = await useFlammeConfig()

            if (!pathname.includes('flamme.config')) {
                console.log(
                    formatShortDate(new Date()),
                    colors.red('[flamme]'),
                    '📄 File changed:',
                    colors.green(path.relative(process.cwd(), pathname))
                )
            } else {
                console.log(
                    formatShortDate(new Date()),
                    colors.red('[flamme]'),
                    '⚙️ Configuration changed:',
                    colors.green(path.relative(process.cwd(), pathname))
                )
                hmr.options.port = nextConfig.hmrServerPort
            }

            debounce(async () => {
                await listener.close()

                // browser client build + server - ssr build
                const { error } = await buildEndpoint({
                    hashKey: newHashKey,
                    entryPointClientContent:
                        await nextGetEntryPointClientContent({
                            hashKey: newHashKey,
                        }),
                    entryPointServerContent:
                        await nextGetEntryPointServerContent({
                            hashKey: newHashKey,
                        }),
                    buildClientPath: nextBuildClientPath(newHashKey),
                    buildServerPath: nextBuildServerPath(newHashKey),
                })

                if (error) {
                    hmr.clients.forEach((client) => {
                        client.send(WS_ERROR_MESSAGE)
                    })
                    return console.error(
                        formatShortDate(new Date()),
                        colors.red('[flamme]'),
                        colors.red('🚫'),
                        'Error building the app. Fix the error and save the file again. The server will reload automatically.'
                    )
                }

                listener = await listenServer({
                    buildServerPath: nextBuildServerPath(newHashKey),
                    port: nextConfig.devServerPort ?? port,
                    reload: true,
                    isProduction: params.isProduction,
                    isPublic: params.isPublic,
                    hasTunnel: params.hasTunnel,
                })

                await refreshWatchingFiles(watcher)
            })
        })

    listener = await listenServer({
        buildServerPath: buildServerPath(hashKey),
        port,
        open: params.open,
        isProduction: params.isProduction,
        isPublic: params.isPublic,
        hasTunnel: params.hasTunnel,
        qr: params.qr,
    })

    console.log(
        formatShortDate(new Date()),
        colors.red('[flamme]'),
        '👀 Watching',
        colors.green('/src'),
        'for files changes...'
    )
}

export async function refreshWatchingFiles(watcher: chokidar.FSWatcher) {
    const { currentDirectory } = await useFlammeCurrentDirectory()

    // c12 - flamme config - get metadata
    const c12 = await useFlammeConfig()

    // get watched files
    const watchedFiles = Object.entries(watcher.getWatched())
        .map(([dir, files]) => {
            return files.map((file) => path.join(dir, file))
        })
        .flat()

    // unwatch previous files and watch new files
    watcher.unwatch(watchedFiles)
    const [newBuildInputFiles] = useFlammeBuildInputFiles()

    watcher.add([
        path.resolve(currentDirectory, c12.configFile ?? ''),
        ...newBuildInputFiles,
    ])
}
