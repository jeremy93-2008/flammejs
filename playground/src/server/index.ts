interface FlammeEntryParams {
    App: any
    event: any
    router: any
}

export default function entry(params: FlammeEntryParams) {
    console.log('Hello, Flamme! From server entrypoint.')
    return 'Hello, Flamme!'
}
