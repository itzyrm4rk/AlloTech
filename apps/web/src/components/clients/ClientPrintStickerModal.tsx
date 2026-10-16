'use client';

import { Cpu, HardDrive, Loader2, Printer, QrCode, X } from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import type { EquipementDB } from './types';

interface ClientPrintStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipement: EquipementDB | null;
  clientNom: string;
}

export function ClientPrintStickerModal({
  isOpen,
  onClose,
  equipement,
  clientNom,
}: ClientPrintStickerModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen || !equipement) return;

    let isMounted = true;
    setGenerating(true);

    const qrValue = equipement.qrCodeData || `ALLOTECH-EQ-${equipement.id}`;

    QRCode.toDataURL(qrValue, {
      width: 320,
      margin: 1,
      color: {
        dark: '#111827',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (isMounted) setQrCodeDataUrl(url);
      })
      .catch((err) => {
        console.error('Erreur QR Code:', err);
      })
      .finally(() => {
        if (isMounted) setGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, equipement]);

  if (!isOpen || !equipement) return null;

  const isLog = equipement.typeActif === 'LOGICIEL';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Isolation impression */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-client-sticker,
          #printable-client-sticker * {
            visibility: visible !important;
          }
          #printable-client-sticker {
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
              <QrCode className="w-5 h-5 text-[#FFA101]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">Étiquette QR Code CMDB</h2>
              <p className="text-xs text-slate-500">
                Sticker d'identification pour l'équipement du client
              </p>
            </div>
          </div>
        </div>

        {/* Aperçu physique imprimable */}
        <div
          id="printable-client-sticker"
          className="my-3 p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-center flex flex-col items-center justify-center"
        >
          <div className="flex items-center justify-between w-full pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFA101]" />
              <span className="font-black text-xs tracking-wider text-[#31525B]">
                ALLOTECH CMDB
              </span>
            </div>
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                isLog ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {isLog ? <Cpu className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
              {isLog ? 'LOGICIEL' : 'MATÉRIEL'}
            </span>
          </div>

          {generating ? (
            <div className="w-40 h-40 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#FFA101]" />
            </div>
          ) : qrCodeDataUrl ? (
            <img
              src={qrCodeDataUrl}
              alt={`QR Code ${equipement.numeroSerie}`}
              className="w-40 h-40 object-contain rounded-lg border border-slate-100 p-1"
            />
          ) : null}

          <div className="mt-2.5 w-full text-center">
            <p className="font-black text-sm text-slate-900 truncate">{equipement.modele}</p>
            <p className="font-mono text-xs font-bold text-slate-700 mt-0.5">
              {isLog ? 'LIC : ' : 'S/N : '}
              {equipement.numeroSerie}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 truncate">Client : {clientNom}</p>
            {equipement.siteAdresse && (
              <p className="text-[10px] text-slate-400 truncate mt-0.5">
                Site : {equipement.siteAdresse}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 print:hidden">
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
            <span>Imprimer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
