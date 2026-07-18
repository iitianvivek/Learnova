# Learnova — Education Discovery Platform

India's education discovery platform where students find and compare institutes and tutors, and providers manage their listings.

---

## Quick Start

```bash
# Terminal 1 — Backend
cd server
npm install
npm run dev        # starts on http://localhost:5000

# Terminal 2 — Frontend
cd client
npm install
npm run dev        # starts on http://localhost:3000
```

Admin login: `learnova63@gmail.com` / `Learnova@1234`
**Change this password immediately on any new machine.**

---

## Recent Product Changes

This workspace now includes the following major product changes:

- mixed compare workspace for institutes, tutors, or both together
- provider plan selection with the `FIRSTFIFTY` coupon-driven launch pricing flow
- temporary QR-payment onboarding instead of Razorpay, with admin approval before provider activation
- admin dashboard visibility for all registered users, provider drafts, payment approvals, and direct edit/delete controls
- updated admin login credentials and removal of older demo-login hints from the public login page
- responsive compare and onboarding improvements for mobile and tablet layouts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 3 |
| Backend | Node.js, Express 4, TypeScript, tsx (dev runner) |
| Database | SQLite via Node.js built-in `node:sqlite` (DatabaseSync) |
| Auth | JWT (jsonwebtoken), bcryptjs for password hashing |
| File uploads | multer (images stored in the configured uploads directory; local default is `uploads/`) |
| HTTP client | axios (client-side) |
| Icons | lucide-react |
| Routing | react-router-dom v6 |

---

## Project Structure

```
Learnova/
├── client/                  ← React frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.ts         ← Axios instance with base URL + JWT interceptor
│   │   ├── components/
│   │   │   ├── Navbar.tsx        ← Top navigation bar
│   │   │   ├── InstituteCard.tsx ← Card shown in search results for institutes
│   │   │   ├── TutorCard.tsx     ← Card shown in search results for tutors
│   │   │   ├── BookmarkButton.tsx← Save/unsave bookmark toggle
│   │   │   ├── EnquiryModal.tsx  ← Popup form to send an enquiry
│   │   │   ├── ReviewSection.tsx ← Star rating + review list + submit form
│   │   │   └── StarRating.tsx    ← Displays star rating with count
│   │   ├── context/
│   │   │   └── AuthContext.tsx   ← Global auth state (user, token, login, logout)
│   │   ├── constants/
│   │   │   └── providerOnboarding.ts ← Session storage keys for provider draft + checkout flow
│   │   ├── pages/
│   │   │   ├── Home.tsx          ← Landing page (hero, search card, categories, featured)
│   │   │   ├── Login.tsx         ← Login page (two-column layout)
│   │   │   ├── Register.tsx      ← Registration (role picker → form)
│   │   │   ├── PlanSelection.tsx ← Provider plan selection after registration draft is saved
│   │   │   ├── Checkout.tsx      ← Manual QR checkout with payment reference submission
│   │   │   ├── Search.tsx        ← Search results with filters
│   │   │   ├── Compare.tsx       ← Guided compare workspace for institutes, tutors, or mixed shortlists
│   │   │   ├── InstituteProfile.tsx  ← Full institute profile page
│   │   │   ├── TutorProfile.tsx      ← Full tutor profile page
│   │   │   ├── NotFound.tsx          ← 404 page
│   │   │   ├── Terms.tsx             ← Terms of Service + Privacy Policy
│   │   │   ├── admin/
│   │   │   │   └── AdminDashboard.tsx ← Admin panel (stats, approvals, people, drafts, payments)
│   │   │   └── dashboard/
│   │   │       ├── StudentDashboard.tsx   ← Student: bookmarks + sent enquiries
│   │   │       ├── InstituteDashboard.tsx ← Institute: profile, courses, images, enquiries
│   │   │       └── TutorDashboard.tsx     ← Tutor: profile, availability, images, enquiries
│   │   ├── types/
│   │   │   └── index.ts          ← All shared TypeScript interfaces
│   │   ├── App.tsx               ← Router setup, ProtectedRoute, Navbar visibility
│   │   ├── main.tsx              ← React entry point
│   │   └── index.css             ← Tailwind directives + global CSS variables + animations
│   ├── tailwind.config.js        ← Brand color tokens (brand.dark, primary, accent, etc.)
│   └── vite.config.ts            ← Vite config with /api and /uploads proxy to port 5000
│
└── server/                  ← Express backend
    ├── src/
    │   ├── db/
    │   │   └── database.ts       ← DB connection, schema creation, migrations, seeding
    │   ├── config/
    │   │   └── providerPlans.ts  ← Server-defined academy and tutor plan catalog
    │   ├── services/
    │   │   ├── providerDraftActivation.ts ← Final provider-account creation after admin approval
    │   │   ├── institutePlanAccess.ts ← Academy plan feature gating helper
    │   │   └── tutorPlanAccess.ts     ← Tutor plan feature gating helper
    │   ├── middleware/
    │   │   ├── auth.ts           ← JWT verify middleware (authenticate, requireRole)
    │   │   └── upload.ts         ← multer config for image uploads
    │   ├── routes/
    │   │   ├── auth.ts           ← POST /register, POST /login, GET /me
    │   │   ├── institutes.ts     ← CRUD for institutes, courses, star teachers, images
    │   │   ├── tutors.ts         ← CRUD for tutors, availability, images
    │   │   ├── search.ts         ← Full-text search + filters + compare endpoint
    │   │   ├── reviews.ts        ← Post and fetch reviews/ratings
    │   │   ├── bookmarks.ts      ← Save/remove/list bookmarks
    │   │   ├── enquiries.ts      ← Send, receive, and status-update enquiries
    │   │   ├── admin.ts          ← Admin stats, pending approvals, users, drafts, payment approvals
    │   │   └── providerOnboarding.ts ← Draft-first provider onboarding + manual QR checkout flow
    │   ├── types/
    │   │   └── index.ts          ← Server-side TypeScript types
    │   └── index.ts              ← Express app entry: middleware, route registration, port
    ├── data/
    │   └── learnova.db           ← SQLite database file (auto-created on first run)
    ├── uploads/                  ← Uploaded images (institute/tutor photos)
    └── tsconfig.json             ← TypeScript config for server
```

