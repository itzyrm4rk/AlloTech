'use client';

import { Loader2, Printer, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import type { EquipementDB } from './types';

interface EquipementPrintStickerModalProps {
  equipement: EquipementDB | null;
  onClose: () => void;
}

export function EquipementPrintStickerModal({
  equipement,
  onClose,
}: EquipementPrintStickerModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    if (!equipement) return;
    let isMounted = true;
    setGeneratingQR(true);

    QRCode.toDataURL(equipement.qrCodeData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrCodeDataUrl(url);
      })
      .catch((err) => {
        console.error('Erreur génération QR Code:', err);
      })
      .finally(() => {
        if (isMounted) setGeneratingQR(false);
      });

    return () => {
      isMounted = false;
    };
  }, [equipement]);

  if (!equipement) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Isolation impression */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-equipment-sticker,
          #printable-equipment-sticker * {
            visibility: visible !important;
          }
          #printable-equipment-sticker {
            position: fixed !important;
            left: 50% !important;
            top: 20% !important;
            transform: translateX(-50%) !important;
            margin: 0 !important;
            padding: 16px !important;
            border: 2px solid #000000 !important;
            border-radius: 8px !important;
            box-shadow: none !important;
            width: 80mm !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer print:hidden"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="print:hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#31525B] flex items-center justify-center text-white">
              <Printer className="w-5 h-5 text-[#FFA101]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Étiquette QR Code CMDB</h2>
              <p className="text-xs text-slate-500">
                Étiquette autocollante prête à imprimer pour le matériel
              </p>
            </div>
          </div>
        </div>

        {/* Aperçu de l'étiquette physique */}
        <div
          id="printable-equipment-sticker"
          className="my-4 p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-center flex flex-col items-center justify-center shadow-inner"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFA101]" />
            <span className="font-black text-xs tracking-wider text-[#31525B]">ALLOTECH CMDB</span>
          </div>

          {generatingQR ? (
            <div className="w-48 h-48 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#FFA101]" />
            </div>
          ) : qrCodeDataUrl ? (
            <img
              src={qrCodeDataUrl}
              alt={`QR Code ${equipement.numeroSerie}`}
              className="w-48 h-48 object-contain rounded-lg border border-slate-100 p-1"
            />
          ) : null}

          <div className="mt-3">
            <p className="font-black text-sm text-slate-900">{equipement.modele}</p>
            <p className="font-mono text-xs font-bold text-slate-600 mt-0.5">
              S/N : {equipement.numeroSerie}
            </p>
            {equipement.client && (
              <p className="text-[11px] text-slate-500 mt-1">Client : {equipement.client.nom}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-[#31525B] hover:bg-[#233b41] text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-[#FFA101]" />
            <span>Imprimer l'étiquette</span>
          </button>
        </div>
      </div>
    </div>
  );
}
