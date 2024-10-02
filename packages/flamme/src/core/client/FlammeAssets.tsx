import React from 'react'
import { useFlammeAssets } from './useFlammeAssets'

interface IFlammeAssetsProps {
    noModulePreload?: boolean
    noScript?: boolean
    noStyle?: boolean
}

export function FlammeAssets(props: IFlammeAssetsProps) {
    const { noModulePreload, noScript, noStyle } = props
    const assetsMap = useFlammeAssets()
    return (
        <>
            {!noModulePreload && (
                <>
                    <link
                        rel="modulepreload"
                        href={assetsMap['client.js']}
                    ></link>
                </>
            )}
            {!noScript && (
                <script
                    type="module"
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
