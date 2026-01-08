
import React, { useState } from 'react';
import { CompanyInfo, AVAILABLE_FIELDS } from '../types';

interface ResultsTableProps {
  data: CompanyInfo[];
  selectedFieldIds: string[];
}

// Get display style based on field type
const getCellContent = (fieldId: string, value: string) => {
  if (!value || value === '' || value === 'N/A') {
    return <span className="data-empty">—</span>;
  }

  switch (fieldId) {
    case 'companyName':
      return <span className="data-company text-base">{value}</span>;

    case 'officialWebsite':
      if (value === 'WEBSITE NOT FOUND') {
        return <span className="data-error">{value}</span>;
      }
      return (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener" className="data-link flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
          {value.replace(/^https?:\/\//, '').replace(/\/$/, '')}
        </a>
      );

    case 'email1':
    case 'email2':
      if (value === 'NO EMAIL' || value.toLowerCase().includes('no email')) {
        return <span className="data-empty italic">No email found</span>;
      }
      return (
        <span className="data-email flex items-center gap-1.5">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {value}
        </span>
      );

    case 'phone':
      return (
        <span className="data-phone flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {value}
        </span>
      );

    case 'linkedin':
      return (
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener" className="data-link flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
          </svg>
          LinkedIn
        </a>
      );

    case 'industry':
    case 'location':
      return (
        <span className="data-business flex items-center gap-1.5">
          {fieldId === 'location' && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          {fieldId === 'industry' && (
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )}
          {value}
        </span>
      );

    case 'foundedYear':
    case 'companySize':
      return <span className="data-meta">{value}</span>;

    default:
      return <span className="text-slate-300">{value}</span>;
  }
};

const ResultsTable: React.FC<ResultsTableProps> = ({ data, selectedFieldIds }) => {
  const [copied, setCopied] = useState(false);

  if (data.length === 0) return null;

  const getBaseHeaders = () => {
    return selectedFieldIds.map(id => {
      const field = AVAILABLE_FIELDS.find(f => f.id === id);
      return field ? field.label : id;
    });
  };

  const getGroupedHeaders = () => {
    const base = getBaseHeaders();
    const result: string[] = [];
    base.forEach((h, i) => {
      result.push(h);
      if ((i + 1) % 10 === 0 && (i + 1) !== base.length) {
        result.push('');
      }
    });
    return result;
  };

  const getGroupedRows = () => {
    return data.map(item => {
      const base = selectedFieldIds.map(id => (item as any)[id] || '');
      const result: string[] = [];
      base.forEach((val, i) => {
        result.push(val);
        if ((i + 1) % 10 === 0 && (i + 1) !== base.length) {
          result.push('');
        }
      });
      return result;
    });
  };

  const getFieldIdForColumn = (colIndex: number): string => {
    let actualIndex = 0;
    let fieldIndex = 0;
    for (let i = 0; i <= colIndex; i++) {
      if (getGroupedHeaders()[i] === '') {
        continue;
      }
      if (i === colIndex) {
        return selectedFieldIds[fieldIndex] || '';
      }
      fieldIndex++;
    }
    return '';
  };

  const handleExportCSV = () => {
    const headers = getGroupedHeaders();
    const rows = getGroupedRows();

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `extraction_${new Date().getTime()}.csv`;
    link.click();
  };

  const handleCopyData = async () => {
    const rows = getGroupedRows();
    const tsvContent = rows.map(row => row.join('\t')).join('\n');

    try {
      await navigator.clipboard.writeText(tsvContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const groupedHeaders = getGroupedHeaders();
  const groupedRows = getGroupedRows();

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Extraction Results</h2>
            <p className="text-sm text-slate-400">{data.length} companies extracted</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyData}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${copied
                ? 'badge-success'
                : 'glass-card text-slate-300 hover:text-white glow-hover'
              }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copy Data
              </>
            )}
          </button>
          <button
            onClick={handleExportCSV}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-5-4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto data-table">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-4 text-left w-16 sticky left-0 bg-slate-800/90 backdrop-blur-sm z-10 border-r border-slate-700/50">
                #
              </th>
              {groupedHeaders.map((header, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-4 text-left ${header === '' ? 'w-4 bg-slate-800/50' : ''}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupedRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="group">
                <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500 font-mono sticky left-0 bg-slate-900/90 backdrop-blur-sm border-r border-slate-800/50 group-hover:bg-slate-800/90">
                  {rowIdx + 1}
                </td>
                {row.map((cell, colIdx) => {
                  const fieldId = getFieldIdForColumn(colIdx);
                  const isSeparator = groupedHeaders[colIdx] === '';

                  return (
                    <td
                      key={colIdx}
                      className={`px-6 py-4 whitespace-nowrap ${isSeparator ? 'bg-slate-800/30' : ''}`}
                    >
                      {isSeparator ? null : getCellContent(fieldId, cell)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sources Section */}
      {data.some(d => d.sources && d.sources.length > 0) && (
        <div className="glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Research Sources
          </h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(data.flatMap(d => d.sources || []))).map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener"
                className="text-xs glass-card px-3 py-1.5 rounded-full text-cyan-400 hover:text-cyan-300 truncate max-w-[300px] transition-colors"
              >
                {url.replace(/^https?:\/\//, '').split('/')[0]}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsTable;
