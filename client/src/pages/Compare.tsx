import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRightLeft,
  Building2,
  ChevronLeft,
  CheckCircle2,
  Clock3,
  GraduationCap,
  MapPin,
  MessageSquare,
  Search,
  Sparkles,
  Wallet,
  XCircle,
} from 'lucide-react';
import type { Institute, InstituteCourse, ProviderPlanFeatures, Tutor } from '../types';
import StarRating from '../components/StarRating';
import api from '../api/axios';

type CompareSelectionType = 'institute' | 'tutor';

interface CompareSelection {
  id: number;
  type: CompareSelectionType;
}

interface CompareState {
  institutes: Institute[];
  tutors: Tutor[];
  sharedCourseIds: number[];
}

const MAX_COMPARE = 4;

const parseIdList = (value: string | null): number[] => {
  if (!value) return [];

  return value
    .split(',')
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isInteger(entry) && entry > 0);
};

const dedupeSelections = (items: CompareSelection[]): CompareSelection[] => {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.type}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, MAX_COMPARE);
};

const parseSelections = (searchParams: URLSearchParams): CompareSelection[] => {
  const institutes = parseIdList(searchParams.get('institutes')).map((id) => ({ id, type: 'institute' as const }));
  const tutors = parseIdList(searchParams.get('tutors')).map((id) => ({ id, type: 'tutor' as const }));

  if (institutes.length > 0 || tutors.length > 0) {
    return dedupeSelections([...institutes, ...tutors]);
  }

  const legacyType = searchParams.get('type');
  const legacyIds = parseIdList(searchParams.get('ids'));
  if (legacyType === 'institute' || legacyType === 'tutor') {
    return dedupeSelections(legacyIds.map((id) => ({ id, type: legacyType })));
  }

  return [];
};

const buildSelectionParams = (items: CompareSelection[]) => {
  const params = new URLSearchParams();
  const institutes = items.filter((item) => item.type === 'institute').map((item) => item.id);
  const tutors = items.filter((item) => item.type === 'tutor').map((item) => item.id);

  if (institutes.length > 0) params.set('institutes', institutes.join(','));
  if (tutors.length > 0) params.set('tutors', tutors.join(','));

  return params;
};

const orderBySelection = <T extends { id: number }>(items: T[], ids: number[]) => (
  ids.map((id) => items.find((item) => item.id === id)).filter(Boolean) as T[]
);

const formatImageAllowance = (features?: ProviderPlanFeatures) => {
  if (!features) return 'Not specified';
  if (features.maxImages === null) return 'Unlimited gallery';
  if (features.maxImages === 0) return 'No gallery';
  return `${features.maxImages} image${features.maxImages === 1 ? '' : 's'} max`;
};

const getInstitutePriceSummary = (institute: Institute) => {
  const courses = institute.courses || [];
  if (courses.length === 0) return 'Contact for pricing';

  const numericFees = courses
    .map((course) => Number.parseFloat(course.fee_structure.replace(/[^0-9.]/g, '')))
    .filter((fee) => Number.isFinite(fee));

  if (numericFees.length === 0) return courses[0].fee_structure;

  const lowestFee = Math.min(...numericFees);
  return `From ₹${lowestFee.toLocaleString('en-IN')}`;
};

const getInstituteFocus = (institute: Institute) => {
  const courses = institute.courses || [];
  if (courses.length === 0) return 'Course catalogue not added yet';
  if (courses.length === 1) return courses[0].course_name;
  return `${courses[0].course_name} + ${courses.length - 1} more`;
};

const getTutorAvailabilitySummary = (tutor: Tutor) => {
  if (!tutor.availability || tutor.availability.length === 0) return 'Availability not added';
  return tutor.availability.map((slot) => slot.day_of_week.slice(0, 3)).join(', ');
};

const getModeLabel = (mode: Tutor['mode']) => {
  if (mode === 'both') return 'Online + Offline';
  return mode.charAt(0).toUpperCase() + mode.slice(1);
};

