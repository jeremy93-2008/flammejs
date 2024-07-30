declare global {
    var buildLoader: 'ts' | 'js'
}

export function useFlammeBuildLoader() {
    return [
        globalThis.buildLoader,
        (mode: 'ts' | 'js') => {
            globalThis.buildLoader = mode
        },
    ] as const
}
