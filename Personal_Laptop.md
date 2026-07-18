# Personal Laptop Master Checklist

Use this file after you copy the project to your personal laptop. It combines the important actions from the production, QR-payment, and logo handoff notes into one place.

## What This File Covers

This checklist tells you:

- what to install on your personal laptop
- what files you may need to change inside the project
- what values you need to set in Render and Netlify
- what to test before going live

If you only want to transfer and keep working locally for now, you can do the local setup first and leave the hosting sections for later.

## 1. Install Requirements On Your Personal Laptop

Install these first:

1. Node.js 22 or higher
2. npm
3. Git if you want version control on the personal laptop

Reason:

- the backend uses `node:sqlite`, which requires a modern Node version

## 2. Copy The Project

Move the full Learnova project folder to your personal laptop.

Make sure these important files and folders are present after transfer:

1. `client/`
2. `server/`
3. `README.md`
4. `PRODUCTION_TRANSFER_HANDOFF.md`
5. `QR_PAYMENT_PERSONAL_LAPTOP_HANDOFF.md`
6. `LOGO_PERSONAL_LAPTOP_HANDOFF.md`
7. `server/.env.example`
8. `client/.env.example`

## 3. Install Dependencies And Confirm It Runs Locally

Run this after transfer:

```bash
cd server
npm install
npm run build

cd ../client
npm install
npm run build
```

If you want to run in development:

```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```

## 4. Required Security Changes Before Production

These are the most important changes to make before going live.

### Must change

1. Set a strong production `JWT_SECRET`
2. Set a new strong `ADMIN_PASSWORD`
3. Do not keep local default secrets in production

### Where to set them

Set them in your backend hosting environment, using:

- `server/.env.example`

## 5. Backend Hosting Changes To Make

If you deploy the backend on Render, make these changes there.

### Required Render settings

1. Root directory: `server`
2. Build command: `npm install && npm run build`
3. Start command: `npm run start`
4. Node version: 22 or higher

### Required Render environment variables

1. `NODE_ENV=production`
2. `PORT=5000`
3. `CORS_ORIGIN=https://learnova.work,https://www.learnova.work,https://your-netlify-site.netlify.app`
4. `JWT_SECRET=<your-strong-secret>`
5. `JWT_EXPIRES_IN=7d`
6. `DATABASE_PATH=/var/data/learnova.db`
7. `UPLOADS_DIR=/var/data/uploads`
8. `ADMIN_EMAIL=learnova63@gmail.com`
9. `ADMIN_PASSWORD=<your-real-admin-password>`

### Very important

Attach a persistent disk in Render.

Suggested mount path:

- `/var/data`

If you skip the persistent disk:

- the database may be lost
- uploaded images may disappear

## 6. Frontend Hosting Changes To Make

If you deploy the frontend on Netlify, make these changes there.

### Required Netlify settings

1. Base directory: `client`
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`
4. Node version: 22 or higher

### Required Netlify environment variables

1. `VITE_API_BASE_URL=https://api.learnova.work/api`
2. `VITE_UPLOADS_BASE_URL=https://api.learnova.work/uploads`

If you use the raw Render URL instead of `api.learnova.work`, replace those values with your actual Render backend URL.

## 7. Domain / DNS Changes To Make

Recommended setup:

1. `learnova.work` -> Netlify
2. `www.learnova.work` -> Netlify
3. `api.learnova.work` -> Render

This is the cleanest setup for production.

## 8. QR Payment Changes To Make On Your Personal Laptop

The project is still on the temporary QR-payment flow.

### Required now

Replace the dummy QR image.

Current placeholder file:

- `client/src/assets/payment-qr-placeholder.svg`

If your real QR file has a different name, also update the import in:

- `client/src/pages/Checkout.tsx`

### Important business limitation

With a static QR image, users can still manually change the amount in some UPI apps.

That means:

- the page shows the required amount
- but the QR image itself does not strictly enforce the exact amount

### Later upgrade

When you are ready, use:

- `QR_PAYMENT_PERSONAL_LAPTOP_HANDOFF.md`

That file explains how to later move from this temporary QR flow to Razorpay.

## 9. Logo / Branding Changes To Make On Your Personal Laptop

If you want to replace the current Learnova branding before go-live, use:

- `LOGO_PERSONAL_LAPTOP_HANDOFF.md`

Main places you may want to change:

1. navbar logo
2. favicon
3. page title
4. login page logo
5. register page logo
6. terms page branding
7. 404 page branding
8. homepage footer branding
9. admin dashboard brand text

If you are not changing branding yet, you can skip this section.

## 10. Files You May Need To Edit On Your Personal Laptop

These are the main project files you are likely to touch after transfer.

### Deployment and environment

1. `server/.env.example`
2. `client/.env.example`

### QR payment

1. `client/src/assets/payment-qr-placeholder.svg`
2. `client/src/pages/Checkout.tsx`

### Branding

1. `client/src/components/Navbar.tsx`
2. `client/index.html`
3. `client/public/favicon.svg`
4. `client/src/pages/Login.tsx`
5. `client/src/pages/Register.tsx`
6. `client/src/pages/Terms.tsx`
7. `client/src/pages/NotFound.tsx`
8. `client/src/pages/Home.tsx`
9. `client/src/pages/admin/AdminDashboard.tsx`
10. `client/src/index.css`
11. `client/tailwind.config.js`

## 11. Things You Do Not Need To Change Unless You Want To

You do not need to change these just to transfer the project:

1. compare logic
2. plan logic
3. admin approval flow
4. coupon logic for `FIRSTFIFTY`
5. provider draft workflow

Those features are already implemented.

## 12. Test Checklist After Transfer

Before production, test these flows:

1. student register
2. student login
3. admin login
4. tutor registration draft
5. institute registration draft
6. plan selection
7. applying coupon `FIRSTFIFTY`
8. QR payment reference submission
9. admin approval of provider payment
10. provider login after approval
11. search page
12. compare page
13. institute profile image loading
14. tutor profile image loading
15. admin dashboard users, drafts, and payments tabs

## 13. Best Order To Do Things On Your Personal Laptop

Follow this order:

1. copy project
2. install Node 22+
3. run local builds
4. replace QR image
5. optionally replace logo and favicon
6. deploy backend on Render
7. attach persistent disk
8. set backend env vars
9. deploy frontend on Netlify
10. set frontend env vars
11. connect domain and subdomain
12. test the full live flow

## 14. Related Files

Use these if you need deeper detail:

1. `PRODUCTION_TRANSFER_HANDOFF.md`
2. `QR_PAYMENT_PERSONAL_LAPTOP_HANDOFF.md`
3. `LOGO_PERSONAL_LAPTOP_HANDOFF.md`

## 15. Short Version

If you want the shortest version possible, these are the main changes to make on your personal laptop:

1. install Node 22+
2. replace the dummy QR image
3. set a strong `JWT_SECRET`
4. set a new `ADMIN_PASSWORD`
5. attach a persistent disk on Render
6. set backend and frontend env vars
7. optionally replace the logo and favicon
8. test everything before going live

