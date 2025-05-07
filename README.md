# Badma

## Development

To start the development server:

```bash
npm run dev
```

## Building

### Important note about NODE_ENV

This project should be built and run with `NODE_ENV=production` to avoid the following error during build:

```
Error: <Html> should not be imported outside of pages/_document.
```

Use these commands for building and running in production mode:

```bash
# Building
npm run build:prod

# Running in production
npm run start:prod
```

These scripts automatically set `NODE_ENV=production` to ensure proper building and rendering.

## Project Structure

This project uses Next.js App Router (app directory structure) for modern routing and rendering features.

- `app/` - Contains all routes and layouts
- `events/` - Event handler configurations
- `migrations/` - Database migration scripts
- `lib/` - Utility functions and shared code
- `public/` - Static assets 