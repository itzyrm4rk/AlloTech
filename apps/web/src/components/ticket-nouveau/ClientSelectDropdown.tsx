'use client';

import { Building2, Check, ChevronDown, MapPin, Search, User, Users, X } from 'lucide-react';
import type React from 'react';
import type { Client } from './types';

interface ClientSelectDropdownProps {
  clientsCount: number;
  loadingClients: boolean;
  selectedClient?: Client;
  clientDropdownOpen: boolean;
  setClientDropdownOpen: (open: boolean | ((p: boolean) => boolean)) => void;
  clientSearch: string;
  setClientSearch: (s: string) => void;
  clientTypeFilter: 'ALL' | 'ENTREPRISE' | 'PARTICULIER';
  setClientTypeFilter: (t: 'ALL' | 'ENTREPRISE' | 'PARTICULIER') => void;
  filteredClients: Client[];
  handleClientChange: (clientId: string) => void;
  clientDropdownRef: React.RefObject<HTMLDivElement | null>;
  clientIdError?: string;
  hasAutoAddress?: boolean;
}

export function ClientSelectDropdown({
  clientsCount,
  loadingClients,
  selectedClient,
  clientDropdownOpen,
  setClientDropdownOpen,
  clientSearch,
  setClientSearch,
  clientTypeFilter,
  setClientTypeFilter,
  filteredClients,
  handleClientChange,
  clientDropdownRef,
  clientIdError,
  hasAutoAddress,
}: ClientSelectDropdownProps) {
  return (
    <div>
      <label
        htmlFor="client-dropdown-trigger"
        className="block text-xs font-bold text-slate-600 mb-1.5"
      >
        Client concerné *
      </label>

      <div className="relative" ref={clientDropdownRef}>
        <div
          className={`w-full flex items-center justify-between bg-slate-50 border ${
            clientIdError
              ? 'border-red-400'
              : clientDropdownOpen
                ? 'border-[#FFA101] ring-2 ring-[#FFA101]/20 bg-white'
                : 'border-slate-200 hover:border-slate-300'
          } rounded-xl px-4 py-3 text-sm transition`}
        >
          <button
            type="button"
            id="client-dropdown-trigger"
            onClick={() => setClientDropdownOpen((p) => !p)}
            disabled={loadingClients}
            className="flex items-center gap-3 min-w-0 flex-1 text-left focus:outline-none cursor-pointer"
          >
            {selectedClient ? (
              <>
                <div className="w-9 h-9 rounded-xl bg-[#31525B]/10 text-[#31525B] flex items-center justify-center shrink-0">
                  {selectedClient.typeClient === 'ENTREPRISE' ? (
                    <Building2 className="w-4 h-4 text-[#FFA101]" />
                  ) : (
                    <User className="w-4 h-4 text-[#31525B]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 truncate">{selectedClient.nom}</span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        selectedClient.typeClient === 'ENTREPRISE'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {selectedClient.typeClient === 'ENTREPRISE' ? (
                        <>
                          <Building2 className="w-3 h-3" />
                          Entreprise
                        </>
                      ) : (
                        <>
                          <User className="w-3 h-3" />
                          Particulier
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {selectedClient.adresse ||
                      selectedClient.telephone ||
                      selectedClient.email ||
                      'Aucune adresse enregistrée'}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2.5 text-slate-400">
                <Building2 className="w-4 h-4" />
                <span>
                  {loadingClients
                    ? 'Chargement des clients...'
                    : 'Sélectionner ou rechercher un client...'}
                </span>
              </div>
            )}
          </button>

          <div className="flex items-center gap-1.5 ml-2 shrink-0">
            {selectedClient && (
              <button
                type="button"
                onClick={() => handleClientChange('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
                title="Désélectionner"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setClientDropdownOpen((p) => !p)}
              className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  clientDropdownOpen ? 'rotate-180 text-[#FFA101]' : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Popover du menu déroulant */}
        {clientDropdownOpen && (
          <div className="absolute top-full left-0 right-0 z-40 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
            {/* Recherche & Filtres */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/70 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, adresse, téléphone..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#FFA101] focus:ring-1 focus:ring-[#FFA101]"
                />
                {clientSearch && (
                  <button
                    type="button"
                    onClick={() => setClientSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Onglets de types de client */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setClientTypeFilter('ALL')}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    clientTypeFilter === 'ALL'
                      ? 'bg-[#31525B] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  Tous ({clientsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setClientTypeFilter('ENTREPRISE')}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    clientTypeFilter === 'ENTREPRISE'
                      ? 'bg-[#31525B] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  Entreprises
                </button>
                <button
                  type="button"
                  onClick={() => setClientTypeFilter('PARTICULIER')}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    clientTypeFilter === 'PARTICULIER'
                      ? 'bg-[#31525B] text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3 h-3" />
                  Particuliers
                </button>
              </div>
            </div>

            {/* Liste scrollable des clients */}
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Aucun client ne correspond à votre recherche.
                </div>
              ) : (
                filteredClients.map((c) => {
                  const isSel = selectedClient?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        handleClientChange(c.id);
                        setClientDropdownOpen(false);
                        setClientSearch('');
                      }}
                      className={`w-full flex items-center justify-between p-3 text-left transition cursor-pointer ${
                        isSel ? 'bg-[#31525B]/5 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            c.typeClient === 'ENTREPRISE'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {c.typeClient === 'ENTREPRISE' ? (
                            <Building2 className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {c.nom}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {c.typeClient === 'ENTREPRISE' ? 'Entreprise' : 'Particulier'}
                            </span>
                          </div>
                          {c.adresse ? (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#FFA101] shrink-0" />
                              {c.adresse}
                            </p>
                          ) : c.telephone ? (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {c.telephone}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {isSel && <Check className="w-4 h-4 text-[#FFA101] shrink-0 ml-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {clientIdError && <p className="text-xs text-red-600 mt-1 font-medium">{clientIdError}</p>}

      {hasAutoAddress && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#31525B] bg-[#31525B]/5 px-3 py-1.5 rounded-xl border border-[#31525B]/15 animate-in fade-in">
          <MapPin className="w-3.5 h-3.5 text-[#FFA101] shrink-0" />
          <span className="font-medium">
            Adresse géographique récupérée automatiquement depuis la fiche client.
          </span>
        </div>
      )}
    </div>
  );
}
