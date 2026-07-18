# Production Transfer Handoff

This project has been adjusted so it can move from the work laptop into a real production setup.

## What Was Changed In Code

The following production blockers were removed:

- backend port, CORS origins, JWT secret, JWT expiry, database path, uploads path, and admin credentials are now environment-driven
- frontend API base URL and uploads base URL are now environment-driven
- uploaded images no longer assume the frontend and backend share the same domain
- Netlify SPA refresh routing is handled by `client/public/_redirects`
- basic security headers are now sent by the Express app
- package engines now require Node 22+ because the backend uses `node:sqlite`

## Files Added For Production Setup

- `server/.env.example`
- `client/.env.example`
- `client/public/_redirects`

## Important Hosting Rule

Because this app uses SQLite and uploaded image files, your backend must have persistent disk storage.

If you deploy Render without a persistent disk:

- the database can be lost on redeploy or restart
- uploaded images can disappear

## Recommended Production Domains

Recommended split:

- frontend: `https://learnova.work`
- frontend alias: `https://www.learnova.work`
- backend: `https://api.learnova.work`

This is cleaner than pointing the frontend directly at the default Render URL forever.

## Backend Deployment On Render

### Service settings

- Root directory: `server`
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Node version: 22 or higher

### Persistent disk

Attach a persistent disk in Render.

Suggested mount path:

- `/var/data`

Then use:

- `DATABASE_PATH=/var/data/learnova.db`
- `UPLOADS_DIR=/var/data/uploads`

### Backend environment variables

Set these in Render:

- `NODE_ENV=production`
- `PORT=5000`
- `CORS_ORIGIN=https://learnova.work,https://www.learnova.work,https://your-netlify-site.netlify.app`
- `JWT_SECRET=<strong-random-secret>`
- `JWT_EXPIRES_IN=7d`
- `DATABASE_PATH=/var/data/learnova.db`
- `UPLOADS_DIR=/var/data/uploads`
- `ADMIN_EMAIL=learnova63@gmail.com`
- `ADMIN_PASSWORD=<your-real-admin-password>`

Important:

- do not add trailing slashes in `CORS_ORIGIN`
- do not use the default local JWT secret in production
- do not keep the default admin password in production

### Backend health check

After deploy, open:

- `https://api.learnova.work/api/health`

or your Render backend URL equivalent.

Expected response should include `status: ok`.

## Frontend Deployment On Netlify

### Site settings

- Base directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Node version: 22 or higher

### Frontend environment variables

Set these in Netlify:

- `VITE_API_BASE_URL=https://api.learnova.work/api`
- `VITE_UPLOADS_BASE_URL=https://api.learnova.work/uploads`

If you have not connected your custom backend subdomain yet, use your Render URL temporarily instead.

Example temporary values:

- `VITE_API_BASE_URL=https://your-render-service.onrender.com/api`
- `VITE_UPLOADS_BASE_URL=https://your-render-service.onrender.com/uploads`

## DNS / Domain Work

Recommended production DNS setup:

1. Point `learnova.work` to Netlify.
2. Point `www.learnova.work` to Netlify.
3. Point `api.learnova.work` to Render.

If you skip the dedicated API subdomain, the frontend can still call the raw Render URL, but the branded domain setup is cleaner.

## QR Payment Flow In Production

The app is still using the temporary QR approval workflow.

Before going live, make sure you also do these two things:

1. Replace `client/src/assets/payment-qr-placeholder.svg` with your real QR image.
2. Review `QR_PAYMENT_PERSONAL_LAPTOP_HANDOFF.md` for the later Razorpay replacement plan.

## Logo / Brand Assets

If you want to replace the current Learnova logo before going live, use:

- `LOGO_PERSONAL_LAPTOP_HANDOFF.md`

## Recommended Pre-Go-Live Checklist

1. Copy the project to your personal machine.
2. Replace the QR placeholder image.
3. Replace the logo and favicon if needed.
4. Set all backend env vars in Render.
5. Attach a Render persistent disk.
6. Set frontend env vars in Netlify.
7. Deploy backend.
8. Deploy frontend.
9. Test these flows on the live domain:
   - student register and login
   - tutor/institute registration draft creation
   - plan selection with coupon `FIRSTFIFTY`
   - QR payment reference submission
   - admin approval of provider payment
   - provider login after approval
   - search, compare, and image loading
10. Confirm admin dashboard can load people, drafts, and payment queues.

## Commands To Test Before Final Push

Run these locally after transfer:

```bash
# backend
cd server
npm install
npm run build

# frontend
cd ../client
npm install
npm run build
```

## Known Production Limitations Still Remaining

These are business-flow limitations, not deployment blockers:

- QR payment is manual and not gateway-verified
- transaction reference / UTR is user-submitted, not bank-verified automatically
- static QR cannot force the exact amount in the UPI app

If you want to remove these limitations later, move to the Razorpay plan already documented in `QR_PAYMENT_PERSONAL_LAPTOP_HANDOFF.md`.
