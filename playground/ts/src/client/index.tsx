import React, { useState } from 'react'
import { FlammeAssets } from 'flamme/client'
// @ts-ignore
import styles from './styles.module.css'
import './styles.css'
import './estilo.scss'
import './lestyle.less'
import './style.styl'

import json from './file.json'

// @ts-ignore
import pikachu from './assets/pikachu.png'
import { Outlet } from 'react-router-dom'

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
                    <h1 className="text-3xl">Hello, Flamme!</h1>
                    <p className={styles.hello}>Counter: {counter}</p>
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
                    <Outlet />
                    <p>{JSON.stringify(json, undefined, 4)}</p>
                    <img src={pikachu} alt="pikachu" />
                    <img src="./marek.jpg" alt="marek" />
                </div>
            </body>
        </html>
    )
}
