import { WebSocketServer } from 'ws'
import chokidar from 'chokidar'
import { IFlammeConfigFile, useFlammeConfig } from '../hooks/useFlammeConfig'
import fs from 'node:fs'
import path from 'node:path'
import { useFlammeCurrentDirectory } from '../hooks/useFlammeCurrentDirectory'
import colors from 'colors/safe'
import { formatShortDate } from '../utils/formatShortDate'

export const WS_RELOAD_MESSAGE = 'reload'

interface IServeHMROptions {
    currentDirectory: string
    config: Required<IFlammeConfigFile>
}

export async function serveAndListenHMRFlamme() {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    const { config } = await useFlammeConfig()
    listenHMRFlamme({ currentDirectory, config })
}

export function listenHMRFlamme({
    currentDirectory,
    config,
}: IServeHMROptions) {
    let isFistConnection = true

    const listeners = new Map<string, () => void>()

    const watcher = chokidar
        .watch(path.resolve(currentDirectory, config.cacheDir), {
            awaitWriteFinish: {
                stabilityThreshold: 300,
                pollInterval: 50,
            },
        })
        .on('add', async () => {
            listeners.forEach((listener) => listener())
        })

    return new WebSocketServer({
        port: config.hmrServerPort,
    }).on('connection', (ws) => {
        let isMessageAlreadySent = false
        if (isFistConnection)
            console.log(
                formatShortDate(new Date()),
                colors.red('[flamme]'),
                '🔥 Hot Reload Module started at',
                colors.blue(`ws://localhost:${config.hmrServerPort}`)
            )

        isFistConnection = false

        listeners.set(ws.url, () => {
            if (isMessageAlreadySent) return
            isMessageAlreadySent = true
            console.log(
                formatShortDate(new Date()),
                colors.red('[flamme]'),
                '🔥 Client reload send from',
                colors.blue(`ws://localhost:${config.hmrServerPort}`)
            )
            ws.send(WS_RELOAD_MESSAGE)
            ws.terminate()
            listeners.delete(ws.url)
        })
    })
}
