import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen, ArrowRight, Sparkles, MapPin, ChevronDown } from 'lucide-react';
import type { Institute, Tutor } from '../types';
import InstituteCard from '../components/InstituteCard';
import TutorCard from '../components/TutorCard';
import api from '../api/axios';

const CITIES = [
  'All India','Delhi','Mumbai','Bangalore','Hyderabad','Chennai',
  'Kolkata','Pune','Ahmedabad','Jaipur','Lucknow','Chandigarh','Noida','Gurugram',
];

const POPULAR_SEARCHES = [
  'JEE Coaching','NEET','IELTS','CUET','UPSC','Class 10 Maths','Spoken English','Python',
];

const CATEGORY_GROUPS = [
  {
    key: 'jee-neet',
    label: 'JEE / NEET',
    emoji: '🔬',
    gradient: 'from-violet-500 to-purple-700',
    ring: 'ring-violet-400/40',
    activeText: 'text-violet-700',
    activeBg: 'bg-violet-50 border-violet-300',
    subs: [
      { label: 'JEE Mains', q: 'JEE Mains' },
      { label: 'JEE Advanced', q: 'JEE Advanced' },
      { label: 'JEE Mains + Advanced', q: 'JEE Mains Advanced' },
      { label: 'NEET', q: 'NEET' },
      { label: 'Foundation (Cl. 9–10)', q: 'JEE NEET Foundation' },
    ],
  },
  {
    key: 'board-prep',
    label: 'Board Prep',
    emoji: '📝',
    gradient: 'from-amber-500 to-orange-500',
    ring: 'ring-amber-400/40',
    activeText: 'text-amber-700',
    activeBg: 'bg-amber-50 border-amber-300',
    subs: [
      { label: 'Class 10', q: 'Class 10 Board' },
      { label: 'Class 11', q: 'Class 11' },
      { label: 'Class 12', q: 'Class 12 Board' },
    ],
  },
  {
    key: 'school-tutor',
    label: 'School Tutor',
    emoji: '🏫',
    gradient: 'from-blue-500 to-brand-primary',
    ring: 'ring-blue-400/40',
    activeText: 'text-brand-primary',
    activeBg: 'bg-brand-mist border-brand-primary',
    subs: [
      { label: 'Class 5', q: 'Class 5' },
      { label: 'Class 6', q: 'Class 6' },
      { label: 'Class 7', q: 'Class 7' },
      { label: 'Class 8', q: 'Class 8' },
      { label: 'Class 9', q: 'Class 9' },
    ],
    subjects: [
      { label: 'Maths', q: 'School Maths' },
      { label: 'Science', q: 'School Science' },
      { label: 'English', q: 'School English' },
      { label: 'Hindi', q: 'School Hindi' },
      { label: 'Social Science', q: 'Social Science' },
      { label: 'Computer', q: 'School Computer' },
    ],
  },
  {
    key: 'competitive',
    label: 'Competitive Exams',
    emoji: '🏆',
    gradient: 'from-emerald-500 to-teal-600',
    ring: 'ring-emerald-400/40',
    activeText: 'text-emerald-700',
    activeBg: 'bg-emerald-50 border-emerald-300',
    subs: [
      { label: 'UPSC', q: 'UPSC' },
      { label: 'BSc Agriculture', q: 'BSc Agriculture' },
      { label: 'Banking / SSC', q: 'Banking SSC' },
      { label: 'CUET', q: 'CUET' },
      { label: 'CLAT', q: 'CLAT' },
      { label: 'NDA', q: 'NDA' },
      { label: 'CET', q: 'CET' },
    ],
  },
  {
    key: 'languages',
    label: 'Languages',
    emoji: '🗣️',
    gradient: 'from-pink-500 to-rose-500',
    ring: 'ring-pink-400/40',
    activeText: 'text-rose-700',
    activeBg: 'bg-pink-50 border-pink-300',
    subs: [
      { label: 'Spoken English', q: 'Spoken English' },
      { label: 'IELTS', q: 'IELTS' },
      { label: 'Hindi', q: 'Hindi language' },
      { label: 'Sanskrit', q: 'Sanskrit' },
      { label: 'French', q: 'French language' },
      { label: 'German', q: 'German language' },
    ],
  },
] as const;

