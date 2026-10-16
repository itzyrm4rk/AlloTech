'use client';

import type { UploadedMedia } from '@/components/MediaUploader';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  type Client,
  type Equipement,
  type Technicien,
  type TicketFormState,
  formatDatetimeLocal,
} from './types';

export function useNouveauTicket() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successRef, setSuccessRef] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Données chargées depuis l'API
  const [clients, setClients] = useState<Client[]>([]);
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [techniciens, setTechniciens] = useState<Technicien[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingEquipements, setLoadingEquipements] = useState(false);
  const [loadingTechs, setLoadingTechs] = useState(true);

  // État du dropdown client personnalisé
  const [clientDropdownOpen, setClientDropdownOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState<'ALL' | 'ENTREPRISE' | 'PARTICULIER'>(
    'ALL',
  );
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Nature de l'installation (Matérielle ou Logicielle)
  const [natureInstallation, setNatureInstallation] = useState<'MATERIEL' | 'LOGICIEL'>('MATERIEL');

  // Compétences dépliées par technicien
  const [expandedTechSkills, setExpandedTechSkills] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState<TicketFormState>({
    clientId: '',
    equipementId: '',
    typeDemande: 'PANNE',
    urgence: 'NORMALE',
    adresseSite: '',
    latitudeSite: '',
    longitudeSite: '',
    description: '',
    dateSouhaitee: '',
    commentaire: '',
    categoriePanne: '',
    sousTypePanneMat: '',
    sousTypePanneLog: '',
    equipementsDescription: '',
  });

  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [medias, setMedias] = useState<UploadedMedia[]>([]);

  // Fermer le dropdown client au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setClientDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Charger les clients
  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((data) => setClients(data.clients ?? []))
      .finally(() => setLoadingClients(false));
  }, []);

  // Charger les techniciens
  useEffect(() => {
    fetch('/api/techniciens')
      .then((r) => r.json())
      .then((data) => setTechniciens(data.techniciens ?? []))
      .finally(() => setLoadingTechs(false));
  }, []);

  // Charger les équipements du client sélectionné
  const loadEquipements = useCallback(async (clientId: string) => {
    if (!clientId) {
      setEquipements([]);
      return;
    }
    setLoadingEquipements(true);
    try {
      const res = await fetch(`/api/equipements?clientId=${clientId}`);
      const data = await res.json();
      setEquipements(data.equipements ?? []);
    } finally {
      setLoadingEquipements(false);
    }
  }, []);

  useEffect(() => {
    loadEquipements(form.clientId);
    setForm((p) => ({ ...p, equipementId: '' }));
  }, [form.clientId, loadEquipements]);

  const handleClientChange = useCallback(
    (clientId: string) => {
      const selected = clients.find((c) => c.id === clientId);
      setForm((p) => ({
        ...p,
        clientId,
        equipementId: '',
        adresseSite: selected?.adresse || p.adresseSite,
      }));
      if (errors.clientId) {
        setErrors(({ clientId: _, ...rest }) => rest);
      }
      if (selected?.adresse && errors.adresseSite) {
        setErrors(({ adresseSite: _, ...rest }) => rest);
      }
    },
    [clients, errors.clientId, errors.adresseSite],
  );

  // Pré-sélection éventuelle d'un client passé en URL query string (ex: ?clientId=...)
  useEffect(() => {
    if (typeof window !== 'undefined' && clients.length > 0 && !form.clientId) {
      const params = new URLSearchParams(window.location.search);
      const urlClientId = params.get('clientId');
      if (urlClientId) {
        handleClientChange(urlClientId);
      }
    }
  }, [clients, form.clientId, handleClientChange]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.clientId) e.clientId = 'Veuillez sélectionner un client';
    if (!form.adresseSite.trim() || form.adresseSite.trim().length < 5)
      e.adresseSite = "L'adresse du site est requise";
    if (!form.description.trim() || form.description.trim().length < 10)
      e.description = 'La description doit faire au moins 10 caractères';
    if (form.typeDemande === 'PANNE' && !form.equipementId)
      e.equipementId = "Sélectionnez l'équipement ou logiciel concerné";
    if (
      form.typeDemande === 'INSTALLATION' &&
      !form.equipementsDescription.trim() &&
      !form.equipementId
    )
      e.equipementsDescription =
        'Précisez les équipements ou logiciels à installer (ou sélectionnez un actif existant).';
    if (selectedTechIds.length === 0) {
      e.techniciens = 'Veuillez assigner au moins un technicien à cette intervention.';
    }
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      let finalEquipementsDescription = form.equipementsDescription?.trim() || null;
      if (form.typeDemande === 'INSTALLATION' && finalEquipementsDescription) {
        const prefix =
          natureInstallation === 'MATERIEL'
            ? '[INSTALLATION MATÉRIELLE]'
            : '[INSTALLATION LOGICIELLE]';
        if (!finalEquipementsDescription.startsWith('[')) {
          finalEquipementsDescription = `${prefix} ${finalEquipementsDescription}`;
        }
      }

      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          equipementId: form.equipementId || null,
          categoriePanne: form.categoriePanne || null,
          sousTypePanneMat: form.sousTypePanneMat || null,
          sousTypePanneLog: form.sousTypePanneLog || null,
          equipementsDescription: finalEquipementsDescription,
          latitudeSite: form.latitudeSite || null,
          longitudeSite: form.longitudeSite || null,
          technicienIds: selectedTechIds,
          medias,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Erreur lors de la création du ticket');
      }

      setSuccessRef(data.ticket?.reference ?? '');
      setSuccess(true);
      setTimeout(() => router.push('/dashboard/tickets'), 1800);
    } catch (err: unknown) {
      setErrors({ global: err instanceof Error ? err.message : 'Une erreur est survenue.' });
    } finally {
      setIsLoading(false);
    }
  };

  const set =
    (key: keyof TicketFormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const toggleTech = (id: string) => {
    setSelectedTechIds((prev) => {
      const next = prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id];
      if (next.length > 0 && errors.techniciens) {
        setErrors(({ techniciens: _, ...rest }) => rest);
      }
      return next;
    });
  };

  const toggleTechSkills = (techId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTechSkills((prev) => ({
      ...prev,
      [techId]: !prev[techId],
    }));
  };

  const toggleInstallationPreset = (preset: string) => {
    setForm((prev) => {
      const current = prev.equipementsDescription || '';
      if (current.includes(preset)) {
        const updated = current
          .replace(new RegExp(`- ${preset}\\n?`, 'g'), '')
          .replace(new RegExp(`${preset},?\\s*`, 'g'), '')
          .trim();
        return { ...prev, equipementsDescription: updated };
      }
      const prefix = current.trim() ? `${current.trim()}\n` : '';
      return { ...prev, equipementsDescription: `${prefix}- ${preset}` };
    });
  };

  const applyDatePreset = (hoursToAdd: number, targetHour?: number) => {
    const d = new Date();
    if (targetHour !== undefined) {
      d.setDate(d.getDate() + Math.floor(hoursToAdd / 24));
      d.setHours(targetHour, 0, 0, 0);
    } else {
      d.setHours(d.getHours() + hoursToAdd);
      const m = d.getMinutes();
      d.setMinutes(m >= 30 ? 30 : 0, 0, 0);
    }
    setForm((p) => ({ ...p, dateSouhaitee: formatDatetimeLocal(d) }));
  };

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesType = clientTypeFilter === 'ALL' || c.typeClient === clientTypeFilter;
      const query = clientSearch.toLowerCase().trim();
      if (!query) return matchesType;
      const matchesText =
        c.nom.toLowerCase().includes(query) ||
        Boolean(c.adresse?.toLowerCase().includes(query)) ||
        Boolean(c.telephone?.toLowerCase().includes(query)) ||
        Boolean(c.email?.toLowerCase().includes(query));
      return matchesType && matchesText;
    });
  }, [clients, clientTypeFilter, clientSearch]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === form.clientId);
  }, [clients, form.clientId]);

  return {
    isLoading,
    success,
    successRef,
    errors,
    clients,
    equipements,
    techniciens,
    loadingClients,
    loadingEquipements,
    loadingTechs,
    clientDropdownOpen,
    setClientDropdownOpen,
    clientSearch,
    setClientSearch,
    clientTypeFilter,
    setClientTypeFilter,
    clientDropdownRef,
    natureInstallation,
    setNatureInstallation,
    expandedTechSkills,
    toggleTechSkills,
    form,
    setForm,
    set,
    selectedTechIds,
    toggleTech,
    medias,
    setMedias,
    handleClientChange,
    handleSubmit,
    toggleInstallationPreset,
    applyDatePreset,
    filteredClients,
    selectedClient,
  };
}
