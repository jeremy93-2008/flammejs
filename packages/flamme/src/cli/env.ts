import { useFlammeConfig } from '../hooks/useFlammeConfig'
import 'dotenv/config'

declare global {
    var env: Record<string, string>
    var envPublic: Record<string, string>
}

export async function loadEnv() {
    sanitizeEnv()
    globalThis.envPublic = await getPublicEnv()
    globalThis.env = await getEnv()
}

// Sanitize Environment Variables
export function sanitizeEnv() {
    const json = JSON.stringify(process.env, null, 2)
    const json_text = json.replace(/\\n/g, '')
    process.env = JSON.parse(json_text)
}

// Get Environment Variables and return them as a Record<string, string>
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

// Get Public Environment Variables (prefixed with PUBLIC_) and return them as a Record<string, string> to be used in the browser
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
