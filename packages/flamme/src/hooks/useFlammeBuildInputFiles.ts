declare global {
    var flammeBuildInputFiles: string[]
}

export function useFlammeBuildInputFiles() {
    return [
        globalThis.flammeBuildInputFiles,
        (inputs: string[]) => {
            globalThis.flammeBuildInputFiles = inputs
        },
    ] as const
}
