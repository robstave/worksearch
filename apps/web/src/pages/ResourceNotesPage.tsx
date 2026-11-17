import { useState } from 'react';
import { useAuth } from '../auth';

interface NoteEntry {
  id: string;
  label: string;
  value: string;
}

function initialEntries(): NoteEntry[] {
  return [
    { id: crypto.randomUUID(), label: 'GitHub link', value: '' },
    { id: crypto.randomUUID(), label: 'LinkedIn link', value: '' },
  ];
}

function NotesEditor({ storageKey }: { storageKey: string }) {
  const [entries, setEntries] = useState<NoteEntry[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
      if (Array.isArray(saved) && saved.every((entry) =>
        entry && typeof entry.id === 'string' && typeof entry.label === 'string' && typeof entry.value === 'string'
      )) return saved;
    } catch {
      // Keep the editor usable when browser storage is unavailable.
    }
    return initialEntries();
  });
  const [status, setStatus] = useState('');

  function updateEntries(next: NoteEntry[]) {
    setEntries(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStatus('Saved in this browser');
    } catch {
      setStatus('Unable to save in this browser. Keep a copy before leaving this page.');
    }
  }

  function updateEntry(id: string, field: 'label' | 'value', value: string) {
    updateEntries(entries.map((entry) => entry.id === id ? { ...entry, [field]: value } : entry));
  }

  const inputClass = 'w-full rounded-md border border-gray-600 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <section aria-labelledby="notes-heading">
      <h2 id="notes-heading" className="text-2xl font-bold text-white mb-2">Notes</h2>
      <p className="text-gray-400 mb-2">Keep links and reusable information here, ready to copy into applications.</p>
      <p className="text-sm text-gray-500 mb-6">Saved automatically in this browser only. Notes do not sync across devices.</p>
      <div className="max-w-3xl space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-lg border border-gray-700 bg-gray-800 p-4">
            <div className="flex items-end gap-3 mb-3">
              <label className="flex-1 text-sm text-gray-300">
                Label
                <input className={`${inputClass} mt-1`} value={entry.label} placeholder="e.g. Portfolio link" onChange={(event) => updateEntry(entry.id, 'label', event.target.value)} />
              </label>
              <button type="button" className="rounded-md px-3 py-2 text-sm text-red-400 hover:bg-gray-700" aria-label={`Remove ${entry.label || 'note'}`} onClick={() => updateEntries(entries.filter((item) => item.id !== entry.id))}>Remove</button>
            </div>
            <label className="block text-sm text-gray-300">
              Value
              <textarea className={`${inputClass} mt-1 resize-y`} rows={3} value={entry.value} placeholder="Paste a link or any text here…" onChange={(event) => updateEntry(entry.id, 'value', event.target.value)} />
            </label>
          </div>
        ))}
        {entries.length === 0 && <p className="text-gray-400">No notes yet. Add an entry to get started.</p>}
        <button type="button" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700" onClick={() => updateEntries([...entries, { id: crypto.randomUUID(), label: '', value: '' }])}>+ Add entry</button>
        <p role="status" className="text-sm text-gray-400">{status}</p>
      </div>
    </section>
  );
}

export function ResourceNotesPage() {
  const { user } = useAuth();
  const storageKey = `worksearch:resource-notes:${user!.id}`;
  return <NotesEditor key={storageKey} storageKey={storageKey} />;
}
