import { defineCommand } from 'citty'
import { createFlamme } from '../flamme'
import { watchAndListenFlamme } from '../watch'
import { buildEndpoint } from '../build'
import { useFlammeBuildMode } from '../../hooks/useFlammeBuildMode'
import { serveAndListenHMRFlamme } from '../hmr'

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
            required: false,
        },
    },
    run: async ({ args }) => {
        // set build mode to development
        const [_, setMode] = useFlammeBuildMode()
        setMode('development')

        // create flamme basic structure
        const {
            config,
            currentDirectory,
            hashKey,
            buildClientPath,
            buildServerPath,
            getEntryPointClientContent,
            getEntryPointServerContent,
        } = await createFlamme()

        // browser client build + server - ssr build
        await buildEndpoint({
            entryPointClientContent: await getEntryPointClientContent({
                hashKey,
            }),
            entryPointServerContent: await getEntryPointServerContent({
                hashKey,
            }),
            buildClientPath: buildClientPath(hashKey),
            buildServerPath: buildServerPath(hashKey),
        })

        // watch and listen flamme
        await watchAndListenFlamme({
            currentDirectory,
            getEntryPointClientContent,
            getEntryPointServerContent,
            buildClientPath,
            buildServerPath,
            hashKey,
            config,
            port: args.port ? Number(args.port) : config.devServerPort,
        })
    },
})
