<p align="center">
<img src="https://raw.githubusercontent.com/jeremy93-2008/flammejs/main/images/flamme.png" alt="Flamme Icon" width="150px">
</p>

# Flamme 🔥

Flamme is a metaframework that leverages the power of the `h3` HTTP server and React for both server-side rendering (SSR) and client-side rendering. This framework aims to provide a seamless development experience for building modern web applications.

## Features

- **H3 HTTP Server**: Utilizes the `h3` server for handling HTTP requests.
- **React SSR**: Supports server-side rendering with React.
- **React Client**: Provides a robust client-side rendering experience with React.
- **Hot Module Replacement (HMR)**: Enables fast development with HMR.
- **TypeScript Support**: Fully supports TypeScript for type-safe development.

## Installation

To install Flamme, you can use npm:

```sh
npm install flamme
```

## Getting Started

### Create a New Project

To create a new Flamme project, run:

```sh
npx create-flamme-app my-new-app
cd my-new-app
npm install
```

### Development Server

To start the development server, use the following command:

```sh
npm run dev
```

This will start the development server with Hot Module Replacement (HMR) enabled.

### Build for Production

To build your application for production, run:

```sh
npm run build
```

### Start the Production Server

After building your application, you can start the production server with:

```sh
npm start
```

## Project Structure

A typical Flamme project structure looks like this:

```
my-new-app/
├── node_modules/
├── public/
├── src/
│   ├── client/
│   │   ├── components/
│   │   └── index.tsx
│   ├── server/
│   │   ├── api/
│   │   └── index.ts
│   └── index.tsx
├── .gitignore
├── package.json
└── flamme.config.ts
```


## Configuration

Flamme can be configured via a `flamme.config.ts` file in the root of your project. Here is an example configuration:

```js
export default defineFlammeConfig({
    root: '/',
    base: './',
    serverBaseUrl: '/api',
    clientDir: 'src/client',
    serverDir: 'src/server',
    buildDir: 'dist',
    publicDir: 'public',
    cacheDir: '.flamme',
    devServerPort: 3000,
    hmrServerPort: 3001,
    envPublicPrefix: 'PUBLIC_',
    css: {
        cssModules: {
            localsConvention: 'camelCase',
            scopeBehaviour: 'local',
            generateScopedName: 'styles__[local]__[hash:base64:6]',
            // for more options, see postcss-modules documentation
        },
        sass: {
            filter: /\.scss$/,
            type: 'css',
            // for more options, see esbuild-sass documentation
        },
        less: {
            // for more options, see esbuild-less documentation}
        },
        stylus: {
            // for more options, see esbuild-stylus documentation}
        },
        tailwindcss: {
            configPath: 'tailwind.config.js',
        },
    },
    esbuild: {
        loglevel: 'warning',
        plugins: [],
    },
});
```

## Commands

### `dev`

Starts the development server.

### `build`

Builds the application for production.

### `start`

Starts the production server.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
