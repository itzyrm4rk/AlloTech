import { LogOut } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import {
  CompetencesCard,
  CompetencesModal,
  CoordonneesCard,
  EditProfileModal,
  PasswordModal,
  ProfilHero,
  SecurityCard,
} from '../components/profil';
import { useProfilScreen } from '../hooks/useProfilScreen';
import type { StoredUser } from '../lib/auth-storage';

interface ProfilScreenProps {
  currentUser: StoredUser | null;
  onLogout: () => void;
  onUserUpdated?: (user: StoredUser) => void;
}

/**
 * Écran Profil du technicien
 * Orchestrateur lisible et modulaire
 */
export function ProfilScreen({ currentUser, onLogout, onUserUpdated }: ProfilScreenProps) {
  const {
    isEditingProfile,
    setIsEditingProfile,
    prenom,
    setPrenom,
    nom,
    setNom,
    telephone,
    setTelephone,
    avatar,
    setAvatar,
    isSavingProfile,
    handleSaveProfile,
    handleAvatarOptions,

    isEditingPassword,
    setIsEditingPassword,

    competencesCatalog,
    techCompetences,
    isEditingCompetences,
    setIsEditingCompetences,
    selectedCompIds,
    toggleSelectedCompId,
    openCompetencesEdit,
    isSavingCompetences,
    isLoadingCompetences,
    handleSaveCompetences,

    bioStatus,
    biometricEnabled,
    selectedBiometricMode,
    handleToggleBiometrics,
    handleSelectMode,

    initials,
    displayName,
    email,
  } = useProfilScreen({ currentUser, onUserUpdated });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── HERO : Avatar + nom + matricule ── */}
      <ProfilHero
        displayName={displayName}
        matricule={currentUser?.matricule ?? '—'}
        initials={initials}
        avatar={avatar}
        onAvatarPress={handleAvatarOptions}
        onEditPress={() => setIsEditingProfile(true)}
      />

      {/* ── COORDONNÉES PROFESSIONNELLES ── */}
      <CoordonneesCard
        matricule={currentUser?.matricule}
        email={email}
        telephone={currentUser?.telephone}
      />

      {/* ── COMPÉTENCES TECHNIQUES ── */}
      <CompetencesCard
        techCompetences={techCompetences}
        isLoadingCompetences={isLoadingCompetences}
        onEditPress={openCompetencesEdit}
      />

      {/* ── SÉCURITÉ & BIOMÉTRIE ── */}
      <SecurityCard
        bioStatus={bioStatus}
        biometricEnabled={biometricEnabled}
        selectedBiometricMode={selectedBiometricMode}
        onToggleBiometrics={handleToggleBiometrics}
        onSelectMode={handleSelectMode}
        onChangePasswordPress={() => setIsEditingPassword(true)}
      />

      {/* ── DÉCONNEXION ── */}
      <TouchableOpacity
        onPress={onLogout}
        style={styles.logoutBtn}
        accessibilityLabel="Se déconnecter"
      >
        <LogOut size={18} color="#DC2626" />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      {/* MODALE 1 : Modification du profil */}
      <EditProfileModal
        visible={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        prenom={prenom}
        onPrenomChange={setPrenom}
        nom={nom}
        onNomChange={setNom}
        telephone={telephone}
        onTelephoneChange={setTelephone}
        avatar={avatar}
        onAvatarChange={setAvatar}
        initials={initials}
        isSaving={isSavingProfile}
        onSave={handleSaveProfile}
        onAvatarOptions={handleAvatarOptions}
      />

      {/* MODALE 2 : Changement de mot de passe */}
      <PasswordModal
        visible={isEditingPassword}
        onClose={() => setIsEditingPassword(false)}
        email={currentUser?.email}
      />

      {/* MODALE 3 : Sélection des compétences */}
      <CompetencesModal
        visible={isEditingCompetences}
        onClose={() => setIsEditingCompetences(false)}
        catalog={competencesCatalog}
        selectedCompIds={selectedCompIds}
        onToggleComp={toggleSelectedCompId}
        isSaving={isSavingCompetences}
        onSave={handleSaveCompetences}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  screenContent: {
    paddingBottom: 60,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 4,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
});
