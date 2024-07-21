import { createApp, defineWebSocketHandler, toNodeListener } from 'h3'
import chokidar from 'chokidar'
import { IFlammeConfigFile, useFlammeConfig } from '../hooks/useFlammeConfig'
import path from 'node:path'
import { useFlammeCurrentDirectory } from '../hooks/useFlammeCurrentDirectory'
import { listen } from 'listhen'

export const WS_RELOAD_MESSAGE = 'reload'

interface IServeHMROptions {
    currentDirectory: string
    config: Required<IFlammeConfigFile>
}

export async function serveHMR() {
    const { currentDirectory } = await useFlammeCurrentDirectory()
    const { config } = await useFlammeConfig()
    const app = appHMR({ currentDirectory, config })

    await listen(toNodeListener(app), {
        port: config.hmrServerPort,
        showURL: false,
        ws: true,
    })
}

export function appHMR({ currentDirectory, config }: IServeHMROptions) {
    const app = createApp()

    app.use(
        '/hmr',
        defineWebSocketHandler({
            open(peer) {
                console.log('🔥[hmr] open', peer)
                peer.send('connected')
                chokidar
                    .watch(path.resolve(currentDirectory, config.cacheDir))
                    .on('change', (path, stats) => {
                        console.log('🔥[hmr] change', path)
                        peer.send(WS_RELOAD_MESSAGE)
                    })
            },

            close(peer, event) {
                console.log('[hmr] close', peer, event)
            },

            error(peer, error) {
                console.log('[hmr] error', peer, error)
            },
        })
    )

    return app
}
