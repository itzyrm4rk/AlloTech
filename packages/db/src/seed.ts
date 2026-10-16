import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
import { hashPassword } from 'better-auth/crypto';
import { db, eq } from './index';
import {
  accounts,
  administrateurs,
  clients,
  competences,
  equipements,
  matriculesAutorises,
  users,
} from './schema';

const DEFAULT_COMPETENCES = [
  'Réseau & Câblage Fibre',
  'Systèmes Windows & Linux',
  'Matériel Serveurs & PC',
  'Sécurité, Firewall & Antivirus',
  'Imprimantes & Périphériques',
  'Bureautique & Suite Cloud M365',
];

const DEFAULT_MATRICULES = ['TECH-001', 'TECH-002', 'TECH-003', 'TECH-004', 'TECH-005'];

async function seed() {
  console.log('🌱 [AlloTech Seed] Démarrage du peuplement de la base de données...');

  // 1. Compétences
  for (const libelle of DEFAULT_COMPETENCES) {
    const existing = await db.query.competences.findFirst({
      where: eq(competences.libelle, libelle),
    });
    if (!existing) {
      await db.insert(competences).values({ libelle });
    }
  }
  console.log(`✅ ${DEFAULT_COMPETENCES.length} compétences initialisées.`);

  // 2. Matricules autorisés pour inscription mobile des techniciens
  for (const matricule of DEFAULT_MATRICULES) {
    const existing = await db.query.matriculesAutorises.findFirst({
      where: eq(matriculesAutorises.matricule, matricule),
    });
    if (!existing) {
      await db.insert(matriculesAutorises).values({
        matricule,
        isUtilise: false,
      });
    }
  }
  console.log(`✅ ${DEFAULT_MATRICULES.length} matricules autorisés initialisés.`);

  // 3. Administrateur par défaut (admin@allotech.fr / Admin123!)
  const adminEmail = 'admin@allotech.fr';
  let adminUser = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  if (!adminUser) {
    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword('Admin123!');

    const [newUser] = await db
      .insert(users)
      .values({
        id: userId,
        name: 'Administrateur AlloTech',
        email: adminEmail,
        emailVerified: true,
      })
      .returning();
    adminUser = newUser;

    await db.insert(accounts).values({
      id: crypto.randomUUID(),
      userId: newUser.id,
      accountId: newUser.id,
      providerId: 'credential',
      password: hashedPassword,
    });

    await db.insert(administrateurs).values({
      userId: newUser.id,
      prenom: 'Admin',
      nom: 'Principal',
      telephone: '+237 670 00 00 00',
    });
    console.log(`✅ Compte administrateur créé : ${adminEmail} (mot de passe : Admin123!)`);
  } else {
    console.log(`ℹ️ Compte administrateur existant : ${adminEmail}`);
  }

  // 4. Clients de test
  const sampleClients = [
    {
      nom: 'TotalEnergies Cameroun',
      typeClient: 'ENTREPRISE' as const,
      telephone: '+237 671 23 45 67',
      email: 'it-support@totalenergies.cm',
      adresse: 'Boulevard de la Liberté, Bonanjo, Douala',
    },
    {
      nom: 'Orange Cameroun',
      typeClient: 'ENTREPRISE' as const,
      telephone: '+237 699 88 77 66',
      email: 'facilities@orange.cm',
      adresse: 'Rue Prince Bell, Akwa, Douala',
    },
    {
      nom: 'Clinique de l’Aéroport',
      typeClient: 'ENTREPRISE' as const,
      telephone: '+237 655 44 33 22',
      email: 'direction@clinique-aeroport.cm',
      adresse: 'Avenue de Gaulle, Bonapriso, Douala',
    },
    {
      nom: 'M. Paul Atangana',
      typeClient: 'PARTICULIER' as const,
      telephone: '+237 677 11 22 33',
      email: 'paul.atangana@gmail.com',
      adresse: 'Quartier Bastos, Yaoundé',
    },
  ];

  const clientMap: Record<string, string> = {};
  for (const c of sampleClients) {
    let cl = await db.query.clients.findFirst({
      where: eq(clients.nom, c.nom),
    });
    if (!cl) {
      const [inserted] = await db.insert(clients).values(c).returning();
      cl = inserted;
    }
    clientMap[c.nom] = cl.id;
  }
  console.log(`✅ ${sampleClients.length} clients opérationnels vérifiés.`);

  // 5. Équipements CMDB
  const totalEnergiesId = clientMap['TotalEnergies Cameroun'];
  const orangeId = clientMap['Orange Cameroun'];
  const cliniqueId = clientMap['Clinique de l’Aéroport'];

  const sampleEquipements = [
    {
      clientId: totalEnergiesId,
      typeActif: 'MATERIEL' as const,
      modele: 'Serveur Dell PowerEdge R740',
      numeroSerie: 'SN-DELL-884920',
      siteAdresse: 'Salle Serveurs Bâtiment A, Bonanjo, Douala',
      statut: 'EN_SERVICE' as const,
      qrCodeData: 'ALLOTECH-EQ-DELL-884920',
    },
    {
      clientId: orangeId,
      typeActif: 'MATERIEL' as const,
      modele: 'Switch Cisco Catalyst 2960-X 48 Ports',
      numeroSerie: 'SN-CISCO-39182',
      siteAdresse: 'Baie de brassage 2, Akwa, Douala',
      statut: 'EN_PANNE' as const,
      qrCodeData: 'ALLOTECH-EQ-CISCO-39182',
    },
    {
      clientId: cliniqueId,
      typeActif: 'MATERIEL' as const,
      modele: 'Imprimante Réseau HP LaserJet Enterprise M608',
      numeroSerie: 'SN-HP-991823',
      siteAdresse: 'Accueil Principal, Bonapriso, Douala',
      statut: 'EN_SERVICE' as const,
      qrCodeData: 'ALLOTECH-EQ-HP-991823',
    },
  ];

  for (const eqItem of sampleEquipements) {
    if (!eqItem.clientId) continue;
    const existing = await db.query.equipements.findFirst({
      where: eq(equipements.numeroSerie, eqItem.numeroSerie),
    });
    if (!existing) {
      await db.insert(equipements).values(eqItem);
    }
  }
  console.log('✅ Équipements du parc CMDB vérifiés.');

  console.log('🎉 [AlloTech Seed] Peuplement initial terminé avec succès !');
}

seed()
  .catch((err) => {
    console.error('❌ Erreur lors du seed :', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
