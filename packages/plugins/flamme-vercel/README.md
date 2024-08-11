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

### Deploy to Vercel

To deploy your Flamme project to Vercel, you can use the Vercel CLI. First, install the Vercel CLI globally:

```bash
npm install -g vercel
```

Then, deploy your project using the following command:

```bash
vercel
```

This will deploy your project to Vercel and provide you with a unique URL for your application.


## License
This project is licensed under the MIT License. See the [LICENSE](../../../LICENSE) file for details.
