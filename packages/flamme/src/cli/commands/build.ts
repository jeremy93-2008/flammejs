import colors from 'colors'
import { defineCommand } from 'citty'
import { createFlamme } from '../flamme'
import { buildEndpoint } from '../build'
import { useFlammeBuildMode } from '../../hooks/useFlammeBuildMode'
import { formatShortDate } from '../../utils/formatShortDate'
import path from 'node:path'
import { rimraf } from 'rimraf'

export default defineCommand({
    meta: {
        name: 'build',
        description: 'Build the app',
        version: '0.0.1-alpha.2',
    },
    run: async () => {
        let buildTime = performance.now()
        // set build mode to development
        const [_, setMode] = useFlammeBuildMode()
        setMode('production')

        console.log(
            formatShortDate(new Date()),
            colors.red('[flamme]'),
            'Building the app...'
        )

        const {
            currentDirectory,
            config,
            hashKey,
            buildClientPath,
            buildServerPath,
            getEntryPointClientContent,
            getEntryPointServerContent,
        } = await createFlamme()

        // clean build directory
        await rimraf.rimraf(path.resolve(currentDirectory, config.buildDir))

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
        buildTime = performance.now() - buildTime

        console.log(
            formatShortDate(new Date()),
            colors.red('[flamme]'),
            'Build completed in',
            colors.yellow(
                `${new Intl.NumberFormat('en-US').format(buildTime / 1000)}s`
            )
        )
    },
})
