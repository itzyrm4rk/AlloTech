'use client';

import { ClientAddEquipementModal } from '@/components/clients/ClientAddEquipementModal';
import { ClientEquipementsTab } from '@/components/clients/ClientEquipementsTab';
import { ClientFormModal } from '@/components/clients/ClientFormModal';
import { ClientHeader } from '@/components/clients/ClientHeader';
import { ClientPrintStickerModal } from '@/components/clients/ClientPrintStickerModal';
import { ClientTicketsTab } from '@/components/clients/ClientTicketsTab';
import type { ClientDB, EquipementDB } from '@/components/clients/types';
import { AlertCircle, ArrowLeft, HardDrive, RefreshCw, Ticket as TicketIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useCallback, useEffect, useState } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function FicheClientPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [client, setClient] = useState<ClientDB | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'equipements' | 'tickets'>('equipements');

  // Modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddEqModalOpen, setIsAddEqModalOpen] = useState(false);
  const [selectedEqForPrint, setSelectedEqForPrint] = useState<EquipementDB | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadClientDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/clients/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors du chargement du client.');
      setClient(data.client);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Impossible de récupérer les détails du client.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadClientDetails();
  }, [loadClientDetails]);

  const handleDeleteClient = async () => {
    if (!client) return;
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer définitivement le client "${client.nom}" ? Cette action est irréversible.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression.');

      alert(`Client ${client.nom} supprimé.`);
      router.push('/dashboard/clients');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-6 w-36 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-44 bg-white rounded-3xl border border-slate-200 animate-pulse" />
        <div className="h-80 bg-white rounded-3xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#31525B] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au répertoire clients
        </Link>
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Client introuvable</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {error || "Ce compte client n'existe pas ou a été supprimé."}
          </p>
          <Link
            href="/dashboard/clients"
            className="inline-flex items-center gap-2 px-5 py-2.5 mt-5 bg-[#31525B] text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            Retour aux clients
          </Link>
        </div>
      </div>
    );
  }

  const equipements = client.equipements || [];
  const tickets = client.tickets || [];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Navigation fil d'Ariane & rafraîchissement */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#31525B] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Répertoire clients
        </Link>

        <button
          type="button"
          onClick={() => void loadClientDetails()}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-900 transition shadow-xs cursor-pointer"
          title="Rafraîchir les informations"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* En-tête Client modulé */}
      <ClientHeader
        client={client}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={handleDeleteClient}
        deleting={deleting}
      />

      {/* Sélecteur d'onglets (CMDB vs Interventions) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('equipements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'equipements'
              ? 'bg-[#31525B] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <HardDrive
            className={`w-3.5 h-3.5 ${activeTab === 'equipements' ? 'text-[#FFA101]' : 'text-slate-400'}`}
          />
          <span>Équipements & CMDB</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'equipements' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {equipements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'tickets'
              ? 'bg-[#31525B] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <TicketIcon
            className={`w-3.5 h-3.5 ${activeTab === 'tickets' ? 'text-[#FFA101]' : 'text-slate-400'}`}
          />
          <span>Interventions & Tickets</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              activeTab === 'tickets' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {tickets.length}
          </span>
        </button>
      </div>

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'equipements' ? (
        <ClientEquipementsTab
          equipements={equipements}
          onOpenAddModal={() => setIsAddEqModalOpen(true)}
          onOpenPrintSticker={(eq) => setSelectedEqForPrint(eq)}
        />
      ) : (
        <ClientTicketsTab clientId={client.id} tickets={tickets} />
      )}

      {/* Modale d'édition des coordonnées du client */}
      <ClientFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        clientToEdit={client}
        onSuccess={() => void loadClientDetails()}
      />

      {/* Modale d'ajout d'équipement rattaché au client */}
      <ClientAddEquipementModal
        isOpen={isAddEqModalOpen}
        onClose={() => setIsAddEqModalOpen(false)}
        clientId={client.id}
        clientAdresse={client.adresse}
        onSuccess={() => void loadClientDetails()}
      />

      {/* Modale d'impression d'étiquette QR Code CMDB */}
      <ClientPrintStickerModal
        isOpen={Boolean(selectedEqForPrint)}
        onClose={() => setSelectedEqForPrint(null)}
        equipement={selectedEqForPrint}
        clientNom={client.nom}
      />
    </div>
  );
}
