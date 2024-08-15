import path from 'node:path'
import { defineCommand } from 'citty'
import { listenServer } from '../listen'
import { useFlammeBuildMode } from '../../hooks/useFlammeBuildMode'
import { useFlammeCurrentDirectory } from '../../hooks/useFlammeCurrentDirectory'
import { useFlammeConfig } from '../../hooks/useFlammeConfig'
import { useFlammeArgs } from '../../hooks/useFlammeArgs'
import { args } from '../helpers/args'

export default defineCommand({
    meta: {
        name: 'start',
        description: 'Start the Flamme server',
        version: '0.0.1-alpha.29',
    },
    args: {
        prod: {
            type: 'boolean',
            description: 'Start the server in production mode',
            valueHint: 'true',
            default: true,
        },
        ...args,
    },
    run: async ({ args }) => {
        // set build mode to development
        const [_, setMode] = useFlammeBuildMode()
        setMode('production')
        // set args to global flamme args
        const [__, setArgs] = useFlammeArgs()
        setArgs(args)

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
            isProduction: args.prod,
            isPublic: Boolean(args.public),
            qr: Boolean(args.qr),
            hasTunnel: Boolean(args.tunnel),
        })
    },
})
