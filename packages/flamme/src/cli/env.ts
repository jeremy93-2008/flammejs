import { useFlammeConfig } from '../hooks/useFlammeConfig'
import 'dotenv/config'

declare global {
    var buildMode: 'development' | 'production'
    var env: Record<string, string>
    var envPublic: Record<string, string>
}

export async function loadEnv() {
    globalThis.envPublic = await getPublicEnv()
    globalThis.env = await getEnv()
}

export async function getEnv() {
    return structuredClone(
        Object.keys(process.env).reduce(
            (acc, key) => {
                ;(acc as any)[key] = `\"${process.env[key]}\"`
                return acc
            },
            {} as Record<string, string>
        )
    )
}

export async function getPublicEnv() {
    const { config } = await useFlammeConfig()
    return structuredClone(
        Object.keys(process.env).reduce(
            (acc, key) => {
                if (key.startsWith(config.envPublicPrefix)) {
                    ;(acc as any)[key] = `${process.env[key]}`
                }
                return acc
            },
            {} as Record<string, string>
        )
    )
}
