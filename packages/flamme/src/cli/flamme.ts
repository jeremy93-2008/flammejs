import path from 'node:path'
import { hash } from 'ohash'
import { useFlammeConfig } from '../hooks/useFlammeConfig'
import { useFlammeCurrentDirectory } from '../hooks/useFlammeCurrentDirectory'
import { createFlammeEntrypoints } from './entrypoint'
import { useFlammeBuildMode } from '../hooks/useFlammeBuildMode'

export async function createFlamme() {
    const [mode] = useFlammeBuildMode()
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

    let hashKey = hash(performance.now())

    const buildClientPath = (hash?: string) =>
        path.resolve(
            currentDirectory,
            mode === 'development' ? '.flamme' : config.buildDir,
            hash ? `client.${hash}.js` : 'client.js'
        )

    const buildServerPath = (hash?: string) =>
        path.resolve(
            currentDirectory,
            mode === 'development' ? '.flamme' : config.buildDir,
            hash ? `server.${hash}.js` : 'server.js'
        )

    const { getEntryPointClientContent, getEntryPointServerContent } =
        createFlammeEntrypoints({
            entrypointClientPath,
            entrypointServerPath,
            buildClientPath,
            config,
            hashKey,
        })

    return {
        config,
        currentDirectory,
        entrypointServerPath,
        entrypointClientPath,
        hashKey,
        buildClientPath,
        buildServerPath,
        getEntryPointClientContent,
        getEntryPointServerContent,
    }
}
