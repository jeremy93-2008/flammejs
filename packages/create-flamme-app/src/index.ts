#!/usr/bin/env node
import * as fs from 'node:fs'
import * as fsExtra from 'fs-extra'
import * as path from 'node:path'
import * as child from 'node:child_process'
import { defineCommand, runMain, showUsage } from 'citty'
import colors from 'colors'

const main = defineCommand({
    meta: {
        name: 'create-flamme-app',
        version: '0.0.1-alpha.33',
        description: 'Create Flamme App',
    },
    args: {
        projectName: {
            type: 'positional',
            description: 'Name of the project',
            required: true,
        },
        template: {
            type: 'string',
            description: 'Template type. Default: ts. Options: ts, js',
            default: 'ts',
        },
        overwrite: {
            type: 'boolean',
            description: 'Overwrite existing directory',
            default: false,
        },
    },
    run: async ({ args }) => {
        const { projectName, template = 'ts', overwrite } = args

        // Validate project name, based on npm package name rules
        const regex = new RegExp(
            '^(?:@(?:[a-z0-9-*~][a-z0-9-*._~]*)?/)?[a-z0-9-~][a-z0-9-._~]*$',
            'gm'
        )

        if (!regex.test(projectName)) {
            console.error(
                colors.red('[create-flamme-app]'),
                colors.red('Invalid project name')
            )
            await showUsage(main)
            process.exit(1)
        }

        if (!['ts', 'js'].includes(template)) {
            console.error(
                colors.red('[create-flamme-app]'),
                colors.red('Invalid template type')
            )
            await showUsage(main)
            process.exit(1)
        }

        const currentDirectory = process.cwd()

        if (fs.existsSync(path.join(currentDirectory, projectName))) {
            if (
                fs.readdirSync(path.join(currentDirectory, projectName))
                    .length > 0 &&
                !overwrite
            ) {
                console.error(
                    colors.red('[create-flamme-app]'),
                    colors.red(`Directory is not empty`)
                )
                process.exit(1)
            }
            console.log(
                colors.red('[create-flamme-app]'),
                colors.yellow(
                    `⚠️ Overwriting existing directory. ${colors.red(projectName)}`
                )
            )
            fsExtra.removeSync(path.join(currentDirectory, projectName))
        }

        console.log(
            colors.red('[create-flamme-app]'),
            `🔥 Creating Flamme App: ${colors.green(projectName)}`
        )
        console.log(
            colors.red('[create-flamme-app]'),
            `📄 Template: ${colors.green(template)}`
        )
        fs.mkdirSync(path.join(currentDirectory, projectName))

        const templatePath = path.join(
            __dirname,
            `../templates/template-${template}`
        )

        fsExtra.copySync(templatePath, path.join(currentDirectory, projectName))

        const pkgJSON = JSON.parse(
            fs.readFileSync(
                path.join(currentDirectory, projectName, 'package.json'),
                'utf-8'
            )
        )

        pkgJSON.name = projectName

        fs.writeFileSync(
            path.join(currentDirectory, projectName, 'package.json'),
            JSON.stringify(pkgJSON, null, 2)
        )

        fs.renameSync(
            path.join(currentDirectory, projectName, '_gitignore'),
            path.join(currentDirectory, projectName, '.gitignore')
        )

        console.log(
            colors.red('[create-flamme-app]'),
            `Project created: ${colors.green(
                path.join(currentDirectory, projectName)
            )}`
        )

        child.spawnSync('git', ['init'], {
            cwd: path.join(currentDirectory, projectName),
            stdio: 'ignore',
        })

        console.log(
            colors.red('[create-flamme-app]'),
            colors.green('📙 Git repository initialized')
        )

        console.log(
            colors.red('[create-flamme-app]'),
            colors.yellow('📦 Installing dependencies...')
        )

        child.spawnSync('npm', ['install'], {
            cwd: path.join(currentDirectory, projectName),
            stdio: 'inherit',
        })

        console.log(
            colors.red('[create-flamme-app]'),
            colors.green('✅  Dependencies installed')
        )

        console.log(
            colors.red('[create-flamme-app]'),
            colors.white('Run the following commands to start the app:')
        )
        console.log(`cd ${colors.green(projectName)}`)
        console.log(colors.white('> npm run dev'))
        console.log(colors.rainbow('Happy coding!'))
    },
})

runMain(main).then()
