export function isSSR() {
    return typeof window === 'undefined' && typeof global !== 'undefined'
}
