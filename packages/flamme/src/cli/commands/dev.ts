import { defineCommand } from 'citty'
import { type Listener, listen } from 'listhen'
import { useFlammeConfig } from '../../hooks/useFlammeConfig'
import { build } from 'esbuild'
import path from 'node:path'
import { useFlammeCurrentDirectory } from '../../hooks/useFlammeCurrentDirectory'
import chokidar from 'chokidar'
import { toNodeListener } from 'h3'
import { hash } from 'ohash'
import { rimraf } from 'rimraf'
var colors = require('colors/safe')

export default defineCommand({
    meta: {
        name: 'dev',
        description: 'Start the development server',
        version: '0.0.1',
    },
    args: {
        port: {
            type: 'string',
            description: 'Port to listen to',
            default: '3000',
        },
    },
    run: async ({ args }) => {
        const { config } = await useFlammeConfig()
        const { currentDirectory } = await useFlammeCurrentDirectory()

        const entrypointServerPath = path.resolve(
            currentDirectory,
            config.serverDir,
            `index`
        )

        const entrypointClientPath = path.resolve(
            currentDirectory,
            config.clientDir,
            `index`
        )

        const entryPointContent = `
            import React from 'react'
            import { hydrateRoot } from 'react-dom/client'
            import { renderToPipeableStream } from 'react-dom/server';
            import { createApp, createRouter, defineEventHandler } from 'h3'
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
            
            //Register the client single entrypoint
            app.use("${config.baseUrl}", defineEventHandler((event) => {
                const { pipe } = renderToPipeableStream(React.createElement(EntrypointClient),
                    {
                        bootstrapScriptContent: \`
                            import React from 'react'
                            import { hydrateRoot } from 'react-dom/client'
                            const domNode = document.getElementById('root')
                            const root = hydrateRoot(domNode!, React.createElement(EntrypointClient))
                        \`,
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

        await rimraf.rimraf(path.resolve(currentDirectory, config.buildDir))

        let hashKey = hash(performance.now())

        const buildServerPath = (hash: string) =>
            path.resolve(currentDirectory, config.buildDir, `index.${hash}.js`)

        await buildServerEndpoint({
            entryPointContent,
            buildServerPath: buildServerPath(hashKey),
        })

        let listener: Listener

        chokidar
            .watch(currentDirectory)
            .on('change', async (pathname, stats) => {
                if (pathname.includes(config.buildDir)) return
                if (!pathname.includes('/src')) return
                console.log(
                    '📄 File changed:',
                    colors.green(path.relative(process.cwd(), pathname))
                )
                await rimraf.rimraf(
                    path.resolve(currentDirectory, config.buildDir)
                )
                hashKey = hash(performance.now())
                await listener.close()
                await buildServerEndpoint({
                    entryPointContent,
                    buildServerPath: buildServerPath(hashKey),
                })
                listener = await listenServer({
                    buildServerPath: buildServerPath(hashKey),
                    port: parseInt(args.port) ?? config.devServerPort,
                    reload: true,
                })
            })

        listener = await listenServer({
            buildServerPath: buildServerPath(hashKey),
            port: parseInt(args.port) ?? config.devServerPort,
        })

        console.log('👀 Watching', colors.green('/src'), 'for files changes...')
    },
})

export async function listenServer({
    buildServerPath,
    port,
    reload,
}: {
    buildServerPath: string
    port: number
    reload?: boolean
}) {
    const import_app = await import(buildServerPath)

    const listener = await listen(toNodeListener(import_app.default.default), {
        port,
        _entry: buildServerPath,
        showURL: !reload,
    })

    if (reload) console.log(`🔄 Server reload at`, colors.blue(listener.url))

    return listener
}

export async function buildServerEndpoint({
    entryPointContent,
    buildServerPath,
}: {
    entryPointContent: string
    buildServerPath: string
}) {
    return await build({
        stdin: {
            contents: entryPointContent,
            resolveDir: path.resolve(__dirname, '../../src/core'),
            sourcefile: `server.ts`,
            loader: 'ts',
        },
        bundle: true,
        outfile: buildServerPath,
        platform: 'node',
        allowOverwrite: true,
    })
}
