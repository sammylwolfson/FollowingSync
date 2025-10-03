# Vercel Deployment Guide

This application is configured for deployment on Vercel. Here are the key configuration details:

## Environment Variables Required

Make sure to set these environment variables in your Vercel project:

- `DATABASE_URL` - PostgreSQL connection string (required)
- `NODE_ENV` - Set to "production" (automatically set by Vercel)

## Build Configuration

The app uses a custom build process:
1. `vite build` - Builds the React frontend to `dist/public`
2. `esbuild` - Bundles the Node.js server to `dist/index.js`

## Important: Framework Detection Override

The `vercel.json` includes `"framework": null` to prevent Vercel from auto-detecting this as a Next.js project. This is a custom Node.js + React application, not Next.js.

## Files Added/Modified for Vercel

### `vercel.json`
- Configures the Node.js serverless function
- Routes all traffic to the single entry point
- Includes static files in the function bundle

### Server Changes
- **Port Configuration**: Uses `process.env.PORT` (dynamic) instead of hardcoded port 5000
- **Environment Detection**: Properly detects Vercel environment vs local development
- **Static File Serving**: Optimized for serverless function environment
- **Debug Logging**: Enhanced logging to troubleshoot deployment issues

## Deployment Steps

1. Connect your GitHub repository to Vercel
2. Set the environment variables in Vercel dashboard
3. Deploy - Vercel will automatically run `npm run build`

## Local Testing

Test production mode locally:
```bash
npm run build
DATABASE_URL="your-db-url" NODE_ENV=production node dist/index.js
```

Test Vercel simulation:
```bash
DATABASE_URL="your-db-url" NODE_ENV=production VERCEL=1 PORT=3000 node dist/index.js
```

## Troubleshooting

- Check Vercel function logs for any startup errors
- Ensure `DATABASE_URL` is properly set
- Verify the build completed successfully
- Check that static files are being served correctly

The debug logging will show environment detection and file serving status.