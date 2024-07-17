import { IFlammeConfigFile } from '../hooks/useFlammeConfig'
import { useFlammeBuildMode } from '../hooks/useFlammeBuildMode'

interface ICreateFlammeEntrypoints {
    config: IFlammeConfigFile
    hashKey: string
    buildClientPath: (
        hash: string,
        mode: 'development' | 'production'
    ) => string
    entrypointClientPath: string
    entrypointServerPath: string
}

export function createFlammeEntrypoints({
    entrypointClientPath,
    entrypointServerPath,
    buildClientPath,
    config,
}: ICreateFlammeEntrypoints) {
    // get build mode
    const [mode] = useFlammeBuildMode()

    const getEntryPointClientContent = () => `
            import React from 'react'
            import { hydrateRoot } from 'react-dom/client'
            import Index from "${entrypointClientPath}"
            
            hydrateRoot(document, React.createElement(Index))
        `

    const getEntryPointServerContent = ({ hashKey }: { hashKey: string }) => `
            import React from 'react'
            import { hydrateRoot } from 'react-dom/client'
            import { renderToPipeableStream } from 'react-dom/server';
            import { createApp, createRouter, defineEventHandler } from 'h3'
            import * as fs from 'node:fs'
            import entrypointServer from "${entrypointServerPath}"
            import EntrypointClient from "${entrypointClientPath}"
            
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
            
            // Load the client script
            const content = fs.readFileSync("${buildClientPath(hashKey, mode ?? 'development')}", 'utf-8')
            
            // Register the client script
            app.use("${config.baseUrl}/client.${hashKey}.js", defineEventHandler((event) => {
                return content
            }))
            
            //Register the client single entrypoint
            app.use("${config.baseUrl || '/'}", defineEventHandler((event) => {
                const { pipe } = renderToPipeableStream(React.createElement(EntrypointClient),
                    {
                        bootstrapScripts: ["/client.${hashKey}.js"],
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

    return {
        getEntryPointClientContent,
        getEntryPointServerContent,
    }
}
