import type { Listener } from 'listhen'
import chokidar from 'chokidar'
import { hash } from 'ohash'
import { rimraf } from 'rimraf'
import colors from 'colors/safe'
import path from 'node:path'
import {
    type IFlammeConfigFile,
    useFlammeConfig,
} from '../hooks/useFlammeConfig'
import { buildEndpoint } from './build'
import { listenServer } from './listen'
import { formatShortDate } from '../utils/formatShortDate'
import { serveAndListenHMRFlamme } from './hmr'
import { useFlammeCurrentDirectory } from '../hooks/useFlammeCurrentDirectory'
import { createFlamme } from './flamme'
import * as fs from 'node:fs'

interface IWatchAndListenFlammeParams {
    currentDirectory: string
    buildClientPath: (hash: string) => string
    buildServerPath: (hash: string) => string
    getEntryPointClientContent: ({
        hashKey,
    }: {
        hashKey: string
    }) => Promise<string>
    getEntryPointServerContent: ({
        hashKey,
    }: {
        hashKey: string
    }) => Promise<string>
    hashKey: string
    config: Required<IFlammeConfigFile>
    port: number
}

export async function watchAndListenFlamme(
    params: IWatchAndListenFlammeParams
) {
    const { currentDirectory, buildServerPath, hashKey, config, port } = params
    let listener: Listener

    // hmr server
    const hmr = await serveAndListenHMRFlamme()

    const watcher = chokidar
        .watch(currentDirectory)
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

            await listener.close()

            // browser client build + server - ssr build
            await buildEndpoint({
                entryPointClientContent: await nextGetEntryPointClientContent({
                    hashKey: newHashKey,
                }),
                entryPointServerContent: await nextGetEntryPointServerContent({
                    hashKey: newHashKey,
                }),
                buildClientPath: nextBuildClientPath(newHashKey),
                buildServerPath: nextBuildServerPath(newHashKey),
            })

            listener = await listenServer({
                buildServerPath: nextBuildServerPath(newHashKey),
                port: nextConfig.devServerPort ?? port,
                reload: true,
            })
        })

    listener = await listenServer({
        buildServerPath: buildServerPath(hashKey),
        port,
    })

    console.log(
        formatShortDate(new Date()),
        colors.red('[flamme]'),
        '👀 Watching',
        colors.green('/src'),
        'for files changes...'
    )
}
