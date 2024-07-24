import type { Listener } from 'listhen'
import chokidar from 'chokidar'
import { hash } from 'ohash'
import { rimraf } from 'rimraf'
import colors from 'colors/safe'
import path from 'node:path'
import { type IFlammeConfigFile } from '../hooks/useFlammeConfig'
import { buildEndpoint } from './build'
import { listenServer } from './listen'
import { formatShortDate } from '../utils/formatShortDate'

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
    const {
        currentDirectory,
        buildClientPath,
        buildServerPath,
        getEntryPointClientContent,
        getEntryPointServerContent,
        hashKey,
        config,
        port,
    } = params
    let listener: Listener

    chokidar.watch(currentDirectory).on('change', async (pathname, stats) => {
        if (pathname.includes(config.buildDir)) return
        if (!pathname.includes('/src')) return
        console.log(
            formatShortDate(new Date()),
            colors.red('[flamme]'),
            '📄 File changed:',
            colors.green(path.relative(process.cwd(), pathname))
        )
        const newHashKey = hash(performance.now())

        await listener.close()
        await rimraf.rimraf(path.resolve(currentDirectory, config.cacheDir))

        // browser client build + server - ssr build
        await buildEndpoint({
            entryPointClientContent: await getEntryPointClientContent({
                hashKey: newHashKey,
            }),
            entryPointServerContent: await getEntryPointServerContent({
                hashKey: newHashKey,
            }),
            buildClientPath: buildClientPath(newHashKey),
            buildServerPath: buildServerPath(newHashKey),
        })

        listener = await listenServer({
            buildServerPath: buildServerPath(newHashKey),
            port,
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
