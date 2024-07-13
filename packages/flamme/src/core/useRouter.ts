import { H3Event } from 'h3'

export const useRouter = (event: H3Event) => {
    return event.context.router
}