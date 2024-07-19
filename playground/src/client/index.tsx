import React, { useState } from 'react'
import { FlammeAssets } from 'flamme/client'
import { hello } from './styles.modules.css'
import './styles.css'

export default function Index() {
    const [counter, setCounter] = useState(0)
    return (
        <html>
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <title>My app</title>
                <FlammeAssets />
            </head>
            <body>
                <div className="app">
                    <h1 className="text-3xl">Hello, Flamme 2!</h1>
                    <p className={hello}>Counter: {counter}</p>
                    <button
                        className="bg-blue-300 px-3 py-1 rounded-md"
                        onClick={() => setCounter(counter + 1)}
                    >
                        Increment
                    </button>
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
