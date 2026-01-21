# Localtunnel Setup Guide

This guide explains how to expose your local development servers to the internet using [localtunnel](https://localtunnel.github.io/www/) so you can test your Expo mobile app without deploying to production.

## Overview

Your app consists of the following services:

| Service | Port | Needs Public Access | Purpose |
|---------|------|---------------------|---------|
| **Next.js Server** | 3000 | ✅ YES | Main API backend (tRPC), authentication, web frontend |
| **PostgreSQL** | 5432 | ❌ NO | Database (internal only) |
| **Drizzle Studio** | 5555 | ❌ NO | Database admin tool (local dev only) |

## What You Need to Expose

**Only Port 3000 (Next.js Server)** needs to be exposed via localtunnel.

This single server handles:
- tRPC API endpoints (`/api/trpc`)
- Authentication endpoints (`/api/auth`)
- Web frontend (Next.js pages)
- All business logic

## Quick Setup

### 1. Install localtunnel

```bash
npm install -g localtunnel
```

### 2. Start Your Local Development Server

First, make sure your Next.js dev server is running:

```bash
# From project root
pnpm dev
```

This will start the Next.js server on `http://localhost:3000`.

### 3. Create a Tunnel

Open a **new terminal** and run:

```bash
lt --port 3000 --subdomain billion-dev
```

This will give you output like:

```
your url is: https://billion-dev.loca.lt
```

**Important Notes:**
- The `--subdomain` flag is optional but recommended for a consistent URL
- Without it, you'll get a random subdomain each time
- The first time you visit the URL in a browser, you'll see a warning page - click "Click to Continue"
- Keep this terminal open - closing it will stop the tunnel

### 4. Configure Your Expo App

Update your `.env` file (or `.env.local`) in the **project root**:

```bash
# Add this line
EXPO_PUBLIC_API_URL=https://billion-dev.loca.lt
```

**Note:** The `EXPO_PUBLIC_` prefix is required for Expo to expose this variable to the client.

### 5. Restart Your Expo App

```bash
# Stop your current Expo dev server (Ctrl+C)
# Then restart it
pnpm dev
```

The Expo app will now connect to your localtunnel URL instead of localhost.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    LOCALTUNNEL ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Expo Mobile App (iOS/Android/Physical Device)                  │
│         │                                                         │
│         └──────── HTTPS (tRPC) ───────→ localtunnel            │
│                                           https://billion-dev    │
│                                           .loca.lt               │
│                                                │                 │
│                                                │ (tunnels to)    │
│                                                ↓                 │
│                                           localhost:3000         │
│                                           (Next.js)              │
│                                                │                 │
│                                                ├── tRPC Router   │
│                                                ├── Auth API      │
│                                                └── SQL ──→ DB    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## How the Expo App Connects

The Expo app determines the API URL based on environment configuration:

1. **If `EXPO_PUBLIC_API_URL` is set**: Uses that URL (for localtunnel or production)
2. **Otherwise**: Auto-detects local IP and uses `http://<local-ip>:3000` (for local dev)

See `apps/expo/src/utils/base-url.ts:7-26` for implementation details.

## Environment Variables Reference

### Required for localtunnel setup:

```bash
# .env (project root)

# Expo client configuration
EXPO_PUBLIC_API_URL=https://billion-dev.loca.lt  # Your localtunnel URL

# Database (keep existing)
POSTGRES_URL=postgresql://user:pass@localhost:5432/dbname
```

### Optional:

```bash
# Override Next.js port (if 3000 is taken)
PORT=3001

# OAuth redirect proxy (for production)
AUTH_REDIRECT_PROXY_URL=https://your-production-url.com
```

## Troubleshooting

### Issue: Expo app can't connect to localtunnel

**Symptoms**: Network errors, timeout, or "Failed to fetch" errors

**Solutions**:
1. Verify the tunnel is running (`lt --port 3000`)
2. Check the URL in your browser first - you may need to click "Continue" on the warning page
3. Ensure `EXPO_PUBLIC_API_URL` is set correctly in `.env`
4. Restart your Expo dev server after changing environment variables
5. Clear Expo cache: `pnpm --filter expo start -c`

### Issue: "CORS error" or "Blocked by CORS policy"

**Solution**: Your Next.js server already has CORS enabled (`Access-Control-Allow-Origin: *`). If you still see CORS errors:
1. Check that you're using the full URL including `https://`
2. Ensure you're not mixing HTTP and HTTPS
3. Verify the tunnel is working by visiting the URL in a browser

### Issue: Authentication doesn't work

**Symptoms**: Session cookies not persisting, logged out after refresh

**Solutions**:
1. Check that your `AUTH_SECRET` is set in `.env`
2. Ensure cookies are enabled in your app (Better-auth handles this automatically)
3. Verify the localtunnel URL uses HTTPS (required for secure cookies)
4. Check `AUTH_REDIRECT_PROXY_URL` if using OAuth providers

### Issue: Random disconnections or tunnel stops working

**Symptoms**: Tunnel URL becomes unreachable, connection resets

**Solutions**:
1. localtunnel connections can be unstable - consider alternatives:
   - [ngrok](https://ngrok.com/) - More stable, requires account
   - [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) - Enterprise-grade, free tier
   - [Tailscale](https://tailscale.com/) - VPN-based, works on same network
2. Use a fixed subdomain to maintain consistent URLs
3. Keep the tunnel terminal window open

### Issue: "This site can't be reached" after visiting localtunnel URL

**Solution**: The first time you visit a localtunnel URL, you'll see a warning page. Click **"Click to Continue"** to whitelist your IP address. This only needs to be done once per IP.

## Alternative: Using ngrok (More Reliable)

If localtunnel is unreliable, ngrok is a better alternative:

### 1. Install ngrok

```bash
brew install ngrok  # macOS
# or download from https://ngrok.com/download
```

### 2. Sign up and get auth token

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 3. Start tunnel

```bash
ngrok http 3000
```

### 4. Update environment variable

```bash
# Use the HTTPS URL provided by ngrok
EXPO_PUBLIC_API_URL=https://abc123.ngrok.io
```

## Production Deployment

When deploying to production, you won't need localtunnel. Instead:

1. Deploy Next.js to Vercel (or your preferred host)
2. Update `EXPO_PUBLIC_API_URL` to your production URL
3. Build your Expo app with the production URL:

```bash
# Update .env
EXPO_PUBLIC_API_URL=https://your-production-domain.com

# Rebuild Expo app
pnpm --filter expo prebuild
```

## Security Considerations

- localtunnel exposes your local development server to the public internet
- Anyone with the URL can access your API (unless you implement authentication)
- Your authentication secrets are already protected via environment variables
- **Never commit** your `.env` file or expose your `AUTH_SECRET`
- Consider using ngrok's password protection feature for sensitive development

## API Endpoints Reference

All endpoints are served from the Next.js server (port 3000):

| Endpoint | Type | Purpose |
|----------|------|---------|
| `/api/trpc` | tRPC | Main API (queries/mutations) |
| `/api/auth/*` | REST | Authentication (Better-auth) |
| `/` | Web | Next.js frontend |

### tRPC API Structure

Available routers (accessed via `/api/trpc/<router>.<procedure>`):

- **auth** - `getSession`, `getSecretMessage`
- **content** - `getAll`, `getByType`, `getById` (bills, government content, court cases)
- **video** - `getInfinite` (AI-generated feed posts)
- **post** - `all`, `byId`, `create`, `delete`

## Summary

1. **What to expose**: Only port 3000 (Next.js server)
2. **Command**: `lt --port 3000 --subdomain billion-dev`
3. **Environment variable**: `EXPO_PUBLIC_API_URL=https://billion-dev.loca.lt`
4. **Restart**: Expo dev server after changing environment
5. **Browser**: Visit the URL once to whitelist your IP

That's it! Your Expo app can now connect to your local backend from any device.
