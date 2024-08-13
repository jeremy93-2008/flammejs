import React from 'react'
import { useFlammeAssets } from './useFlammeAssets'

interface IFlammeAssetsProps {
    noScript?: boolean
    noStyle?: boolean
}

export function FlammeAssets(props: IFlammeAssetsProps) {
    const { noScript, noStyle } = props
    const assetsMap = useFlammeAssets()
    return (
        <>
            {!noScript && (
                <script
                    type="text/javascript"
                    src={assetsMap['client.js']}
                    defer
                ></script>
            )}
            {!noStyle && (
                <link rel="stylesheet" href={assetsMap['client.css']}></link>
            )}
        </>
    )
}
