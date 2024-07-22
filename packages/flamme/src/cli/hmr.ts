import { WebSocketServer } from 'ws'
import chokidar from 'chokidar'
import { IFlammeConfigFile, useFlammeConfig } from '../hooks/useFlammeConfig'
import path from 'node:path'
import { useFlammeCurrentDirectory } from '../hooks/useFlammeCurrentDirectory'
import colors from 'colors/safe'

export const WS_RELOAD_MESSAGE = 'reload'

interface IServeHMROptions {
    currentDirectory: string
    config: Required<IFlammeConfigFile>
}

export async function serveHMR() {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    const { config } = await useFlammeConfig()
    appHMR({ currentDirectory, config })
}

export function appHMR({ currentDirectory, config }: IServeHMROptions) {
    let isFistConnection = true
    return new WebSocketServer({
        port: config.hmrServerPort,
    }).on('connection', (ws) => {
        if (isFistConnection)
            console.log(
                '🔥 Hot Reload Module started at',
                colors.blue(`ws://localhost:${config.hmrServerPort}`)
            )
        isFistConnection = false
        const watcher = chokidar
            .watch(path.resolve(currentDirectory, config.cacheDir))
            .on('change', async (path, stats) => {
                await watcher.close()
                setTimeout(() => {
                    console.log(
                        '🔥 Client reload at',
                        colors.blue(`ws://localhost:${config.hmrServerPort}`)
                    )
                    ws.send(WS_RELOAD_MESSAGE)
                    ws.close()
                })
            })
    })
}