---

## Database Schema

All tables are created automatically in `server/src/db/database.ts` on first run.

### users
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | |
| email | TEXT UNIQUE | |
| password_hash | TEXT | bcrypt hash |
| role | TEXT | student / tutor / institute / admin |
| created_at | DATETIME | |

### institutes
| Column | Notes |
|---|---|
| id, user_id | user_id links to users table |
| name, location, description | profile fields |
| contact_email, contact_phone, contact_website | |
| status | pending → approved / rejected (set by admin) |

### tutors
| Column | Notes |
|---|---|
| id, user_id | |
| name, subject, bio | |
| experience_years, hourly_rate | |
| mode | online / offline / both |
| status | pending → approved / rejected |

### institute_courses
Links institutes to courses with fee_structure and duration.

### tutor_availability
Stores day_of_week, start_time, end_time per tutor.

### reviews
One review per (reviewer, target, target_type). target_type = 'institute' or 'tutor'.

### bookmarks
One bookmark per (student, target, target_type).

### enquiries
| Column | Notes |
|---|---|
| student_id, target_id, target_type | |
| message, student_name, student_email, student_phone | |
| status | new → read → replied |

**Business rule:** A student cannot send a second enquiry to the same target until the first is marked 'replied'.

### provider_registration_drafts
Stores provider registration details before a real account is created.

| Column | Notes |
|---|---|
| public_id | External draft identifier used by the client |
| role | tutor / institute |
| form_json | Saved registration form payload |
| selected_plan_code, selected_duration_months, selected_amount | Plan selection attached before checkout |
| status | draft → checkout_pending → paid → converted |

### provider_checkout_sessions
Stores manual QR checkout session state for the provider flow.

