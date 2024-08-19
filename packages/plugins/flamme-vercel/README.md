<p align="center">
<img src="https://raw.githubusercontent.com/jeremy93-2008/flammejs/main/images/flamme.png" alt="Flamme Icon" width="150px">
</p>

# 🔥 [Plugin] Flamme Vercel

This plugin is used to structure and make ready your Flamme project to Vercel.

## Installation

```bash
npm install flamme-vercel
```

## Usage

```bash
flamme-vercel
```
This command will create .vercel folder based on the build output folder in your project.

#### Parameters

- noBuild: Do not build the project, and take the output folder of the config flamme as it is.
- noDeploy: Do not deploy the project to Vercel.

#### Deployment

By default, the plugin will deploy the project to Vercel. If you want to deploy the project to Vercel, you need to have an account on Vercel and have the Vercel CLI installed on your machine.
    
```bash
npm install -g vercel
```

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
