import { loadConfig } from 'c12'
import { useFlammeCurrentDirectory } from './useFlammeCurrentDirectory'

export async function useFlammeConfig() {
    const { currentDirectory } = await useFlammeCurrentDirectory()

    return await loadConfig({
        cwd: currentDirectory,
        name: 'flamme',
        dotenv: true,
    })
}
