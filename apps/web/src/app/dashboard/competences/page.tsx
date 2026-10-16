'use client';

import { CompetenceCreateForm } from '@/components/competences/CompetenceCreateForm';
import { CompetenceItem } from '@/components/competences/CompetenceItem';
import { CompetencesHeader } from '@/components/competences/CompetencesHeader';
import { useCompetences } from '@/components/competences/useCompetences';
import { AlertCircle, CheckCircle2, Loader2, Wrench } from 'lucide-react';

export default function CompetencesPage() {
  const {
    competences,
    loading,
    error,
    notification,
    loadCompetences,
    createCompetence,
    updateCompetence,
    deleteCompetence,
  } = useCompetences();

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* En-tête */}
      <CompetencesHeader
        total={competences.length}
        loading={loading}
        onRefresh={() => void loadCompetences()}
      />

      {/* Notification Toast */}
      {notification && (
        <div
          className={`rounded-2xl p-4 flex items-start gap-2.5 text-xs shadow-xs animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          )}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Formulaire d'ajout rapide */}
      <CompetenceCreateForm onCreate={createCompetence} />

      {/* Liste des compétences */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-[#31525B]" />
          <h2 className="text-sm font-bold text-slate-900">Compétences enregistrées</h2>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="w-6 h-6 text-[#FFA101] animate-spin" />
            <p className="text-sm text-slate-500 font-medium">Chargement des compétences...</p>
          </div>
        )}

        {!loading && error && (
          <div className="p-8 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 text-sm font-semibold">{error}</p>
          </div>
        )}

        {!loading && !error && competences.length === 0 && (
          <div className="p-12 text-center">
            <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              Aucune compétence pour le moment. Ajoutez-en une ci-dessus.
            </p>
          </div>
        )}

        {!loading && !error && competences.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {competences.map((comp, index) => (
              <CompetenceItem
                key={comp.id}
                index={index}
                competence={comp}
                onUpdate={updateCompetence}
                onDelete={deleteCompetence}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
