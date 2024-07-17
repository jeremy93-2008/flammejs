import { defineCommand, runMain } from 'citty'
import devCommand from './commands/dev'
import buildCommand from './commands/build'

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
