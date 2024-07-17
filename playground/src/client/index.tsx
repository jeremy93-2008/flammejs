import React from 'react'

export default function Index() {
    return (
        <html>
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="stylesheet" href="/styles.css"></link>
                <title>My app</title>
            </head>
            <body>
                <div>
                    <h1>Hello, Flamme!</h1>
                    <p>
                        This is a React component in{' '}
                        <code>src/client/index.tsx</code>.
                    </p>
                    <p>
                        It is rendered SSR by the server and hydrated by the
                        client.
                    </p>
                </div>
            </body>
        </html>
    )
}
