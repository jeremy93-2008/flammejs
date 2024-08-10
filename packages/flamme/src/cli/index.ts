#!/usr/bin/env node

import { defineCommand, runMain } from 'citty'

import devCommand from './commands/dev'
import buildCommand from './commands/build'
import startCommand from './commands/start'

import { loadEnv } from './env'

loadEnv().then()

const main = defineCommand({
    meta: {
        name: 'flamme',
        version: '0.0.1-alpha.6',
        description: 'Flamme CLI',
    },
    subCommands: {
        dev: devCommand,
        build: buildCommand,
        start: startCommand,
    },
})

runMain(main).then()
