import { useState } from 'react';
import { normalizeDomain } from '@shared/utils';
import type { SiteEntry } from '@shared/types';

function newId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5A1.5 1.5 0 0 0 8.5 21h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface SiteListProps {
  sites: SiteEntry[];
  onChange: (sites: SiteEntry[]) => void;
  placeholder?: string;
}

/** Manages the user-controlled block list: add, remove, edit, enable/disable. */
export function SiteListEditor({ sites, onChange, placeholder = 'example.com' }: SiteListProps) {
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const addDomain = () => {
    const domain = normalizeDomain(draft);
    if (!domain) {
      setDraftError('Enter a valid website, e.g. youtube.com');
      return;
    }
    if (sites.some((s) => s.domain === domain)) {
      setDraftError(`${domain} is already in the list`);
      return;
    }
    setDraftError(null);
    setDraft('');
    onChange([...sites, { id: newId(), domain, enabled: true }]);
  };

  const removeDomain = (id: string) => onChange(sites.filter((s) => s.id !== id));

  const toggleDomain = (id: string) =>
    onChange(sites.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));

  const startEdit = (entry: SiteEntry) => {
    setEditingId(entry.id);
    setEditingValue(entry.domain);
  };

  const commitEdit = () => {
    const domain = normalizeDomain(editingValue);
    if (!domain) {
      setDraftError('Enter a valid website, e.g. youtube.com');
      return;
    }
    if (sites.some((s) => s.domain === domain && s.id !== editingId)) {
      setDraftError(`${domain} is already in the list`);
      return;
    }
    setDraftError(null);
    setEditingId(null);
    onChange(sites.map((s) => (s.id === editingId ? { ...s, domain } : s)));
  };

  return (
    <div>
      {sites.length > 0 && (
        <ul className="mb-3 space-y-1">
          {sites.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white/70 px-3.5 py-2.5 dark:border-white/10 dark:bg-white/5"
            >
              <input
                type="checkbox"
                checked={entry.enabled}
                onChange={() => toggleDomain(entry.id)}
                className="h-4 w-4 shrink-0 cursor-pointer accent-accent-600"
                aria-label={`Block ${entry.domain}`}
              />
              {editingId === entry.id ? (
                <input
                  autoFocus
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitEdit();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onBlur={commitEdit}
                  className="input !px-2 !py-1 flex-1"
                />
              ) : (
                <span
                  className={`flex-1 truncate text-sm ${
                    entry.enabled ? 'font-medium' : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {entry.domain}
                  {!entry.enabled && <span className="ml-2 text-xs text-zinc-400">not blocking</span>}
                </span>
              )}
              {editingId !== entry.id && (
                <button
                  onClick={() => startEdit(entry)}
                  className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-accent-600 dark:hover:bg-white/10 dark:hover:text-accent-300"
                  aria-label={`Edit ${entry.domain}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => removeDomain(entry.id)}
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                aria-label={`Remove ${entry.domain}`}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setDraftError(null);
          }}
          onKeyDown={(e) => e.key === 'Enter' && addDomain()}
          placeholder={placeholder}
          className="input flex-1"
          aria-label="Add a website to block"
        />
        <button onClick={addDomain} className="btn-secondary !px-4">
          + Add Website
        </button>
      </div>
      {draftError && <p className="mt-2 text-xs font-medium text-rose-500">{draftError}</p>}
    </div>
  );
}
