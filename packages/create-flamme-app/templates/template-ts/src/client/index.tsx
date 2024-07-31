import React from 'react'
import { FlammeAssets } from 'flamme/client'

import './index.css'
import styles from './style.module.css'

export default function Index() {
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
                <div className={styles.container}>
                    <h1 className={styles.flammeTitle}>
                        Hello, Welcome to Flamme!
                    </h1>
                    <p className={styles.flammeText}>
                        This is a template for creating a new Flamme app with
                        TypeScript.
                    </p>
                </div>
            </body>
        </html>
    )
}