| Column | Notes |
|---|---|
| session_id | External checkout session identifier |
| draft_public_id | Links back to provider_registration_drafts |
| plan_code, duration_months, amount, currency | Server-side billing snapshot |
| gateway | Currently `local_placeholder` for the temporary QR flow |
| gateway_reference | User-submitted payment reference / UTR |
| status | created → paid / failed / cancelled |

### provider_subscriptions
Stores the activated provider plan after admin approval finalizes the provider account.

| Column | Notes |
|---|---|
| user_id | Final provider user |
| role | tutor / institute |
| plan_code, duration_months, amount, currency | Activated plan data |
| payment_session_id | Paid checkout session |
| starts_at, ends_at | Subscription period |
| status | active / expired / cancelled |

---

## Plan Enforcement

Paid provider plans are not just display content anymore. They are enforced in the backend using:

- `server/src/services/institutePlanAccess.ts`
- `server/src/services/tutorPlanAccess.ts`

These helpers are used by profile, search, review, enquiry, and upload routes so plan-based restrictions apply consistently.

### Academy plan rules

| Plan | Public listing | Images | Reviews | Student enquiries | Star teachers |
|---|---|---|---|---|---|
| Academy Starter | Yes | Up to 5 | No | No | No |
| Academy Growth | Yes | Unlimited | Yes | Yes | Yes |
| Academy Elite | Yes | Unlimited | Yes | Yes | Yes |

### Tutor plan rules

| Plan | Public listing | Images | Reviews | Student enquiries |
|---|---|---|---|---|
| Tutor Starter | No | Not available | No | No |
| Tutor Pro | Yes | Up to 4 | Yes | Yes |
| Tutor Elite | Yes | Unlimited | Yes | Yes |

### Legacy provider accounts

Older provider profiles that were created before the paid onboarding flow do not have a paid subscription row.

Current behavior:

- legacy institute and tutor profiles keep permissive access
- they remain visible if already approved
- they are not forcibly downgraded by the new plan rules

---

## API Endpoints

Base URL: `http://localhost:5000/api`

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /register | No | Create student account directly. Provider signup now uses `/api/provider-onboarding/*` |
| POST | /login | No | Returns JWT token + user object |
| GET | /me | JWT | Get current user info |

### Provider Onboarding — `/api/provider-onboarding`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /plans?role=institute\|tutor | No | Get server-defined plans for academies or tutors |
| POST | /drafts | No | Save provider registration form as a draft |
| GET | /drafts/:draftId | No | Get saved draft summary |
| POST | /drafts/:draftId/selection | No | Attach plan + billing duration and create checkout session |
| GET | /checkout/:sessionId | No | Get manual QR checkout session summary |
| POST | /checkout/:sessionId/complete-local | No | Submit QR payment reference / UTR for admin approval |
| POST | /finalize/:draftId | No | Public finalize is disabled; provider activation now happens through admin approval |

### Institutes — `/api/institutes`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | No | List approved institutes. Ratings/enquiry availability may depend on the institute's active plan. Filters: `location`, `minRating`, `page`, `limit` |
| GET | /:id | No | Full institute profile |
| GET | /mine/profile | institute | Own profile |
| PUT | /:id | institute/admin | Update profile |
| POST | /:id/courses | institute | Add a course |
| DELETE | /:id/courses/:courseId | institute | Remove a course |
| POST | /:id/star-teachers | institute | Add star teacher (Growth/Elite academy plans) |
| DELETE | /:id/star-teachers/:tutorId | institute | Remove star teacher |
| POST | /:id/images | institute | Upload images (multipart, plan-limited) |
| DELETE | /:id/images/:imageId | institute | Delete an image |

### Tutors — `/api/tutors`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | No | List approved tutors that are publicly visible on their current plan. Filters: `subject`, `minRate`, `maxRate`, `minRating`, `minExp`, `page`, `limit` |
| GET | /:id | No | Full tutor profile |
| GET | /mine/profile | tutor | Own profile |
| PUT | /:id | tutor/admin | Update profile (includes mode) |
| POST | /:id/availability | tutor | Replace availability slots |
| POST | /:id/images | tutor | Upload images (plan-limited) |
| DELETE | /:id/images/:imageId | tutor | Delete image |

