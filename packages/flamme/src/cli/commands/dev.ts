import { defineCommand } from 'citty'
import { listenAndWatch } from 'listhen'
import { useFlammeConfig } from '../../hooks/useFlammeConfig'
import { build } from 'esbuild'
import path from 'node:path'
import { useFlammeCurrentDirectory } from '../../hooks/useFlammeCurrentDirectory'

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
        const entrypointPath = path.resolve(currentDirectory, config.serverDir ?? 'src/server', 'index')

        const entryPointContent = `
            import { createApp, createRouter, defineEventHandler } from 'h3'
            import { resolve } from 'path'
            import entrypoint from "${entrypointPath}"
            
            const app = createApp()
            
            // Create a new router and register it in app
            const router = createRouter()
            app.use(router)
            
            console.log('Hello, Flamme!')
            
            // Register custom values for context
            app.use(defineEventHandler((event) => {
                event.context.app = app
                event.context.router = router
            }))
        
            // Register the default entrypoint
            app.use(defineEventHandler(entrypoint))
            
            export default app;
        `

        await build({
            stdin: {
                contents: entryPointContent,
                resolveDir: path.resolve(__dirname, '../src/core'),
                sourcefile: 'server.ts',
                loader: 'ts',
            },
            bundle: true,
            outfile: path.resolve(currentDirectory, '.flamme', 'server.js'),
            platform: 'node',
            packages: 'external',
            external: ['h3', 'path', entrypointPath],
        })

        await listenAndWatch(path.resolve(currentDirectory, '.flamme', 'server.js'), {
            port: parseInt(args.port) ?? config.devServerPort ?? 3000,
        })
    },
})
