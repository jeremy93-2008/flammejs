import { H3Event, type Router } from 'h3'

export const useRouter = (event: H3Event): Router => {
    if (typeof window !== 'undefined')
        throw new Error('This hook is only available on the server')
    return event.context.router
}
