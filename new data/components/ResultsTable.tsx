
import React, { useState } from 'react';
import { CompanyInfo, AVAILABLE_FIELDS } from '../types';

interface ResultsTableProps {
  data: CompanyInfo[];
  selectedFieldIds: string[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ data, selectedFieldIds }) => {
  const [copied, setCopied] = useState(false);

  if (data.length === 0) return null;

  // Header definition based on selected fields
  const getBaseHeaders = () => {
    return selectedFieldIds.map(id => {
      const field = AVAILABLE_FIELDS.find(f => f.id === id);
      return field ? field.label : id;
    });
  };

  // Logic to insert blank columns after every 10 data columns
  const getGroupedHeaders = () => {
    const base = getBaseHeaders();
    const result: string[] = [];
    base.forEach((h, i) => {
      result.push(h);
      if ((i + 1) % 10 === 0 && (i + 1) !== base.length) {
        result.push(''); // Blank separator
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
          result.push(''); // Blank separator
        }
      });
      return result;
    });
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

    // TSV for spreadsheet compatibility, including blank separators
    // EXPLICITLY EXCLUDES HEADERS as per user request for clean appending
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-800">Results ({data.length})</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyData}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all border shadow-sm ${
              copied ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {copied ? (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg> Copied!</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg> Copy Data</>
            )}
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-5-4l-3 3m0 0l-3-3m3 3V4"/></svg> Export CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-12 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                #
              </th>
              {groupedHeaders.map((header, idx) => (
                <th 
                  key={idx} 
                  className={`px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                    header === '' ? 'w-8 bg-gray-100/50' : ''
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {groupedRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-400 font-mono sticky left-0 bg-white border-r border-gray-100">
                  {rowIdx + 1}
                </td>
                {row.map((cell, colIdx) => (
                  <td 
                    key={colIdx} 
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-600 ${
                      groupedHeaders[colIdx] === '' ? 'bg-gray-50/30' : ''
                    }`}
                  >
                    {cell === 'WEBSITE NOT FOUND' ? <span className="text-red-400 font-medium">{cell}</span> : 
                     cell.toString().startsWith('http') ? <a href={cell} target="_blank" rel="noopener" className="text-blue-600 hover:underline">{cell}</a> :
                     cell === 'NO EMAIL' ? <span className="text-gray-400 italic">{cell}</span> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.some(d => d.sources && d.sources.length > 0) && (
        <div className="mt-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Research Sources</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(data.flatMap(d => d.sources || []))).map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener" className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full text-blue-600 truncate max-w-[300px]">
                {url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsTable;
