import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Check, Clock3, QrCode, ShieldCheck, Smartphone } from 'lucide-react';
import api from '../api/axios';
import { PROVIDER_CHECKOUT_SESSION_KEY, PROVIDER_DRAFT_ID_KEY } from '../constants/providerOnboarding';
import type { ProviderCheckoutSession } from '../types';
import qrPlaceholderImage from '../assets/payment-qr-placeholder.jpeg';

function formatPrice(value: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Checkout() {
  const location = useLocation();
  const routeSessionId = (location.state as { sessionId?: string } | null)?.sessionId;
  const storedSessionId = sessionStorage.getItem(PROVIDER_CHECKOUT_SESSION_KEY);
  const sessionId = routeSessionId || storedSessionId;

  const [checkoutSession, setCheckoutSession] = useState<ProviderCheckoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [submissionMessage, setSubmissionMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!sessionId) return;
      setLoading(true);
      setError('');

      try {
        const { data } = await api.get(`/provider-onboarding/checkout/${sessionId}`);
        const session = data.checkoutSession as ProviderCheckoutSession;
        setCheckoutSession(session);
        setPaymentReference(session.paymentReference || '');
        sessionStorage.setItem(PROVIDER_CHECKOUT_SESSION_KEY, session.sessionId);
        sessionStorage.setItem(PROVIDER_DRAFT_ID_KEY, session.draftId);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Unable to load the checkout placeholder.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [sessionId]);

  if (!sessionId) {
    return <Navigate to="/register" replace />;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-brand-secondary">Loading checkout...</div>;
  }

  if (!checkoutSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-bold text-brand-dark">Checkout is unavailable</p>
          <p className="mt-2 text-sm text-brand-secondary">{error || 'Please go back and try your plan selection again.'}</p>
          <Link to="/register/plans" className="mt-6 inline-flex items-center gap-2 text-brand-primary font-semibold hover:text-brand-dark">
            <ArrowLeft className="h-4 w-4" /> Back to plans
          </Link>
        </div>
      </div>
    );
  }

  const roleLabel = checkoutSession.role === 'institute' ? 'Academy' : 'Tutor';
  const paymentSubmitted = checkoutSession.status === 'paid';
  const approvalStatusMessage = paymentSubmitted
    ? 'Your payment reference has been submitted. An admin now needs to verify it and approve your profile.'
    : 'Pay the exact amount shown below, then submit your payment reference so the admin can verify and approve the profile.';

  const qrInstructions = [
    'Open any UPI app and scan the QR image below once you replace this placeholder with your real QR.',
    `Pay exactly ${formatPrice(checkoutSession.amount, checkoutSession.currency)} for this ${checkoutSession.plan.name} plan.`,
    'After payment, paste the UTR / transaction reference below so the admin can verify it.',
  ];

  const handleLocalPayment = async () => {
    setSubmitting(true);
    setError('');
    setSubmissionMessage('');

    if (!paymentReference.trim()) {
      setError('Enter the transaction reference or UTR after making the payment.');
      setSubmitting(false);
      return;
    }

    try {
      const { data } = await api.post(`/provider-onboarding/checkout/${checkoutSession.sessionId}/complete-local`, {
        paymentReference: paymentReference.trim(),
      });
      setCheckoutSession({
        ...checkoutSession,
        status: 'paid',
        paymentReference: paymentReference.trim(),
      });
      setSubmissionMessage(data.message || 'Payment submitted for admin approval.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to submit the QR payment reference right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-mist px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/register/plans" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-secondary transition-colors hover:text-brand-primary">
          <ArrowLeft className="h-4 w-4" /> Back to plans
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-[2rem] border border-brand-border bg-white p-8 shadow-[0_18px_60px_rgba(16,27,45,0.08)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/15 bg-brand-primary/5 px-4 py-1.5 text-sm font-semibold text-brand-primary">
              <QrCode className="h-4 w-4" />
              Manual QR payment
            </div>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-brand-dark">Checkout for {checkoutSession.plan.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-secondary sm:text-base">
              This temporary page lets providers pay via your QR code while Razorpay is pending. After they submit the payment reference, the admin must manually verify and approve them before their profile is created.
            </p>

            <div className="mt-8 grid gap-4 rounded-[1.75rem] bg-brand-mist p-5 sm:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-secondary">Provider</p>
                <p className="mt-2 text-lg font-bold text-brand-dark">{checkoutSession.providerSummary.name}</p>
                <p className="text-sm text-brand-secondary">{checkoutSession.providerSummary.email}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-secondary">Role</p>
                <p className="mt-2 text-lg font-bold text-brand-dark">{roleLabel}</p>
                <p className="text-sm text-brand-secondary">{checkoutSession.providerSummary.location || checkoutSession.providerSummary.subject || 'Profile details saved'}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-secondary">Billing</p>
                <p className="mt-2 text-lg font-bold text-brand-dark">{checkoutSession.durationMonths} month{checkoutSession.durationMonths > 1 ? 's' : ''}</p>
                <p className="text-sm text-brand-secondary">{formatPrice(checkoutSession.amount, checkoutSession.currency)}</p>
              </div>
            </div>

            {checkoutSession.appliedCouponCode && (
              <div className="mt-5 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                Coupon <span className="font-bold">{checkoutSession.appliedCouponCode}</span> was applied, so this checkout is using the lower launch pricing.
              </div>
            )}

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[1.75rem] border border-brand-border p-5">
                <div className="flex items-center gap-2 text-brand-dark">
                  <Smartphone className="h-5 w-5 text-brand-primary" />
                  <h2 className="text-xl font-extrabold">Scan and pay this amount</h2>
                </div>
                <div className="mt-5 rounded-[1.5rem] border border-brand-primary/15 bg-brand-primary/5 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-secondary">Amount to pay</p>
                  <p className="mt-2 text-4xl font-extrabold text-brand-dark">{formatPrice(checkoutSession.amount, checkoutSession.currency)}</p>
                  <p className="mt-2 text-sm text-brand-secondary">Pay exactly this amount for the selected plan duration.</p>
                </div>

                <div className="mt-5 space-y-3 text-sm text-brand-secondary">
                  {qrInstructions.map((instruction) => (
                    <div key={instruction} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                      <span>{instruction}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-brand-border bg-brand-mist p-5">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-secondary">QR placeholder</p>
                <div className="mt-4 rounded-[1.5rem] border border-brand-border bg-white p-4 shadow-sm">
                  <img src={qrPlaceholderImage} alt="Replace with your real payment QR" className="mx-auto w-full max-w-[240px] rounded-2xl border border-brand-border" />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-brand-secondary">
                  This is a dummy placeholder image for now. Replace it later with your actual payment QR on your personal laptop.
                </p>
              </div>
            </div>

            <div className="mt-8 rounded-[1.75rem] border border-brand-border p-5">
              <div className="flex items-center gap-2 text-brand-dark">
                <BadgeCheck className="h-5 w-5 text-brand-primary" />
                <h2 className="text-xl font-extrabold">What happens next</h2>
              </div>
              <ul className="mt-4 space-y-3 text-sm text-brand-secondary">
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-500" /> The payment request and selected plan are saved on the server</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-500" /> The provider submits the payment reference after paying via QR</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-500" /> The admin dashboard receives a payment approval request</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-emerald-500" /> The provider profile is created only when the admin approves that payment request</li>
              </ul>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-[0_18px_60px_rgba(16,27,45,0.08)]">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-primary">Order summary</p>
            <h2 className="mt-2 text-2xl font-extrabold text-brand-dark">{checkoutSession.plan.name}</h2>
            <p className="mt-1 text-sm text-brand-secondary">{checkoutSession.plan.audience}</p>

            <div className="mt-5 space-y-3 rounded-2xl bg-brand-mist p-4 text-sm text-brand-secondary">
              <div className="flex items-center justify-between">
                <span>Plan total</span>
                <span className="font-semibold text-brand-dark">{formatPrice(checkoutSession.amount, checkoutSession.currency)}</span>
              </div>
              {checkoutSession.appliedCouponCode && (
                <div className="flex items-center justify-between">
                  <span>Coupon</span>
                  <span className="font-semibold text-emerald-600">{checkoutSession.appliedCouponCode}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Duration</span>
                <span className="font-semibold text-brand-dark">{checkoutSession.durationMonths} month{checkoutSession.durationMonths > 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center justify-between border-t border-brand-border pt-3">
                <span className="font-semibold text-brand-dark">Payment path</span>
                <span className="font-semibold text-brand-primary">Manual QR</span>
              </div>
            </div>

            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${paymentSubmitted ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
              {submissionMessage || approvalStatusMessage}
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="mt-5">
              <label className="block text-sm font-semibold text-brand-dark mb-2">Transaction reference / UTR</label>
              <input
                type="text"
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                disabled={paymentSubmitted}
                placeholder="Example: 423198775612 or bank reference"
                className="w-full rounded-2xl border border-brand-border px-4 py-3 text-sm text-brand-body outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15 disabled:bg-slate-50 disabled:text-brand-secondary"
              />
              <p className="mt-2 text-xs text-brand-secondary">This helps you verify the payment manually before approving the provider.</p>
            </div>

            <button
              type="button"
              onClick={handleLocalPayment}
              disabled={submitting || paymentSubmitted}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #2F6FED, #16407A)', boxShadow: '0 10px 32px rgba(47,111,237,0.28)' }}
            >
              {submitting ? 'Submitting payment reference...' : paymentSubmitted ? 'Submitted for admin approval' : 'I have paid via QR'}
            </button>

            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-brand-border p-4 text-sm text-brand-secondary">
              <Clock3 className="mt-0.5 h-4 w-4 text-brand-primary" />
              <span>After approval, the provider can log in using the same email and password they entered during registration.</span>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-brand-border p-4 text-sm text-brand-secondary">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-brand-primary" />
              <span>When you move this project to your personal laptop, replace this QR placeholder flow with the Razorpay integration documented in the new handoff file.</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
