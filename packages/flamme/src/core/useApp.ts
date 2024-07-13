import { H3Event } from 'h3'

export const useApp = (event: H3Event) => {
    return event.context.app
}