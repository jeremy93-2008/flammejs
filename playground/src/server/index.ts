import { type H3Event } from 'flamme/server'

export default function entry(event: H3Event) {
    console.log('server', process.env)
    return 'Hello, Flamme API!'
}
