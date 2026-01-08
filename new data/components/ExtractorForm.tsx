
import React, { useState, useEffect } from 'react';
import { OutputMode, AVAILABLE_FIELDS, CompanyField } from '../types';

interface ExtractorFormProps {
  onExtract: (inputs: string[], selectedFields: string[]) => void | Promise<void>;
  isLoading: boolean;
}

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Company Names or URLs
          </label>
          <textarea
            className="w-full h-40 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm placeholder:text-gray-400"
            placeholder="Enter company names or URLs, one per line (e.g., Apple, google.com, Microsoft)..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <span className="text-sm font-semibold text-gray-700">1. Select Preset Mode:</span>
            <div className="flex bg-gray-100 p-1 rounded-lg self-start">
              <button
                type="button"
                onClick={() => setMode(OutputMode.FULL_DETAILS)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === OutputMode.FULL_DETAILS 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Full Details
              </button>
              <button
                type="button"
                onClick={() => setMode(OutputMode.ONLY_EMAILS)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  mode === OutputMode.ONLY_EMAILS 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Emails Only
              </button>
              <button
                type="button"
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-default ${
                  mode === OutputMode.CUSTOM 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-400'
                }`}
              >
                Custom
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm font-semibold text-gray-700">2. Customize Fields:</span>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {AVAILABLE_FIELDS.map((field) => (
                <label 
                  key={field.id} 
                  className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-all ${
                    selectedFieldIds.includes(field.id) 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedFieldIds.includes(field.id)}
                    onChange={() => toggleField(field.id)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                  <span className="text-xs font-medium truncate">{field.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim() || selectedFieldIds.length === 0}
            className={`w-full sm:w-auto px-10 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 active:transform active:scale-95'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing Research...
              </span>
            ) : 'Start Intelligent Extraction'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExtractorForm;
