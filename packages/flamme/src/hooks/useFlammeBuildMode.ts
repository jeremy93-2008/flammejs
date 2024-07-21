export function useFlammeBuildMode() {
    return [
        globalThis.buildMode as 'development' | 'production',
        (mode: 'development' | 'production') => {
            globalThis.buildMode = mode
        },
    ] as const
}