### Search — `/api/search`
| Method | Path | Description |
|---|---|---|
| GET | / | Search with params: q, type, subject, location, minFee, maxFee, minRating, mode, page, limit. Tutor Starter profiles are excluded from public search. |
| GET | /courses | All courses (for filter dropdowns) |
| GET | /compare | Compare 2-4 items of a single type: `?ids=1,2,3&type=institute|tutor`. The frontend compare workspace can combine institute and tutor responses into one mixed comparison view. |

### Reviews — `/api/reviews`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /:targetType/:targetId | No | Get reviews for an institute or tutor if that plan allows reviews |
| POST | / | student | Submit a review (1 per student per target, only if the target plan allows reviews) |
| DELETE | /:id | student/admin | Delete own review |

### Bookmarks — `/api/bookmarks`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | / | student | Get own bookmarks |
| POST | / | student | Add bookmark |
| GET | /check/:targetType/:targetId | student | Check whether a listing is bookmarked |
| DELETE | /:targetType/:targetId | student | Remove bookmark |

### Enquiries — `/api/enquiries`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | / | student | Send enquiry (blocked if pending one exists or the target plan does not allow enquiries) |
| GET | /mine | student | Own sent enquiries |
| GET | /received | institute/tutor | Enquiries received, if the current plan includes enquiry inbox access |
| PATCH | /:id/status | institute/tutor | Mark as read or replied |
| GET | /admin | admin | All enquiries |

### Admin — `/api/admin`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /stats | admin | Platform stats |
| GET | /pending | admin | Legacy pending registrations plus provider payment approvals |
| GET | /provider-drafts | admin | Tutor and institute registration drafts that are not activated yet |
| PUT | /institutes/:id/status | admin | Approve or reject |
| PUT | /tutors/:id/status | admin | Approve or reject |
| GET | /users | admin | All users with role/search filters |
| PUT | /users/:id | admin | Edit user details and linked tutor/institute profile fields |
| DELETE | /users/:id | admin | Delete user |
| POST | /provider-payments/:draftId/approve | admin | Approve QR payment and create the real provider account |
| POST | /provider-payments/:draftId/reject | admin | Reset a submitted provider payment back to checkout_pending |
| DELETE | /provider-drafts/:draftId | admin | Delete a saved provider registration draft |

---

## Brand Colors (Tailwind tokens)

Defined in `client/tailwind.config.js` and as CSS variables in `client/src/index.css`.

| Token | Hex | Usage |
|---|---|---|
| `brand-dark` | `#16407A` | Headings, dark backgrounds |
| `brand-primary` | `#2F6FED` | Buttons, links, active states |
| `brand-accent` | `#6C4FD8` | Secondary actions, tutor color |
| `brand-mist` | `#EAF2FA` | Light backgrounds, hover fills |
| `brand-body` | `#101B2D` | Body text |
| `brand-secondary` | `#54627A` | Subtext, labels |
| `brand-border` | `#E1E9F2` | All borders and dividers |

---

## Authentication Flow

1. User submits login → server returns `{ token, user }`
2. Token stored in `localStorage` as `learnova_token`
3. User object stored as `learnova_user` (JSON)
4. `AuthContext.tsx` reads these on page load and exposes `user`, `isAuthenticated`, `login()`, `logout()`
5. `axios.ts` interceptor attaches `Authorization: Bearer <token>` to every request
6. On 401 response, the interceptor clears localStorage (`learnova_token` and `learnova_user`)
7. `ProtectedRoute` in `App.tsx` checks `isAuthenticated` and `user.role` before rendering

---

## Registration Flow

### Student
Simple form → account created → redirected to `/dashboard/student`

### Institute / Tutor
1. Step 1: Choose role (role picker screen)
2. Step 2: Fill form (role-specific fields shown)
3. On submit → registration is saved as a provider draft on the server
4. Step 3: Choose a server-defined plan at `/register/plans`
5. Optional launch pricing is unlocked by entering coupon code `FIRSTFIFTY`
6. Step 4: Continue to `/register/checkout`, pay through the temporary QR flow, and submit the transaction reference / UTR
7. That payment submission enters the admin approval queue instead of creating the provider immediately
8. Only after admin approval are the provider account, provider profile, and provider subscription created
9. Feature access after signup depends on the active paid plan, not only on the role

