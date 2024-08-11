#!/usr/bin/env node
import colors from 'colors'
import { defineCommand, runMain } from 'citty'
import { formatShortDate } from './utils/formatShortDate'
import { spawnSync } from 'child_process'
import { mkdirSync } from 'fs'
import { useFlammeConfig } from './hooks/useFlammeConfig'
import * as path from 'node:path'
import * as fsExtra from 'fs-extra'
import { existsSync, writeJSONSync } from 'fs-extra'

const defaultBuildFolderName = '.flamme'

const main = defineCommand({
    meta: {
        name: 'flamme-vercel',
        description: 'Deploy your Flamme app to Vercel',
        version: '0.0.1-alpha.9',
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
            buildDir = defaultBuildFolderName
            spawnSync(`flamme build --buildDir=${buildDir}`, {
                shell: true,
                stdio: 'inherit',
            })
        }

        console.log(
            formatShortDate(new Date()),
            colors.white('[flamme-vercel]'),
            'Preparing your Flamme app to Vercel...'
        )

        if (existsSync('.vercel')) {
            fsExtra.removeSync('.vercel')
        }

        console.log(
            formatShortDate(new Date()),
            colors.white('[flamme-vercel]'),
            'Creating the Vercel structure...'
        )

        // We create the base structure for Vercel
        mkdirSync('.vercel/output', { recursive: true })
        // We create the static directory
        mkdirSync('.vercel/output/static', { recursive: true })
        // We create the functions directory
        mkdirSync('.vercel/output/functions', { recursive: true })

        console.log(
            formatShortDate(new Date()),
            colors.white('[flamme-vercel]'),
            'Copying files...'
        )

        // We create the vercel config file
        writeJSONSync('.vercel/output/config.json', {
            version: 3,
        })

        //We copy the build directory to the static directory, but no server files
        fsExtra.copySync(
            path.resolve(currentDirectory, buildDir),
            '.vercel/output/static',
            {
                filter: (src, dest) => {
                    return !src.includes('server')
                },
            }
        )

        // We create the single function directory for Vercel compatibility
        mkdirSync('.vercel/output/functions/index.func', { recursive: true })

        // Read the manifest file to get the hash
        const buildManifest = await import(
            path.resolve(currentDirectory, buildDir, '_buildManifest.js')
        )
        const hashKey = buildManifest.default.hashKey

        // We create the vc config file for Vercel
        writeJSONSync('.vercel/output/functions/index.func/.vc-config.json', {
            handler: `server.${hashKey}.js`,
            runtime: 'nodejs',
            launcherType: 'Nodejs',
            supportsResponseStreaming: true,
        })

        // We copy the server files to the functions directory
        fsExtra.copySync(
            path.resolve(currentDirectory, buildDir),
            '.vercel/output/functions/index.func'
        )

        console.log(
            formatShortDate(new Date()),
            colors.white('[flamme-vercel]'),
            'Vercel structure created!'
        )
    },
})

runMain(main).then()
