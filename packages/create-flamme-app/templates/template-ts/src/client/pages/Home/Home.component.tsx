import React from 'react'
import styles from './home.module.css'

export function Home() {
    const [count, setCount] = React.useState(0)
    return (
        <div className={styles.container}>
            <img
                className={styles.flammeImage}
                src="/flamme.png"
                alt="Flamme logo"
            />
            <h1 className={styles.flammeTitle}>Hello, Welcome to Flamme!</h1>
            <p className={styles.flammeText}>
                This is a template for creating a new Flamme app with
                TypeScript.
            </p>
            <p className={styles.flammeText2}>
                To get started, edit{' '}
                <code className={styles.flammeCode}>src/client/index.tsx</code>{' '}
                and save to reload.
            </p>
            <p className={styles.flammeCounter}>
                <span className={styles.flammeCounterText}>
                    Counter: <span>{count}</span>
                </span>
                <button onClick={() => setCount(count + 1)}>Increment</button>
            </p>
        </div>
    )
}