### Why payment is local-only right now

The checkout page is intentionally using a temporary manual QR flow so this onboarding can run on a locked-down work laptop without adding external payment SDKs.

Current temporary behavior:

- the checkout page shows the amount due
- a placeholder QR image is rendered from `client/src/assets/payment-qr-placeholder.svg`
- the provider manually pays and enters a transaction reference / UTR
- the admin verifies that payment and approves the provider manually

When you move the project to your own machine, use [QR_PAYMENT_PERSONAL_LAPTOP_HANDOFF.md](QR_PAYMENT_PERSONAL_LAPTOP_HANDOFF.md) for the Razorpay swap-over plan.

Important limitation:

- a static QR image cannot truly force the payment amount in the user's UPI app
- the page clearly shows the expected amount, but strict amount prefilling needs a dynamic UPI QR or Razorpay

---

## Admin Management Dashboard

The admin dashboard is no longer limited to just approval counts.

Current admin capabilities:

- view platform stats
- review legacy institute and tutor approval queues
- review QR payment submissions for provider onboarding
- see every registered user directly in the dashboard
- search and filter users by role
- edit tutor and institute profile fields from the dashboard itself
- delete users without opening the SQLite database manually
- inspect provider registration drafts that are not activated yet
- delete abandoned or invalid provider drafts

Notes:

- students exist only in the `users` table, so they show basic account data in the People tab
- tutors and institutes show both user-account fields and linked profile details
- deleting a user also removes linked tutor/institute rows because of database foreign-key cascades

---

## Comparison Experience

Learnova now has a dedicated compare workspace at `/compare`.

Current behavior:

- opening Compare directly from the navbar or homepage no longer lands in an invalid state
- users can compare institutes only, tutors only, or a mixed shortlist containing both institutes and tutors
- the compare workspace includes a built-in shortlist builder when no active comparison is loaded yet
- search sends separate institute and tutor selections into the compare workspace
- mixed comparison focuses on practical decision points like format, pricing style, reviews, enquiries, and gallery access
- institute-only comparison still includes shared-course and course-fee comparison
- tutor-only comparison still includes tutor-specific metrics like subject, rate, experience, mode, and availability

Technical note:

- the backend `/api/search/compare` endpoint still compares one type at a time
- the frontend compare workspace merges the institute response and tutor response into one mixed UI when needed

---

## File Upload Flow

- multer saves files to `server/uploads/` with a timestamp prefix
- File path (relative to uploads/) stored in DB
- Files served statically at `/uploads/<filename>` via Express
- Frontend constructs URLs as `/uploads/${file_path}` (proxied by Vite in dev)
- In production: Nginx serves `/uploads` directly from the server folder
- Upload endpoints now enforce plan-based image limits for institutes and tutors

---

## Responsive Behavior

The frontend is responsive and is designed to remain usable across mobile, tablet, and desktop screens.

Current behavior:

- homepage, search, profile, dashboard, and onboarding sections mainly collapse into stacked cards and single-column layouts on smaller screens
- the compare workspace also collapses its major sections on mobile
- wider comparison tables on the compare page use horizontal scrolling on smaller screens instead of compressing content too aggressively

This means the site is mobile-friendly today, but the compare experience is still stronger on desktop because dense side-by-side tables are naturally easier to scan there.

---

## Local Demo Data

This local workspace now contains realistic demo academy profiles for product demos:

- Apex Learning Academy
- Meridian Commerce Institute
- Northbridge Science Academy

Current demo state:

- Apex and Meridian are on Growth-tier academy plans
- Northbridge is on a Starter-tier academy plan
- Apex and Meridian have seeded student ratings and reviews
- Northbridge intentionally has reviews and enquiries disabled to demonstrate Starter restrictions

---

## Common Debugging Scenarios

