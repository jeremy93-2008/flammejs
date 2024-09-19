import { sync as resolveSync } from 'resolve'

export function resolveDirModule(module: string) {
    const pathFile = resolveSync(module, { basedir: process.cwd() })
    if (!pathFile) throw new Error(`Module ${module} not found`)
    const splitPathFiles = pathFile.split('node_modules')
    return `${splitPathFiles[0]}node_modules/${splitPathFiles[1].split('/')[1]}`
}
