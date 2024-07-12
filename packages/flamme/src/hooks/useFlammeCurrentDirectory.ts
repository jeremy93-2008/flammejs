export async function useFlammeCurrentDirectory() {
    return { currentDirectory: process.cwd() }
}
