import { defineCommand } from 'citty'
import { createFlamme } from '../flamme'
import { watchAndListenFlamme } from '../watch'
import { buildEndpoint } from '../build'
import { useFlammeBuildMode } from '../../hooks/useFlammeBuildMode'
import { useFlammeArgs } from '../../hooks/useFlammeArgs'
import { args } from '../helpers/args'
import { openBrowser } from '../openBrowser'

export default defineCommand({
    meta: {
        name: 'dev',
        description: 'Start the development server',
        version: '0.0.1-alpha.26',
    },
    args: {
        open: {
            type: 'boolean',
            description: 'Open browser',
            valueHint: 'true',
        },
        ...args,
    },
    run: async ({ args }) => {
        // set build mode to development
        const [_, setMode] = useFlammeBuildMode()
        setMode('development')
        // set args to global flamme args
        const [__, setArgs] = useFlammeArgs()
        setArgs(args)

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
            hashKey,
            entryPointClientContent: await getEntryPointClientContent({
                hashKey,
            }),
            entryPointServerContent: await getEntryPointServerContent({
                hashKey,
            }),
            buildClientPath: buildClientPath(hashKey),
            buildServerPath: buildServerPath(hashKey),
        })

        const port = args.port ? Number(args.port) : config.devServerPort

        // watch and listen flamme
        await watchAndListenFlamme({
            currentDirectory,
            getEntryPointClientContent,
            getEntryPointServerContent,
            buildClientPath,
            buildServerPath,
            hashKey,
            config,
            port,
        })

        if (args.open) {
            await openBrowser({
                port,
            })
        }
    },
})
