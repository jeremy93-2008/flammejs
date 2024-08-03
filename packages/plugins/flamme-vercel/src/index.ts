import { defineCommand, runMain } from 'citty'

const main = defineCommand({
    meta: {
        name: 'flamme-vercel',
        description: 'Deploy your Flamme app to Vercel',
        version: '0.0.1-alpha.5',
    },
    run: async () => {
        console.log('Hello, Flamme Vercel!')
    },
})

runMain(main).then()
