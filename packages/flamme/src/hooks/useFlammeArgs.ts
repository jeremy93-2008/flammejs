import { ArgsKey } from '../cli/helpers/args'

declare global {
    var flammeArgs: Partial<Record<ArgsKey | string, string>>
}

export function useFlammeArgs() {
    return [
        globalThis.flammeArgs,
        (args: Partial<Record<ArgsKey | string, string>>) => {
            globalThis.flammeArgs = args
        },
    ] as const
}
