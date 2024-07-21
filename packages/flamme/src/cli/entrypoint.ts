import { IFlammeConfigFile } from '../hooks/useFlammeConfig'
import path from 'node:path'
import { getPublicEnv } from './env'
import { WS_RELOAD_MESSAGE } from './hmr'
interface ICreateFlammeEntrypoints {
    entrypointClientPath: string
    entrypointServerPath: string
    outPath: string
    config: IFlammeConfigFile
}

export async function createFlammeEntrypoints({
    entrypointClientPath,
    entrypointServerPath,
    outPath,
    config,
}: ICreateFlammeEntrypoints) {
    const defaultCssPath = path.resolve(
        __dirname,
        '../../src/core/styles/default.css'
    )

    const getEntryPointClientContent = async ({
        hashKey,
    }: {
        hashKey: string
    }) => {
        const assetsMap = JSON.stringify({
            'client.js': `/_flamme/assets/client.${hashKey}.js`,
            'client.css': `/_flamme/assets/client.${hashKey}.css`,
        })
        const publicEnv = await getPublicEnv()

        return `
            import React from 'react'
            import { hydrateRoot } from 'react-dom/client'
            import EntrypointClient from "${entrypointClientPath}"
            import "${defaultCssPath}"
            
            function IndexApp() {
                globalThis.assetsMap = ${assetsMap}
                globalThis.process = {"env":  ${JSON.stringify(publicEnv)}}
                
                return React.createElement(EntrypointClient)
            }
            
            hydrateRoot(document, React.createElement(IndexApp))
            
            // Create WebSocket connection.
            const socket = new WebSocket("ws://localhost:${config.hmrServerPort}/hmr");
            
            // Listen for messages
            socket.addEventListener("message", (event) => {
                if(event.data === ${WS_RELOAD_MESSAGE})
                    location.reload()
            });
        `
    }

    const getEntryPointServerContent = async ({
        hashKey,
    }: {
        hashKey: string
    }) => {
        const assetsMap = JSON.stringify({
            'client.js': `/_flamme/assets/client.${hashKey}.js`,
            'client.css': `/_flamme/assets/client.${hashKey}.css`,
        })
        return `
            import React from 'react'
            import { hydrateRoot } from 'react-dom/client'
            import { renderToPipeableStream } from 'react-dom/server';
            import { createApp, createRouter, defineEventHandler, serveStatic, setResponseHeader } from 'h3'
            import * as fs from 'node:fs'
            import * as fsPromises from 'node:fs/promises'
            import * as mime from 'mime-types'
            import path from 'node:path'
            import entrypointServer from "${entrypointServerPath}"
            import EntrypointClient from "${entrypointClientPath}"
            import "${defaultCssPath}"
            
            globalThis.assetsMap = ${assetsMap}
            
            const app = createApp({ debug:true })
            
            // Create a new router and register it in app
            const router = createRouter()
            app.use(router)
            
            // Register custom values for context
            app.use(defineEventHandler((event) => {
                event.context.app = app
                event.context.router = router
            }))
            
            // Register the static assets created by the build
            app.use(
                "${config.assetsBaseUrl}",
                defineEventHandler((event) => {
                    return serveStatic(event, {
                        getContents: (id) => {
                            if(id === '/server.${hashKey}.js') return null
                            setResponseHeader(event, 'content-type', mime.lookup(id))
                            return fsPromises.readFile(path.join('${outPath}', id))
                        },
                        getMeta: async (id) => {
                            if(id === '/server.${hashKey}.js') return null
                            setResponseHeader(event, 'content-type', mime.lookup(id))
                            const stats = await fsPromises
                                .stat(path.join('${outPath}', id))
                                .catch(() => {})
            
                            if (!stats || !stats.isFile()) {
                                return
                            }
            
                            return {
                                size: stats.size,
                                mtime: stats.mtimeMs,
                            }
                        },
                    })
                })
            )
            
            // Register specific case of favicon request to avoid loading the client
            app.use('/favicon.ico', defineEventHandler((event) => {
                if(!fs.existsSync(path.join('${outPath}', "favicon.ico"))) return null
                return fsPromises.readFile(path.join('${outPath}', "favicon.ico"))
            }))
            
            // Register the server single entrypoint
            app.use("${config.serverBaseUrl}",defineEventHandler((event) => {
                process.env = ${JSON.stringify(globalThis.env)}
                return entrypointServer(event)
            }))
        
            //Register the client single entrypoint
            app.use("${config.root || '/'}", defineEventHandler((event) => {
                process.env = ${JSON.stringify(globalThis.envPublic)}
                const { pipe } = renderToPipeableStream(
                    React.createElement(EntrypointClient),
                    {
                        onShellReady() {
                            setResponseHeader(event, 'content-type', 'text/html')
                            pipe(event.node.res)
                        },
                        onShellError(error) {
                            console.log(error)
                            event.node.res.statusCode = 500
                            event.node.res.setHeader('content-type', 'text/html')
                            event.node.res.end()
                        },
                    }
                )
                return "Page loading..."
            }))
            
            export default app;
        `
    }

    return {
        getEntryPointClientContent,
        getEntryPointServerContent,
    }
}
