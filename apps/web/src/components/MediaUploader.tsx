'use client';

import {
  AlertCircle,
  FileIcon,
  FileSpreadsheet,
  FileText,
  Film,
  Image as ImageIcon,
  Loader2,
  Presentation,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { useRef, useState } from 'react';

export interface UploadedMedia {
  fileUrl: string;
  fileName: string;
  fileSizeBytes?: number;
  mimeType?: string;
  typeMedia:
    | 'PHOTO_PANNE_CLIENT'
    | 'DOC_CAHIER_CHARGES'
    | 'PHOTO_INTERVENTION_TECH'
    | 'VIDEO_INTERVENTION_TECH';
}

interface MediaUploaderProps {
  typeDemande: 'PANNE' | 'INSTALLATION';
  medias: UploadedMedia[];
  onChange: (medias: UploadedMedia[]) => void;
  maxFiles?: number;
}

export function MediaUploader({ typeDemande, medias, onChange, maxFiles = 5 }: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPanne = typeDemande === 'PANNE';

  // Tous les formats courants sont acceptés sans blocage : Word, PDF, PowerPoint, Excel, Images, Vidéos, etc.
  const acceptedTypes =
    '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.dwg,image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm';

  const title = isPanne
    ? 'Photos, Vidéos & Documents de diagnostic'
    : 'Cahier des charges, Plans & Fichiers techniques';

  const subtitle = isPanne
    ? 'Glissez vos photos, vidéos, documents Word, PDF ou PowerPoint (max 50 Mo par fichier)'
    : 'Glissez vos documents Word, PDF, PowerPoint, Excel, plans ou photos (max 50 Mo par fichier)';

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const resolveTypeMedia = (file: File): UploadedMedia['typeMedia'] => {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    const isDoc =
      name.endsWith('.pdf') ||
      name.endsWith('.doc') ||
      name.endsWith('.docx') ||
      name.endsWith('.ppt') ||
      name.endsWith('.pptx') ||
      name.endsWith('.xls') ||
      name.endsWith('.xlsx') ||
      name.endsWith('.txt') ||
      name.endsWith('.zip') ||
      type.includes('pdf') ||
      type.includes('word') ||
      type.includes('presentation') ||
      type.includes('spreadsheet') ||
      type.includes('officedocument');

    if (isDoc) return 'DOC_CAHIER_CHARGES';
    return isPanne ? 'PHOTO_PANNE_CLIENT' : 'DOC_CAHIER_CHARGES';
  };

  const uploadFile = async (file: File): Promise<UploadedMedia> => {
    const determinedTypeMedia = resolveTypeMedia(file);

    // 1. Demande d'URL présignée
    const presignRes = await fetch('/api/upload/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        typeMedia: determinedTypeMedia,
      }),
    });

    if (!presignRes.ok) {
      throw new Error(`Erreur d'initialisation de l'upload pour ${file.name}`);
    }

    const presignData = await presignRes.json();

    // 2a. Si URL présignée S3 / Backblaze B2 disponible -> tentative de PUT direct
    if (presignData.isPresigned && presignData.uploadUrl) {
      try {
        const uploadRes = await fetch(presignData.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
          },
          body: file,
        });

        if (uploadRes.ok) {
          return {
            fileUrl: presignData.fileUrl,
            fileName: file.name,
            fileSizeBytes: file.size,
            mimeType: file.type,
            typeMedia: determinedTypeMedia,
          };
        }
        console.warn(
          `[MediaUploader] Upload B2 direct renvoie ${uploadRes.status}, bascule vers upload serveur`,
        );
      } catch (presignErr) {
        console.warn(
          '[MediaUploader] Erreur réseau/CORS B2 direct, bascule automatique sur /api/upload:',
          presignErr,
        );
      }
    }

    // 2b. Fallback upload direct multipart
    const formData = new FormData();
    formData.append('file', file);
    formData.append('typeMedia', determinedTypeMedia);

    const directRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!directRes.ok) {
      throw new Error(`Échec de l'enregistrement de ${file.name}`);
    }

    const directData = await directRes.json();

    return {
      fileUrl: directData.fileUrl,
      fileName: directData.fileName || file.name,
      fileSizeBytes: directData.fileSizeBytes || file.size,
      mimeType: directData.mimeType || file.type,
      typeMedia: determinedTypeMedia,
    };
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    const availableSlots = maxFiles - medias.length;
    if (availableSlots <= 0) {
      setErrorMessage(`Limite atteinte : maximum ${maxFiles} fichiers autorisés.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    setIsUploading(true);

    const newMedias: UploadedMedia[] = [];
    const errors: string[] = [];

    for (const file of filesToUpload) {
      try {
        const uploaded = await uploadFile(file);
        newMedias.push(uploaded);
      } catch (err: unknown) {
        errors.push(err instanceof Error ? err.message : `Erreur pour ${file.name}`);
      }
    }

    if (newMedias.length > 0) {
      onChange([...medias, ...newMedias]);
    }

    if (errors.length > 0) {
      setErrorMessage(errors.join(', '));
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeMedia = (indexToRemove: number) => {
    onChange(medias.filter((_, idx) => idx !== indexToRemove));
  };

  const getFileIcon = (media: UploadedMedia) => {
    const mime = media.mimeType?.toLowerCase() || '';
    const name = media.fileName.toLowerCase();

    if (mime.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name)) {
      return <ImageIcon className="w-5 h-5 text-teal-600" />;
    }
    if (mime.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(name)) {
      return <Film className="w-5 h-5 text-indigo-600" />;
    }
    if (mime.includes('pdf') || name.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-rose-600" />;
    }
    if (mime.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (
      mime.includes('presentation') ||
      mime.includes('powerpoint') ||
      name.endsWith('.ppt') ||
      name.endsWith('.pptx')
    ) {
      return <Presentation className="w-5 h-5 text-amber-600" />;
    }
    if (
      mime.includes('spreadsheet') ||
      mime.includes('excel') ||
      name.endsWith('.xls') ||
      name.endsWith('.xlsx')
    ) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    return <FileIcon className="w-5 h-5 text-slate-500" />;
  };

  const isImageFile = (media: UploadedMedia) => {
    const mime = media.mimeType?.toLowerCase() || '';
    const name = media.fileName.toLowerCase();
    return mime.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(name);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
            {title}
            <span className="text-xs font-normal text-slate-400">
              ({medias.length}/{maxFiles})
            </span>
          </span>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Zone Drag and Drop */}
      {/* biome-ignore lint/a11y/useSemanticElements: Drag and drop dropzone contains file inputs and complex layout */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!isUploading) fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-[#FFA101] bg-amber-50/40 scale-[0.99]'
            : 'border-slate-300 hover:border-[#31525B] bg-slate-50/50 hover:bg-slate-50'
        } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-[#31525B]">
              <Loader2 className="w-8 h-8 animate-spin text-[#FFA101]" />
              <span className="text-sm font-semibold">
                Téléversement en cours vers le stockage...
              </span>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-[#31525B]/10 text-[#31525B] flex items-center justify-center transition-transform hover:scale-105">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-slate-700">
                <span className="text-[#31525B] font-bold hover:underline">
                  Cliquez pour parcourir
                </span>{' '}
                ou déposez vos fichiers ici
              </p>
              <p className="text-xs text-slate-400">
                Word (.docx), PDF, PowerPoint (.pptx), Excel (.xlsx), Images ou Vidéos (max 50 Mo)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Message d'erreur éventuel */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Liste des médias uploadés */}
      {medias.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {medias.map((media, index) => (
            <div
              key={`${media.fileUrl}-${index}`}
              className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-colors group"
            >
              {/* Miniature ou Icône */}
              <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                {isImageFile(media) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={media.fileUrl}
                    alt={media.fileName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  getFileIcon(media)
                )}
              </div>

              {/* Métadonnées */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate" title={media.fileName}>
                  {media.fileName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {media.fileSizeBytes && (
                    <span className="text-[10px] text-slate-400">
                      {formatFileSize(media.fileSizeBytes)}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {media.typeMedia === 'DOC_CAHIER_CHARGES' ? 'Document' : 'Photo/Vidéo'}
                  </span>
                </div>
              </div>

              {/* Bouton supprimer */}
              <button
                type="button"
                onClick={() => removeMedia(index)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Supprimer ce fichier"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
