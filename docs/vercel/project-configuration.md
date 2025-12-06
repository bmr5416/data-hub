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

## Environment Variables

### Required for Production

| Variable | Purpose | Required | Source |
|----------|---------|----------|--------|
| `SUPABASE_URL` | Database API URL | Always | Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin access | Always | Dashboard → Settings → API |
| `SUPABASE_JWT_SECRET` | JWT signature verification (HS256) | If tokens use HS256* | Dashboard → Settings → API → JWT Secret |
| `VITE_SUPABASE_URL` | Client-side API URL | Always | Same as SUPABASE_URL |
| `VITE_SUPABASE_ANON_KEY` | Client-side anon key | Always | Dashboard → Settings → API |

*Supabase Cloud issues HS256-signed tokens by default. The auth middleware auto-detects the algorithm from the JWT header. If your project uses ES256, the JWKS endpoint is used instead (no secret needed).

### Adding via CLI

For secrets with special characters (`+`, `/`, `=`), use `printf` to avoid encoding issues:

```bash
# Correct way (preserves special characters)
printf '%s' 'your-secret-with+special/chars==' | npx vercel env add SUPABASE_JWT_SECRET production

# Standard variables
npx vercel env add SUPABASE_URL production
# Enter value when prompted
```

### Verifying Configuration

```bash
# List all production variables
npx vercel env ls production

# Pull to local .env for testing
npx vercel env pull .env.local
```

### Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid token" / "invalid signature" | JWT secret mismatch or encoding issue | Re-add secret using `printf '%s' 'SECRET' \| npx vercel env add ...` |
| "Server authentication not configured" | Missing `SUPABASE_JWT_SECRET` (local) | Copy JWT Secret from `supabase status` to `.env` |
| "Token verification failed" | JWKS endpoint unreachable (production) | Check `SUPABASE_URL` is correct, verify network access |
| "No authorization token provided" | Client not sending Bearer token | Check frontend auth context and API interceptors |
| 401 errors after deploy | Old serverless function cache | Force redeploy: `npx vercel --prod --force` |
