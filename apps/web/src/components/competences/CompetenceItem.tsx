'use client';

import { AlertCircle, Edit2, Loader2, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { type Competence, validateCompetenceLibelle } from './types';

interface CompetenceItemProps {
  index: number;
  competence: Competence;
  onUpdate: (id: string, libelle: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function CompetenceItem({ index, competence, onUpdate, onDelete }: CompetenceItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLibelle, setEditLibelle] = useState(competence.libelle);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditLibelle(competence.libelle);
    setEditError(null);
    setConfirmDelete(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditLibelle(competence.libelle);
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    setEditError(null);
    const err = validateCompetenceLibelle(editLibelle);
    if (err) {
      setEditError(err);
      return;
    }

    setSaving(true);
    try {
      await onUpdate(competence.id, editLibelle.trim());
      setIsEditing(false);
    } catch (e: unknown) {
      setEditError(e instanceof Error ? e.message : 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(competence.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <li className="px-6 py-3.5 flex items-center gap-3 group hover:bg-slate-50 transition">
      <span className="text-xs font-mono font-bold text-slate-400 w-6 text-right shrink-0">
        {index + 1}
      </span>

      {isEditing ? (
        /* Mode édition */
        <div className="flex-1 flex flex-col gap-2">
          {editError && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {editError}
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={editLibelle}
              onChange={(e) => {
                setEditLibelle(e.target.value);
                setEditError(null);
              }}
              className="flex-1 bg-white border border-[#FFA101] rounded-lg px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FFA101]/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <button
              type="button"
              onClick={() => void handleSaveEdit()}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFA101] hover:bg-[#e69100] text-white text-xs font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Sauvegarder
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Annuler"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Mode affichage */
        <>
          <span className="flex-1 text-sm font-semibold text-slate-800">{competence.libelle}</span>

          {confirmDelete ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-red-700 font-bold">Confirmer suppression ?</span>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Oui, supprimer'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition cursor-pointer"
              >
                Annuler
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={handleStartEdit}
                title="Renommer"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                title="Supprimer"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </li>
  );
}
