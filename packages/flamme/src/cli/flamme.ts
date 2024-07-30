import path from 'node:path'
import { hash } from 'ohash'
import { useFlammeConfig } from '../hooks/useFlammeConfig'
import { useFlammeCurrentDirectory } from '../hooks/useFlammeCurrentDirectory'
import { createFlammeEntrypoints } from './entrypoint'
import { useFlammeBuildMode } from '../hooks/useFlammeBuildMode'
import { useFlammeBuildLoader } from '../hooks/useFlammeBuildLoader'
import * as fs from 'node:fs'

export async function createFlamme() {
    const [mode] = useFlammeBuildMode()
    const { config } = await useFlammeConfig()
    const { currentDirectory } = await useFlammeCurrentDirectory()

    const [_, setBuildLoader] = useFlammeBuildLoader()
    const isTsConfigExists = fs.existsSync(
        path.resolve(currentDirectory, 'tsconfig.json')
    )

    setBuildLoader('js')
    if (isTsConfigExists) {
        setBuildLoader('ts')
    }
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

    const outPath = path.resolve(
        currentDirectory,
        mode === 'development' ? config.cacheDir : config.buildDir
    )

    const buildClientPath = (hash?: string) =>
        path.resolve(outPath, hash ? `client.${hash}.js` : 'client.js')

    const buildServerPath = (hash?: string) =>
        path.resolve(outPath, hash ? `server.${hash}.js` : 'server.js')

    const { getEntryPointClientContent, getEntryPointServerContent } =
        await createFlammeEntrypoints({
            entrypointClientPath,
            entrypointServerPath,
            outPath,
            config,
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
