'use client';

import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { validateCompetenceLibelle } from './types';

interface CompetenceCreateFormProps {
  onCreate: (libelle: string) => Promise<boolean>;
}

export function CompetenceCreateForm({ onCreate }: CompetenceCreateFormProps) {
  const [libelle, setLibelle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateCompetenceLibelle(libelle);
    if (validationError) {
      setError(validationError);
      return;
    }

    setCreating(true);
    try {
      await onCreate(libelle.trim());
      setLibelle('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4 text-[#FFA101]" />
        <h2 className="text-sm font-bold text-slate-900">Ajouter une nouvelle compétence</h2>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-center gap-2 text-red-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3">
        <label htmlFor="new-competence" className="sr-only">
          Libellé de la nouvelle compétence
        </label>
        <input
          id="new-competence"
          type="text"
          value={libelle}
          onChange={(e) => {
            setLibelle(e.target.value);
            setError(null);
          }}
          placeholder="Ex : Réseau & Switchs (Cisco, Mikrotik)..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition"
        />
        <button
          type="submit"
          disabled={creating}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#FFA101] hover:bg-[#e69100] text-white text-sm font-bold rounded-xl transition disabled:opacity-50 shadow-md shadow-[#FFA101]/25 hover:shadow-lg cursor-pointer"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>Ajouter</span>
        </button>
      </form>
    </div>
  );
}
