declare global {
    var cacheDirEntries: Set<string>
}

export function useFlammeCacheDirEntries() {
    if (!globalThis.cacheDirEntries)
        globalThis.cacheDirEntries = new Set<string>()
    return [
        globalThis.cacheDirEntries,
        (cacheDir: string) => {
            if (!globalThis.cacheDirEntries.has(cacheDir))
                globalThis.cacheDirEntries.add(cacheDir)
        },
    ] as const
}
