import React from 'react'

export function FlammeAssets() {
    const assetsMap = (globalThis as any).assetsMap
    return (
        <>
            <script
                type="text/javascript"
                src={assetsMap['client.js']}
                defer
            ></script>
            <link rel="stylesheet" href={assetsMap['client.css']}></link>
        </>
    )
}
