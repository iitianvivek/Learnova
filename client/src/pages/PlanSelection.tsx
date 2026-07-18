import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Crown, GraduationCap, ShieldCheck, Sparkles, X } from 'lucide-react';
import api from '../api/axios';
import { PROVIDER_CHECKOUT_SESSION_KEY, PROVIDER_DRAFT_ID_KEY } from '../constants/providerOnboarding';
import type { BillingDurationMonths, ProviderDraftSummary, ProviderPlan, ProviderPlanCatalogResponse } from '../types';

type DurationOption = {
  months: BillingDurationMonths;
  label: string;
};

const DURATION_OPTIONS: DurationOption[] = [
  { months: 1, label: '1 Month' },
  { months: 3, label: '3 Months' },
  { months: 6, label: '6 Months' },
  { months: 12, label: '12 Months' },
];

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeCouponCode(value: string) {
  return value.trim().toUpperCase();
}

function getDisplayedTotal(plan: ProviderPlan, duration: BillingDurationMonths, couponApplied: boolean) {
  return couponApplied ? plan.durationPricing[duration] : plan.originalMonthly * duration;
}

function getCardStyles(style: ProviderPlan['cardStyle'], selected: boolean) {
  if (style === 'popular') {
    return selected
      ? 'border-brand-primary bg-white shadow-[0_24px_70px_rgba(47,111,237,0.22)] ring-2 ring-brand-primary/20'
      : 'border-brand-primary/30 bg-white shadow-[0_18px_50px_rgba(47,111,237,0.12)]';
  }

  if (style === 'elite') {
    return selected
      ? 'border-slate-900 bg-slate-950 text-white shadow-[0_26px_70px_rgba(15,23,42,0.35)] ring-2 ring-white/15'
      : 'border-slate-800 bg-slate-950 text-white shadow-[0_20px_60px_rgba(15,23,42,0.25)]';
  }

  return selected
    ? 'border-brand-accent bg-white shadow-[0_24px_60px_rgba(108,79,216,0.16)] ring-2 ring-brand-accent/15'
    : 'border-brand-border bg-white shadow-sm';
}

