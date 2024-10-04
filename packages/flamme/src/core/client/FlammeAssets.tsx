import React from 'react'
import { useFlammeAssets } from './useFlammeAssets'

import 'react-refresh'

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
            <script
                type="module"
                dangerouslySetInnerHTML={{
                    __html:
                        "  import { require_react_refresh_runtime_development as requireRefreshRuntime } from 'http://localhost:3000/chunk/react-refresh-runtime.dVRdB6Rzmo.mjs'\n" +
                        '  requireRefreshRuntime().injectIntoGlobalHook(window)\n' +
                        '  window.$RefreshReg$ = () => {}\n' +
                        '  window.$RefreshSig$ = () => (type) => type\n' +
                        '  window.__vite_plugin_react_preamble_installed__ = true',
                }}
            ></script>
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
