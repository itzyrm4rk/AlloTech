'use client';

import {
  Camera,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Film,
  Info,
  Paperclip,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { TicketDetail } from './types';

type MediaItem = NonNullable<TicketDetail['medias']>[number];

export function TicketMediaGallery({ medias = [] }: { medias?: TicketDetail['medias'] }) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [activeTab, setActiveTab] = useState<'TOUS' | 'TERRAIN' | 'INITIAL'>('TOUS');

  // Séparation stricte des médias selon leur origine
  const techMedias = medias.filter(
    (m) => m.typeMedia === 'PHOTO_INTERVENTION_TECH' || m.typeMedia === 'VIDEO_INTERVENTION_TECH',
  );

  const initialMedias = medias.filter(
    (m) => m.typeMedia === 'PHOTO_PANNE_CLIENT' || m.typeMedia === 'DOC_CAHIER_CHARGES',
  );

  const displayedMedias =
    activeTab === 'TERRAIN' ? techMedias : activeTab === 'INITIAL' ? initialMedias : medias;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
      {/* En-tête et onglets de sélection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-[#FFA101]" />
            Médias & Pièces jointes du ticket
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {medias.length} au total
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Distingue les pièces initiales (signalement client) des preuves capturées par le
            technicien sur le terrain.
          </p>
        </div>

        {/* Filtres par origine */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('TOUS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'TOUS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous ({medias.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TERRAIN')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'TERRAIN'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-emerald-600" />
            Preuves terrain ({techMedias.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INITIAL')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'INITIAL'
                ? 'bg-white text-[#31525B] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5 text-[#31525B]" />
            Dossier initial ({initialMedias.length})
          </button>
        </div>
      </div>

      {/* Alerte explicite si l'administrateur consulte l'onglet Preuves terrain et qu'il n'y en a aucune */}
      {activeTab === 'TERRAIN' && techMedias.length === 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">Aucune preuve terrain transmise par le technicien</p>
            <p className="text-amber-800 leading-relaxed">
              Le technicien a clôturé l'intervention sans téléverser de photo ou vidéo
              d'intervention depuis l'application mobile.
              {initialMedias.length > 0 &&
                ` Le(s) ${initialMedias.length} document(s) présent(s) sur ce ticket correspond(ent) au dossier de création initial (signalement client).`}
            </p>
          </div>
        </div>
      )}

      {/* Alerte si aucun document initial */}
      {activeTab === 'INITIAL' && initialMedias.length === 0 && (
        <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
          Aucun document initial (photo de panne ou cahier des charges) n'a été joint lors de la
          création de ce ticket.
        </p>
      )}

      {/* Contenu général vide */}
      {medias.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-4">
          Aucune pièce jointe, photo ou vidéo associée à ce ticket.
        </p>
      ) : displayedMedias.length === 0 ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {displayedMedias.map((m) => {
            const isImg =
              m.mimeType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(m.fileName);
            const isVid =
              m.typeMedia === 'VIDEO_INTERVENTION_TECH' ||
              m.mimeType?.startsWith('video/') ||
              /\.(mp4|webm|mov|m4v)$/i.test(m.fileName);

            const isTechProof =
              m.typeMedia === 'PHOTO_INTERVENTION_TECH' ||
              m.typeMedia === 'VIDEO_INTERVENTION_TECH';

            const typeLabel =
              m.typeMedia === 'PHOTO_PANNE_CLIENT'
                ? 'Constat panne client'
                : m.typeMedia === 'DOC_CAHIER_CHARGES'
                  ? 'Cahier des charges'
                  : m.typeMedia === 'VIDEO_INTERVENTION_TECH'
                    ? 'Vidéo intervention (Technicien)'
                    : 'Photo intervention (Technicien)';

            const originLabel = isTechProof ? 'Terrain • Technicien' : 'Création • Client / Admin';

            return (
              <button
                type="button"
                key={m.id}
                className="group relative flex flex-col justify-between p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl hover:bg-white hover:border-[#FFA101] hover:shadow-md transition-all cursor-pointer overflow-hidden text-left w-full"
                onClick={() => setSelectedMedia(m)}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="relative w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {isImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.fileUrl}
                        alt={m.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : isVid ? (
                      <div className="flex flex-col items-center justify-center text-indigo-600">
                        <Film className="w-6 h-6" />
                        <span className="text-[9px] font-bold mt-0.5">MP4</span>
                      </div>
                    ) : (
                      <FileText className="w-6 h-6 text-rose-600" />
                    )}

                    {/* Overlay eye on hover */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          isTechProof
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        {originLabel}
                      </span>
                    </div>

                    <p
                      className="text-xs font-bold text-slate-800 truncate group-hover:text-[#31525B]"
                      title={m.fileName}
                    >
                      {m.fileName}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                      <span className="text-[10px] text-slate-600 font-medium">{typeLabel}</span>
                      {m.fileSizeBytes ? (
                        <span>
                          •{' '}
                          {m.fileSizeBytes < 1024 * 1024
                            ? `${(m.fileSizeBytes / 1024).toFixed(0)} Ko`
                            : `${(m.fileSizeBytes / (1024 * 1024)).toFixed(1)} Mo`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 w-full">
                  <span className="text-[11px] text-slate-400">
                    Ajouté le{' '}
                    {new Date(m.uploadedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div className="flex items-center gap-1 text-[#31525B] font-semibold text-[11px] group-hover:text-[#FFA101]">
                    <span>Aperçu</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Lightbox / Video Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Backdrop button */}
          <button
            type="button"
            aria-label="Fermer la prévisualisation"
            onClick={() => setSelectedMedia(null)}
            className="absolute inset-0 bg-black/75 backdrop-blur-xs w-full h-full cursor-default"
          />

          <div className="relative z-10 bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="min-w-0 pr-4">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {selectedMedia.fileName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedMedia.typeMedia === 'VIDEO_INTERVENTION_TECH'
                    ? 'Vidéo enregistrée sur le terrain'
                    : 'Photo / document technique'}
                  {selectedMedia.fileSizeBytes &&
                    ` • ${(selectedMedia.fileSizeBytes / (1024 * 1024)).toFixed(2)} Mo`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedMedia.downloadUrl || selectedMedia.fileUrl}
                  download={selectedMedia.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#31525B] text-white hover:bg-[#253f46] shadow-xs transition"
                  title="Télécharger sur mon ordinateur"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedMedia(null)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 bg-slate-950 flex items-center justify-center min-h-[300px] overflow-auto">
              {selectedMedia.typeMedia === 'VIDEO_INTERVENTION_TECH' ||
              selectedMedia.mimeType?.startsWith('video/') ||
              /\.(mp4|webm|mov|m4v)$/i.test(selectedMedia.fileName) ? (
                <video
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[65vh] w-auto max-w-full rounded-lg outline-hidden"
                  src={selectedMedia.fileUrl}
                >
                  <track kind="captions" />
                  Votre navigateur ne prend pas en charge la lecture vidéo HTML5.
                </video>
              ) : selectedMedia.mimeType?.startsWith('image/') ||
                /\.(jpg|jpeg|png|webp|gif)$/i.test(selectedMedia.fileName) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedMedia.fileUrl}
                  alt={selectedMedia.fileName}
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-center p-8 text-white space-y-3">
                  <FileText className="w-16 h-16 mx-auto text-slate-400" />
                  <p className="text-sm">Ce fichier ne peut pas être prévisualisé directement.</p>
                  <a
                    href={selectedMedia.downloadUrl || selectedMedia.fileUrl}
                    download={selectedMedia.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFA101] text-white rounded-xl text-xs font-bold hover:bg-[#e08f00] transition"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le document
                  </a>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Téléversé le{' '}
                {new Date(selectedMedia.uploadedAt).toLocaleString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMedia(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
