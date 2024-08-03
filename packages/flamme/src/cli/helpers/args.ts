import { type ArgDef } from 'citty'
import { IFlammeConfigFile } from '../../hooks/useFlammeConfig'
export type ArgsKey = keyof IFlammeConfigFile

export const args: Record<ArgsKey | 'config' | string, ArgDef> = {
    root: {
        type: 'string',
        description: 'Base url',
        valueHint: '/',
    },
    base: {
        type: 'string',
        description: 'Base path',
        valueHint: './',
    },
    serverBaseUrl: {
        type: 'string',
        description: 'Server base url',
        valueHint: '/api',
    },
    clientDir: {
        type: 'string',
        description: 'Client directory',
        valueHint: 'src/client',
    },
    serverDir: {
        type: 'string',
        description: 'Server directory',
        valueHint: 'src/server',
    },
    buildDir: {
        type: 'string',
        description: 'Build directory',
        valueHint: 'dist',
    },
    publicDir: {
        type: 'string',
        description: 'Public directory',
        valueHint: 'public',
    },
    cacheDir: {
        type: 'string',
        description: 'Cache directory',
        valueHint: '.flamme',
    },
    devServerPort: {
        type: 'string',
        description: 'Development server port',
        valueHint: '3000',
    },
    hmrServerPort: {
        type: 'string',
        description: 'HMR server port',
        valueHint: '3001',
    },
    envPublicPrefix: {
        type: 'string',
        description: 'Env public prefix',
        valueHint: 'PUBLIC_',
    },
    config: {
        type: 'string',
        description: 'Config file path',
        valueHint: 'flamme.config.js',
    },
}
