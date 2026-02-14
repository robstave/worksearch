import { useState, useEffect, useRef, useCallback } from 'react';
import { companiesApi } from '../api';
import type { Company } from '../api';

interface CompanyTypeaheadProps {
  value: string; // companyId
  onChange: (companyId: string) => void;
  /** Pre-set the display text (for when navigating from a company page) */
  initialCompanyName?: string;
}

export function CompanyTypeahead({ value, onChange, initialCompanyName }: CompanyTypeaheadProps) {
  const [query, setQuery] = useState(initialCompanyName ?? '');
  const [results, setResults] = useState<Company[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedName, setSelectedName] = useState(initialCompanyName ?? '');
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If value is set but we don't have a name yet, fetch it
  useEffect(() => {
    if (value && !selectedName) {
      companiesApi.get(value).then((c) => {
        setSelectedName(c.name);
        setQuery(c.name);
      }).catch(() => {});
    }
  }, [value]);

  const searchCompanies = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await companiesApi.list({ search: searchQuery, limit: 15 });
      setResults(res.items);
      
      // Auto-select if there's an exact match (case-insensitive)
      const exactMatch = res.items.find(
        (c) => c.name.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (exactMatch) {
        setSelectedName(exactMatch.name);
        onChange(exactMatch.id);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [onChange]);

  const handleInputChange = (text: string) => {
    setQuery(text);
    // Clear selection if user edits the text
    if (selectedName && text !== selectedName) {
      setSelectedName('');
      onChange('');
    }
    setIsOpen(true);

    // Debounce API calls
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchCompanies(text);
    }, 250);
  };

  const handleSelect = (company: Company) => {
    setQuery(company.name);
    setSelectedName(company.name);
    onChange(company.id);
    setIsOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isValid = !!value && !!selectedName;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (query.trim() && !isValid) {
              setIsOpen(true);
              searchCompanies(query);
            }
          }}
          placeholder="Type to search companies..."
          className={`w-full px-3 py-2 pr-9 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isValid
              ? 'border-green-500'
              : query.trim() && !isValid
                ? 'border-yellow-500'
                : 'border-gray-600'
          }`}
        />
        {/* Status indicator */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
          {loading ? (
            <span className="text-gray-400 animate-pulse">...</span>
          ) : isValid ? (
            <span className="text-green-400">✓</span>
          ) : query.trim() ? (
            <span className="text-yellow-400">?</span>
          ) : null}
        </span>
      </div>

      {/* Dropdown results */}
      {isOpen && query.trim() && (
        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
          {results.length > 0 ? (
            results.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-700 text-sm transition-colors ${
                  c.id === value ? 'bg-gray-700 text-green-400' : 'text-white'
                }`}
              >
                <span className="font-medium">{c.name}</span>
                {c.applicationCount > 0 && (
                  <span className="ml-2 text-gray-400 text-xs">
                    ({c.applicationCount} app{c.applicationCount !== 1 ? 's' : ''})
                  </span>
                )}
                {c.star && <span className="ml-1 text-yellow-400">★</span>}
              </button>
            ))
          ) : !loading ? (
            <div className="px-3 py-2 text-sm text-gray-400">
              No companies match "{query}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
