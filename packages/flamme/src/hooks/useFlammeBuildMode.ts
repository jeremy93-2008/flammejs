declare global {
    var buildMode: 'development' | 'production'
}

export function useFlammeBuildMode() {
    return [
        globalThis.buildMode as 'development' | 'production',
        (mode: 'development' | 'production') => {
            globalThis.buildMode = mode
        },
    ] as const
}
