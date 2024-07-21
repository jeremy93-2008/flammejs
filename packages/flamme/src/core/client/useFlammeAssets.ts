declare global {
    var assetsMap: Record<string, string>
}

export function useFlammeAssets() {
    // assets map is set by the server
    return globalThis.assetsMap
}
