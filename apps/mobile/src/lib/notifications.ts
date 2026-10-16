import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ==============================================================================
// Gestion des notifications système pour le Technicien Mobile (Android / iOS)
// Centre de notifications du smartphone + Redirection au clic vers le ticket
// ==============================================================================

// Comportement de présentation immédiate
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Initialise les permissions et configure le canal haute priorité pour Android
 */
export async function setupNotifications(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('allotech-interventions', {
        name: 'Interventions & Alertes AlloTech',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFA101',
        sound: 'default',
        enableVibrate: true,
        showBadge: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('[Notifications] Erreur configuration notifications:', error);
    return false;
  }
}

/**
 * Émet une notification dans le volet / centre de notifications du smartphone
 */
export async function showSystemNotification({
  title,
  body,
  ticketId,
  data,
}: {
  title: string;
  body: string;
  ticketId?: string;
  data?: Record<string, unknown>;
}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: {
          ticketId,
          ...data,
        },
      },
      trigger: null, // Immédiat
    });
  } catch (error) {
    console.warn('[Notifications] Erreur affichage notification système:', error);
  }
}

/**
 * Écoute le clic utilisateur sur la notification dans le centre de notifications
 * du smartphone et déclenche la redirection immédiate vers le ticket concerné.
 */
export function listenNotificationTap(onTicketSelect: (ticketId: string) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.ticketId && typeof data.ticketId === 'string') {
      onTicketSelect(data.ticketId);
    }
  });

  return () => {
    subscription.remove();
  };
}