### Blank white page
- Check browser console for errors
- Most likely cause: import error or JSX parse error
- Run `npm run build` in client/ — the TypeScript compiler will show exact errors

### "Cannot find module" on server start
- Run `npm install` in the server/ folder
- Check `server/src/index.ts` for new imports that may not be registered

### API returns 401
- Token is expired or missing
- Clear localStorage in browser DevTools → Application → Local Storage → delete `learnova_token` and `learnova_user`
- Log in again

### API returns 403
- User's role doesn't match the required role for that endpoint
- Example: a student trying to call `/api/enquiries/received` (institute/tutor only)

### Institute/Tutor not showing in search
- Legacy `/api/auth/register` provider records still require admin approval because they are created as `pending`
- New `/api/provider-onboarding/*` provider signups do not become visible immediately after payment submission
- A provider created through the QR flow appears only after the admin approves the payment and the real account is created
- Tutor Starter profiles are intentionally hidden from public tutor listings and tutor search
- Check whether the provider came through the legacy path or the paid onboarding path

### Provider says payment was made but cannot log in
- In the current QR flow, payment submission alone does not create the provider account
- The provider can log in only after the admin approves the payment request from the admin dashboard
- Check the Provider Payments tab in the admin dashboard for the submitted UTR / transaction reference
- If the payment submission was wrong, use the reset action so the provider can submit the reference again

### Reviews or enquiries are missing on a public profile
- The provider may be on a plan that does not include that feature
- Academy Starter disables reviews, enquiries, and star teachers
- Tutor Starter disables public listing, reviews, enquiries, and gallery uploads

### Image upload fails even though login is valid
- The provider may have hit the plan's image limit
- Academy Starter allows up to 5 images
- Tutor Pro allows up to 4 images
- Tutor Starter does not include gallery uploads

### Database schema change not applied
- The schema uses `CREATE TABLE IF NOT EXISTS` — changes to existing tables need a migration
- Migrations run at startup in `database.ts` using try/catch ALTER TABLE blocks
- If a column is missing, add an ALTER TABLE line in the migrations section of `database.ts` and restart the server

### Images not showing
- Check that the configured uploads directory exists
- Verify the file path in DB doesn't have a leading slash
- In dev, Vite proxies `/uploads` to the backend target configured in `client/vite.config.ts`

### "Module has no exported member" TypeScript error
- `client/tsconfig.app.json` has `verbatimModuleSyntax: true`
- All type-only imports MUST use `import type { Foo }` syntax, not `import { Foo }`

---

## Environment

The app now supports environment-based configuration for production.

Local defaults still work without extra setup, but production should use the example env files:

- `server/.env.example`
- `client/.env.example`

Core environment-driven settings now include:

| Setting | Local Default | File |
|---|---|---|
| Backend port | `5000` | `server/src/config/env.ts` |
| Frontend dev port | `3000` | `client/vite.config.ts` |
| JWT secret | local-only fallback | `server/src/config/env.ts` |
| JWT expiry | `7d` | `server/src/config/env.ts` |
| CORS origins | `http://localhost:3000` | `server/src/config/env.ts` |
| DB file path | `data/learnova.db` | `server/src/config/env.ts` |
| Uploads path | `uploads/` | `server/src/config/env.ts` |
| API base URL | `/api` in local dev | `client/src/utils/runtime.ts` |
| Uploads base URL | `/uploads` in local dev | `client/src/utils/runtime.ts` |
| Payment gateway mode | `local_placeholder` (temporary QR approval flow) | `server/src/routes/providerOnboarding.ts` |
| QR placeholder asset | `client/src/assets/payment-qr-placeholder.svg` | `client/src/pages/Checkout.tsx` |

For the full Netlify + Render production setup, use `PRODUCTION_TRANSFER_HANDOFF.md`.

---

## Data Backup

The database is a single SQLite file stored at the path configured by `DATABASE_PATH`.

Local default:

- `server/data/learnova.db`

To back it up: copy that file anywhere. To restore: replace it.

Uploaded images are stored in the directory configured by `UPLOADS_DIR`.

Local default:

- `server/uploads/`

Back that folder up together with the database.