import { defineCommand, runMain } from 'citty'
import devCommand from './commands/dev'
import buildCommand from './commands/build'
import { loadEnv } from './env'

loadEnv().then()

const main = defineCommand({
    meta: {
        name: 'flamme',
        version: '1.0.0',
        description: 'Flamme CLI',
    },
    subCommands: {
        dev: devCommand,
        build: buildCommand,
    },
})

runMain(main).then()
