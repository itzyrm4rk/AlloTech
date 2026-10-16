'use client';

import { useCallback, useMemo, useState } from 'react';

export function usePasswordChange() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: 'bg-slate-200' };
    let score = 0;
    if (newPassword.length >= 8) score++;
    if (newPassword.length >= 12) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword)) score++;

    switch (score) {
      case 1:
        return { score: 1, label: 'Faible', color: 'bg-red-500' };
      case 2:
        return { score: 2, label: 'Moyen', color: 'bg-orange-500' };
      case 3:
        return { score: 3, label: 'Bon', color: 'bg-yellow-500' };
      case 4:
        return { score: 4, label: 'Excellent', color: 'bg-emerald-500' };
      default:
        return { score: 0, label: '', color: 'bg-slate-200' };
    }
  }, [newPassword]);

  const handleChangePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setPasswordError(null);
      setPasswordSuccess(false);

      if (newPassword.length < 8) {
        setPasswordError('Le nouveau mot de passe doit comporter au moins 8 caractères.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError('Les mots de passe saisis ne correspondent pas.');
        return;
      }

      setPasswordSaving(true);
      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Échec de la modification du mot de passe.');
        }
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(false), 5000);
      } catch (err: unknown) {
        setPasswordError(
          err instanceof Error ? err.message : 'Erreur lors de la modification du mot de passe.',
        );
      } finally {
        setPasswordSaving(false);
      }
    },
    [currentPassword, newPassword, confirmPassword],
  );

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    passwordSaving,
    passwordSuccess,
    passwordError,
    passwordStrength,
    handleChangePassword,
  };
}
