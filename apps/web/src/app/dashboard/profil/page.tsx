'use client';

import { ProfileAvatarCard } from '@/components/profil/ProfileAvatarCard';
import { ProfileInfoForm } from '@/components/profil/ProfileInfoForm';
import { ProfilePasswordForm } from '@/components/profil/ProfilePasswordForm';
import { usePasswordChange } from '@/components/profil/usePasswordChange';
import { useProfile } from '@/components/profil/useProfile';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export default function ProfilPage() {
  const {
    // Session
    isSessionPending,
    isDataLoaded,
    userEmail,
    roleLabel,
    session,
    // Champs
    prenom,
    setPrenom,
    nom,
    setNom,
    telephone,
    setTelephone,
    // Avatar
    avatar,
    userInitials,
    hasUnsavedAvatar,
    fileInputRef,
    handleFileChange,
    handleRemoveAvatar,
    handleSavePhotoOnly,
    // Profil
    handleSaveProfile,
    profileSaving,
    profileSuccess,
    profileError,
    // Photo
    photoSaving,
    photoSuccess,
  } = useProfile();

  const password = usePasswordChange();

  if (isSessionPending && !isDataLoaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#FFA101] animate-spin" />
          <p className="text-sm text-slate-500">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  const displayName =
    prenom || nom ? `${prenom} ${nom}`.trim() : session?.user?.name || 'Utilisateur';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mon Profil</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gérez vos informations personnelles, votre avatar et vos paramètres de sécurité.
        </p>
      </div>

      {/* Notifications globales photo */}
      {photoSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-2.5 text-emerald-800 text-xs shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span className="font-semibold">
            Votre photo de profil a été enregistrée avec succès !
          </span>
        </div>
      )}

      {profileError && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-2.5 text-red-800 text-xs shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span className="font-semibold">{profileError}</span>
        </div>
      )}

      {/* Section avatar */}
      <ProfileAvatarCard
        avatar={avatar}
        userInitials={userInitials}
        userEmail={userEmail}
        roleLabel={roleLabel}
        displayName={displayName}
        hasUnsavedAvatar={hasUnsavedAvatar}
        photoSaving={photoSaving}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
        onRemoveAvatar={handleRemoveAvatar}
        onSavePhoto={handleSavePhotoOnly}
      />

      {/* Formulaire informations personnelles */}
      <ProfileInfoForm
        prenom={prenom}
        setPrenom={setPrenom}
        nom={nom}
        setNom={setNom}
        telephone={telephone}
        setTelephone={setTelephone}
        userEmail={userEmail}
        profileSaving={profileSaving}
        profileSuccess={profileSuccess}
        onSubmit={handleSaveProfile}
      />

      {/* Formulaire changement de mot de passe */}
      <ProfilePasswordForm
        currentPassword={password.currentPassword}
        setCurrentPassword={password.setCurrentPassword}
        newPassword={password.newPassword}
        setNewPassword={password.setNewPassword}
        confirmPassword={password.confirmPassword}
        setConfirmPassword={password.setConfirmPassword}
        showCurrentPassword={password.showCurrentPassword}
        setShowCurrentPassword={password.setShowCurrentPassword}
        showNewPassword={password.showNewPassword}
        setShowNewPassword={password.setShowNewPassword}
        showConfirmPassword={password.showConfirmPassword}
        setShowConfirmPassword={password.setShowConfirmPassword}
        passwordSaving={password.passwordSaving}
        passwordSuccess={password.passwordSuccess}
        passwordError={password.passwordError}
        passwordStrength={password.passwordStrength}
        onSubmit={password.handleChangePassword}
      />
    </div>
  );
}
