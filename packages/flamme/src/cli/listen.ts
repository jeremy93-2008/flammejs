import { listen } from 'listhen'
import { toNodeListener } from 'h3'
import colors from 'colors/safe'
import { formatShortDate } from '../utils/formatShortDate'

export async function listenServer({
    buildServerPath,
    port,
    reload,
}: {
    buildServerPath: string
    port: number
    reload?: boolean
}) {
    // @ts-ignore
    const import_app = await import(buildServerPath)

    const listener = await listen(toNodeListener(import_app.default.default), {
        port,
        _entry: buildServerPath,
        showURL: !reload,
    })

    if (reload)
        console.log(
            `${formatShortDate(new Date())} ${colors.red('[flamme]')} 🔄 Server rebuild at`,
            colors.blue(listener.url)
        )

    return listener
}
