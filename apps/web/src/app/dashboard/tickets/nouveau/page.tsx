'use client';

import { MediaUploader } from '@/components/MediaUploader';
import { ClientSelectDropdown } from '@/components/ticket-nouveau/ClientSelectDropdown';
import { PanneInstallationFields } from '@/components/ticket-nouveau/PanneInstallationFields';
import { SiteAndScheduleFields } from '@/components/ticket-nouveau/SiteAndScheduleFields';
import { TechniciensAssignGrid } from '@/components/ticket-nouveau/TechniciensAssignGrid';
import { TypeAndUrgenceSelector } from '@/components/ticket-nouveau/TypeAndUrgenceSelector';
import { useNouveauTicket } from '@/components/ticket-nouveau/useNouveauTicket';
import { ArrowLeft, Building2, CheckCircle, FileText, Save, Wrench } from 'lucide-react';
import Link from 'next/link';

export default function NouveauTicketPage() {
  const {
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
  } = useNouveauTicket();

  if (success) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-300 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Ticket créé avec succès !</h2>
        {successRef && (
          <p className="text-sm font-mono font-bold text-[#31525B] bg-slate-100 px-4 py-2 rounded-xl">
            {successRef}
          </p>
        )}
        <p className="text-slate-500 text-sm text-center">
          Redirection vers la liste des tickets...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/tickets"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#31525B] transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux tickets
        </Link>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Nouveau ticket d'intervention
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Renseignez les détails du site et de la prestation requise.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" id="form-nouveau-ticket">
        {errors.global && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-medium text-red-700">
            {errors.global}
          </div>
        )}

        {/* Section 1: Client & Localisation */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <Building2 className="w-4 h-4 text-[#FFA101]" />
            <h2 className="text-sm font-bold text-slate-900">Client &amp; Localisation</h2>
          </div>

          <ClientSelectDropdown
            clientsCount={clients.length}
            loadingClients={loadingClients}
            selectedClient={selectedClient}
            clientDropdownOpen={clientDropdownOpen}
            setClientDropdownOpen={setClientDropdownOpen}
            clientSearch={clientSearch}
            setClientSearch={setClientSearch}
            clientTypeFilter={clientTypeFilter}
            setClientTypeFilter={setClientTypeFilter}
            filteredClients={filteredClients}
            handleClientChange={handleClientChange}
            clientDropdownRef={clientDropdownRef}
            clientIdError={errors.clientId}
            hasAutoAddress={Boolean(form.clientId && form.adresseSite)}
          />

          <SiteAndScheduleFields
            adresseSite={form.adresseSite}
            latitudeSite={form.latitudeSite}
            longitudeSite={form.longitudeSite}
            onAddressChange={(val) => setForm((p) => ({ ...p, adresseSite: val }))}
            onSelectLocation={(loc) =>
              setForm((p) => ({
                ...p,
                adresseSite: loc.address,
                latitudeSite: loc.latitude || '',
                longitudeSite: loc.longitude || '',
              }))
            }
            addressError={errors.adresseSite}
            dateSouhaitee={form.dateSouhaitee}
            onDateChange={set('dateSouhaitee')}
            onClearDate={() => setForm((p) => ({ ...p, dateSouhaitee: '' }))}
            onApplyDatePreset={applyDatePreset}
            commentaire={form.commentaire}
            onCommentaireChange={set('commentaire')}
          />
        </div>

        {/* Section 2: Type & Urgence */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <Wrench className="w-4 h-4 text-[#FFA101]" />
            <h2 className="text-sm font-bold text-slate-900">Type de prestation &amp; Priorité</h2>
          </div>

          <TypeAndUrgenceSelector
            typeDemande={form.typeDemande}
            onTypeChange={(type) => setForm((p) => ({ ...p, typeDemande: type }))}
            urgence={form.urgence}
            onUrgenceChange={(urg) => setForm((p) => ({ ...p, urgence: urg }))}
          />

          <PanneInstallationFields
            typeDemande={form.typeDemande}
            clientId={form.clientId}
            equipements={equipements}
            loadingEquipements={loadingEquipements}
            equipementId={form.equipementId}
            onEquipementChange={(e) => {
              const eq = equipements.find((item) => item.id === e.target.value);
              setForm((p) => ({
                ...p,
                equipementId: e.target.value,
                categoriePanne: eq ? eq.typeActif : '',
                sousTypePanneMat: '',
                sousTypePanneLog: '',
              }));
            }}
            equipementError={errors.equipementId}
            categoriePanne={form.categoriePanne}
            setCategoriePanne={(cat) =>
              setForm((p) => ({
                ...p,
                categoriePanne: cat,
                sousTypePanneLog: cat === 'MATERIEL' ? '' : p.sousTypePanneLog,
                sousTypePanneMat: cat === 'LOGICIEL' ? '' : p.sousTypePanneMat,
              }))
            }
            sousTypePanneMat={form.sousTypePanneMat}
            onSousTypePanneMatChange={set('sousTypePanneMat')}
            sousTypePanneLog={form.sousTypePanneLog}
            onSousTypePanneLogChange={set('sousTypePanneLog')}
            natureInstallation={natureInstallation}
            setNatureInstallation={setNatureInstallation}
            equipementsDescription={form.equipementsDescription}
            onEquipementsDescriptionChange={set('equipementsDescription')}
            equipementsDescriptionError={errors.equipementsDescription}
            onToggleInstallationPreset={toggleInstallationPreset}
            onRattachementEquipementChange={set('equipementId')}
          />
        </div>

        {/* Section Médias & Pièces Jointes */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <MediaUploader
            typeDemande={form.typeDemande}
            medias={medias}
            onChange={setMedias}
            maxFiles={6}
          />
        </div>

        {/* Section 3: Description */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <FileText className="w-4 h-4 text-[#FFA101]" />
            <h2 className="text-sm font-bold text-slate-900">Détails &amp; Description</h2>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold text-slate-600 mb-1.5">
              Description détaillée de la demande *
            </label>
            <textarea
              id="description"
              placeholder="Décrivez précisément le dysfonctionnement ou la prestation à effectuer..."
              value={form.description}
              onChange={set('description')}
              rows={4}
              className={`w-full bg-slate-50 border ${
                errors.description ? 'border-red-400' : 'border-slate-200'
              } rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#FFA101] focus:ring-2 focus:ring-[#FFA101]/20 transition resize-none`}
            />
            <div className="flex justify-between mt-1">
              {errors.description ? (
                <p className="text-xs text-red-600 font-medium">{errors.description}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-slate-400">{form.description.length} caractères</span>
            </div>
          </div>
        </div>

        {/* Section 4: Assignation des Techniciens */}
        <TechniciensAssignGrid
          techniciens={techniciens}
          loadingTechs={loadingTechs}
          selectedTechIds={selectedTechIds}
          onToggleTech={toggleTech}
          dateSouhaitee={form.dateSouhaitee}
          expandedTechSkills={expandedTechSkills}
          onToggleTechSkills={toggleTechSkills}
          technicienError={errors.techniciens}
        />

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Link
            href="/dashboard/tickets"
            className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 text-center transition"
          >
            Annuler
          </Link>
          <button
            id="btn-creer-ticket"
            type="submit"
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#FFA101] hover:bg-[#e69100] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold rounded-xl transition shadow-md shadow-[#FFA101]/25 hover:shadow-lg cursor-pointer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isLoading ? 'Création en cours...' : 'Créer le ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
