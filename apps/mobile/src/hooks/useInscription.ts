import { useCallback, useEffect, useState } from 'react';
import { trpcClient } from '../lib/trpc';

export type Competence = { id: string; libelle: string };

interface UseInscriptionProps {
  onSuccess: () => void;
}

export function useInscription({ onSuccess }: UseInscriptionProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [competenceModalVisible, setCompetenceModalVisible] = useState(false);

  const [formData, setFormData] = useState({
    matricule: '',
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    password: '',
    confirmPassword: '',
    selectedCompetences: [] as string[],
  });

  // Chargement des compétences disponibles
  useEffect(() => {
    const loadCompetences = async () => {
      try {
        const list = await trpcClient.auth.getCompetences.query();
        if (list.length === 0) {
          await trpcClient.auth.seedCompetences.mutate();
          const seeded = await trpcClient.auth.getCompetences.query();
          setCompetences(seeded);
        } else {
          setCompetences(list);
        }
      } catch {
        // Si le serveur n'est pas joignable, on continue sans compétences
      }
    };
    void loadCompetences();
  }, []);

  const updateFormField = useCallback((field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const toggleCompetence = useCallback((id: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedCompetences: prev.selectedCompetences.includes(id)
        ? prev.selectedCompetences.filter((c) => c !== id)
        : [...prev.selectedCompetences, id],
    }));
  }, []);

  const validateStep1 = useCallback(() => {
    if (!formData.matricule.trim()) return 'Le matricule est obligatoire.';
    if (!formData.prenom.trim()) return 'Le prénom est obligatoire.';
    if (!formData.nom.trim()) return 'Le nom est obligatoire.';
    if (!formData.telephone.trim()) return 'Le numéro de téléphone est obligatoire.';
    if (!formData.email.trim()) return "L'adresse email est obligatoire.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return "Format d'adresse email invalide.";
    }
    return null;
  }, [formData.matricule, formData.prenom, formData.nom, formData.telephone, formData.email]);

  const validateStep2 = useCallback(() => {
    if (!formData.password) return 'Le mot de passe est obligatoire.';
    if (formData.password.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères.';
    if (formData.password !== formData.confirmPassword)
      return 'Les deux mots de passe ne correspondent pas.';
    return null;
  }, [formData.password, formData.confirmPassword]);

  const handleNextStep = useCallback(() => {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep(2);
  }, [validateStep1]);

  const handleSubmit = useCallback(async () => {
    const err = validateStep2();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await trpcClient.auth.registerTechnicien.mutate({
        matricule: formData.matricule.trim().toUpperCase(),
        prenom: formData.prenom.trim(),
        nom: formData.nom.trim(),
        telephone: formData.telephone.trim(),
        email: formData.email.trim(),
        password: formData.password,
        competenceIds: formData.selectedCompetences,
      });

      setSuccess(true);
      setTimeout(() => onSuccess(), 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de l'inscription. Réessayez.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [formData, onSuccess, validateStep2]);

  return {
    step,
    setStep,
    showPassword,
    setShowPassword,
    loading,
    error,
    setError,
    success,
    competences,
    competenceModalVisible,
    setCompetenceModalVisible,
    formData,
    updateFormField,
    toggleCompetence,
    handleNextStep,
    handleSubmit,
  };
}
