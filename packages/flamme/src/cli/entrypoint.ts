import { IFlammeConfigFile } from '../hooks/useFlammeConfig'
import path from 'node:path'
import { getPublicEnv } from './env'
import { WS_ERROR_MESSAGE, WS_RELOAD_MESSAGE } from './hmr'
import { useFlammeBuildMode } from '../hooks/useFlammeBuildMode'
import * as fs from 'node:fs'
interface ICreateFlammeEntrypoints {
    directoryClientPath: string
    directoryServerPath: string
    entrypointClientPath: string
    entrypointServerPath: string
    outPath: string
    config: IFlammeConfigFile
}
import { useFlammeBuildLoader } from '../hooks/useFlammeBuildLoader'

export async function createFlammeEntrypoints({
    directoryClientPath,
    entrypointClientPath,
    entrypointServerPath,
    outPath,
    config,
}: ICreateFlammeEntrypoints) {
    const [loader] = useFlammeBuildLoader()
    const [mode] = useFlammeBuildMode()

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
            'client.js': `${config.base}client.${hashKey}.js`,
            'client.css': `${config.base}client.${hashKey}.css`,
        })
        const publicEnv = await getPublicEnv()

        return `
            import React from 'react'
            import { hydrateRoot } from 'react-dom/client'
            import EntrypointClient from "${entrypointClientPath}"
            import {
                RouterProvider
            } from 'react-router-dom'
            import "${defaultCssPath}"
            
            ${
                fs.existsSync(path.resolve(directoryClientPath, 'routes.tsx'))
                    ? `import getFlammeRouter from "${path.resolve(directoryClientPath, 'routes.tsx')}"`
                    : fs.existsSync(
                            path.resolve(directoryClientPath, 'routes.jsx')
                        )
                      ? `import getFlammeRouter from "${path.resolve(directoryClientPath, 'routes.jsx')}"`
                      : 'const getFlammeRouter = async () => null'
            }
            
            async function IndexApp() {
                globalThis.assetsMap = ${assetsMap}
                globalThis.process = {"env":  ${JSON.stringify(publicEnv)}}
                
                const flammeRouter = await getFlammeRouter(event, React.createElement(EntrypointClient))
                
                if(flammeRouter) {
                    return () => React.createElement(RouterProvider, { router: flammeRouter.router },
                                                 React.createElement(EntrypointClient)) 
                }
                
                return () => React.createElement(EntrypointClient)
            }
            
            IndexApp().then((component) => {
                hydrateRoot(document, React.createElement(component))
                ${
                    mode === 'development'
                        ? `
                    // Create WebSocket connection.
                    const socket = new WebSocket("ws://localhost:${config.hmrServerPort}/hmr");
                    
                    // Listen for messages
                    socket.addEventListener("message", (event) => {
                        if(event.data === "${WS_RELOAD_MESSAGE}") {
                            socket.close()
                            if(document.getElementById('flamme-error')) document.getElementById('flamme-error').remove()
                            location.reload()
                        }
                        if(event.data === "${WS_ERROR_MESSAGE}") {
                            console.error("An error occurred while building the app")
                            ${
                                config.hmrOverlay
                                    ? `const errorElement = document.createElement('div')
                            errorElement.id = 'flamme-error'
                            errorElement.style.position = 'fixed'
                            errorElement.style.top = '0'
                            errorElement.style.left = '0'
                            errorElement.style.width = '100%'
                            errorElement.style.height = '150px'
                            errorElement.style.backgroundColor = 'rgb(248 113 113)'
                            errorElement.style.color = 'white'
                            errorElement.style.zIndex = '10000'
                            errorElement.style.display = 'flex'
                            errorElement.style.flexDirection = 'column'
                            errorElement.style.justifyContent = 'center'
                            errorElement.style.alignItems = 'center'
                            
                            const h1 = document.createElement('h1')
                            h1.style.fontSize = '2rem'
                            h1.innerHTML = 'An error occurred while building the app'
                            errorElement.appendChild(h1)
                            
                            const p = document.createElement('p')
                            p.style.fontSize = '1rem'
                            p.innerHTML = 'Check flammejs console for more details. Fix the error and save the file again. The page will reload automatically.'
                            errorElement.appendChild(p)
                            
                            document.body.appendChild(errorElement)`
                                    : ''
                            }
                            
                        }
                    });
                `
                        : ''
                }
           }) 
        `
    }

    const getEntryPointServerContent = async ({
        hashKey,
    }: {
        hashKey: string
    }) => {
        const assetsMap = JSON.stringify({
            'client.js': `${config.base}client.${hashKey}.js`,
            'client.css': `${config.base}client.${hashKey}.css`,
        })
        return `
            import React from 'react'
            import { renderToPipeableStream } from 'react-dom/server';
            import { createApp, createRouter, defineEventHandler, serveStatic, setResponseHeader } from 'h3'
            import * as fs from 'node:fs'
            import * as fsPromises from 'node:fs/promises'
            import * as mime from 'mime-types'
            import path from 'node:path'
            import {
                StaticRouterProvider
            } from 'react-router-dom/server'
            import entrypointServer from "${entrypointServerPath}"
            import EntrypointClient from "${entrypointClientPath}"
            import "${defaultCssPath}"
            
             ${
                 fs.existsSync(path.resolve(directoryClientPath, 'routes.tsx'))
                     ? `import getFlammeRouter from "${path.resolve(directoryClientPath, 'routes.tsx')}"`
                     : fs.existsSync(
                             path.resolve(directoryClientPath, 'routes.jsx')
                         )
                       ? `import getFlammeRouter from "${path.resolve(directoryClientPath, 'routes.jsx')}"`
                       : 'const getFlammeRouter = async () => null'
             }
            
            globalThis.assetsMap = ${assetsMap}
            
            const app = createApp({ debug: ${mode === 'development' ? 'true' : 'false'} })
            
            // Create a new server router and register it in app
            const router = createRouter()
            app.use(router)
            
            ${
                mode === 'development'
                    ? `
            // Create Vite Server
            import { createServer as createViteServer } from 'vite'
            
            const vite = createViteServer({
                server: { middlewareMode: true, origin: 'http://localhost:${config.devServerPort}' },
                appType: 'custom',
                configFile: false,
                build: {
                    manifest: true,
                    rollupOptions: {
                        input: '${entrypointClientPath}.${loader}x',
                    },
                },
            })
            
            vite.then(server => {
                app.use(defineEventHandler(async (event) => {
                    return vite.middlewares(event.node.req, event.node.res, () => null)
                }))            
            })
            
            `
                    : ''
            }
            
            
            // Register custom values for context
            app.use(defineEventHandler((event) => {
                event.context.app = app
                event.context.router = router
            }))
            
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
            
             // Register the static assets created by the build
            app.use(
                "${config.root || '/'}",
                defineEventHandler((event) => {
                    // Check if the request is for a static asset
                    const regex = new RegExp(/\\${config.root || '/'}(.*)\\.(.+)/)
                    // If the request is not for a static asset, return undefined and then h3 will check the next handler
                    if(!regex.test(event.path)) return undefined    
                                    
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
        
            //Register the client single entrypoint
            app.use("${config.root || '/'}", defineEventHandler(async (event) => {
                process.env = ${JSON.stringify(globalThis.envPublic)}
                                
                const flammeRouter = await getFlammeRouter(event, React.createElement(EntrypointClient))
                
                const ClientComponent = flammeRouter ? 
                    () => React.createElement(StaticRouterProvider, 
                        { router: flammeRouter.router, context: flammeRouter.ctx }, 
                    EntrypointClient) : EntrypointClient
                
                const { pipe } = renderToPipeableStream(
                    React.createElement(ClientComponent),
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