export default function PlanSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeDraftId = (location.state as { draftId?: string } | null)?.draftId;
  const storedDraftId = sessionStorage.getItem(PROVIDER_DRAFT_ID_KEY);
  const draftId = routeDraftId || storedDraftId;

  const [draft, setDraft] = useState<ProviderDraftSummary | null>(null);
  const [plans, setPlans] = useState<ProviderPlan[]>([]);
  const [selectedDuration, setSelectedDuration] = useState<BillingDurationMonths>(1);
  const [selectedPlanCode, setSelectedPlanCode] = useState('');
  const [availableCouponCode, setAvailableCouponCode] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!routeDraftId && storedDraftId) {
      navigate('/register/plans', { replace: true, state: { draftId: storedDraftId } });
    }
  }, [navigate, routeDraftId, storedDraftId]);

  useEffect(() => {
    const load = async () => {
      if (!draftId) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const { data: draftData } = await api.get(`/provider-onboarding/drafts/${draftId}`);
        const draftSummary = draftData.draft as ProviderDraftSummary;
        const { data: planData } = await api.get('/provider-onboarding/plans', { params: { role: draftSummary.role } });
        const catalog = planData as ProviderPlanCatalogResponse;
        const availablePlans = catalog.plans;
        const draftCouponCode = draftSummary.appliedCouponCode || '';

        setDraft(draftSummary);
        setPlans(availablePlans);
        setAvailableCouponCode(catalog.couponCode);
        setSelectedDuration(draftSummary.selectedDurationMonths || 1);
        setSelectedPlanCode(
          draftSummary.selectedPlanCode
            || (draftSummary.role === 'institute' ? 'academy_growth' : 'tutor_pro'),
        );
        setCouponInput(draftCouponCode || '');
        setCouponApplied(Boolean(draftCouponCode));
        setCouponMessage(draftCouponCode
          ? { type: 'success', text: `${draftCouponCode} applied. Coupon pricing is active.` }
          : null);
        sessionStorage.setItem(PROVIDER_DRAFT_ID_KEY, draftSummary.draftId);
      } catch (err: any) {
        sessionStorage.removeItem(PROVIDER_DRAFT_ID_KEY);
        setError(err.response?.data?.error || 'Unable to load your saved registration details. Please start again.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [draftId]);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.code === selectedPlanCode) ?? plans[0],
    [plans, selectedPlanCode],
  );

  if (!draftId) {
    return <Navigate to="/register" replace />;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-brand-secondary">Loading plans...</div>;
  }

  if (!draft || !selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-bold text-brand-dark">We could not load your plans</p>
          <p className="mt-2 text-sm text-brand-secondary">{error || 'Please restart the provider registration flow.'}</p>
          <Link to="/register" className="mt-6 inline-flex items-center gap-2 text-brand-primary font-semibold hover:text-brand-dark">
            <ArrowLeft className="h-4 w-4" /> Back to register
          </Link>
        </div>
      </div>
    );
  }

  const selectedTotal = getDisplayedTotal(selectedPlan, selectedDuration, couponApplied);
  const effectiveMonthly = Math.round(selectedTotal / selectedDuration);
  const selectedSavings = (selectedPlan.originalMonthly * selectedDuration) - selectedTotal;
  const roleLabel = draft.role === 'institute' ? 'Academy' : 'Tutor';
  const roleGradient = draft.role === 'institute'
    ? 'linear-gradient(135deg, #0b2447 0%, #16407A 58%, #2F6FED 100%)'
    : 'linear-gradient(135deg, #24104f 0%, #6C4FD8 45%, #2F6FED 100%)';

  const applyCoupon = () => {
    const normalized = normalizeCouponCode(couponInput);

    if (!normalized) {
      setCouponApplied(false);
      setCouponMessage({ type: 'error', text: 'Enter a coupon code first.' });
      return;
    }

    if (normalized !== availableCouponCode) {
      setCouponApplied(false);
      setCouponMessage({ type: 'error', text: 'That coupon code is not valid.' });
      return;
    }

    setCouponInput(availableCouponCode);
    setCouponApplied(true);
    setCouponMessage({ type: 'success', text: `${availableCouponCode} applied. Coupon pricing is now unlocked.` });
  };

  const clearCoupon = () => {
    setCouponInput('');
    setCouponApplied(false);
    setCouponMessage(null);
  };

  const handleContinue = async () => {
    setSubmitting(true);
    setError('');

    try {
      const { data } = await api.post(`/provider-onboarding/drafts/${draft.draftId}/selection`, {
        planCode: selectedPlan.code,
        durationMonths: selectedDuration,
        couponCode: couponApplied ? availableCouponCode : undefined,
      });

      const sessionId = data.checkoutSession.sessionId as string;
      sessionStorage.setItem(PROVIDER_CHECKOUT_SESSION_KEY, sessionId);
      navigate('/register/checkout', { state: { sessionId } });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to continue to checkout right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-mist">
      <section className="relative overflow-hidden px-4 pt-10 pb-16 text-white" style={{ background: roleGradient }}>
        <div className="absolute inset-0 dot-grid opacity-70" />
        <div className="absolute -top-20 left-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-brand-accent/30 blur-3xl" />
        <div className="relative mx-auto max-w-7xl">
          <Link to="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to details
          </Link>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white/90 glass-dark">
                <GraduationCap className="h-4 w-4 text-amber-300" />
                {roleLabel} setup · Step 2 of 3
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Choose your {roleLabel.toLowerCase()} plan</h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                Your details are saved on the server. Pick the plan and billing duration you want before going to the local checkout placeholder.
              </p>
            </div>

            <div className="glass-dark rounded-3xl border border-white/15 p-5 lg:w-[340px]">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">Selected provider</p>
              <p className="mt-2 text-2xl font-extrabold">{draft.name || roleLabel}</p>
              <p className="mt-1 text-sm text-white/75">{draft.email}</p>
              <p className="mt-4 text-sm text-white/75">
                {draft.role === 'institute'
                  ? draft.location || 'Location will appear here'
                  : draft.subject || 'Primary subject will appear here'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pb-16 -mt-8">
        <div className="rounded-[2rem] border border-white/60 bg-white/90 p-4 shadow-[0_22px_70px_rgba(16,27,45,0.08)] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">Plan pricing</p>
              <h2 className="mt-1 text-2xl font-extrabold text-brand-dark">Flexible billing for every stage</h2>
            </div>
            <div className="flex flex-col gap-3 lg:items-end">
              <div className="flex flex-wrap gap-2 rounded-2xl bg-brand-mist p-1.5">
                {DURATION_OPTIONS.map(option => (
                  <button
                    key={option.months}
                    type="button"
                    onClick={() => setSelectedDuration(option.months)}
                    className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                      selectedDuration === option.months
                        ? 'bg-white text-brand-primary shadow-sm'
                        : 'text-brand-secondary hover:bg-white/70 hover:text-brand-dark'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border border-brand-border bg-slate-50 p-3 sm:min-w-[360px]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-secondary">Coupon</p>
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(event) => {
                        setCouponInput(event.target.value);
                        if (couponMessage) setCouponMessage(null);
                        if (couponApplied && normalizeCouponCode(event.target.value) !== availableCouponCode) {
                          setCouponApplied(false);
                        }
                      }}
                      placeholder="Enter coupon code"
                      className="mt-2 w-full rounded-xl border border-brand-border bg-white px-3 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-brand-dark outline-none transition-all focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/15"
                    />
                    <p className="mt-2 text-xs text-brand-secondary">Use <span className="font-bold text-brand-dark">{availableCouponCode}</span> to unlock the lower launch prices.</p>
                  </div>
                  <div className="flex gap-2 sm:self-end">
                    <button
                      type="button"
                      onClick={applyCoupon}
                      className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-95"
                    >
                      Apply
                    </button>
                    {couponApplied && (
                      <button
                        type="button"
                        onClick={clearCoupon}
                        className="rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm font-bold text-brand-secondary transition-colors hover:text-brand-dark"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {couponMessage && (
                  <div className={`mt-3 rounded-xl px-3 py-2 text-sm ${couponMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {couponMessage.text}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_320px]">
            <div className="xl:col-span-3 grid gap-6 lg:grid-cols-3">
              {plans.map(plan => {
                const selected = plan.code === selectedPlan.code;
                const total = getDisplayedTotal(plan, selectedDuration, couponApplied);
                const elite = plan.cardStyle === 'elite';
                const monthlyPrice = couponApplied ? plan.launchMonthly : plan.originalMonthly;

                return (
                  <article
                    key={plan.code}
                    className={`relative flex h-full flex-col rounded-[2rem] border p-6 transition-all duration-300 ${getCardStyles(plan.cardStyle, selected)}`}
                  >
                    {plan.badge && (
                      <div className={`absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-[0.16em] ${
                        elite ? 'bg-white text-slate-900' : 'bg-brand-primary text-white'
                      }`}>
                        {plan.cardStyle === 'popular' ? <Sparkles className="h-3.5 w-3.5" /> : <Crown className="h-3.5 w-3.5" />}
                        {plan.badge}
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-[0.24em] ${elite ? 'text-white/60' : 'text-brand-secondary'}`}>
                          {plan.audience}
                        </p>
                        <h3 className={`mt-3 text-2xl font-extrabold ${elite ? 'text-white' : 'text-brand-dark'}`}>{plan.name}</h3>
                      </div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${elite ? 'bg-white/10' : plan.cardStyle === 'popular' ? 'bg-brand-primary/10' : 'bg-brand-mist'}`}>
                        {plan.cardStyle === 'elite' ? (
                          <Crown className="h-5 w-5 text-amber-300" />
                        ) : plan.cardStyle === 'popular' ? (
                          <ShieldCheck className="h-5 w-5 text-brand-primary" />
                        ) : (
                          <BadgeCheck className="h-5 w-5 text-brand-accent" />
                        )}
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className={`text-xs font-bold uppercase tracking-[0.2em] ${elite ? 'text-white/55' : 'text-brand-secondary'}`}>
                        {couponApplied ? 'Coupon price' : 'Standard price'}
                      </p>
                      <div className="mt-1 flex items-end gap-2">
                        <span className={`text-4xl font-extrabold tracking-tight ${elite ? 'text-white' : 'text-brand-dark'}`}>
                          {formatPrice(monthlyPrice)}
                        </span>
                        <span className={`pb-1 text-sm font-semibold ${elite ? 'text-white/65' : 'text-brand-secondary'}`}>/month</span>
                      </div>
                      <p className={`mt-2 text-sm ${elite ? 'text-white/65' : 'text-brand-secondary'}`}>
                        {couponApplied ? 'FIRSTFIFTY is active on this plan.' : 'Apply the coupon above to reveal the lower launch pricing.'}
                      </p>
                      <div className={`mt-4 rounded-2xl border px-4 py-3 ${elite ? 'border-white/10 bg-white/5' : 'border-brand-border bg-slate-50'}`}>
                        <p className={`text-xs font-bold uppercase tracking-[0.22em] ${elite ? 'text-white/55' : 'text-brand-secondary'}`}>
                          {selectedDuration} month billing
                        </p>
                        <p className={`mt-1 text-2xl font-extrabold ${elite ? 'text-white' : 'text-brand-dark'}`}>{formatPrice(total)}</p>
                        <p className={`mt-1 text-sm ${elite ? 'text-white/65' : 'text-brand-secondary'}`}>
                          Effective {formatPrice(Math.round(total / selectedDuration))}/month
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPlanCode(plan.code)}
                      className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                        elite
                          ? selected
                            ? 'bg-white text-slate-950 shadow-lg'
                            : 'border border-white/15 bg-white/10 text-white hover:bg-white/16'
                          : plan.cardStyle === 'popular'
                            ? selected
                              ? 'bg-brand-primary text-white shadow-lg'
                              : 'border border-brand-primary/25 bg-brand-primary/5 text-brand-primary hover:bg-brand-primary/10'
                            : selected
                              ? 'bg-brand-accent text-white shadow-lg'
                              : 'border border-brand-border bg-white text-brand-dark hover:border-brand-primary hover:text-brand-primary'
                      }`}
                    >
                      {selected ? 'Selected' : plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <div className="mt-6 flex-1 space-y-4">
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-[0.22em] ${elite ? 'text-white/55' : 'text-brand-secondary'}`}>
                          Included
                        </p>
                        <ul className="mt-3 space-y-2.5">
                          {plan.included.map(feature => (
                            <li key={feature} className={`flex items-start gap-2.5 text-sm ${elite ? 'text-white/85' : 'text-brand-body'}`}>
                              <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${elite ? 'bg-emerald-400/15 text-emerald-300' : 'bg-emerald-50 text-emerald-600'}`}>
                                <Check className="h-3.5 w-3.5" />
                              </span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {plan.plusLabel && plan.extraFeatures && (
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-[0.22em] ${elite ? 'text-white/55' : 'text-brand-secondary'}`}>
                            {plan.plusLabel}
                          </p>
                          <ul className="mt-3 space-y-2.5">
                            {plan.extraFeatures.map(feature => (
                              <li key={feature} className={`flex items-start gap-2.5 text-sm ${elite ? 'text-white/85' : 'text-brand-body'}`}>
                                <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${elite ? 'bg-amber-300/15 text-amber-300' : 'bg-brand-primary/10 text-brand-primary'}`}>
                                  <Sparkles className="h-3.5 w-3.5" />
                                </span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {plan.notIncluded && (
                        <div>
                          <p className={`text-xs font-bold uppercase tracking-[0.22em] ${elite ? 'text-white/55' : 'text-brand-secondary'}`}>
                            Not included
                          </p>
                          <ul className="mt-3 space-y-2.5">
                            {plan.notIncluded.map(feature => (
                              <li key={feature} className={`flex items-start gap-2.5 text-sm ${elite ? 'text-white/45' : 'text-brand-secondary'}`}>
                                <span className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full ${elite ? 'bg-white/8 text-white/45' : 'bg-slate-100 text-slate-400'}`}>
                                  <X className="h-3.5 w-3.5" />
                                </span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="xl:sticky xl:top-24">
              <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-[0_20px_60px_rgba(16,27,45,0.08)]">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">Plan summary</p>
                <h3 className="mt-2 text-2xl font-extrabold text-brand-dark">{selectedPlan.name}</h3>
                <p className="mt-1 text-sm text-brand-secondary">{selectedPlan.audience}</p>

                <div className="mt-5 rounded-2xl bg-brand-mist p-4">
                  <div className="flex items-center justify-between text-sm text-brand-secondary">
                    <span>Duration</span>
                    <span className="font-semibold text-brand-dark">{selectedDuration} month{selectedDuration > 1 ? 's' : ''}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-brand-secondary">
                    <span>{couponApplied ? 'Coupon price' : 'Standard price'}</span>
                    <span className="font-semibold text-brand-dark">{formatPrice(selectedTotal)}</span>
                  </div>
                  {couponApplied && (
                    <div className="mt-3 flex items-center justify-between text-sm text-brand-secondary">
                      <span>Coupon applied</span>
                      <span className="font-semibold text-emerald-600">{availableCouponCode}</span>
                    </div>
                  )}
                  {couponApplied && selectedSavings > 0 && (
                    <div className="mt-3 flex items-center justify-between text-sm text-brand-secondary">
                      <span>Total savings</span>
                      <span className="font-semibold text-emerald-600">{formatPrice(selectedSavings)}</span>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-brand-border pt-3">
                    <span className="text-sm font-semibold text-brand-dark">Effective monthly</span>
                    <span className="text-lg font-extrabold text-brand-primary">{formatPrice(effectiveMonthly)}</span>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5 rounded-2xl border border-brand-border p-4 text-sm text-brand-secondary">
                  <div className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                    <span>Registration details are already stored on the server as a provider draft.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-emerald-500" />
                    <span>Next step uses a local checkout placeholder, so no external payment service is required on this laptop.</span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={submitting}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #2F6FED, #16407A)', boxShadow: '0 10px 32px rgba(47,111,237,0.28)' }}
                >
                  {submitting ? 'Preparing checkout...' : `Continue with ${selectedPlan.name}`}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <p className="mt-3 text-center text-xs text-brand-secondary">
                  The next screen is a local checkout placeholder that you can later swap with Razorpay.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}