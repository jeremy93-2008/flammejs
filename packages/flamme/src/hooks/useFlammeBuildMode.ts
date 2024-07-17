export function useFlammeBuildMode() {
    return [
        process.env.BUILD_MODE as 'development' | 'production',
        (mode: 'development' | 'production') => {
            process.env.BUILD_MODE = mode
        },
    ] as const
}
