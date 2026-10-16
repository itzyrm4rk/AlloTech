import { db, eq } from '@allotech/db';
import { tickets } from '@allotech/db/schema';
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { type NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

// Styles du document PDF basés sur l'identité visuelle d'AlloTech
const styles = StyleSheet.create({
  page: {
    padding: 36,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#2C2C2E',
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#31525B',
    marginBottom: 16,
  },
  logoBrand: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#31525B',
  },
  logoSubtitle: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#1A2C31',
  },
  docRef: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#FFA101',
    marginTop: 2,
  },
  badgeContainer: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 4,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  badgeInfo: {
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
  },
  badgeSoftware: {
    backgroundColor: '#EDE9FE',
    color: '#5B21B6',
  },
  section: {
    marginBottom: 14,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#31525B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  col2: {
    flex: 1,
  },
  col3: {
    flex: 1,
    paddingRight: 8,
  },
  label: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 9,
    color: '#0F172A',
    marginTop: 1,
  },
  valueBold: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    marginTop: 1,
  },
  reportBox: {
    marginTop: 4,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
  },
  reportText: {
    fontSize: 9,
    color: '#1E293B',
    lineHeight: 1.5,
  },
  signatureContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  signatureBox: {
    flex: 1,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    alignItems: 'center',
    minHeight: 110,
    justifyContent: 'space-between',
  },
  signatureTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  signatureImage: {
    width: 140,
    height: 55,
    objectFit: 'contain',
    marginVertical: 4,
  },
  signatureEmpty: {
    fontSize: 8,
    fontStyle: 'italic',
    color: '#94A3B8',
    marginVertical: 20,
  },
  signatureSigner: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  signatureDate: {
    fontSize: 7,
    color: '#64748B',
  },
  qrCodeBox: {
    width: 65,
    height: 65,
    alignSelf: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#94A3B8',
  },
});

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Récupération complète du ticket avec toutes ses relations
    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, id),
      with: {
        client: true,
        equipement: true,
        techniciens: {
          with: { technicien: true },
        },
        rapport: true,
        signature: true,
        medias: true,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 });
    }

    // Génération du QR Code de certification pour le document
    const qrData = ticket.equipement?.qrCodeData || `ALLOTECH-TCK-${ticket.reference}`;
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      margin: 1,
      width: 120,
      color: { dark: '#1A2C31', light: '#FFFFFF' },
    });

    const dateCloture = ticket.clotureAt
      ? new Date(ticket.clotureAt).toLocaleString('fr-FR', {
          dateStyle: 'long',
          timeStyle: 'short',
        })
      : new Date().toLocaleDateString('fr-FR');

    const dateIntervention = ticket.heureDemarrage
      ? new Date(ticket.heureDemarrage).toLocaleDateString('fr-FR')
      : ticket.dateSouhaitee
        ? new Date(ticket.dateSouhaitee).toLocaleDateString('fr-FR')
        : 'Non spécifiée';

    const techniciensStr =
      ticket.techniciens.length > 0
        ? ticket.techniciens
            .map((t) => `${t.technicien.prenom} ${t.technicien.nom} (${t.technicien.matricule})`)
            .join(', ')
        : 'Non assigné';

    const isActifLogiciel =
      ticket.equipement?.typeActif === 'LOGICIEL' ||
      ticket.categoriePanne === 'LOGICIEL' ||
      ticket.sousTypePanneLog !== null ||
      Boolean(ticket.equipementsDescription?.toUpperCase().includes('LOGICIEL'));

    // Construction du document PDF avec @react-pdf/renderer
    const PdfDoc = (
      <Document
        title={`Rapport d'intervention - ${ticket.reference}`}
        author="AlloTech Douala"
        subject={`Rapport technique officiel #${ticket.reference}`}
      >
        <Page size="A4" style={styles.page}>
          {/* En-tête */}
          <View style={styles.header}>
            <View>
              <Text style={styles.logoBrand}>AlloTech</Text>
              <Text style={styles.logoSubtitle}>
                Système de Supervision et gestion de Maintenance Informatique • Cameroun
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.docTitle}>RAPPORT D'INTERVENTION</Text>
              <Text style={styles.docRef}>#{ticket.reference}</Text>
              <View style={styles.badgeContainer}>
                <Text
                  style={[
                    styles.badge,
                    ticket.statutActuel === 'CLOTUREE' ? styles.badgeSuccess : styles.badgeWarning,
                  ]}
                >
                  {ticket.statutActuel === 'CLOTUREE'
                    ? 'OFFICIELLEMENT CLÔTURÉ'
                    : ticket.statutActuel}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 1 : Informations Client & Intervention */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Informations Générales</Text>
            <View style={styles.row}>
              <View style={styles.col2}>
                <Text style={styles.label}>Client bénéficiaire</Text>
                <Text style={styles.valueBold}>{ticket.client.nom}</Text>
                <Text style={styles.value}>Tél : {ticket.client.telephone}</Text>
                {ticket.client.email && (
                  <Text style={styles.value}>Email : {ticket.client.email}</Text>
                )}
              </View>
              <View style={styles.col2}>
                <Text style={styles.label}>Lieu d'intervention (Site)</Text>
                <Text style={styles.valueBold}>{ticket.adresseSite}</Text>
                <Text style={styles.value}>Date d'intervention : {dateIntervention}</Text>
                <Text style={styles.value}>
                  Type : {ticket.typeDemande} • Urgence : {ticket.urgence}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 2 : Équipement & Diagnostic */}
          <View style={styles.section}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
                borderBottomWidth: 1,
                borderBottomColor: '#CBD5E1',
                paddingBottom: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: 'Helvetica-Bold',
                  color: '#31525B',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                2. Actif CMDB & Diagnostic d'intervention
              </Text>
              {ticket.typeDemande === 'INSTALLATION' && (
                <Text
                  style={[styles.badge, isActifLogiciel ? styles.badgeSoftware : styles.badgeInfo]}
                >
                  {isActifLogiciel
                    ? 'DÉPLOIEMENT LOGICIEL & LICENCES (CMDB)'
                    : 'MISE EN SERVICE MATÉRIELLE (CMDB)'}
                </Text>
              )}
            </View>

            <View style={styles.row}>
              <View style={styles.col3}>
                <Text style={styles.label}>
                  {isActifLogiciel ? 'Logiciel / Progiciel' : 'Équipement concerné'}
                </Text>
                <Text style={styles.valueBold}>
                  {ticket.equipement?.modele ||
                    ticket.equipementsDescription ||
                    'Non répertorié ou équipement neuf'}
                </Text>
                {isActifLogiciel ? (
                  <>
                    <Text style={styles.value}>
                      Clé / N° Licence :{' '}
                      {ticket.equipement?.numeroSerie || 'Enregistrée à la clôture'}
                    </Text>
                    {(ticket.equipement?.editeur || ticket.equipement?.version) && (
                      <Text style={styles.value}>
                        Éditeur / Version :{' '}
                        {[ticket.equipement.editeur, ticket.equipement.version]
                          .filter(Boolean)
                          .join(' • ')}
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.value}>
                    N° Série (SN) : {ticket.equipement?.numeroSerie || 'N/A'}
                  </Text>
                )}
                <Text style={styles.value}>
                  Statut CMDB : {ticket.equipement?.statut || 'EN_SERVICE'}
                </Text>
              </View>

              <View style={styles.col3}>
                <Text style={styles.label}>Technicien(s) intervenant(s)</Text>
                <Text style={styles.valueBold}>{techniciensStr}</Text>
                <Text style={styles.value}>
                  Nature : {ticket.typeDemande} •{' '}
                  {ticket.categoriePanne || (isActifLogiciel ? 'LOGICIEL' : 'MATÉRIEL')}
                </Text>
                {ticket.sousTypePanneMat && (
                  <Text style={styles.value}>Sous-type : {ticket.sousTypePanneMat}</Text>
                )}
                {ticket.sousTypePanneLog && (
                  <Text style={styles.value}>Sous-type : {ticket.sousTypePanneLog}</Text>
                )}
              </View>

              <View style={{ width: 70, alignItems: 'center' }}>
                <Image src={qrCodeDataUrl} style={styles.qrCodeBox} />
                <Text style={{ fontSize: 6, color: '#94A3B8', marginTop: 2, textAlign: 'center' }}>
                  Scan CMDB
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 6 }}>
              <Text style={styles.label}>Description initiale de la demande</Text>
              <Text style={styles.value}>{ticket.description}</Text>
            </View>
          </View>

          {/* Section 3 : Rapport technique du technicien */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Compte-Rendu Technique d'Intervention</Text>
            <View style={styles.reportBox}>
              <Text style={styles.reportText}>
                {ticket.rapport?.contenu ||
                  "Aucun rapport textuel n'a été rédigé pour cette intervention."}
              </Text>
            </View>
          </View>

          {/* Section 4 : Horodatage & Signatures */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Validation & Signatures</Text>
            <Text style={{ fontSize: 8, color: '#64748B', marginBottom: 6 }}>
              En signant ce document, le client reconnaît la conformité des prestations réalisées et
              la clôture définitive de l'intervention.
            </Text>

            <View style={styles.signatureContainer}>
              {/* Signature Technicien */}
              <View style={styles.signatureBox}>
                <Text style={styles.signatureTitle}>Visa du Technicien AlloTech</Text>
                <View style={{ marginVertical: 8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#31525B' }}>
                    [ CERTIFIÉ SUR LE TERRAIN ]
                  </Text>
                  <Text style={{ fontSize: 7, color: '#64748B', marginTop: 2 }}>
                    Authentifié via terminal mobile
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.signatureSigner}>{techniciensStr}</Text>
                  <Text style={styles.signatureDate}>Date : {dateCloture}</Text>
                </View>
              </View>

              {/* Signature Client */}
              <View style={styles.signatureBox}>
                <Text style={styles.signatureTitle}>Signature du Client</Text>
                {ticket.signature?.signatureUrl?.startsWith('data:image/') ? (
                  <Image src={ticket.signature.signatureUrl} style={styles.signatureImage} />
                ) : (
                  <Text style={styles.signatureEmpty}>Signature enregistrée numériquement</Text>
                )}
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.signatureSigner}>
                    {ticket.signature?.nomSignataire || ticket.client.nom}
                  </Text>
                  <Text style={styles.signatureDate}>Signé le : {dateCloture}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Pied de page */}
          <View style={styles.footer}>
            <Text>AlloTech — Système de Supervision et gestion de Maintenance Informatique</Text>
            <Text>Document certifié électroniquement • Page 1 / 1</Text>
          </View>
        </Page>
      </Document>
    );

    // Rendu en buffer binaire PDF
    const pdfBuffer = await renderToBuffer(PdfDoc);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rapport-Intervention-${ticket.reference}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    console.error('Erreur de génération du PDF:', error);
    const msg = error instanceof Error ? error.message : 'Erreur interne de génération du PDF';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
