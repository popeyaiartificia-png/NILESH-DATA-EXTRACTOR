
import React, { useState, useCallback, useEffect } from 'react';
import ExtractorForm from './components/ExtractorForm';
import ResultsTable from './components/ResultsTable';
import { CompanyInfo } from './types';
import { GeminiService } from './services/geminiService';
import { SupabaseService, supabase } from './services/supabaseService';

const App: React.FC = () => {
  const [results, setResults] = useState<CompanyInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [error, setError] = useState<{ message: string; isQuota: boolean } | null>(null);
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  useEffect(() => {
    const checkKeyStatus = async () => {
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasCustomKey(hasKey);
      }
    };
    checkKeyStatus();
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasCustomKey(true);
      setError(null);
    }
  };

  const handleExtraction = useCallback(async (inputs: string[], fieldIds: string[]) => {
    setLoading(true);
    setError(null);
    setSyncStatus('idle');
    setSelectedFields(fieldIds);
    setResults([]);

    const gemini = new GeminiService();
    const db = new SupabaseService();

    try {
      const CHUNK_SIZE = 2;
      const allResults: CompanyInfo[] = [];

      for (let i = 0; i < inputs.length; i += CHUNK_SIZE) {
        const chunk = inputs.slice(i, i + CHUNK_SIZE);
        const chunkResults = await gemini.extractCompanyData(chunk, fieldIds);

        allResults.push(...chunkResults);
        setResults([...allResults]);

        if (supabase) {
          setSyncStatus('syncing');
          try {
            await db.saveExtractions(chunkResults);
            setSyncStatus('success');
          } catch (dbErr) {
            console.error("Sync to Supabase failed for chunk:", dbErr);
            setSyncStatus('error');
          }
        }
      }
    } catch (err: any) {
      console.error("Extraction process failed:", err);
      const errorData = err?.error || err;
      const message = (errorData?.message || err?.message || "").toLowerCase();
      const status = errorData?.status || err?.status;

      const isQuota = status === 'RESOURCE_EXHAUSTED' || message.includes('429') || message.includes('quota');

      if (message.includes("requested entity was not found.")) {
        setHasCustomKey(false);
        setError({
          message: "API project mismatch or session expired. Please re-select a valid paid API key.",
          isQuota: false
        });
      } else {
        setError({
          message: isQuota
            ? "Research Limit Reached: The Gemini API quota for this project has been exhausted."
            : "An unexpected error occurred during research. Please try again with fewer items.",
          isQuota
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header Section */}
        <div className="text-center space-y-4 relative">
          {/* Top Right Controls */}
          <div className="absolute top-0 right-0 flex flex-col items-end gap-2">
            <button
              onClick={handleSelectKey}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${hasCustomKey
                  ? 'badge-success'
                  : 'glass-card text-slate-300 hover:text-white glow-hover'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              {hasCustomKey ? 'Paid Key Active' : 'Use Personal API Key'}
            </button>

            {supabase && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${syncStatus === 'success' ? 'badge-success' :
                  syncStatus === 'syncing' ? 'badge-syncing animate-pulse' :
                    syncStatus === 'error' ? 'badge-error' :
                      'badge-idle'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'success' ? 'bg-green-400' :
                    syncStatus === 'syncing' ? 'bg-amber-400' :
                      syncStatus === 'error' ? 'bg-red-400' : 'bg-slate-500'
                  }`} />
                {syncStatus === 'idle' ? 'Cloud Sync Ready' :
                  syncStatus === 'syncing' ? 'Syncing to Supabase...' :
                    syncStatus === 'success' ? 'All Data Synced' : 'Sync Error'}
              </div>
            )}
          </div>

          {/* Logo/Icon */}
          <div className="inline-flex items-center justify-center p-4 rounded-2xl glass-card glow animate-float mb-4">
            <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Company Data Extractor
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-slate-400">
            Intelligent company research with automatic cloud persistence. Find verified websites, contacts, and firmographics in seconds.
          </p>
        </div>

        {/* Input Area */}
        <section>
          <ExtractorForm onExtract={handleExtraction} isLoading={loading} />
        </section>

        {/* Error State */}
        {error && (
          <div className="glass-card p-6 rounded-2xl space-y-4 border-l-4 border-red-500">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-xl bg-red-500/20">
                <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-300">Extraction Error</h3>
                <p className="text-red-200/80 leading-relaxed mt-1">{error.message}</p>
              </div>
            </div>

            {error.isQuota && (
              <div className="bg-slate-900/50 p-4 rounded-xl border border-red-500/20">
                <p className="text-sm text-red-300 font-semibold mb-3">
                  Why am I seeing this?
                </p>
                <p className="text-sm text-slate-400 mb-4">
                  The default shared API key has reached its request limit. To continue research without interruption, please connect your own Google Cloud project's API key.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSelectKey}
                    className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-red-500/20"
                  >
                    Select Personal API Key
                  </button>
                  <a
                    href="https://ai.google.dev/gemini-api/docs/billing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-400 px-5 py-2.5 rounded-xl text-sm font-semibold border border-red-500/30 hover:bg-red-500/10 transition-all"
                  >
                    Billing Documentation
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Area */}
        {results.length > 0 && (
          <section>
            <ResultsTable data={results} selectedFieldIds={selectedFields} />
          </section>
        )}

        {/* Features Section */}
        {!loading && results.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <div className="glass-card p-6 rounded-2xl glow-hover transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2">Real-time Search</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Gemini uses Google Search to find up-to-date official company domains, avoiding outdated directories.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl glow-hover transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04L3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622l-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2">Verified Extraction</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Emails are extracted directly from company pages like 'Contact Us' or 'Privacy Policy' to ensure legitimacy.
              </p>
            </div>

            <div className="glass-card p-6 rounded-2xl glow-hover transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <h3 className="font-bold text-white mb-2">Cloud Sync Ready</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Automatically sync results to your Supabase project. Build your own CRM or lead list with persistent storage.
              </p>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-20 text-center text-slate-600 text-sm">
        Built with Gemini AI Engine • Connected to Cloud Persistence
      </footer>
    </div>
  );
};

export default App;
