'use client';

import {
  type ExportColumn,
  type ExportOptions,
  exportToExcel,
  exportToPdfReport,
} from '@/lib/export-utils';
import { Download, FileDown, FileSpreadsheet, Loader2, Printer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ExportActionsProps<T = Record<string, unknown>> {
  title: string;
  subtitle?: string;
  filename: string;
  sheetName?: string;
  columns: ExportColumn<T>[];
  data: T[];
  activeFilters?: { label: string; value: string }[];
  itemLabel?: string;
}

export function ExportActions<T = Record<string, unknown>>({
  title,
  subtitle,
  filename,
  sheetName,
  columns,
  data,
  activeFilters,
  itemLabel = 'éléments',
}: ExportActionsProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu lors d'un clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const options: ExportOptions<T> = {
    title,
    subtitle,
    filename,
    sheetName,
    columns,
    data,
    activeFilters,
  };

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      await exportToExcel(options);
      setIsOpen(false);
    } catch (err) {
      console.error('Erreur export Excel:', err);
      alert("Une erreur est survenue lors de l'export Excel.");
    } finally {
      setExportingExcel(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setExportingPdf(true);
      const res = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          filename,
          columns: columns.map((c) => ({ header: c.header, key: String(c.key) })),
          rows: data.map((row) =>
            columns.map((col) => {
              const raw = (row as Record<string, unknown>)[col.key as string];
              return col.format
                ? col.format(raw, row)
                : raw !== null && raw !== undefined
                  ? raw
                  : '—';
            }),
          ),
          activeFilters,
        }),
      });

      if (!res.ok) {
        throw new Error('Erreur de génération PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename || 'export'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setIsOpen(false);
    } catch (err) {
      console.error('Erreur téléchargement PDF:', err);
      alert('Une erreur est survenue lors du téléchargement du PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePrintPdf = () => {
    try {
      exportToPdfReport(options);
      setIsOpen(false);
    } catch (err) {
      console.error('Erreur impression PDF:', err);
      alert("Une erreur est survenue lors de l'ouverture de l'impression.");
    }
  };

  const isBusy = exportingExcel || exportingPdf;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        id={`btn-export-${filename}`}
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={data.length === 0 || isBusy}
        className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-[#31525B] text-slate-700 hover:text-[#31525B] text-xs font-bold rounded-xl transition shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        title={`Exporter ${data.length} ${itemLabel} filtré(s)`}
      >
        {isBusy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FFA101]" />
        ) : (
          <Download className="w-3.5 h-3.5 text-[#31525B]" />
        )}
        <span>
          {exportingPdf ? 'Export PDF...' : exportingExcel ? 'Export Excel...' : 'Exporter'}
        </span>
        <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[10px] font-black text-slate-600">
          {data.length}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3.5 py-1.5 border-b border-slate-100 text-[11px] font-semibold text-slate-400">
            Exporter {data.length} {itemLabel}
          </div>

          {/* 1. Téléchargement direct PDF */}
          <button
            type="button"
            onClick={() => void handleDownloadPdf()}
            disabled={isBusy}
            className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-rose-50 hover:text-rose-800 flex items-center gap-2.5 transition cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              {exportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
            </div>
            <div>
              <p className="leading-tight">Télécharger le PDF</p>
              <p className="text-[10px] text-slate-400 font-normal">Fichier .pdf directement</p>
            </div>
          </button>

          {/* 2. Imprimer / Aperçu avant impression */}
          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={isBusy}
            className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-sky-50 hover:text-sky-800 flex items-center gap-2.5 transition cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-sky-100 flex items-center justify-center text-sky-700 shrink-0">
              <Printer className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="leading-tight">Imprimer le rapport</p>
              <p className="text-[10px] text-slate-400 font-normal">
                Dialogue d'impression navigateur
              </p>
            </div>
          </button>

          {/* 3. Classeur Excel */}
          <button
            type="button"
            onClick={() => void handleExportExcel()}
            disabled={isBusy}
            className="w-full text-left px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2.5 transition cursor-pointer"
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              {exportingExcel ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5" />
              )}
            </div>
            <div>
              <p className="leading-tight">Classeur Excel</p>
              <p className="text-[10px] text-slate-400 font-normal">Format standard .xlsx</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
