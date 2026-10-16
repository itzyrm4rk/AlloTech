'use client';

import { Camera, Loader2, Save, ShieldCheck, Trash2, Upload } from 'lucide-react';
import type React from 'react';

interface ProfileAvatarCardProps {
  avatar: string | null;
  userInitials: string;
  userEmail: string;
  roleLabel: string;
  displayName: string;
  hasUnsavedAvatar: boolean;
  photoSaving: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAvatar: () => void;
  onSavePhoto: () => Promise<void>;
}

export function ProfileAvatarCard({
  avatar,
  userInitials,
  userEmail,
  roleLabel,
  displayName,
  hasUnsavedAvatar,
  photoSaving,
  fileInputRef,
  onFileChange,
  onRemoveAvatar,
  onSavePhoto,
}: ProfileAvatarCardProps) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar avec déclencheur */}
        <div className="relative group shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar sélectionné"
              className="w-24 h-24 rounded-2xl object-cover border-2 border-[#FFA101] shadow-md shadow-[#FFA101]/20"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#31525B] to-slate-800 border-2 border-slate-200 flex items-center justify-center text-white font-bold text-2xl shadow-sm">
              {userInitials}
            </div>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Changer la photo de profil"
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-[#FFA101] hover:bg-[#e69100] border-2 border-white flex items-center justify-center text-white shadow-md transition"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Identité & actions */}
        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-3 h-3 text-[#31525B]" />
              {roleLabel}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">{userEmail}</p>

          {/* Input fichier caché */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />

          <div className="pt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 rounded-xl transition border border-slate-200"
            >
              <Upload className="w-3.5 h-3.5 text-[#FFA101]" />
              <span>Choisir une photo</span>
            </button>

            {hasUnsavedAvatar && (
              <button
                type="button"
                onClick={() => void onSavePhoto()}
                disabled={photoSaving}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FFA101] hover:bg-[#e69100] text-xs font-bold text-white rounded-xl transition shadow-md shadow-[#FFA101]/25 disabled:opacity-50 animate-pulse"
              >
                {photoSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Enregistrer la photo</span>
              </button>
            )}

            {avatar && (
              <button
                type="button"
                onClick={onRemoveAvatar}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 rounded-xl transition border border-red-200"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Retirer</span>
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400 pt-1">
            Formats acceptés : JPG, PNG, WebP (max. 4 Mo).
          </p>
        </div>
      </div>
    </div>
  );
}
