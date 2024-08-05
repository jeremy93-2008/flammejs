import colors from 'colors'
import { defineCommand, runMain } from 'citty'
import { formatShortDate } from './utils/formatShortDate'
import { spawnSync } from 'child_process'
import { mkdirSync } from 'fs'
import { useFlammeConfig } from './hooks/useFlammeConfig'

const main = defineCommand({
    meta: {
        name: 'flamme-vercel',
        description: 'Deploy your Flamme app to Vercel',
        version: '0.0.1-alpha.5',
    },
    args: {
        noBuild: {
            type: 'boolean',
            description: 'Skip the build step',
            default: false,
        },
        configFile: {
            type: 'string',
            description: 'Path to the Flamme config file',
        },
    },
    run: async ({ args }) => {
        const currentDirectory = process.cwd()
        const { config } = await useFlammeConfig({
            currentDirectory,
            configFile: args.configFile,
        })
        let buildDir = config.buildDir

        if (!args.noBuild) {
            console.log(
                formatShortDate(new Date()),
                colors.white('[flamme-vercel]'),
                'Building your Flamme app...'
            )
            spawnSync('flamme build --buildDir=.build', {
                shell: true,
                stdio: 'inherit',
            })
            buildDir = '.build'
        }

        console.log(
            formatShortDate(new Date()),
            colors.white('[flamme-vercel]'),
            'Preparing your Flamme app to Vercel...'
        )

        mkdirSync('.vercel/output', { recursive: true })
    },
})

runMain(main).then()
