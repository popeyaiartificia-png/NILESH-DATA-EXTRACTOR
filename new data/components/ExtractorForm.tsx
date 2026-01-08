
import React, { useState, useEffect } from 'react';
import { OutputMode, AVAILABLE_FIELDS, CompanyField } from '../types';

interface ExtractorFormProps {
  onExtract: (inputs: string[], selectedFields: string[]) => void | Promise<void>;
  isLoading: boolean;
}

// Field category mapping for color-coded chips
const getFieldCategory = (fieldId: string): string => {
  switch (fieldId) {
    case 'companyName':
    case 'officialWebsite':
      return 'company';
    case 'email1':
    case 'email2':
      return 'email';
    case 'phone':
      return 'phone';
    case 'linkedin':
      return 'social';
    case 'industry':
    case 'location':
    case 'foundedYear':
    case 'companySize':
      return 'business';
    default:
      return 'business';
  }
};

const ExtractorForm: React.FC<ExtractorFormProps> = ({ onExtract, isLoading }) => {
  const [inputValue, setInputValue] = useState('');
  const [mode, setMode] = useState<OutputMode>(OutputMode.FULL_DETAILS);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>(
    AVAILABLE_FIELDS.map(f => f.id)
  );

  useEffect(() => {
    if (mode === OutputMode.FULL_DETAILS) {
      setSelectedFieldIds(AVAILABLE_FIELDS.map(f => f.id));
    } else if (mode === OutputMode.ONLY_EMAILS) {
      setSelectedFieldIds(['companyName', 'email1', 'email2']);
    }
  }, [mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inputs = inputValue
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (inputs.length === 0) return;
    if (selectedFieldIds.length === 0) {
      alert("Please select at least one field to extract.");
      return;
    }

    onExtract(inputs, selectedFieldIds);
  };

  const toggleField = (fieldId: string) => {
    setMode(OutputMode.CUSTOM);
    setSelectedFieldIds(prev =>
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  return (
    <div className="glass-card rounded-2xl p-8 glow">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Input Area */}
        <div>
          <label className="block text-sm font-semibold text-slate-300 mb-3">
            Company Names or URLs
          </label>
          <textarea
            className="input-dark w-full h-40 px-5 py-4 rounded-xl resize-none text-sm"
            placeholder="Enter company names or URLs, one per line (e.g., Apple, google.com, Microsoft)..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Mode Selection */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-300">1. Select Preset Mode:</span>
            <div className="flex p-1.5 rounded-xl glass-card self-start">
              <button
                type="button"
                onClick={() => setMode(OutputMode.FULL_DETAILS)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${mode === OutputMode.FULL_DETAILS
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                Full Details
              </button>
              <button
                type="button"
                onClick={() => setMode(OutputMode.ONLY_EMAILS)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${mode === OutputMode.ONLY_EMAILS
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                Emails Only
              </button>
              <button
                type="button"
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all cursor-default ${mode === OutputMode.CUSTOM
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'text-slate-500'
                  }`}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <span className="text-sm font-semibold text-slate-300">2. Customize Fields:</span>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {AVAILABLE_FIELDS.map((field) => {
                const category = getFieldCategory(field.id);
                const isSelected = selectedFieldIds.includes(field.id);

                return (
                  <label
                    key={field.id}
                    className={`field-chip field-chip-${category} ${isSelected ? 'selected' : ''} flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-all`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleField(field.id)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
                      disabled={isLoading}
                    />
                    <span className={`text-xs font-medium truncate ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                      {field.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim() || selectedFieldIds.length === 0}
            className="btn-cta w-full sm:w-auto"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing Research...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Start Intelligent Extraction
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExtractorForm;
