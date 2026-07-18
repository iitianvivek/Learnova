import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, BookOpen, Users } from 'lucide-react';
import type { SearchResults, Course } from '../types';
import InstituteCard from '../components/InstituteCard';
import TutorCard from '../components/TutorCard';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [minFee, setMinFee] = useState(searchParams.get('minFee') || '');
  const [maxFee, setMaxFee] = useState(searchParams.get('maxFee') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [subject, setSubject] = useState(searchParams.get('subject') || '');
  const [mode, setMode] = useState(searchParams.get('mode') || '');

  const [results, setResults] = useState<SearchResults>({ institutes: [], tutors: [] });
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [compareList, setCompareList] = useState<{ id: number; type: 'institute' | 'tutor' }[]>([]);

  const compareBreakdown = useMemo(() => {
    const institutes = compareList.filter(item => item.type === 'institute').length;
    const tutors = compareList.filter(item => item.type === 'tutor').length;
    return { institutes, tutors };
  }, [compareList]);

  useEffect(() => {
    api.get('/search/courses').then(({ data }) => setCourses(data)).catch(() => {});
  }, []);

  const doSearch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { q: query, type };
      if (location) params.location = location;
      if (minFee) params.minFee = minFee;
      if (maxFee) params.maxFee = maxFee;
      if (minRating) params.minRating = minRating;
      if (subject) params.subject = subject;
      if (mode) params.mode = mode;
      const { data } = await api.get('/search', { params });
      setResults(data);
      setSearchParams(params);
    } catch {
      setResults({ institutes: [], tutors: [] });
    } finally {
      setLoading(false);
    }
  }, [query, type, location, minFee, maxFee, minRating, subject, mode, setSearchParams]);

  useEffect(() => { doSearch(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch();
  };

  const clearFilters = () => {
    setLocation(''); setMinFee(''); setMaxFee(''); setMinRating(''); setSubject(''); setMode('');
  };

  const toggleCompare = (id: number, t: 'institute' | 'tutor') => {
    setCompareList(prev => {
      const exists = prev.find(c => c.id === id && c.type === t);
      if (exists) return prev.filter(c => !(c.id === id && c.type === t));
      if (prev.length >= 4) { alert('You can compare up to 4 at once'); return prev; }
      return [...prev, { id, type: t }];
    });
  };

  const handleCompare = () => {
    if (compareList.length < 2) { alert('Select at least 2 to compare'); return; }
    const institutes = compareList.filter(item => item.type === 'institute').map(item => item.id).join(',');
    const tutors = compareList.filter(item => item.type === 'tutor').map(item => item.id).join(',');
    const params = new URLSearchParams();
    if (institutes) params.set('institutes', institutes);
    if (tutors) params.set('tutors', tutors);
    navigate(`/compare?${params.toString()}`);
  };

  const total = results.institutes.length + results.tutors.length;
  const categories = [...new Set(courses.map(c => c.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 bg-gray-100 rounded-xl px-4 py-2.5">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search institutes, tutors, subjects..."
                className="flex-1 bg-transparent outline-none text-sm text-gray-800"
              />
              {query && <button type="button" onClick={() => setQuery('')}><X className="w-4 h-4 text-gray-400" /></button>}
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${showFilters ? 'bg-blue-50 border-blue-400 text-blue-600' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Filters</h3>
              <button onClick={clearFilters} className="text-sm text-red-500 hover:text-red-600">Clear all</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Type</label>
                <select value={type} onChange={e => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All</option>
                  <option value="institute">Institutes</option>
                  <option value="tutor">Tutors</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Subject / Course</label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All subjects</option>
                  {categories.map(cat => (
                    <optgroup key={cat} label={cat}>
                      {courses.filter(c => c.category === cat).map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Location</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="City or area"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Min Rating</label>
                <select value={minRating} onChange={e => setMinRating(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Any rating</option>
                  <option value="3">3+ stars</option>
                  <option value="4">4+ stars</option>
                  <option value="4.5">4.5+ stars</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Min Fee (₹)</label>
                <input type="number" value={minFee} onChange={e => setMinFee(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Max Fee (₹)</label>
                <input type="number" value={maxFee} onChange={e => setMaxFee(e.target.value)}
                  placeholder="No limit"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mode (Tutors)</label>
                <select value={mode} onChange={e => setMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All modes</option>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="both">Both</option>
                </select>
              </div>
            </div>
            <button onClick={doSearch}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors">
              Apply Filters
            </button>
          </div>
        )}

        {/* Compare bar */}
        {compareList.length > 0 && (
          <div className="bg-blue-600 text-white rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">{compareList.length} selected for comparison</p>
              <p className="text-xs text-blue-100 mt-1">
                {compareBreakdown.institutes > 0 ? `${compareBreakdown.institutes} institute${compareBreakdown.institutes > 1 ? 's' : ''}` : 'No institutes'}
                {' · '}
                {compareBreakdown.tutors > 0 ? `${compareBreakdown.tutors} tutor${compareBreakdown.tutors > 1 ? 's' : ''}` : 'No tutors'}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCompareList([])} className="text-blue-200 hover:text-white text-sm">Clear</button>
              <button onClick={handleCompare} disabled={compareList.length < 2}
                className="bg-white text-blue-600 font-bold px-4 py-1.5 rounded-lg text-sm hover:bg-blue-50 transition-colors">
                Open Compare Workspace
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-gray-600 text-sm">
            {loading ? 'Searching...' : `${total} result${total !== 1 ? 's' : ''} found`}
          </p>
          <div className="flex gap-2">
            {(['all', 'institute', 'tutor'] as const).map(t => (
              <button key={t}
                onClick={() => { setType(t); doSearch(); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${type === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'}`}>
                {t === 'all' ? 'All' : t === 'institute' ? '🏫 Institutes' : '👨‍🏫 Tutors'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Searching...</div>
        ) : total === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">No results found</p>
            <p className="text-gray-400 text-sm mt-1">Try different keywords or clear filters</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Institutes */}
            {results.institutes.length > 0 && (type === 'all' || type === 'institute') && (
              <div>
                <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Institutes ({results.institutes.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {results.institutes.map(inst => (
                    <InstituteCard
                      key={inst.id} institute={inst}
                      showCompare
                      onCompare={(id) => toggleCompare(id, 'institute')}
                      compareSelected={compareList.some(c => c.id === inst.id && c.type === 'institute')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tutors */}
            {results.tutors.length > 0 && (type === 'all' || type === 'tutor') && (
              <div>
                <h2 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-500" />
                  Tutors ({results.tutors.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {results.tutors.map(t => (
                    <TutorCard
                      key={t.id} tutor={t}
                      showCompare
                      onCompare={(id) => toggleCompare(id, 'tutor')}
                      compareSelected={compareList.some(c => c.id === t.id && c.type === 'tutor')}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}