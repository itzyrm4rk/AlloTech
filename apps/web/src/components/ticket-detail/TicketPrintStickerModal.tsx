'use client';

import { CheckCircle2, Cpu, Loader2, Package, Printer, QrCode, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import type { TicketDetail } from './types';

interface TicketPrintStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketDetail;
}

export function TicketPrintStickerModal({ isOpen, onClose, ticket }: TicketPrintStickerModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [format, setFormat] = useState<'label' | 'badge'>('label');

  const equipement = ticket.equipement;

  useEffect(() => {
    if (!isOpen || !equipement) return;

    let isMounted = true;
    setGenerating(true);

    const qrValue = equipement.qrCodeData || `ALLOTECH-EQ-${equipement.id}`;

    QRCode.toDataURL(qrValue, {
      width: 360,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (isMounted) setQrCodeDataUrl(url);
      })
      .catch((err) => {
        console.error('Erreur génération QR Code:', err);
      })
      .finally(() => {
        if (isMounted) setGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, equipement]);

  if (!isOpen || !equipement) return null;

  const isLogiciel = equipement.typeActif === 'LOGICIEL';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* CSS d'impression chirurgical pour isoler strictement l'étiquette */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-ticket-sticker,
          #printable-ticket-sticker * {
            visibility: visible !important;
          }
          #printable-ticket-sticker {
            position: fixed !important;
            left: 50% !important;
            top: 15% !important;
            transform: translateX(-50%) !important;
            margin: 0 !important;
            padding: 16px !important;
            border: 2px solid #000000 !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            width: 85mm !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Bouton fermeture */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer print:hidden"
        >
          <X className="w-4 h-4" />
        </button>

        {/* En-tête modal */}
        <div className="print:hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#31525B] flex items-center justify-center text-white shrink-0 shadow-xs">
              <QrCode className="w-5 h-5 text-[#FFA101]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Étiquette QR Code CMDB</h2>
              <p className="text-xs text-slate-500">
                Prête à coller sur l'équipement ou documenter la licence client
              </p>
            </div>
          </div>

          {/* Sélecteur de format */}
          <div className="flex items-center gap-2 my-4 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFormat('label')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition cursor-pointer text-center ${
                format === 'label'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Format Étiquette / Sticker (Compact)
            </button>
            <button
              type="button"
              onClick={() => setFormat('badge')}
              className={`flex-1 py-1.5 px-3 rounded-lg transition cursor-pointer text-center ${
                format === 'badge'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Format Fiche Identification (Détaillé)
            </button>
          </div>
        </div>

        {/* ZONE PHYSIQUE IMPRIMABLE */}
        <div
          id="printable-ticket-sticker"
          className={`my-3 p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-left transition-all ${
            format === 'badge' ? 'max-w-md mx-auto' : 'max-w-sm mx-auto'
          }`}
        >
          {/* Header étiquette avec branding AlloTech */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFA101]" />
              <span className="font-black text-xs tracking-wider text-[#31525B]">
                ALLOTECH CMDB
              </span>
            </div>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                isLogiciel ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isLogiciel ? <Cpu className="w-3 h-3" /> : <Package className="w-3 h-3" />}
              {isLogiciel ? 'LOGICIEL' : 'MATÉRIEL'}
            </span>
          </div>

          <div
            className={`flex ${
              format === 'label' ? 'flex-col items-center text-center' : 'items-center gap-4'
            }`}
          >
            {/* Visualisation QR Code */}
            <div className="shrink-0 flex flex-col items-center justify-center">
              {generating ? (
                <div className="w-36 h-36 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200">
                  <Loader2 className="w-7 h-7 animate-spin text-[#FFA101]" />
                </div>
              ) : qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Code ${equipement.numeroSerie}`}
                  className="w-36 h-36 object-contain rounded-xl border border-slate-200 p-1 bg-white shadow-2xs"
                />
              ) : null}
              <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-tight">
                SCAN & DIAGNOSTIC CMDB
              </span>
            </div>

            {/* Détails techniques */}
            <div
              className={`min-w-0 flex-1 ${
                format === 'label' ? 'mt-3 w-full border-t border-slate-100 pt-2.5' : ''
              }`}
            >
              <p className="font-black text-sm text-slate-900 leading-snug break-words">
                {equipement.modele}
              </p>

              <div className="mt-1.5 space-y-1">
                <p className="font-mono text-xs font-bold text-slate-700 break-all">
                  <span className="text-slate-400 text-[10px] uppercase block">
                    {isLogiciel ? 'Clé de Licence / Ref' : 'N° de Série'}
                  </span>
                  {equipement.numeroSerie}
                </p>

                {ticket.client && (
                  <p className="text-xs text-slate-600 truncate">
                    <span className="text-slate-400 text-[10px] uppercase block">Client</span>
                    {ticket.client.nom}
                  </p>
                )}

                {ticket.adresseSite && (
                  <p className="text-[11px] text-slate-500 truncate">
                    <span className="text-slate-400 text-[10px] uppercase block">Site</span>
                    {ticket.adresseSite}
                  </p>
                )}

                {equipement.version && (
                  <p className="text-[11px] text-slate-500">
                    <span className="text-slate-400 text-[10px] uppercase">Version : </span>
                    {equipement.version}
                  </p>
                )}

                <div className="pt-1.5 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                  <span>Réf : {ticket.reference}</span>
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> EN SERVICE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pied de modal / Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 print:hidden">
          <p className="text-[11px] text-slate-400">
            Compatible imprimantes à étiquettes (Dymo, Zebra, Brother) et feuilles A4.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-[#31525B] hover:bg-[#233b41] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-[#FFA101]" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
