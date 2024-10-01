import React from 'react'
import { H3Event } from 'h3'

import {
    createStaticHandler,
    createStaticRouter,
    type StaticHandlerContext,
} from 'react-router-dom/server.js'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'

import { isSSR } from '../client/isSSR'
import { createFetchRequest } from '../../utils/createFetchRequest'

interface IDefineFlammeRoutesOptions {
    layout: Omit<
        RouteObject,
        'children' | 'element' | 'Component' | 'path' | 'index'
    >
}

export function defineFlammeRoutes(
    routes: RouteObject[],
    options?: IDefineFlammeRoutesOptions
) {
    return async (event: H3Event, EntrypointClient: React.ReactNode) => {
        const finalRoutes: RouteObject[] = [
            {
                element: EntrypointClient,
                children: routes,
                errorElement: options?.layout.errorElement ?? EntrypointClient,
                hasErrorBoundary: options?.layout.hasErrorBoundary ?? false,
                action: options?.layout.action,
                caseSensitive: options?.layout.caseSensitive,
                ErrorBoundary: options?.layout.ErrorBoundary,
                handle: options?.layout.handle,
                HydrateFallback: options?.layout.HydrateFallback,
                hydrateFallbackElement: options?.layout.hydrateFallbackElement,
                shouldRevalidate: options?.layout.shouldRevalidate,
                loader: options?.layout.loader,
                lazy: options?.layout.lazy,
                id: options?.layout.id,
            },
        ]

        if (isSSR() && event) {
            const handler = createStaticHandler(finalRoutes)
            const ctx = await handler.query(await createFetchRequest(event))
            return {
                router: createStaticRouter(
                    finalRoutes,
                    ctx as StaticHandlerContext
                ),
                ctx: ctx as StaticHandlerContext,
            }
        } else if (!isSSR() && !event) {
            return { router: createBrowserRouter(finalRoutes), ctx: {} }
        } else {
            if (isSSR() && !event) {
                throw new Error('SSR route must be called with a request')
            }
            if (!isSSR() && event) {
                throw new Error('CSR route must be called without a request')
            }
            throw new Error('Unknown route type')
        }
    }
}
