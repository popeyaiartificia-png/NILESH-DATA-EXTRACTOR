
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

        // Synchronize with Supabase after each chunk
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4 relative">
          <div className="absolute top-0 right-0 flex flex-col items-end gap-2">
            <button
              onClick={handleSelectKey}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                hasCustomKey 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              {hasCustomKey ? 'Paid Key Active' : 'Use Personal API Key'}
            </button>
            
            {supabase && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                syncStatus === 'success' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                syncStatus === 'syncing' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                syncStatus === 'error' ? 'bg-red-50 text-red-600 border-red-100' :
                'bg-gray-100 text-gray-400 border-gray-200'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  syncStatus === 'success' ? 'bg-blue-500' :
                  syncStatus === 'syncing' ? 'bg-amber-500' :
                  syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                {syncStatus === 'idle' ? 'Cloud Sync Ready' : 
                 syncStatus === 'syncing' ? 'Syncing to Supabase...' :
                 syncStatus === 'success' ? 'All Data Synced' : 'Sync Error'}
              </div>
            )}
          </div>

          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-2">
            <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            AI Company Data & Email Extractor
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500">
            Intelligent company research with automatic Supabase persistence. Find verified websites, contacts, and firmographics in seconds.
          </p>
        </div>

        {/* Input Area */}
        <section>
          <ExtractorForm onExtract={handleExtraction} isLoading={loading} />
        </section>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-2 rounded-full">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-900">Extraction Error</h3>
                <p className="text-red-700 leading-relaxed mt-1">{error.message}</p>
              </div>
            </div>
            
            {error.isQuota && (
              <div className="bg-white/50 p-4 rounded-lg border border-red-100">
                <p className="text-sm text-red-800 font-semibold mb-3">
                  Why am I seeing this?
                </p>
                <p className="text-sm text-red-700 mb-4">
                  The default shared API key has reached its request limit. To continue research without interruption, please connect your own Google Cloud project's API key.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={handleSelectKey}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-md"
                  >
                    Select Personal API Key
                  </button>
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-red-600 px-4 py-2 rounded-lg text-sm font-semibold border border-red-200 hover:bg-red-50 transition-colors"
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
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ResultsTable data={results} selectedFieldIds={selectedFields} />
          </section>
        )}

        {/* Instructions / Features */}
        {!loading && results.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Real-time Search</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Gemini uses Google Search to find up-to-date official company domains, avoiding outdated directories.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.040L3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622l-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Verified Extraction</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Emails are extracted directly from company pages like 'Contact Us' or 'Privacy Policy' to ensure legitimacy.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Supabase Ready</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Automatically sync results to your Supabase project. Build your own CRM or lead list with persistent storage.
              </p>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-20 text-center text-gray-400 text-sm">
        Built with Gemini AI Engine • Connected to Supabase Persistence
      </footer>
    </div>
  );
};

export default App;
