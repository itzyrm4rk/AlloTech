import { db, eq } from '@allotech/db';
import { equipements } from '@allotech/db/schema';

export interface DiagnosticIAImage {
  base64: string;
  mimeType?: string;
}

export interface DiagnosticIAMessage {
  role: 'user' | 'assistant';
  content: string;
  images?: DiagnosticIAImage[];
}

export interface DiagnosticIAInput {
  ticketId?: string;
  equipementId?: string;
  descriptionPanne: string;
  categoriePanne?: string;
  sousTypePanne?: string;
  images?: DiagnosticIAImage[];
  messages?: DiagnosticIAMessage[];
}

export interface DiagnosticIAResult {
  success: boolean;
  isSimulated: boolean;
  diagnostic: string;
}

/**
 * Service de Diagnostic IA (Google Gemini Multimodal + Moteur Heuristique Local)
 */
export async function runDiagnosticIA(input: DiagnosticIAInput): Promise<DiagnosticIAResult> {
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();

  // Récupérer les informations de l'équipement si présent
  let equipementInfo = '';
  if (input.equipementId) {
    const eqItem = await db.query.equipements.findFirst({
      where: eq(equipements.id, input.equipementId),
      with: {
        tickets: {
          limit: 5,
          orderBy: (t, { desc }) => [desc(t.createdAt)],
        },
      },
    });

    if (eqItem) {
      equipementInfo = `
Équipement concerné :
- Modèle : ${eqItem.modele}
- Type : ${eqItem.typeActif}
- N° Série / Clé : ${eqItem.numeroSerie}
- Éditeur : ${eqItem.editeur || 'N/A'}
- Version : ${eqItem.version || 'N/A'}
- Statut actuel : ${eqItem.statut}
- Historique récent des pannes :
${eqItem.tickets.map((t) => `  * Ticket ${t.reference} (${t.typeDemande}) : ${t.description} [Statut: ${t.statutActuel}]`).join('\n') || '  Aucun historique'}
`;
    }
  }

  const baseSystemPrompt = `Tu es l'assistant de diagnostic technique intelligent d'AlloTech, une entreprise de maintenance informatique et réseau à Douala (Cameroun).
Un technicien sur le terrain te demande assistance technique pour résoudre une intervention.

${equipementInfo}
Symptômes initiaux déclarés :
- Catégorie : ${input.categoriePanne || 'Non précisée'}
- Sous-type : ${input.sousTypePanne || 'Non précisé'}
- Description : ${input.descriptionPanne}`;

  const initialPrompt = `${baseSystemPrompt}

Donne une réponse structurée, concise et directement exploitable sur le terrain :
1. **Causes probables** (3 causes principales classées par probabilité)
2. **Points de vérification rapides** (vérifications physiques ou logicielles à faire en premier)
3. **Actions recommandées étape par étape**
4. **Précautions de sécurité / avertissements**`;

  const hasHistory = Array.isArray(input.messages) && input.messages.length > 0;
  const lastUserQuestion = hasHistory
    ? [...(input.messages ?? [])].reverse().find((m) => m.role === 'user')?.content
    : null;

  const getFallbackResponse = (note?: string) => {
    if (lastUserQuestion) {
      const q = lastUserQuestion.toLowerCase();
      let answer = '';

      if (
        q.includes('voyant') ||
        q.includes('led') ||
        q.includes('orange') ||
        q.includes('rouge') ||
        q.includes('clignot')
      ) {
        answer = `### 💡 Analyse des Indicateurs LED & Voyants
- **Orange clignotant :** Indique souvent une liaison réseau négociée à vitesse dégradée (10/100 Mbps au lieu de 1 Gbps) ou une attente de bail DHCP.
- **Rouge fixe / clignotant :** Alerte matérielle critique (défaut d'alimentation, surchauffe ou erreur POST).
- **Vert clignotant rapide :** Trafic normal et actif sur l'interface.

**Action recommandée sur site :**
1. Débrancher et reconnecter fermement le câble RJ45/fibre.
2. Vérifier si le port du switch en amont est bien activé et assigné au bon VLAN.`;
      } else if (
        q.includes('reset') ||
        q.includes('reinit') ||
        q.includes('usine') ||
        q.includes('factory')
      ) {
        answer = `### 🔄 Procédure de Réinitialisation d'Usine
1. **Équipement sous tension :** Maintenez le bouton *Reset* enfoncé avec un trombone pendant 15 à 20 secondes.
2. **Observation :** Relâchez lorsque l'ensemble des LED clignotent simultanément.
3. **Redémarrage :** L'appareil redémarrera avec sa configuration d'origine (IP par défaut généralement \`192.168.1.1\` ou obtention automatique via DHCP).
4. **Prudence :** Toute configuration VLAN, route statique ou clé Wi-Fi personnalisée sera effacée.`;
      } else if (
        q.includes('mot de passe') ||
        q.includes('password') ||
        q.includes('admin') ||
        q.includes('identifiant') ||
        q.includes('login') ||
        q.includes('accès')
      ) {
        answer = `### 🔐 Accès d'Administration & Identifiants
- **Identifiants d'usine fréquents :** \`admin\` / \`admin\` ou \`admin\` / mot de passe vide.
- **Étiquette équipement :** Vérifiez l'autocollant constructeur situé sous le châssis pour la clé par défaut.
- **Console locale :** Si l'accès HTTP/SSH est désactivé, raccordez un câble console RS232/USB (paramètres : 9600 bauds, 8 bits de données, aucune parité, 1 bit d'arrêt).`;
      } else if (
        q.includes('commande') ||
        q.includes('cli') ||
        q.includes('terminal') ||
        q.includes('ping') ||
        q.includes('ipconfig') ||
        q.includes('test')
      ) {
        answer = `### 💻 Commandes de Test & Diagnostic Rapide
Depuis le poste du technicien connecté au même segment réseau :
\`\`\`bash
# Tester la connectivité de base
ping -c 4 8.8.8.8
ping -c 4 <IP_PASSERELLE>

# Vérifier la résolution de noms
nslookup google.com

# Tracer la route pour situer la rupture
tracert 1.1.1.1  # (Windows) ou traceroute 1.1.1.1 (Linux)
\`\`\`
Sur les commutateurs/routeurs : \`show ip interface brief\` ou \`show log\`.`;
      } else if (
        q.includes('câble') ||
        q.includes('cable') ||
        q.includes('rj45') ||
        q.includes('fibre') ||
        q.includes('connectique') ||
        q.includes('port')
      ) {
        answer = `### 🔌 Vérification du Câblage & Connectique
1. Testez le cordon de raccordement (patch cord) avec un testeur de câble RJ45 pour vérifier le schéma de câblage T568B.
2. Inspectez visuellement les broches du connecteur femelle (broches tordues ou encrassées).
3. Pour une liaison fibre optique, contrôlez les connecteurs LC/SC et mesurez l'affaiblissement au photomètre.`;
      } else if (
        q.includes('ip') ||
        q.includes('dhcp') ||
        q.includes('vlan') ||
        q.includes('masque') ||
        q.includes('dns') ||
        q.includes('passerelle')
      ) {
        answer = `### 🌐 Diagnostic Adressage Réseau & DHCP
1. Assurez-vous que le pool DHCP du sous-réseau n'est pas saturé.
2. Vérifiez que le port switch est tagué ou configuré en mode accès sur le VLAN client attendu.
3. Testez l'affectation d'une IP statique temporaire dans la même plage pour isoler une panne du serveur DHCP.`;
      } else {
        answer = `### 🤖 Recommandation Technique Ciblée
Concernant votre question : *« ${lastUserQuestion} »*

1. **Vérification terrain :** Vérifiez la cohérence des branchements et l'état d'alimentation de l'équipement.
2. **Isolation du composant :** Déconnectez temporairement les périphériques secondaires pour déterminer si l'anomalie persiste sur l'unité centrale.
3. **Mesure conservatoire :** Si l'équipement ne répond plus, prévoyez le remplacement par une unité de secours et notez le numéro de série pour la traçabilité CMDB.`;
      }

      return `${answer}${note ? `\n\n*(Note : ${note})*` : ''}`;
    }

    return `### 🤖 Diagnostic Suggéré (Assistant AlloTech)
${note ? `*(Note : ${note})*\n\n` : ''}**1. Causes probables :**
- **Défaut d'alimentation ou connectique :** Faux contact sur les câbles d'alimentation ou bloc d'alimentation défectueux.
- **Conflit logiciel ou pilote corrompu :** Anomalie suite à une mise à jour récente ou coupure intempestive.
- **Surchauffe ou sécurité :** Mise en sécurité thermique suite à obstruction de la ventilation.

**2. Points de vérification rapides :**
- Vérifier les voyants LED d'état sur l'équipement.
- Contrôler l'état physique des connecteurs et câbles réseau/secteur.
- Vérifier la température du boîtier et le bruit du ventilateur.

**3. Actions recommandées étape par étape :**
1. Débrancher l'alimentation pendant 30 secondes pour vider les condensateurs puis redémarrer à froid.
2. Tester l'appareil sur une autre prise secteur ou isoler du réseau.
3. Si le problème persiste, inspecter les journaux d'erreurs récents.

**4. Précautions de sécurité :**
- Toujours décharger l'électricité statique avant d'intervenir sur les composants internes.`;
  };

  const isTest = Boolean(process.env.VITEST || process.env.NODE_ENV === 'test');
  if (isTest || !geminiApiKey) {
    return {
      success: true,
      isSimulated: true,
      diagnostic: getFallbackResponse(
        isTest
          ? 'Mode Test Automatisé Vitest'
          : 'Mode Assistant Local - GEMINI_API_KEY non configurée',
      ),
    };
  }

  try {
    const formatImagePart = (img: DiagnosticIAImage) => {
      const cleanBase64 = img.base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/i, '').trim();
      return {
        inlineData: {
          mimeType: img.mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      };
    };

    const hasImages =
      (input.images && input.images.length > 0) ||
      input.messages?.some((m) => m.images && m.images.length > 0);
    const visionSystemPrompt = hasImages
      ? `${baseSystemPrompt}\n\nIMPORTANT (VISION & PHOTOS) : Des photos terrain ont été transmises par le technicien. Analyse visuellement ces images en détail : identifie les modèles d'appareils, composants, voyants LED (couleur, clignotement), câblages, ports, écrans d'erreurs (codes BSOD, alertes), état physique (brûlures, gonflements, détériorations) et fournis une explication claire et opérationnelle.`
      : baseSystemPrompt;

    type ContentPart = { text: string } | { inlineData: { mimeType: string; data: string } };

    const geminiContents = hasHistory
      ? [
          {
            role: 'user',
            parts: [
              {
                text: `${visionSystemPrompt}\n\nFournis le diagnostic technique initial pour ce ticket.`,
              },
            ],
          },
          ...(input.messages ?? []).map((m, idx, arr) => {
            const isUser = m.role !== 'assistant';
            const parts: ContentPart[] = [{ text: m.content }];
            const attachedImages =
              m.images || (idx === arr.length - 1 && input.images ? input.images : []);
            if (isUser && attachedImages && attachedImages.length > 0) {
              for (const img of attachedImages) {
                if (img.base64) {
                  parts.push(formatImagePart(img));
                }
              }
            }
            return {
              role: isUser ? ('user' as const) : ('model' as const),
              parts,
            };
          }),
        ]
      : [
          {
            role: 'user',
            parts: (() => {
              const parts: ContentPart[] = [{ text: `${visionSystemPrompt}\n\n${initialPrompt}` }];
              if (input.images && input.images.length > 0) {
                for (const img of input.images) {
                  if (img.base64) {
                    parts.push(formatImagePart(img));
                  }
                }
              }
              return parts;
            })(),
          },
        ];

    // Timeout de 35s pour laisser le temps à Gemini de traiter et répondre
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35_000);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2048,
          },
        }),
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Erreur Gemini API (${res.status})`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      success: true,
      isSimulated: false,
      diagnostic: candidate || 'Aucune analyse générée par Gemini.',
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur lors de la requête Gemini';
    console.warn('[Diagnostic IA] Erreur ou clé invalide Gemini API:', msg);
    const cleanNote = msg.includes('aborted')
      ? 'Analyse instantanée standard — Guides CMDB terrain'
      : 'Analyse standard — Guides CMDB terrain';
    return {
      success: true,
      isSimulated: true,
      diagnostic: getFallbackResponse(cleanNote),
    };
  }
}