const getAudienceFit = (item: Institute | Tutor, type: CompareSelectionType) => {
  if (type === 'institute') {
    const institute = item as Institute;
    const courseCount = institute.courses?.length || 0;
    return courseCount > 1
      ? `Learners comparing structured programs across ${courseCount} courses.`
      : 'Learners looking for a full institute-led program.';
  }

  const tutor = item as Tutor;
  return tutor.experience_years > 4
    ? 'Learners who want direct mentor attention and deeper one-to-one guidance.'
    : 'Learners who want flexible personal support around one main subject.';
};

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedSelections = useMemo(() => parseSelections(searchParams), [searchParams]);

  const [selected, setSelected] = useState<CompareSelection[]>(parsedSelections);
  const [featuredInstitutes, setFeaturedInstitutes] = useState<Institute[]>([]);
  const [featuredTutors, setFeaturedTutors] = useState<Tutor[]>([]);
  const [pickerMode, setPickerMode] = useState<'all' | 'institute' | 'tutor'>('all');
  const [compareState, setCompareState] = useState<CompareState>({ institutes: [], tutors: [], sharedCourseIds: [] });
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [compareNotice, setCompareNotice] = useState('');

  useEffect(() => {
    setSelected(parsedSelections);
  }, [parsedSelections]);

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get('/institutes?limit=6'),
      api.get('/tutors?limit=6'),
    ])
      .then(([institutesRes, tutorsRes]) => {
        if (!active) return;
        setFeaturedInstitutes(institutesRes.data);
        setFeaturedTutors(tutorsRes.data);
      })
      .catch(() => {
        if (!active) return;
        setFeaturedInstitutes([]);
        setFeaturedTutors([]);
      })
      .finally(() => {
        if (active) setLoadingCatalog(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const instituteIds = parsedSelections.filter((item) => item.type === 'institute').map((item) => item.id);
    const tutorIds = parsedSelections.filter((item) => item.type === 'tutor').map((item) => item.id);

    if (parsedSelections.length < 2) {
      setCompareState({ institutes: [], tutors: [], sharedCourseIds: [] });
      setCompareNotice(parsedSelections.length === 1 ? 'Pick at least one more profile to start comparing.' : 'Choose any 2 to 4 institutes, tutors, or a mix of both.');
      setLoadingComparison(false);
      return;
    }

    let active = true;
    setLoadingComparison(true);
    setCompareNotice('');

    const requests: Promise<any>[] = [];

    if (instituteIds.length > 0) {
      requests.push(api.get('/search/compare', { params: { ids: instituteIds.join(','), type: 'institute' } }));
    }

    if (tutorIds.length > 0) {
      requests.push(api.get('/search/compare', { params: { ids: tutorIds.join(','), type: 'tutor' } }));
    }

    Promise.all(requests)
      .then((responses) => {
        if (!active) return;

        const institutePayload = responses.find((response) => response.data.type === 'institute')?.data;
        const tutorPayload = responses.find((response) => response.data.type === 'tutor')?.data;

        const orderedInstitutes = orderBySelection<Institute>(institutePayload?.items || [], instituteIds);
        const orderedTutors = orderBySelection<Tutor>(tutorPayload?.items || [], tutorIds);

        setCompareState({
          institutes: orderedInstitutes,
          tutors: orderedTutors,
          sharedCourseIds: institutePayload?.sharedCourseIds || [],
        });

        const loadedCount = orderedInstitutes.length + orderedTutors.length;
        if (loadedCount < 2) {
          setCompareNotice('Some selected profiles are no longer available for public comparison. Pick at least 2 active profiles.');
        } else if (loadedCount < parsedSelections.length) {
          setCompareNotice('A few selected profiles were skipped because they are not publicly available right now.');
        }
      })
      .catch((error) => {
        if (!active) return;
        setCompareState({ institutes: [], tutors: [], sharedCourseIds: [] });
        setCompareNotice(error.response?.data?.error || 'Unable to load comparison right now. Try adjusting your selections.');
      })
      .finally(() => {
        if (active) setLoadingComparison(false);
      });

    return () => {
      active = false;
    };
  }, [parsedSelections]);

  const selectedInstituteIds = selected.filter((item) => item.type === 'institute').map((item) => item.id);
  const selectedTutorIds = selected.filter((item) => item.type === 'tutor').map((item) => item.id);
  const comparedCount = compareState.institutes.length + compareState.tutors.length;
  const isMixedComparison = compareState.institutes.length > 0 && compareState.tutors.length > 0;
  const canCompare = selected.length >= 2;

  const comparedCards = [
    ...compareState.institutes.map((institute) => ({
      id: institute.id,
      type: 'institute' as const,
      title: institute.name,
      subtitle: institute.location,
      href: `/institute/${institute.id}`,
      rating: institute.avg_rating,
      reviewCount: institute.review_count,
      accent: 'border-sky-200 bg-white',
      badge: institute.subscription_plan_name || 'Institute',
      highlight: getInstituteFocus(institute),
    })),
    ...compareState.tutors.map((tutor) => ({
      id: tutor.id,
      type: 'tutor' as const,
      title: tutor.name,
      subtitle: tutor.subject,
      href: `/tutor/${tutor.id}`,
      rating: tutor.avg_rating,
      reviewCount: tutor.review_count,
      accent: 'border-amber-200 bg-white',
      badge: tutor.subscription_plan_name || 'Tutor',
      highlight: `${getModeLabel(tutor.mode)} · ${tutor.experience_years} yrs exp`,
    })),
  ].sort((left, right) => {
    const leftIndex = parsedSelections.findIndex((item) => item.type === left.type && item.id === left.id);
    const rightIndex = parsedSelections.findIndex((item) => item.type === right.type && item.id === right.id);
    return leftIndex - rightIndex;
  });

  const catalogInstitutes = pickerMode === 'tutor' ? [] : featuredInstitutes;
  const catalogTutors = pickerMode === 'institute' ? [] : featuredTutors;

  const selectionLabels = selected.map((item) => {
    const institute = featuredInstitutes.find((entry) => entry.id === item.id);
    const tutor = featuredTutors.find((entry) => entry.id === item.id);
    return {
      key: `${item.type}-${item.id}`,
      type: item.type,
      id: item.id,
      label: item.type === 'institute'
        ? institute?.name || compareState.institutes.find((entry) => entry.id === item.id)?.name || `Institute #${item.id}`
        : tutor?.name || compareState.tutors.find((entry) => entry.id === item.id)?.name || `Tutor #${item.id}`,
    };
  });

  const toggleSelection = (id: number, type: CompareSelectionType) => {
    setSelected((current) => {
      const exists = current.some((item) => item.id === id && item.type === type);
      if (exists) return current.filter((item) => !(item.id === id && item.type === type));
      if (current.length >= MAX_COMPARE) return current;
      return [...current, { id, type }];
    });
  };

  const applyComparison = () => {
    if (!canCompare) return;
    setSearchParams(buildSelectionParams(selected));
  };

  const clearSelections = () => {
    setSelected([]);
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(47,111,237,0.08),_transparent_40%),linear-gradient(180deg,_#f8fbff_0%,_#ffffff_38%,_#f8fafc_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Link to="/search" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-sky-700">
                <ChevronLeft className="h-4 w-4" />
                Back to search
              </Link>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-sky-700">
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Compare workspace
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Compare institutes, tutors, or both together</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                Build a short list, view the strongest differences side by side, and mix institute-level options with individual tutors when you want a practical shortlist instead of a strict like-for-like list.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600 md:max-w-xs">
              <p className="font-semibold text-slate-900">Comparison rules</p>
              <p className="mt-2">Choose any 2 to 4 profiles. Mixed comparison works now, so you can evaluate academy-led programs against direct tutor support in one place.</p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">Build your shortlist</p>
                  <p className="mt-1 text-sm text-slate-600">Start here when you open Compare directly from the homepage or navbar.</p>
                </div>
                <div className="flex rounded-2xl bg-white p-1 shadow-sm">
                  {(['all', 'institute', 'tutor'] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPickerMode(option)}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${pickerMode === option ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                      {option === 'all' ? 'All options' : option === 'institute' ? 'Institutes only' : 'Tutors only'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {selectionLabels.length > 0 ? selectionLabels.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleSelection(item.id, item.type)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${item.type === 'institute' ? 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300' : 'border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300'}`}
                  >
                    {item.label} · remove
                  </button>
                )) : (
                  <p className="text-sm text-slate-500">No selections yet. Pick at least 2 profiles to compare.</p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{selected.length}</span> selected
                  <span className="mx-2 text-slate-300">•</span>
                  {selectedInstituteIds.length} institutes
                  <span className="mx-2 text-slate-300">•</span>
                  {selectedTutorIds.length} tutors
                </div>
                <button
                  type="button"
                  onClick={applyComparison}
                  disabled={!canCompare}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Compare selected
                </button>
                <button
                  type="button"
                  onClick={clearSelections}
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                >
                  Clear
                </button>
                <Link to="/search" className="text-sm font-semibold text-sky-700 hover:text-sky-800">Find more profiles in search</Link>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-[linear-gradient(145deg,_#0f172a,_#1d4ed8)] p-5 text-white">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
                <Sparkles className="h-3.5 w-3.5" />
                Better decision support
              </div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
                <p>Use mixed comparison when the real decision is “structured institute program or personal tutor support?” rather than “which two academies look identical on paper?”</p>
                <p>The workspace highlights pricing style, learning format, review access, enquiry access, and gallery limits so plan restrictions do not create confusing empty sections.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 xl:grid-cols-[1.25fr_1fr]">
          <div className="space-y-8">
            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Pick featured institutes and tutors</p>
                  <p className="mt-1 text-sm text-slate-600">Fast starting point for live demos and first-time visitors.</p>
                </div>
                {selected.length >= MAX_COMPARE && (
                  <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Max {MAX_COMPARE} selections reached
                  </div>
                )}
              </div>

              {loadingCatalog ? (
                <div className="py-12 text-center text-sm text-slate-400">Loading suggestions...</div>
              ) : (
                <div className="mt-6 space-y-8">
                  {catalogInstitutes.length > 0 && (
                    <div>
                      <div className="mb-4 flex items-center gap-2 text-slate-900">
                        <Building2 className="h-5 w-5 text-sky-600" />
                        <h2 className="text-lg font-bold">Institutes</h2>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {catalogInstitutes.map((institute) => {
                          const isSelected = selected.some((item) => item.type === 'institute' && item.id === institute.id);
                          return (
                            <div key={institute.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-sky-300">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{institute.name}</p>
                                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {institute.location}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleSelection(institute.id, 'institute')}
                                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${isSelected ? 'bg-sky-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-sky-50 hover:text-sky-700'}`}
                                >
                                  {isSelected ? 'Added' : 'Add'}
                                </button>
                              </div>
                              <div className="mt-4 flex items-center justify-between gap-3">
                                <StarRating rating={institute.avg_rating} count={institute.review_count} size="sm" />
                                <Link to={`/institute/${institute.id}`} className="text-xs font-semibold text-sky-700 hover:text-sky-800">View profile</Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {catalogTutors.length > 0 && (
                    <div>
                      <div className="mb-4 flex items-center gap-2 text-slate-900">
                        <GraduationCap className="h-5 w-5 text-amber-500" />
                        <h2 className="text-lg font-bold">Tutors</h2>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {catalogTutors.map((tutor) => {
                          const isSelected = selected.some((item) => item.type === 'tutor' && item.id === tutor.id);
                          return (
                            <div key={tutor.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-amber-300">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-bold text-slate-900">{tutor.name}</p>
                                  <p className="mt-1 text-xs text-amber-700">{tutor.subject}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleSelection(tutor.id, 'tutor')}
                                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${isSelected ? 'bg-amber-500 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-amber-50 hover:text-amber-700'}`}
                                >
                                  {isSelected ? 'Added' : 'Add'}
                                </button>
                              </div>
                              <div className="mt-4 flex items-center justify-between gap-3">
                                <StarRating rating={tutor.avg_rating} count={tutor.review_count} size="sm" />
                                <Link to={`/tutor/${tutor.id}`} className="text-xs font-semibold text-amber-700 hover:text-amber-800">View profile</Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900">
                <Search className="h-4 w-4 text-sky-600" />
                <h2 className="text-lg font-bold">Comparison snapshot</h2>
              </div>

              {loadingComparison ? (
                <div className="py-12 text-center text-sm text-slate-400">Loading comparison...</div>
              ) : comparedCount >= 2 ? (
                <div className="mt-5 space-y-4">
                  {comparedCards.map((card) => (
                    <div key={`${card.type}-${card.id}`} className={`rounded-3xl border p-4 ${card.accent}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                            {card.badge}
                          </div>
                          <p className="mt-3 text-sm font-bold text-slate-950">{card.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{card.subtitle}</p>
                        </div>
                        <Link to={card.href} className="text-xs font-semibold text-sky-700 hover:text-sky-800">View</Link>
                      </div>
                      <div className="mt-4">
                        <StarRating rating={card.rating} count={card.reviewCount} size="sm" />
                      </div>
                      <p className="mt-3 text-xs text-slate-600">{card.highlight}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <XCircle className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-4 text-sm font-semibold text-slate-800">No active comparison yet</p>
                  <p className="mt-2 text-sm text-slate-500">Pick two or more profiles from the selector on the left, then open the compare workspace.</p>
                </div>
              )}

              {compareNotice && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {compareNotice}
                </div>
              )}
            </section>
          </div>
        </div>

        {comparedCount >= 2 && !loadingComparison && (
          <div className="space-y-6">
            <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Detailed comparison</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {isMixedComparison
                      ? 'Cross-type view shows how each option differs in learning format, pricing style, and access.'
                      : compareState.institutes.length > 0
                        ? 'Institute comparison keeps course, teacher, and contact details aligned.'
                        : 'Tutor comparison keeps cost, subject, availability, and teaching format aligned.'}
                  </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {isMixedComparison ? 'Mixed compare' : compareState.institutes.length > 0 ? 'Institute compare' : 'Tutor compare'}
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-600">
                      <th className="px-4 py-3 font-semibold">What matters</th>
                      {comparedCards.map((card) => (
                        <th key={`${card.type}-${card.id}`} className="px-4 py-3 font-semibold text-slate-900">{card.title}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-3 text-slate-500">Provider type</td>
                      {comparedCards.map((card) => <td key={`${card.type}-${card.id}`} className="px-4 py-3 text-slate-700">{card.type === 'institute' ? 'Institute' : 'Tutor'}</td>)}
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td className="px-4 py-3 text-slate-500">Learning focus</td>
                      {comparedCards.map((card) => {
                        const institute = card.type === 'institute' ? compareState.institutes.find((entry) => entry.id === card.id) : undefined;
                        const tutor = card.type === 'tutor' ? compareState.tutors.find((entry) => entry.id === card.id) : undefined;
                        return <td key={`${card.type}-${card.id}`} className="px-4 py-3 text-slate-700">{institute ? getInstituteFocus(institute) : tutor?.subject || 'Subject not listed'}</td>;
                      })}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-500">Format</td>
                      {comparedCards.map((card) => {
                        const tutor = card.type === 'tutor' ? compareState.tutors.find((entry) => entry.id === card.id) : undefined;
                        return <td key={`${card.type}-${card.id}`} className="px-4 py-3 text-slate-700">{card.type === 'institute' ? 'Structured program at institute level' : tutor ? getModeLabel(tutor.mode) : 'Not specified'}</td>;
                      })}
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td className="px-4 py-3 text-slate-500">Pricing</td>
                      {comparedCards.map((card) => {
                        const institute = card.type === 'institute' ? compareState.institutes.find((entry) => entry.id === card.id) : undefined;
                        const tutor = card.type === 'tutor' ? compareState.tutors.find((entry) => entry.id === card.id) : undefined;
                        return <td key={`${card.type}-${card.id}`} className="px-4 py-3 text-slate-700">{institute ? getInstitutePriceSummary(institute) : tutor && tutor.hourly_rate > 0 ? `₹${tutor.hourly_rate}/hr` : 'Negotiable'}</td>;
                      })}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-500">Reach</td>
                      {comparedCards.map((card) => {
                        const institute = card.type === 'institute' ? compareState.institutes.find((entry) => entry.id === card.id) : undefined;
                        const tutor = card.type === 'tutor' ? compareState.tutors.find((entry) => entry.id === card.id) : undefined;
                        return <td key={`${card.type}-${card.id}`} className="px-4 py-3 text-slate-700">{institute ? institute.location : tutor ? getTutorAvailabilitySummary(tutor) : 'Not specified'}</td>;
                      })}
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td className="px-4 py-3 text-slate-500">Reviews</td>
                      {comparedCards.map((card) => {
                        const item = card.type === 'institute'
                          ? compareState.institutes.find((entry) => entry.id === card.id)
                          : compareState.tutors.find((entry) => entry.id === card.id);
                        return <td key={`${card.type}-${card.id}`} className="px-4 py-3 text-slate-700">{item?.plan_features?.reviewsEnabled ? `${item.review_count} review${item.review_count === 1 ? '' : 's'}` : 'Not enabled on current plan'}</td>;
                      })}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-500">Enquiries</td>
                      {comparedCards.map((card) => {
                        const item = card.type === 'institute'
                          ? compareState.institutes.find((entry) => entry.id === card.id)
                          : compareState.tutors.find((entry) => entry.id === card.id);
                        return <td key={`${card.type}-${card.id}`} className="px-4 py-3 text-slate-700">{item?.plan_features?.enquiriesEnabled ? 'Direct enquiries available' : 'No enquiry inbox on current plan'}</td>;
                      })}
                    </tr>
                    <tr className="bg-slate-50/70">
                      <td className="px-4 py-3 text-slate-500">Gallery</td>
                      {comparedCards.map((card) => {
                        const item = card.type === 'institute'
                          ? compareState.institutes.find((entry) => entry.id === card.id)
                          : compareState.tutors.find((entry) => entry.id === card.id);
                        return <td key={`${card.type}-${card.id}`} className="px-4 py-3 text-slate-700">{formatImageAllowance(item?.plan_features)}</td>;
                      })}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-slate-500">Best suited for</td>
                      {comparedCards.map((card) => {
                        const item = card.type === 'institute'
                          ? compareState.institutes.find((entry) => entry.id === card.id)
                          : compareState.tutors.find((entry) => entry.id === card.id);
                        return <td key={`${card.type}-${card.id}`} className="px-4 py-3 text-slate-700">{item ? getAudienceFit(item, card.type) : 'Not available'}</td>;
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {compareState.institutes.length > 0 && (
              <div className="space-y-6">
                {compareState.sharedCourseIds.length > 0 && (
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-6">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-emerald-900">
                      <CheckCircle2 className="h-5 w-5" />
                      Shared courses side by side
                    </h3>
                    <p className="mt-2 text-sm text-emerald-800">These courses appear across every selected institute, which makes price and duration comparison easier.</p>
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b border-emerald-200 text-left text-emerald-800">
                            <th className="px-3 py-2 font-semibold">Course</th>
                            {compareState.institutes.map((institute) => (
                              <th key={institute.id} className="px-3 py-2 text-center font-semibold">{institute.name}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {compareState.sharedCourseIds.map((courseId) => {
                            const course = compareState.institutes[0].courses?.find((entry: InstituteCourse) => entry.course_id === courseId);
                            if (!course) return null;

                            return (
                              <tr key={courseId} className="border-b border-emerald-100">
                                <td className="px-3 py-3 font-medium text-slate-800">{course.course_name}</td>
                                {compareState.institutes.map((institute) => {
                                  const selectedCourse = institute.courses?.find((entry: InstituteCourse) => entry.course_id === courseId);
                                  return (
                                    <td key={institute.id} className="px-3 py-3 text-center text-slate-700">
                                      {selectedCourse ? (
                                        <div>
                                          <p className="font-semibold text-slate-900">{selectedCourse.fee_structure}</p>
                                          {selectedCourse.duration && <p className="text-xs text-slate-500">{selectedCourse.duration}</p>}
                                        </div>
                                      ) : '—'}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-100 px-6 py-5">
                    <h3 className="text-lg font-bold text-slate-900">Institute detail view</h3>
                  </div>
                  <div className={`grid divide-slate-100 ${compareState.institutes.length === 2 ? 'md:grid-cols-2 md:divide-x' : compareState.institutes.length === 3 ? 'md:grid-cols-3 md:divide-x' : 'md:grid-cols-2 xl:grid-cols-4 xl:divide-x'}`}>
                    {compareState.institutes.map((institute) => (
                      <div key={institute.id} className="space-y-5 p-6">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{institute.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{institute.description || 'Profile summary not added yet.'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Courses</p>
                          <div className="mt-2 space-y-2">
                            {institute.courses && institute.courses.length > 0 ? institute.courses.map((course: InstituteCourse) => (
                              <div key={course.course_id} className={`rounded-2xl border p-3 text-xs ${compareState.sharedCourseIds.includes(course.course_id) ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                                <p className="font-semibold text-slate-900">{course.course_name}</p>
                                <p className="text-slate-600">{course.fee_structure}</p>
                                {course.duration && <p className="text-slate-400">{course.duration}</p>}
                              </div>
                            )) : <p className="text-xs text-slate-400">No courses listed</p>}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Star teachers</p>
                          <div className="mt-2 space-y-2">
                            {institute.star_teachers && institute.star_teachers.length > 0 ? institute.star_teachers.map((teacher) => (
                              <div key={`${institute.id}-${teacher.id}`} className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2">
                                <p className="text-xs font-semibold text-slate-900">{teacher.name}</p>
                                <p className="text-xs text-slate-500">{teacher.subject}</p>
                              </div>
                            )) : <p className="text-xs text-slate-400">No star teachers listed on this plan.</p>}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Contact</p>
                          <div className="mt-2 space-y-1 text-xs text-slate-600">
                            {institute.contact_email && <p>{institute.contact_email}</p>}
                            {institute.contact_phone && <p>{institute.contact_phone}</p>}
                            {institute.contact_website && <p className="break-all text-sky-700">{institute.contact_website}</p>}
                            {!institute.contact_email && !institute.contact_phone && !institute.contact_website && <p className="text-slate-400">Contact details not added</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {compareState.tutors.length > 0 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="border-b border-slate-100 px-6 py-5">
                    <h3 className="text-lg font-bold text-slate-900">Tutor metrics</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-left text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Metric</th>
                          {compareState.tutors.map((tutor) => (
                            <th key={tutor.id} className="px-4 py-3 text-center font-semibold">{tutor.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="px-4 py-3 text-slate-600">Subject</td>
                          {compareState.tutors.map((tutor) => <td key={tutor.id} className="px-4 py-3 text-center font-semibold text-slate-900">{tutor.subject}</td>)}
                        </tr>
                        <tr className="bg-slate-50/70">
                          <td className="px-4 py-3 text-slate-600">Hourly rate</td>
                          {compareState.tutors.map((tutor) => <td key={tutor.id} className="px-4 py-3 text-center font-semibold text-slate-900">{tutor.hourly_rate > 0 ? `₹${tutor.hourly_rate}/hr` : 'Negotiable'}</td>)}
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-slate-600">Experience</td>
                          {compareState.tutors.map((tutor) => <td key={tutor.id} className="px-4 py-3 text-center font-semibold text-slate-900">{tutor.experience_years} yrs</td>)}
                        </tr>
                        <tr className="bg-slate-50/70">
                          <td className="px-4 py-3 text-slate-600">Mode</td>
                          {compareState.tutors.map((tutor) => <td key={tutor.id} className="px-4 py-3 text-center text-slate-700">{getModeLabel(tutor.mode)}</td>)}
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-slate-600">Availability</td>
                          {compareState.tutors.map((tutor) => <td key={tutor.id} className="px-4 py-3 text-center text-slate-700">{getTutorAvailabilitySummary(tutor)}</td>)}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={`grid gap-4 ${compareState.tutors.length === 2 ? 'md:grid-cols-2' : compareState.tutors.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-4'}`}>
                  {compareState.tutors.map((tutor) => (
                    <div key={tutor.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                      <p className="text-sm font-bold text-slate-900">{tutor.name}</p>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">{tutor.bio || 'No bio provided yet.'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isMixedComparison && (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                    <p className="font-bold">Pricing style</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Institutes usually compare on course packages, while tutors compare on hourly or personal-session pricing. Showing both together helps when you are deciding on budget shape, not just the amount.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-900">
                    <Clock3 className="h-4 w-4 text-sky-500" />
                    <p className="font-bold">Time commitment</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Institutes are stronger for fixed program structure. Tutors are stronger when you want adaptable pacing, catch-up help, or focused improvement in one subject.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-900">
                    <MessageSquare className="h-4 w-4 text-amber-500" />
                    <p className="font-bold">Contact readiness</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Plan-gated fields stay visible here as plain-language availability so users understand why some profiles allow enquiries or reviews and others do not.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}