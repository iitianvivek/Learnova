# QR Payment To Razorpay Handoff

This project is temporarily using a manual QR-payment flow so provider onboarding can continue before Razorpay is connected.

## What The Temporary Flow Does Right Now

1. Provider fills registration details.
2. Provider selects a plan and billing duration.
3. Provider goes to the checkout page.
4. The checkout page shows:
   - the exact amount to pay
   - a temporary QR placeholder image
   - a field for payment reference / UTR
5. Provider pays manually and submits the payment reference.
6. Draft status moves into the admin payment approval queue.
7. Admin approves the payment in the admin dashboard.
8. Only after approval is the actual provider account and profile created.

## Replace The Dummy QR Image

Current placeholder file:

- `client/src/assets/payment-qr-placeholder.svg`

Current checkout page import:

- `client/src/pages/Checkout.tsx`

To replace it later:

1. Put your real QR image file in `client/src/assets/`.
2. Update the import in `client/src/pages/Checkout.tsx`.
3. Replace `payment-qr-placeholder.svg` with your real image import.

If you only use a static QR image:

- users may still manually change the payment amount in some UPI apps
- the page shows the required amount clearly, but the QR image itself will not enforce plan-specific totals unless the QR is generated dynamically with the amount encoded

## Best Temporary Upgrade Before Razorpay

If you want exact amount prefilling before Razorpay, generate a dynamic UPI payment QR per checkout session.

Typical UPI URI format:

`upi://pay?pa=YOUR_UPI_ID&pn=Learnova&am=AMOUNT&cu=INR&tn=PLAN_NAME`

Then convert that URI into a QR image in the frontend or backend.

That approach is still not as robust as Razorpay, but it is better than a static QR image.

## What To Change Later For Razorpay

### Backend

Files involved:

- `server/src/routes/providerOnboarding.ts`
- `server/src/services/providerDraftActivation.ts`

What to do:

1. Create a Razorpay order instead of relying on manual QR payment submission.
2. Store the Razorpay order ID against the checkout session.
3. Replace manual payment-reference submission with server-side Razorpay payment verification.
4. After successful verification, either:
   - keep admin approval if you still want manual control, or
   - auto-activate by calling the same draft finalization logic currently used by admin approval.

### Frontend

Files involved:

- `client/src/pages/Checkout.tsx`

What to do:

1. Replace the QR image block with Razorpay checkout launch logic.
2. Replace the payment reference field with Razorpay success/failure handling.
3. After successful payment verification, show either:
   - “awaiting admin approval”, or
   - direct activation success, depending on the final business rule.

## Admin Flow Right Now

Admin approval queue is in:

- `client/src/pages/admin/AdminDashboard.tsx`

Admin APIs used:

- `POST /api/admin/provider-payments/:draftId/approve`
- `POST /api/admin/provider-payments/:draftId/reject`

These can continue to exist even after Razorpay if you still want manual approval after payment.

## If You Want Full Auto-Activation Later

When Razorpay is added, you can remove manual approval from the payment flow by:

1. verifying the payment on the backend
2. calling the same finalization logic immediately after verification
3. skipping the admin queue for provider payments

That finalization logic already exists in:

- `server/src/services/providerDraftActivation.ts`
