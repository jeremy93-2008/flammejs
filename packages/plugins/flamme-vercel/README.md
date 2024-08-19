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

In your `package.json` file, add the following scripts:

```json
{
  "scripts": {
    "vercel-build": "flamme-vercel"
  }
}
```

This command will generate the correct output into the .vercel folder, when Vercel will going to build your site on his page.

## Deploy

Then, you can deploy your project to Vercel as usual:

```bash
vercel
```

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.