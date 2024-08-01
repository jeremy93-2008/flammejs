import { defineCommand } from 'citty'
import { useFlammeBuildMode } from '../../hooks/useFlammeBuildMode'
import { listenServer } from '../listen'
import { useFlammeCurrentDirectory } from '../../hooks/useFlammeCurrentDirectory'
import { useFlammeConfig } from '../../hooks/useFlammeConfig'
import path from 'node:path'

export default defineCommand({
    meta: {
        name: 'start',
        description: 'Start the Flamme server',
        version: '0.0.1-alpha.3',
    },
    args: {
        port: {
            type: 'string',
            description: 'Port to listen to',
            required: false,
        },
    },
    run: async ({ args }) => {
        // set build mode to development
        const [_, setMode] = useFlammeBuildMode()
        setMode('production')

        const { currentDirectory } = await useFlammeCurrentDirectory()
        const { config } = await useFlammeConfig()

        const buildManifest = await import(
            path.resolve(currentDirectory, config.buildDir, '_buildManifest.js')
        )
        const hashKey = buildManifest.default.hashKey

        const buildServerPath = path.resolve(
            currentDirectory,
            config.buildDir,
            `server.${hashKey}.js`
        )

        //listen to the build endpoint
        await listenServer({
            buildServerPath,
            port: Number(args.port) ?? config.devServerPort,
        })
    },
})
