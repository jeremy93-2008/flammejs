import { H3Event } from 'h3'

export const useApp = (event: H3Event) => {
    if (typeof window !== 'undefined')
        return 'This hook is only available on the server'
    return event.context.app
}
