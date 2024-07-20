import { IFlammeConfigFile } from '../hooks/useFlammeConfig'
import { useFlammeCurrentDirectory } from '../hooks/useFlammeCurrentDirectory'
import path from 'node:path'
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
    const { currentDirectory } = await useFlammeCurrentDirectory()
    const defaultCssPath = path.resolve(
        __dirname,
        '../../src/core/styles/default.css'
    )
    const getEntryPointClientContent = ({ hashKey }: { hashKey: string }) => {
        const assetsMap = JSON.stringify({
            'client.js': `/_flamme/assets/client.${hashKey}.js`,
            'client.css': `/_flamme/assets/client.${hashKey}.css`,
        })
        return `
            import React from 'react'
            import { hydrateRoot } from 'react-dom/client'
            import EntrypointClient from "${entrypointClientPath}"
            import "${defaultCssPath}"
            
            function IndexApp() {
                globalThis.assetsMap = ${assetsMap}
                return React.createElement(EntrypointClient)
            }
            
            hydrateRoot(document, React.createElement(IndexApp))
        `
    }

    const getEntryPointServerContent = ({ hashKey }: { hashKey: string }) => {
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
            
            // Register the server single entrypoint
            app.use("${config.serverBaseUrl}",defineEventHandler(entrypointServer))
            
            // Register the static assets created by the build
            app.use(
                '/_flamme/assets',
                defineEventHandler((event) => {
                    return serveStatic(event, {
                        getContents: (id) => {
                            if(id === '/server.${hashKey}.js') return null
                            return fsPromises.readFile(path.join('${outPath}', id))
                        },
                        getMeta: async (id) => {
                            if(id === '/server.${hashKey}.js') return null
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
        
            //Register the client single entrypoint
            app.use("${config.baseUrl || '/'}", defineEventHandler((event) => {
                const { pipe } = renderToPipeableStream(
                    React.createElement(EntrypointClient),
                    {
                        onShellReady() {
                            event.headers.set('content-type', 'text/html')
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
