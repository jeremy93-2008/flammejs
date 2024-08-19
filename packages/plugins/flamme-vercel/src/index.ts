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
        version: '0.0.1-alpha.33',
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
        const root = config.root
        const serverBaseUrl = config.serverBaseUrl
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

        // We remove the .vercel/output directory if it exists, and we kee the .vercel to keep project settings
        if (existsSync('.vercel/output')) {
            fsExtra.removeSync('.vercel/output')
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
            routes: [
                {
                    handle: 'filesystem',
                },
                {
                    src: `${serverBaseUrl}`,
                    dest: '/',
                },
                {
                    src: `${serverBaseUrl}/(.*)`,
                    dest: '/',
                },
                {
                    src: `${root}(.*)`,
                    dest: '/',
                },
                {
                    src: `${root}`,
                    dest: `/`,
                },
            ],
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

        // We create the index files for the serverless, compatible with Vercel
        fsExtra.writeFileSync(
            '.vercel/output/functions/index.func/index.js',
            `
            const { createServer } = require('node:http')
            const { toNodeListener } = require('h3')
            const server = require('./server.${hashKey}.js')
            
            const app = server.default

            module.exports = createServer(toNodeListener(app))
        `
        )

        // We create the vc config file for Vercel
        writeJSONSync('.vercel/output/functions/index.func/.vc-config.json', {
            handler: `index.js`,
            runtime: 'nodejs20.x',
            launcherType: 'Nodejs',
            supportsResponseStreaming: true,
        })

        // We copy the server files to the functions directory
        fsExtra.copySync(
            path.resolve(currentDirectory, buildDir),
            '.vercel/output/functions/index.func'
        )

        // We copy node_modules dependencies needed for our index script to power up our server in the vercel server to the functions directory
        const dependencies = ['h3']
        for (const dep of dependencies) {
            // We read the package.json file to get the dependencies
            const packageJSON = fsExtra.readJSONSync(
                path.resolve(
                    currentDirectory,
                    'node_modules',
                    dep,
                    'package.json'
                )
            )
            // We add all the possible dependencies to the list
            if (packageJSON.dependencies) {
                Object.keys(packageJSON.dependencies).forEach((d) => {
                    dependencies.push(d)
                })
            }
            // We copy the current dependency iteration to the functions directory
            fsExtra.copySync(
                path.resolve(currentDirectory, 'node_modules', dep),
                `.vercel/output/functions/index.func/node_modules/${dep}`
            )
        }

        console.log(
            formatShortDate(new Date()),
            colors.white('[flamme-vercel]'),
            'Vercel output created!'
        )
    },
})

runMain(main).then()
