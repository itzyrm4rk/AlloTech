'use client';

import { ExportActions } from '@/components/ExportActions';
import { Pagination } from '@/components/Pagination';
import { ClientFormModal } from '@/components/clients/ClientFormModal';
import { ClientStatsCards } from '@/components/clients/ClientStatsCards';
import { type ClientDB, TYPE_CONFIG } from '@/components/clients/types';
import type { ExportColumn } from '@/lib/export-utils';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  HardDrive,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Ticket,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'TOUS' | 'ENTREPRISE' | 'PARTICULIER'>('TOUS');

  // Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClientDB | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Notification toast
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors du chargement des clients.');
      setClients(data.clients || []);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Une erreur est survenue lors de la récupération.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const showNotif = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDeleteClient = async (e: React.MouseEvent, client: ClientDB) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement le client "${client.nom}" ?`)) {
      return;
    }

    setDeletingId(client.id);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la suppression.');

      showNotif('success', `Client "${client.nom}" supprimé avec succès.`);
      await loadClients();
    } catch (err: unknown) {
      showNotif('error', err instanceof Error ? err.message : 'Erreur lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleOpenEdit = (e: React.MouseEvent, client: ClientDB) => {
    e.preventDefault();
    e.stopPropagation();
    setClientToEdit(client);
    setIsFormModalOpen(true);
  };

  const handleOpenCreate = () => {
    setClientToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = (_savedClient: ClientDB, isEdit: boolean) => {
    showNotif(
      'success',
      isEdit ? 'Client mis à jour avec succès.' : 'Nouveau client enregistré avec succès.',
    );
    void loadClients();
  };

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const q = search.trim().toLowerCase();
      const matchSearch =
        q === '' ||
        c.nom.toLowerCase().includes(q) ||
        c.telephone.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.adresse?.toLowerCase().includes(q);

      const matchType = typeFilter === 'TOUS' || c.typeClient === typeFilter;
      return matchSearch && matchType;
    });
  }, [clients, search, typeFilter]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter]);

  const paginatedClients = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportColumns: ExportColumn<ClientDB>[] = [
    { header: 'Nom / Raison sociale', key: 'nom', width: 28 },
    {
      header: 'Type de client',
      key: 'typeClient',
      width: 16,
      format: (v) => (v === 'ENTREPRISE' ? 'Entreprise' : 'Particulier'),
    },
    { header: 'Téléphone', key: 'telephone', width: 18 },
    { header: 'Email', key: 'email', width: 26, format: (v) => (v ? String(v) : 'Non renseigné') },
    {
      header: 'Adresse',
      key: 'adresse',
      width: 32,
      format: (v) => (v ? String(v) : 'Non renseignée'),
    },
    {
      header: 'Équipements Matériels',
      key: 'equipements',
      width: 18,
      format: (_, row) => row.equipements?.filter((e) => e.typeActif !== 'LOGICIEL').length ?? 0,
    },
    {
      header: 'Équipements Logiciels',
      key: 'equipements',
      width: 18,
      format: (_, row) => row.equipements?.filter((e) => e.typeActif === 'LOGICIEL').length ?? 0,
    },
    {
      header: 'Tickets associés',
      key: 'tickets',
      width: 16,
      format: (_, row) => row.tickets?.length ?? 0,
    },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast de notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-in slide-in-from-top-3 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-red-50 text-red-900 border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span className="text-xs font-bold">{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFA101]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#31525B]">
              Annuaire Clients
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Répertoire Clients
          </h1>
          <p className="text-xs lg:text-sm text-slate-500 mt-1">
            Consultez les coordonnées, parcs d’équipements CMDB et historiques d'interventions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <ExportActions
            title="Répertoire des Clients"
            filename="allotech-clients"
            sheetName="Clients"
            columns={exportColumns}
            data={filtered}
            activeFilters={[
              { label: 'Recherche', value: search },
              { label: 'Type', value: typeFilter === 'TOUS' ? '' : typeFilter },
            ]}
            itemLabel="clients"
          />

          <button
            type="button"
            onClick={() => void loadClients()}
            disabled={loading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#FFA101]' : ''}`} />
          </button>

          <button
            type="button"
            id="btn-nouveau-client"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#31525B] hover:bg-[#233b41] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FFA101]" />
            <span>Nouveau client</span>
          </button>
        </div>
      </div>

      {/* Cartes KPI réutilisables */}
      <ClientStatsCards clients={clients} />

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, téléphone, email ou ville..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#31525B]/20"
          />
        </div>

        <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTypeFilter('TOUS')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              typeFilter === 'TOUS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous ({clients.length})
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('ENTREPRISE')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              typeFilter === 'ENTREPRISE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#31525B]" />
            Entreprises
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('PARTICULIER')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              typeFilter === 'PARTICULIER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#FFA101]" />
            Particuliers
          </button>
        </div>
      </div>

      {/* Liste des clients */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-[#FFA101] mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Chargement des clients...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-700 text-xs font-bold">
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-800 font-bold text-sm">Aucun client trouvé</p>
          <p className="text-slate-400 text-xs mt-1">
            {search
              ? 'Aucun client ne correspond à votre recherche.'
              : 'Commencez par ajouter votre premier client.'}
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 bg-[#31525B] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#FFA101]" />
            <span>Créer un client</span>
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 uppercase font-black tracking-wider text-[10px]">
                  <th className="px-5 py-3.5">Client & Raison sociale</th>
                  <th className="px-4 py-3.5 hidden sm:table-cell">Type</th>
                  <th className="px-4 py-3.5">Contact</th>
                  <th className="px-4 py-3.5 hidden md:table-cell">Adresse / Site</th>
                  <th className="text-center px-4 py-3.5 hidden lg:table-cell">
                    Équipements (Mat. / Log.)
                  </th>
                  <th className="text-center px-4 py-3.5 hidden lg:table-cell">Tickets</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedClients.map((client) => {
                  const typeCfg = TYPE_CONFIG[client.typeClient] || TYPE_CONFIG.ENTREPRISE;
                  const TypeIcon = typeCfg.icon;
                  const matCount =
                    client.equipements?.filter((e) => (e.typeActif ?? 'MATERIEL') !== 'LOGICIEL')
                      .length || 0;
                  const logCount =
                    client.equipements?.filter((e) => e.typeActif === 'LOGICIEL').length || 0;
                  const ticketsCount = client.tickets?.length || 0;

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/clients/${client.id}`}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={`w-10 h-10 rounded-xl ${typeCfg.bg} border ${typeCfg.border} flex items-center justify-center shrink-0`}
                          >
                            <TypeIcon className={`w-5 h-5 ${typeCfg.text}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 group-hover:text-[#FFA101] transition-colors truncate">
                              {client.nom}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Inscrit le{' '}
                              {new Date(client.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </Link>
                      </td>

                      <td className="px-4 py-4 hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}
                        >
                          {typeCfg.label}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{client.telephone}</span>
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[170px]">{client.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 hidden md:table-cell text-slate-600 truncate max-w-[220px]">
                        {client.adresse ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#FFA101] shrink-0" />
                            <span className="truncate">{client.adresse}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Non renseignée</span>
                        )}
                      </td>

                      <td className="text-center px-4 py-4 hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <HardDrive className="w-3.5 h-3.5 text-[#31525B]" />
                          <span>{matCount}</span>
                          <span className="text-slate-300">|</span>
                          <span className="text-purple-700">{logCount}</span>
                        </span>
                      </td>

                      <td className="text-center px-4 py-4 hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          <Ticket className="w-3.5 h-3.5 text-[#FFA101]" />
                          <span>{ticketsCount}</span>
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/dashboard/clients/${client.id}`}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-[#31525B] hover:text-white text-slate-700 rounded-xl text-xs font-bold transition"
                          >
                            Fiche
                          </Link>

                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(e, client)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                            title="Modifier ce client"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDeleteClient(e, client)}
                            disabled={deletingId === client.id}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition cursor-pointer disabled:opacity-50"
                            title="Supprimer ce client"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > pageSize && (
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <Pagination
                currentPage={currentPage}
                totalItems={filtered.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}

      {/* Modale partagée Création / Modification */}
      <ClientFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleFormSuccess}
        clientToEdit={clientToEdit}
      />
    </div>
  );
}
