import { getRequestHeaders, getRequestURL, H3Event, readBody } from 'h3'

export async function createFetchRequest(event: H3Event) {
    let controller = new AbortController()
    event.node.res.on('close', () => controller.abort())

    let headers = new Headers()

    for (let [key, values] of Object.entries(getRequestHeaders(event))) {
        if (values) {
            if (Array.isArray(values)) {
                for (let value of values) {
                    headers.append(key, value)
                }
            } else {
                headers.set(key, values as string)
            }
        }
    }

    let init = {
        method: event.node.req.method,
        headers,
        signal: controller.signal,
    } as RequestInit

    if (event.node.req.method !== 'GET' && event.node.req.method !== 'HEAD') {
        init.body = await readBody(event)
    }

    return new Request(getRequestURL(event), init)
}
