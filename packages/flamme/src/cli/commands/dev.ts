import { defineCommand } from 'citty'
import { listen } from 'listhen'
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

        const entryPointContent = `
            import { createApp, createRouter, eventHandler } from 'h3'
            import { resolve } from 'path'
            import entrypoint from "${path.resolve(currentDirectory, config.serverDir ?? 'src/server', 'index')}"
            
            export default async function Entrypoint() {            
                const app = createApp()
            
                // Create a new router and register it in app
                const router = createRouter()
                app.use(router)
                
                console.log('Hello, Flamme!')
            
                // Register the default entrypoint
                app.use(eventHandler(() => {
                    return entrypoint()
                }))
            }
        `

        await build({
            stdin: {
                contents: entryPointContent,
                resolveDir: path.resolve(__dirname, '../src/core'),
                sourcefile: 'server.ts',
                loader: 'ts',
            },
            bundle: true,
            outfile: path.resolve(currentDirectory, 'dist', 'server.js'),
            platform: 'node',
            packages: 'external',
        })

        const compiledEntrypoint = await import(
            path.resolve(currentDirectory, 'dist', 'server.js')
        )

        console.log(compiledEntrypoint)

        await listen(compiledEntrypoint.default.default, {
            port: parseInt(args.port) ?? config.devServerPort ?? 3000,
        })
    },
})
