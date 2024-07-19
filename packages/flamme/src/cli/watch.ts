import type { Listener } from 'listhen'
import chokidar from 'chokidar'
import { hash } from 'ohash'
import { rimraf } from 'rimraf'
import colors from 'colors/safe'
import path from 'node:path'
import { type IFlammeConfigFile } from '../hooks/useFlammeConfig'
import { buildEndpoint } from './build'
import { listenServer } from './listen'

interface IWatchAndListenFlammeParams {
    currentDirectory: string
    buildClientPath: (hash: string) => string
    buildServerPath: (hash: string) => string
    getEntryPointClientContent: ({ hashKey }: { hashKey: string }) => string
    getEntryPointServerContent: ({ hashKey }: { hashKey: string }) => string
    hashKey: string
    config: Required<IFlammeConfigFile>
    port: string
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
            '📄 File changed:',
            colors.green(path.relative(process.cwd(), pathname))
        )
        const newHashKey = hash(performance.now())

        await listener.close()
        await rimraf.rimraf(path.resolve(currentDirectory, '.flamme'))

        // browser client build + server - ssr build
        await buildEndpoint({
            entryPointClientContent: getEntryPointClientContent({
                hashKey: newHashKey,
            }),
            entryPointServerContent: getEntryPointServerContent({
                hashKey: newHashKey,
            }),
            buildClientPath: buildClientPath(newHashKey),
            buildServerPath: buildServerPath(newHashKey),
        })

        listener = await listenServer({
            buildServerPath: buildServerPath(newHashKey),
            port: parseInt(port) ?? config.devServerPort,
            reload: true,
        })
    })

    listener = await listenServer({
        buildServerPath: buildServerPath(hashKey),
        port: parseInt(port) ?? config.devServerPort,
    })

    console.log('👀 Watching', colors.green('/src'), 'for files changes...')
}