export default function Home() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [lookingFor, setLookingFor] = useState<'institute' | 'tutor' | 'both'>('both');
  const [mode, setMode] = useState<'online' | 'offline' | 'both'>('both');
  const [featuredInstitutes, setFeaturedInstitutes] = useState<Institute[]>([]);
  const [featuredTutors, setFeaturedTutors] = useState<Tutor[]>([]);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/institutes?limit=4').then(({ data }) => setFeaturedInstitutes(data)).catch(() => {});
    api.get('/tutors?limit=4').then(({ data }) => setFeaturedTutors(data)).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (lookingFor !== 'both') params.set('type', lookingFor);
    if (city && city !== 'All India') params.set('location', city);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero */}
      <section className="relative text-white pt-24 pb-36 px-4 overflow-hidden" style={{background: 'linear-gradient(135deg, #0b2447 0%, #16407A 40%, #1a5296 70%, #0d1f44 100%)'}}>
        {/* Ambient orbs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full opacity-30 animate-float pointer-events-none" style={{background: 'radial-gradient(circle, #6C4FD8, transparent 70%)', filter: 'blur(60px)'}} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 animate-float-slow pointer-events-none" style={{background: 'radial-gradient(circle, #2F6FED, transparent 70%)', filter: 'blur(80px)'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] rounded-full opacity-15 pointer-events-none" style={{background: 'radial-gradient(circle, #EAF2FA, transparent 70%)', filter: 'blur(60px)'}} />
        <div className="absolute inset-0 dot-grid pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 glass-dark border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium text-violet-200 mb-7">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            India's #1 education discovery platform
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-none tracking-tight mb-5">
            <span className="block text-white drop-shadow-lg">Find the Best</span>
            <span className="block mt-2 text-transparent bg-clip-text" style={{backgroundImage: 'linear-gradient(90deg, #EAF2FA, #a5c8f0, #EAF2FA)', backgroundSize: '200% auto', animation: 'shimmer-text 3s linear infinite'}}>
              Institutes & Tutors
            </span>
          </h1>

          <p className="text-purple-200 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Search, compare and connect with top-rated educational institutes and expert tutors across India.
          </p>
        </div>
      </section>

      {/* ── Advanced Search Card ───────────────────────────── */}
      <div className="relative z-10 -mt-16 px-4">
        <form onSubmit={handleSearch} className="max-w-6xl mx-auto bg-white rounded-3xl p-6 md:p-8" style={{boxShadow: '0 20px 60px rgba(22,64,122,0.18), 0 4px 16px rgba(22,64,122,0.08)'}}>

          {/* 5-column row */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_170px_210px_210px_auto] gap-4 items-end">

            {/* 1 — Search input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider">What do you want to learn?</label>
              <div className="flex items-center gap-2.5 border border-brand-border rounded-xl px-3.5 py-[11px] focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-transparent transition-all">
                <Search className="w-4 h-4 text-brand-secondary flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="e.g. JEE Coaching, Python, IELTS…"
                  className="flex-1 outline-none text-sm text-brand-body placeholder-brand-secondary bg-transparent"
                />
              </div>
            </div>

            {/* 2 — City */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider">City</label>
              <div className="relative flex items-center border border-brand-border rounded-xl px-3.5 py-[11px] focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-transparent transition-all">
                <MapPin className="w-4 h-4 text-brand-secondary mr-2 flex-shrink-0" />
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="flex-1 outline-none text-sm text-brand-body bg-transparent appearance-none cursor-pointer pr-4"
                >
                  {CITIES.map(c => <option key={c} value={c === 'All India' ? '' : c}>{c}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-brand-secondary absolute right-3 pointer-events-none" />
              </div>
            </div>

            {/* 3 — Looking for (3-way toggle) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider">I am looking for</label>
              <div className="flex bg-brand-mist rounded-xl p-1 gap-0.5">
                {(['institute', 'tutor', 'both'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLookingFor(opt)}
                    className={`flex-1 text-[11px] font-bold py-2.5 rounded-lg transition-all ${
                      lookingFor === opt
                        ? 'bg-white text-brand-primary shadow-sm'
                        : 'text-brand-secondary hover:text-brand-dark hover:bg-brand-dark/10'
                    }`}
                  >
                    {opt === 'institute' ? 'Academy' : opt === 'tutor' ? 'Tutor' : 'Both'}
                  </button>
                ))}
              </div>
            </div>

            {/* 4 — Mode (3-way toggle) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider">Mode</label>
              <div className="flex bg-brand-mist rounded-xl p-1 gap-0.5">
                {(['online', 'offline', 'both'] as const).map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setMode(opt)}
                    className={`flex-1 text-[11px] font-bold py-2.5 rounded-lg capitalize transition-all ${
                      mode === opt
                        ? 'bg-white text-brand-accent shadow-sm'
                        : 'text-brand-secondary hover:text-brand-dark hover:bg-brand-dark/10'
                    }`}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* 5 — Search button */}
            <button
              type="submit"
              className="flex items-center justify-center gap-2 text-white font-bold px-7 py-[13px] rounded-2xl transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.97] whitespace-nowrap"
              style={{background: 'linear-gradient(135deg, #6C4FD8, #2F6FED)', boxShadow: '0 6px 24px rgba(108,79,216,0.35)'}}
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </div>

          {/* Popular searches */}
          <div className="flex items-center flex-wrap gap-2 mt-5 pt-5 border-t border-brand-border">
            <span className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider mr-1 shrink-0">Popular:</span>
            {POPULAR_SEARCHES.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => setQuery(tag)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-border text-brand-secondary hover:border-brand-primary hover:text-brand-primary hover:bg-brand-mist transition-all"
              >
                {tag}
              </button>
            ))}
            <Link
              to="/search"
              className="ml-auto text-xs font-semibold text-brand-primary hover:text-brand-dark flex items-center gap-1 whitespace-nowrap"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </form>
      </div>

      {/* Popular Categories */}
      <section className="py-14 px-4 bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-1">Explore by category</p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-brand-dark tracking-tight">Browse popular subjects</h2>
            <Link to="/search" className="inline-flex items-center gap-1.5 text-brand-primary hover:text-brand-dark font-semibold text-sm group mt-3">
              View all categories <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Category buttons + shared dropdown panel */}
          <div onMouseLeave={() => setHoveredCat(null)}>

            {/* 5 category buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              {CATEGORY_GROUPS.map(cat => (
                <button
                  key={cat.key}
                  onMouseEnter={() => setHoveredCat(cat.key)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border font-bold text-sm transition-all duration-200 ${
                    hoveredCat === cat.key
                      ? `${cat.activeBg} ${cat.activeText} shadow-md -translate-y-0.5 ring-2 ${cat.ring}`
                      : 'bg-white border-brand-border text-brand-secondary hover:border-brand-primary hover:text-brand-dark hover:-translate-y-0.5'
                  }`}
                >
                  <span className={`w-8 h-8 bg-gradient-to-br ${cat.gradient} rounded-lg flex items-center justify-center text-base shadow-sm flex-shrink-0`}>
                    {cat.emoji}
                  </span>
                  {cat.label}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${hoveredCat === cat.key ? 'rotate-180' : ''}`} />
                </button>
              ))}
            </div>

            {/* Shared subcategory panel */}
            <div className={`mt-4 transition-all duration-200 origin-top ${
              hoveredCat ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none h-0 overflow-hidden'
            }`}>
              {CATEGORY_GROUPS.map(cat => cat.key === hoveredCat && (
                <div
                  key={cat.key}
                  onMouseEnter={() => setHoveredCat(cat.key)}
                  className="bg-white border border-brand-border rounded-3xl p-6 shadow-xl shadow-brand-dark/8"
                >
                  {'subjects' in cat ? (
                    // School Tutor — two sections
                    <div className="space-y-4">
                      <div>
                        <p className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider mb-3">By Class</p>
                        <div className="flex flex-wrap gap-2">
                          {cat.subs.map(sub => (
                            <Link
                              key={sub.label}
                              to={`/search?q=${encodeURIComponent(sub.q)}`}
                              className={`px-4 py-2 rounded-xl border border-brand-border bg-brand-mist text-sm font-semibold text-brand-primary hover:border-brand-primary hover:shadow-sm hover:-translate-y-0.5 transition-all`}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div className="border-t border-brand-border pt-4">
                        <p className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider mb-3">By Subject</p>
                        <div className="flex flex-wrap gap-2">
                          {(cat as any).subjects.map((sub: { label: string; q: string }) => (
                            <Link
                              key={sub.label}
                              to={`/search?q=${encodeURIComponent(sub.q)}`}
                              className="px-4 py-2 rounded-xl border border-brand-border text-sm font-semibold text-brand-secondary hover:border-brand-accent hover:text-brand-accent hover:bg-violet-50 hover:-translate-y-0.5 transition-all"
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    // All other categories
                    <div>
                      <p className="text-[11px] font-bold text-brand-secondary uppercase tracking-wider mb-3">{cat.label} — select a topic</p>
                      <div className="flex flex-wrap gap-2">
                        {cat.subs.map(sub => (
                          <Link
                            key={sub.label}
                            to={`/search?q=${encodeURIComponent(sub.q)}`}
                            className={`px-4 py-2.5 rounded-xl border border-brand-border text-sm font-semibold text-brand-secondary hover:border-brand-primary hover:text-brand-primary hover:bg-brand-mist hover:-translate-y-0.5 transition-all`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Institutes */}
      {featuredInstitutes.length > 0 && (
        <section className="py-16 px-4 bg-brand-mist">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-4 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-primary">Top Rated</span>
                </div>
                <h2 className="text-2xl font-extrabold text-brand-dark tracking-tight">Featured Institutes</h2>
                <p className="text-brand-secondary text-sm mt-1">Highest rated educational institutes on Learnova</p>
              </div>
              <Link to="/search?type=institute" className="flex items-center gap-1.5 text-brand-primary hover:text-brand-dark font-semibold text-sm group">
                View all <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredInstitutes.map(inst => <InstituteCard key={inst.id} institute={inst} />)}
            </div>
          </div>
        </section>
      )}

      {/* Featured Tutors */}
      {featuredTutors.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1 h-4 rounded-full bg-gradient-to-b from-violet-500 to-purple-600" />
                  <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">Expert Tutors</span>
                </div>
                <h2 className="text-2xl font-extrabold text-brand-dark tracking-tight">Meet Our Tutors</h2>
                <p className="text-brand-secondary text-sm mt-1">Expert tutors available near you</p>
              </div>
              <Link to="/search?type=tutor" className="flex items-center gap-1.5 text-brand-primary hover:text-brand-dark font-semibold text-sm group">
                View all <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredTutors.map(t => <TutorCard key={t.id} tutor={t} />)}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Learnova */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-2">Why Learnova</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-brand-dark tracking-tight">Everything you need to learn smarter</h2>
            <p className="mt-3 text-brand-secondary text-lg max-w-xl mx-auto">We've built every feature around one goal — making quality education accessible for every student in India.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '💰',
                gradient: 'from-emerald-400 to-teal-500',
                shadow: 'shadow-emerald-200',
                title: 'Transparent Pricing',
                desc: 'No hidden fees. Every institute and tutor lists their fees upfront so you can compare costs before you commit.',
              },
              {
                icon: '✅',
                gradient: 'from-brand-primary to-brand-dark',
                shadow: 'shadow-blue-200',
                title: 'Verified & Trusted',
                desc: 'All institutes and tutors go through a verification process. Look for the verified badge to study with confidence.',
              },
              {
                icon: '📅',
                gradient: 'from-violet-500 to-brand-accent',
                shadow: 'shadow-violet-200',
                title: 'Easy Booking',
                desc: 'Send an enquiry or book a demo class in seconds — no phone calls, no waiting, no hassle.',
              },
              {
                icon: '🎧',
                gradient: 'from-sky-400 to-cyan-500',
                shadow: 'shadow-sky-200',
                title: 'Flexible Learning',
                desc: 'Online, offline, or hybrid — filter by the mode that fits your schedule and choose how you want to learn.',
              },
              {
                icon: '⭐',
                gradient: 'from-amber-400 to-orange-500',
                shadow: 'shadow-amber-200',
                title: 'Student Reviews',
                desc: 'Real ratings from real students. Read honest reviews to find the best match for your goals and learning style.',
              },
              {
                icon: '🤝',
                gradient: 'from-rose-400 to-pink-500',
                shadow: 'shadow-rose-200',
                title: 'Best Support',
                desc: "Our team is available to help you find the right educator, resolve queries, and make your learning journey smooth.",
              },
            ].map(card => (
              <div key={card.title} className="group relative bg-white border border-brand-border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
                <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center text-2xl shadow-md ${card.shadow} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  {card.icon}
                </div>
                <h3 className="text-base font-extrabold text-brand-dark mb-2">{card.title}</h3>
                <p className="text-sm text-brand-secondary leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0" style={{background: 'linear-gradient(135deg, #0b2447, #16407A, #1a5296)'}} />
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 pointer-events-none" style={{background: 'radial-gradient(circle, #6C4FD8, transparent 70%)', filter: 'blur(60px)'}} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-20 pointer-events-none" style={{background: 'radial-gradient(circle, #2F6FED, transparent 70%)', filter: 'blur(50px)'}} />
        <div className="relative max-w-2xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/25 rounded-full px-4 py-1.5 text-sm font-medium text-purple-200 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Join our growing community
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 tracking-tight">Are you an Institute or Tutor?</h2>
          <p className="text-purple-200 mb-8 text-lg">Join Learnova and reach thousands of students across India looking for quality education.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-brand-dark font-bold px-8 py-3.5 rounded-2xl transition-all shadow-2xl hover:scale-[1.04] active:scale-[0.97]"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 text-sm text-center py-8 px-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-slate-300">Learnova</span>
        </div>
        <p>© 2026 Learnova. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs">
          <Link to="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          <span className="text-slate-700">·</span>
          <Link to="/terms#privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <span className="text-slate-700">·</span>
          <Link to="/search" className="hover:text-slate-300 transition-colors">Find Tutors</Link>
        </div>
      </footer>
    </div>
  );
}
