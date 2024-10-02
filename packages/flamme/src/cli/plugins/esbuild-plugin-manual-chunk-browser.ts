import { Plugin } from 'esbuild'
import { useFlammeConfig } from '../../hooks/useFlammeConfig'
import { useFlammeBuildMode } from '../../hooks/useFlammeBuildMode'
import * as fs from 'fs-extra'
import { hash } from 'ohash'

/**
 * A plugin for esbuild to manual chunk modules by name. This plugin is for browser environment.
 */
export async function esbuildPluginManualChunkBrowser(
    manualChunkModulesName: string[],
    hashKey: string
): Promise<Plugin> {
    const [mode] = useFlammeBuildMode()
    const { config } = await useFlammeConfig()

    return {
        name: 'manual-chunk-browser',
        setup(build) {
            if (mode === 'production') return
            build.initialOptions.legalComments = 'none'
            build.initialOptions.metafile = true
            build.onEnd(() => {
                let resultContent = fs.readFileSync(
                    `${config.cacheDir}/client.${hashKey}.mjs`,
                    'utf-8'
                )

                const separatedChunkByFiles = resultContent
                    .split('\n// ')
                    .reduce(
                        (acc, val) => {
                            const [importLine, ...rest] = val.split('\n')
                            acc[importLine] = rest.join('\n')
                            return acc
                        },
                        {} as Record<string, string>
                    )

                const topCommonCodeFile = Object.values(
                    separatedChunkByFiles
                )[0]

                const importsToShare: string[] = []

                Object.entries(separatedChunkByFiles).forEach(
                    ([key, chunk], idx) => {
                        if (
                            manualChunkModulesName.filter((name) =>
                                key.includes(name)
                            ).length === 0
                        )
                            return

                        const hashFile = hash({
                            chunkName: key,
                            chunkContent: chunk,
                        })

                        if (
                            fs.existsSync(
                                `${config.cacheDir}/chunk/chunk.${hashFile}.mjs`
                            )
                        )
                            return

                        const originalChunk = chunk

                        const chunkExportedVariables: string[] = []
                        const globalizeChunk = chunk
                            .split('\n')
                            .map((line) => {
                                if (line.startsWith('var ')) {
                                    chunkExportedVariables.push(
                                        line
                                            .split('=')[0]
                                            .replace('var ', '')
                                            .trim()
                                    )
                                    return line.replace('var ', 'export var ')
                                }
                                return line
                            })
                            .join('\n')

                        const importSentence = `import { ${chunkExportedVariables.join(', \n')} } from '/chunk/chunk.${hashFile}.mjs';`

                        resultContent = resultContent.replace(
                            originalChunk,
                            `${importSentence}\n`
                        )

                        fs.outputFileSync(
                            `${config.cacheDir}/chunk/chunk.${hashFile}.mjs`,
                            topCommonCodeFile +
                                '\n' +
                                importsToShare.join('\n') +
                                '\n\n' +
                                globalizeChunk
                        )

                        importsToShare.push(importSentence)
                    }
                )

                fs.writeFileSync(
                    `${config.cacheDir}/client.${hashKey}.mjs`,
                    resultContent
                )
            })
        },
    }
}
