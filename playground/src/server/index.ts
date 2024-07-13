import { type H3Event, useRouter } from 'flamme'

export default function entry(event: H3Event) {
    console.log('Hello, Flamme! From server entrypoint.')
    console.log(event)
    console.log('Router:', useRouter(event))
    return 'Hello, Flamme!'
}
