interface IOpenOptions {
    port: number
}

export async function openBrowser(options: IOpenOptions) {
    const { port } = options
    const openModule = await import('open')
    await openModule.default(`http://localhost:${port}`)
}
