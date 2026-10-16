import { Camera, Edit2 } from 'lucide-react-native';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { resolveMediaUrl } from '../../lib/media-utils';

interface ProfilHeroProps {
  displayName: string;
  matricule: string;
  initials: string;
  avatar: string | null;
  onAvatarPress: () => void;
  onEditPress: () => void;
}

export function ProfilHero({
  displayName,
  matricule,
  initials,
  avatar,
  onAvatarPress,
  onEditPress,
}: ProfilHeroProps) {
  const resolvedAvatar = resolveMediaUrl(avatar);

  return (
    <View style={styles.hero}>
      <View style={styles.heroBg} />
      <View style={styles.avatarWrap}>
        {resolvedAvatar ? (
          <Image source={{ uri: resolvedAvatar }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={onAvatarPress}
          style={styles.avatarBtn}
          accessibilityLabel="Changer la photo de profil"
        >
          <Camera size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.heroName}>{displayName}</Text>
      <Text style={styles.heroMatricule}>#{matricule}</Text>

      <TouchableOpacity
        onPress={onEditPress}
        style={styles.editBtn}
        accessibilityLabel="Modifier mon profil"
      >
        <Edit2 size={15} color="#FFFFFF" />
        <Text style={styles.editBtnText}>Modifier le profil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 20,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatarImg: {
    width: 90,
    height: 90,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarFallback: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: '#31525B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarInitials: { fontSize: 30, fontWeight: '800', color: '#FFFFFF' },
  avatarBtn: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#FFA101',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  heroName: { fontSize: 24, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  heroMatricule: {
    fontSize: 14,
    color: '#FFA101',
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 10,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#31525B',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#31525B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  editBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
