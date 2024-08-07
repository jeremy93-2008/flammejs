import React from 'react'
import { useFlammeAssets } from './useFlammeAssets'

export function FlammeAssets() {
    const assetsMap = useFlammeAssets()
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
