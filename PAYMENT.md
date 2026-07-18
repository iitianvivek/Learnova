# Provider Payments Handoff

This project now includes a local-only provider onboarding flow for academies and tutors:

1. Registration details are stored as a server draft.
2. Plans are loaded from the server.
3. A checkout session is created on the server.
4. A local placeholder checkout marks the session as paid.
5. The provider account is finalized only after that paid state exists.

This was done so the feature can be developed on a locked-down work laptop without installing external payment SDKs.

## Current Files

- `server/src/config/providerPlans.ts`
  Contains the academy and tutor plan catalog.

- `server/src/routes/providerOnboarding.ts`
  Contains local onboarding endpoints:
  - `GET /api/provider-onboarding/plans?role=`
  - `POST /api/provider-onboarding/drafts`
  - `GET /api/provider-onboarding/drafts/:draftId`
  - `POST /api/provider-onboarding/drafts/:draftId/selection`
  - `GET /api/provider-onboarding/checkout/:sessionId`
  - `POST /api/provider-onboarding/checkout/:sessionId/complete-local`
  - `POST /api/provider-onboarding/finalize/:draftId`

- `server/src/db/database.ts`
  Adds these tables:
  - `provider_registration_drafts`
  - `provider_checkout_sessions`
  - `provider_subscriptions`

- `client/src/pages/Register.tsx`
  Provider registration now creates a server draft instead of immediately creating the final account.

- `client/src/pages/PlanSelection.tsx`
  Fetches plans and draft info from the server.

- `client/src/pages/Checkout.tsx`
  Local checkout placeholder screen.

## What To Replace On Your Personal Laptop

Replace the local placeholder checkout with Razorpay in three places.

### 1. Add Razorpay server integration

Install Razorpay on your personal machine only:

```powershell
cd server
npm install razorpay
```

Then replace the local checkout completion flow in `server/src/routes/providerOnboarding.ts`.

Current local placeholder endpoint:

- `POST /api/provider-onboarding/checkout/:sessionId/complete-local`

Future Razorpay flow:

- `POST /api/provider-onboarding/checkout/:sessionId/create-order`
- `POST /api/provider-onboarding/payments/verify`
- `POST /api/provider-onboarding/payments/webhook`

### 2. Add server secrets

Move these into environment variables on your personal machine:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

Do not hardcode them in the repo.

### 3. Replace the client payment button

In `client/src/pages/Checkout.tsx`, replace:

- `Simulate successful payment`

with:

- request order from backend
- open Razorpay checkout modal
- send returned payment identifiers back to backend for verification

## Recommended Razorpay Mapping

Use the existing draft/session architecture.

### Backend order creation

Create Razorpay order using:

- draft id
- selected plan code
- duration months
- server-side amount from `providerPlans.ts`

Save the returned Razorpay order id into `provider_checkout_sessions`.

### Backend verification

After checkout success:

1. receive Razorpay payment id
2. receive Razorpay order id
3. receive Razorpay signature
4. verify signature on the server
5. mark local checkout session as paid
6. call the same finalize logic already present in the route

## Why This Structure Matters

The important part is already done:

- providers are not created too early
- plan selection is server-driven
- checkout exists as a separate step
- final account activation already depends on a paid state
- provider features are now enforced after activation based on the saved plan code

That means the Razorpay work later is mostly replacing the local paid marker, not redesigning the entire onboarding flow.

## Feature Gating Already In Place

After payment and finalization, the project now uses the saved provider plan to control access to features.

### Academy plans

- `academy_starter`
  - public listing: yes
  - images: up to 5
  - reviews: no
  - enquiries: no
  - star teachers: no

- `academy_growth`
  - public listing: yes
  - images: unlimited
  - reviews: yes
  - enquiries: yes
  - star teachers: yes

- `academy_elite`
  - public listing: yes
  - images: unlimited
  - reviews: yes
  - enquiries: yes
  - star teachers: yes

### Tutor plans

- `tutor_starter`
  - public listing: no
  - images: no
  - reviews: no
  - enquiries: no

- `tutor_pro`
  - public listing: yes
  - images: up to 4
  - reviews: yes
  - enquiries: yes

- `tutor_elite`
  - public listing: yes
  - images: unlimited
  - reviews: yes
  - enquiries: yes

When you move to Razorpay later, keep this plan-gating layer unchanged. The gateway swap should only replace how a draft becomes paid, not how plan-based feature access is decided.


