import React from 'react'
import { defineFlammeRoutes } from 'flamme'
import { Home } from './pages/Home'

/**
 * Define the routes of the application
 */
export default defineFlammeRoutes([
    {
        path: '/',
        element: <Home />,
    },
])
