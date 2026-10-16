'use client';

import { authClient } from '@allotech/auth/client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useProfile() {
  const { data: session, isPending: isSessionPending } = authClient.useSession();

  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [initialAvatar, setInitialAvatar] = useState<string | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [profileSaving, setProfileSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chargement initial du profil
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/update-profile');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            if (data.prenom) setPrenom(data.prenom);
            if (data.nom) setNom(data.nom);
            if (data.telephone) setTelephone(data.telephone);
            if (data.image) {
              setAvatar(data.image);
              setInitialAvatar(data.image);
            }
            setIsDataLoaded(true);
            return;
          }
        }
      } catch {
        // Fallback sur la session Better Auth
      }

      if (isMounted && session?.user) {
        const fullName = session.user.name?.trim() ?? '';
        if (fullName) {
          const parts = fullName.split(/\s+/);
          if (parts.length > 1) {
            setNom(parts[parts.length - 1]);
            setPrenom(parts.slice(0, -1).join(' '));
          } else {
            setPrenom(parts[0] ?? '');
            setNom('');
          }
        }
        if (session.user.image) {
          setAvatar(session.user.image);
          setInitialAvatar(session.user.image);
        }
        setIsDataLoaded(true);
      }
    }

    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, [session]);

  // Initiales de l'utilisateur
  const userInitials = useMemo(() => {
    if (prenom || nom) {
      const first = prenom ? prenom[0].toUpperCase() : '';
      const last = nom ? nom[0].toUpperCase() : '';
      return `${first}${last}` || 'U';
    }
    if (session?.user?.email) {
      return session.user.email.slice(0, 2).toUpperCase();
    }
    return 'AD';
  }, [prenom, nom, session]);

  const hasUnsavedAvatar = avatar !== initialAvatar;

  // Sélection de fichier image
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setProfileError("L'image ne doit pas dépasser 4 Mo.");
      return;
    }

    setProfileError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveAvatar = useCallback(() => {
    setAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Enregistrement de la photo uniquement
  const handleSavePhotoOnly = useCallback(async () => {
    setPhotoSaving(true);
    setPhotoSuccess(false);
    setProfileError(null);
    try {
      const res = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, nom, telephone, image: avatar }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de l'enregistrement de la photo.");
      }
      setInitialAvatar(avatar);
      setPhotoSuccess(true);
      setTimeout(() => setPhotoSuccess(false), 5000);
    } catch (err: unknown) {
      setProfileError(
        err instanceof Error ? err.message : "Erreur lors de l'enregistrement de la photo.",
      );
    } finally {
      setPhotoSaving(false);
    }
  }, [prenom, nom, telephone, avatar]);

  // Enregistrement du profil complet
  const handleSaveProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setProfileSaving(true);
      setProfileSuccess(false);
      setProfileError(null);
      try {
        const res = await fetch('/api/auth/update-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prenom, nom, telephone, image: avatar }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Erreur lors de la mise à jour du profil.');
        }
        setInitialAvatar(avatar);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 5000);
      } catch (err: unknown) {
        setProfileError(
          err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil.',
        );
      } finally {
        setProfileSaving(false);
      }
    },
    [prenom, nom, telephone, avatar],
  );

  const userEmail = session?.user?.email ?? '';
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? 'ADMIN';
  const roleLabel =
    userRole === 'ADMIN'
      ? 'Administrateur Principal'
      : userRole === 'TECHNICIEN'
        ? 'Technicien'
        : 'Client';

  return {
    // Session
    isSessionPending,
    isDataLoaded,
    userEmail,
    userRole,
    roleLabel,
    session,
    // Champs profil
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
    // Profil info
    handleSaveProfile,
    profileSaving,
    profileSuccess,
    profileError,
    // Photo
    photoSaving,
    photoSuccess,
  };
}
