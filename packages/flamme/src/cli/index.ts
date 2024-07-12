import { defineCommand, runMain } from 'citty'
import devCommand from './commands/dev'

const main = defineCommand({
    meta: {
        name: 'flamme',
        version: '1.0.0',
        description: 'Flamme CLI',
    },
    subCommands: {
        dev: devCommand,
    },
})

runMain(main).then()
