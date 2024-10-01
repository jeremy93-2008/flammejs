import { WebSocketServer } from 'ws'
import chokidar from 'chokidar'
import { IFlammeConfigFile, useFlammeConfig } from '../hooks/useFlammeConfig'
import path from 'node:path'
import { useFlammeCurrentDirectory } from '../hooks/useFlammeCurrentDirectory'
import colors from 'colors/safe'
import { formatShortDate } from '../utils/formatShortDate'

export const WS_RELOAD_MESSAGE = 'reload'
export const WS_ERROR_MESSAGE = 'error'

interface IServeHMROptions {
    currentDirectory: string
    config: Required<IFlammeConfigFile>
}

export async function serveAndListenHMRFlamme() {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    const { config } = await useFlammeConfig()
    return listenHMRFlamme({ currentDirectory, config })
}

export function listenHMRFlamme({
    currentDirectory,
    config,
}: IServeHMROptions) {
    let isFistConnection = true

    let reloadListener = () => {}

    chokidar
        .watch(path.resolve(currentDirectory, config.cacheDir), {
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 50,
            },
        })
        .on('add', async (path) => {
            if (
                path.match(/client\..+\.mjs$/gi) ||
                path.match(/chunk\..+\.mjs$/gi)
            ) {
                return reloadListener()
            }
        })

    return new WebSocketServer({
        port: config.hmrServerPort,
    }).on('connection', (ws) => {
        let isRefreshMessageAlreadySent = false
        if (isFistConnection)
            console.log(
                formatShortDate(new Date()),
                colors.red('[flamme]'),
                '🔥 Hot Reload Module started at',
                colors.blue(`ws://localhost:${config.hmrServerPort}`)
            )

        isFistConnection = false

        reloadListener = () => {
            if (isRefreshMessageAlreadySent) return
            isRefreshMessageAlreadySent = true
            console.log(
                formatShortDate(new Date()),
                colors.red('[flamme]'),
                '🔥 Client reload send from',
                colors.blue(`ws://localhost:${config.hmrServerPort}`)
            )
            ws.send(WS_RELOAD_MESSAGE)
            ws.terminate()
        }
    })
}
