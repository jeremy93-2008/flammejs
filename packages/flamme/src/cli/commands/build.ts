import { defineCommand } from 'citty'
import { createFlamme } from '../flamme'
import { buildEndpoint } from '../build'
import { useFlammeBuildMode } from '../../hooks/useFlammeBuildMode'

export default defineCommand({
    meta: {
        name: 'build',
        description: 'Build the app',
        version: '0.0.1',
    },
    run: async () => {
        // set build mode to development
        const [_, setMode] = useFlammeBuildMode()
        setMode('production')

        const {
            hashKey,
            buildClientPath,
            buildServerPath,
            getEntryPointClientContent,
            getEntryPointServerContent,
        } = await createFlamme()

        // browser client build + server - ssr build
        await buildEndpoint({
            entryPointClientContent: getEntryPointClientContent({ hashKey }),
            entryPointServerContent: getEntryPointServerContent({
                hashKey,
            }),
            buildClientPath: buildClientPath(),
            buildServerPath: buildServerPath(),
        })
    },
})
