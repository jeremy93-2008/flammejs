import { listen } from 'listhen'
import { toNodeListener } from 'h3'
import colors from 'colors/safe'
import { formatShortDate } from '../utils/formatShortDate'

export async function listenServer({
    buildServerPath,
    port,
    reload,
    open,
    isProduction,
    isPublic,
    qr,
    hasTunnel,
}: {
    buildServerPath: string
    port: number
    reload?: boolean
    open?: boolean
    isProduction?: boolean
    isPublic?: boolean
    qr?: boolean
    hasTunnel?: boolean
}) {
    const import_app = await import(buildServerPath)

    if (!reload && !isPublic && qr) {
        console.log(
            `${formatShortDate(new Date())} ${colors.red('[flamme]')} ${colors.yellow('[WARN] QR code is only available whether the server is public')}`
        )
    }

    const listener = await listen(toNodeListener(import_app.default.default), {
        port,
        _entry: buildServerPath,
        showURL: !reload, // show url only if it's the first time
        open, // open browser
        isProd: isProduction,
        public: isPublic,
        qr,
        tunnel: hasTunnel,
    })

    if (reload)
        console.log(
            `${formatShortDate(new Date())} ${colors.red('[flamme]')} 🔄 Server rebuild at`,
            colors.blue(listener.url)
        )

    return listener
}
