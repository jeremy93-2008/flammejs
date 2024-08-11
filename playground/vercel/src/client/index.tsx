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
                <title>Flamme app</title>
                <FlammeAssets />
            </head>
            <body>
                <div className={styles.container}>
                    <img
                        className={styles.flammeImage}
                        src="./flamme.png"
                        alt="Flamme logo"
                    />
                    <h1 className={styles.flammeTitle}>
                        Hello, Welcome to Flamme!
                    </h1>
                    <p className={styles.flammeText}>
                        This is a template for creating a new Flamme app with
                        TypeScript.
                    </p>
                    <p className={styles.flammeText2}>
                        To get started, edit{' '}
                        <code className={styles.flammeCode}>
                            src/client/index.tsx
                        </code>{' '}
                        and save to reload.
                    </p>
                </div>
            </body>
        </html>
    )
}
