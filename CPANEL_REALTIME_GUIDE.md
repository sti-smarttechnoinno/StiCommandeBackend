# 🌐 cPanel Shared Hosting Realtime Deployment Guide (WebSockets & HTTPS Stream)

This guide provides step-by-step instructions for running real-time updates (Orders & Delegate Presence) on **cPanel Shared Hosting** without causing server load or firewalls issues.

---

## 🏗️ Architecture Overview

The system supports **Dual-Mode Hybrid Realtime**:

1. **Option A: cPanel Node.js Selector (Native WebSockets `wss://`)**
   Recommended if your cPanel has the **Setup Node.js App** tool (available on most modern cPanel hosts like Hostinger, A2, Namecheap, etc.).
   
2. **Option B: HTTPS SSE Stream Fallback (Zero-Node.js Shared Hosting)**
   If custom WebSocket ports like `8085` are blocked by your shared host firewall, the frontend automatically falls back to **HTTPS SSE Stream** (`https://yourdomain.com/api/orders/stream`) on standard SSL Port 443 with 0 background daemons.

---

## 🚀 Option A: Setup WebSockets via cPanel Node.js App (Recommended)

If your cPanel includes **Setup Node.js App**:

1. Log into **cPanel**.
2. Go to **Software > Setup Node.js App**.
3. Click **Create Application**:
   - **Node.js Version**: Select `18.x` or `20.x`.
   - **Application Root**: `backend` (or directory where `websocket-server.js` is uploaded).
   - **Application Startup File**: `websocket-server.js`
   - **Application URL**: `ws`
4. Click **Create** / **Start App**.
5. In your Frontend `.env.production` (or Next.js Vercel / Host settings):
   ```env
   NEXT_PUBLIC_WEBSOCKET_URL=wss://yourdomain.com/ws
   NEXT_PUBLIC_API_URL=https://yourdomain.com/api
   ```
6. **Done!** WebSockets will run natively over HTTPS SSL (`wss://`) without firewall issues.

---

## ⚡ Option B: Standard Shared Hosting without Node.js (cPanel HTTPS SSE Stream)

If your shared hosting provider blocks custom ports and does not have Node.js:

1. Upload the Laravel backend to your cPanel `public_html`.
2. Open `public_html/.htaccess` and add the following lines to disable output buffering on LiteSpeed / Nginx:

   ```apache
   # Disable output buffering for Realtime HTTPS Stream / SSE
   <IfModule mod_env.c>
       SetEnv no-gzip dont-variate
   </IfModule>
   <IfModule mod_headers.c>
       Header set X-Accel-Buffering "no"
       Header set Cache-Control "no-cache, no-transform"
   </IfModule>
   ```

3. In Frontend `.env.production`:
   ```env
   NEXT_PUBLIC_API_URL=https://yourdomain.com/api
   ```

4. **How it works automatically**:
   - The frontend tries `wss://yourdomain.com/ws` first.
   - When it detects that WebSocket port is closed, it seamlessly switches to `https://yourdomain.com/api/orders/stream`.
   - The stream interval is set to a gentle, server-friendly frequency (no load on single-threaded PHP workers).

---

## 📱 Flutter Mobile App Configuration

In the Flutter Mobile App (`app/lib/core/config/app_config.dart` or `.env`):

```dart
static const String baseUrl = 'https://yourdomain.com/api';
```

When delegates create orders or send heartbeats from their Android phones:
- Mobile calls `POST https://yourdomain.com/api/orders`
- Mobile calls `POST https://yourdomain.com/api/delegates/heartbeat`
- The backend automatically broadcasts to both WebSockets and the HTTPS Stream.

---

## ✅ Summary Checklist for cPanel

| Feature | cPanel Node.js App (`wss://`) | cPanel HTTPS Stream (`/api/orders/stream`) |
| :--- | :--- | :--- |
| **Protocol** | WebSockets (`wss://`) | HTTPS Stream (Port 443) |
| **cPanel Tool Required** | Setup Node.js App | None (Standard PHP 8.1+) |
| **Firewall Setup** | None required | None required |
| **Server Overhead** | Very Low (< 10MB RAM) | Zero |
| **Latency** | < 10 ms | Instant |
