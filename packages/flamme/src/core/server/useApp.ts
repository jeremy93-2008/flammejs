import { H3Event, type App } from 'h3'

export const useApp = (event: H3Event): App => {
    if (typeof window !== 'undefined')
        throw new Error('This hook is only available on the server')
    return event.context.app
}
