import { Plugin } from 'esbuild'
import { useFlammeConfig } from '../../hooks/useFlammeConfig'
import { useFlammeBuildMode } from '../../hooks/useFlammeBuildMode'
import * as fs from 'fs-extra'
import { hash } from 'ohash'
import path from 'node:path'

/**
 * A plugin for esbuild to manual chunk modules by name. This plugin is for browser environment.
 */
export async function esbuildPluginManualChunkBrowser(
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
                        (acc, val, idx) => {
                            const [importLine, ...rest] = val.split('\n')
                            acc[importLine + '___' + idx] = rest.join('\n')
                            return acc
                        },
                        {} as Record<string, string>
                    )

                const topCommonCodeFile = Object.values(
                    separatedChunkByFiles
                )[0]

                const importsToShare: {
                    line: string
                    imports: string[]
                    filename: string
                    timestamp: number
                }[] = []

                Object.entries(separatedChunkByFiles).forEach(
                    ([keyWithIdx, chunk], idx) => {
                        const key = keyWithIdx.split('___')[0]
                        if (idx == 0) return

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
                        const exportedChunk = chunk
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
                                } else if (line.startsWith('function ')) {
                                    chunkExportedVariables.push(
                                        line
                                            .split('(')[0]
                                            .replace('function ', '')
                                    )
                                    return line.replace(
                                        'function ',
                                        'export function '
                                    )
                                } else if (line.startsWith('async function ')) {
                                    chunkExportedVariables.push(
                                        line
                                            .split('(')[0]
                                            .replace('async function ', '')
                                    )
                                    return line.replace(
                                        'async function ',
                                        'export async function '
                                    )
                                }
                                return line
                            })
                            .join('\n')

                        const friendlyName = path.basename(key).split('.')[0]
                        const timestamp = Date.now()

                        const importSentence = `import { ${chunkExportedVariables.join(', \n')} } from '/chunk/${friendlyName}.${hashFile}.mjs?timestamp=${timestamp}';`

                        resultContent = resultContent.replace(
                            originalChunk,
                            `${importSentence}\n`
                        )

                        fs.outputFile(
                            `${config.cacheDir}/chunk/${friendlyName}.${hashFile}.mjs`,
                            `var __create = Object.create;\n` +
                                topCommonCodeFile +
                                '\n' +
                                importsToShare
                                    .map((importObj) => ({
                                        ...importObj,
                                        imports: importObj.imports.filter(
                                            (imp) => exportedChunk.includes(imp)
                                        ),
                                    }))
                                    .filter(
                                        (importObj) =>
                                            importObj.imports.length > 0
                                    )
                                    .map(
                                        (importObj) =>
                                            `import { ${importObj.imports.join(', ')} } from '/chunk/${importObj.filename}?timestamp=${importObj.timestamp}';`
                                    )
                                    .join('\n') +
                                '\n\n' +
                                exportedChunk
                        )

                        importsToShare.push({
                            line: importSentence,
                            imports: chunkExportedVariables,
                            filename: `${friendlyName}.${hashFile}.mjs`,
                            timestamp,
                        })
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