import { H3Event } from 'h3'

export const useRouter = (event: H3Event) => {
    if (typeof window !== 'undefined')
        return 'This hook is only available on the server'
    return event.context.router
}
