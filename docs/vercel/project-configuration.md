# Vercel Project Configuration Reference

> Scraped from: https://vercel.com/docs/projects/project-configuration

## Key Properties for Data Hub

### outputDirectory
**Type:** `string | null`

The `outputDirectory` property can be used to override the Output Directory in the Project Settings dashboard for a given deployment.

```json
{
  "outputDirectory": "build"
}
```

**Important:** This value overrides the Output Directory in Project Settings. However, if Project Settings has an explicit value set, it may take precedence.

### buildCommand
**Type:** `string | null`

Override the Build Command. For monorepos, this runs from the root directory.

```json
{
  "buildCommand": "npm run build"
}
```

### framework
**Type:** `string | null`

Override the Framework Preset. Use `null` to select "Other" (no framework auto-detection).

```json
{
  "framework": null
}
```

**Critical for monorepos:** Setting `"framework": null` prevents Vercel from auto-detecting frameworks and applying unwanted defaults.

### rewrites
For SPA routing, redirect all non-API routes to index.html:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### functions
Configure serverless functions:

```json
{
  "functions": {
    "api/index.js": {
      "maxDuration": 10,
      "includeFiles": "server/**"
    }
  }
}
```

## Monorepo Deployment

For monorepos with separate client/server directories:

1. **Root Directory**: Keep blank (deploy from root)
2. **Build Command**: `npm run build` (delegates to workspace)
3. **Output Directory**: Point to where client builds (e.g., `client/dist` or `dist`)
4. **Framework**: Set to `null` to disable auto-detection

## Common Issues

### "No Output Directory named 'dist' found"

**Cause:** Mismatch between where Vite outputs and where Vercel looks.

**Solutions:**
1. Configure Vite's `build.outDir` to match Vercel's `outputDirectory`
2. OR update `vercel.json` outputDirectory to match Vite's output location
3. Check Project Settings in Vercel Dashboard aren't overriding vercel.json

### Framework Detection Conflicts

If Vercel auto-detects the wrong framework:
- Set `"framework": null` in vercel.json
- This is critical for Express + Vite monorepos
