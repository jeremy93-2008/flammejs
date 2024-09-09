import React from 'react'
import { Outlet } from 'react-router-dom'
import { FlammeAssets } from 'flamme/client'
import './index.css'

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
                <Outlet />
            </body>
        </html>
    )
}
