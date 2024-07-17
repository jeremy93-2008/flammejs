import { defineCommand } from 'citty'
import { createFlamme } from '../flamme'
import { watchAndListenFlamme } from '../watch'
import { buildEndpoint } from '../common'
import { useFlammeBuildMode } from '../../hooks/useFlammeBuildMode'

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
            entryPointClientContent: getEntryPointClientContent(),
            entryPointServerContent: getEntryPointServerContent({
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
            port: args.port,
        })
    },
})
