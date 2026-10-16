import { calculateEquipmentHealth } from '@/lib/health-utils';
import { auth } from '@allotech/auth';
import { db, desc, eq } from '@allotech/db';
import { equipements, tickets } from '@allotech/db/schema';
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import QRCode from 'qrcode';

const styles = StyleSheet.create({
  page: {
    padding: 32,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: '#1E293B',
    lineHeight: 1.35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#31525B',
    paddingBottom: 12,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#31525B',
  },
  brandAccent: {
    color: '#FFA101',
  },
  brandSubtitle: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },
  docMeta: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
  },
  docSubtitle: {
    fontSize: 8,
    color: '#64748B',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#31525B',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
    marginBottom: 8,
    marginTop: 10,
    textTransform: 'uppercase',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  infoCard: {
    flex: 1,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  label: {
    color: '#64748B',
    fontSize: 8,
  },
  value: {
    fontFamily: 'Helvetica-Bold',
    color: '#0F172A',
    fontSize: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  kpiBox: {
    flex: 1,
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  kpiVal: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#31525B',
  },
  kpiLabel: {
    fontSize: 7,
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  alertBox: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    color: '#92400E',
    marginBottom: 10,
    fontSize: 8,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#31525B',
  },
  tableHeaderCell: {
    padding: 5,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCell: {
    padding: 5,
    fontSize: 7.5,
    color: '#334155',
  },
  signatureRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
    marginBottom: 10,
  },
  signatureBox: {
    flex: 1,
    height: 55,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    padding: 6,
    justifyContent: 'flex-start',
    backgroundColor: '#FAFAFA',
  },
  signatureLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 32,
    right: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    fontSize: 7,
    color: '#94A3B8',
  },
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { id } = await params;

    const equip = await db.query.equipements.findFirst({
      where: eq(equipements.id, id),
      with: {
        client: true,
      },
    });

    if (!equip) {
      return NextResponse.json({ error: 'Équipement introuvable.' }, { status: 404 });
    }

    const equipTickets = await db.query.tickets.findMany({
      where: eq(tickets.equipementId, id),
      with: {
        techniciens: {
          with: {
            technicien: true,
          },
        },
        rapport: true,
        signature: true,
      },
      orderBy: [desc(tickets.createdAt)],
    });

    const isLogiciel = equip.typeActif === 'LOGICIEL';
    const nowStr = new Date().toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    const health = calculateEquipmentHealth({
      createdAt: equip.createdAt,
      dateInstallation: equip.dateInstallation,
      statut: equip.statut,
      typeActif: equip.typeActif,
      tickets: equipTickets,
    });

    const totalTickets = equipTickets.length;
    const pannesCount = equipTickets.filter((t) => t.typeDemande === 'PANNE').length;
    const cloturesCount = equipTickets.filter((t) => t.statutActuel === 'CLOTUREE').length;

    // Déduplication des techniciens
    const techMap = new Map<
      string,
      { matricule: string; nom: string; count: number; lastDate: string }
    >();
    for (const t of equipTickets) {
      if (t.techniciens) {
        for (const { technicien } of t.techniciens) {
          const existing = techMap.get(technicien.id);
          if (existing) {
            existing.count += 1;
            if (new Date(t.createdAt) > new Date(existing.lastDate)) {
              existing.lastDate = new Date(t.createdAt).toLocaleDateString('fr-FR');
            }
          } else {
            techMap.set(technicien.id, {
              matricule: technicien.matricule,
              nom: `${technicien.prenom} ${technicien.nom}`,
              count: 1,
              lastDate: new Date(t.createdAt).toLocaleDateString('fr-FR'),
            });
          }
        }
      }
    }
    const techList = Array.from(techMap.values());

    // Génération QR code en Data URL
    let qrDataUrl: string | null = null;
    try {
      qrDataUrl = await QRCode.toDataURL(equip.qrCodeData || equip.numeroSerie, {
        width: 100,
        margin: 1,
      });
    } catch {
      // Ignorer si échec QR code
    }

    const PdfDoc = (
      <Document>
        <Page size="A4" style={styles.page}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brandTitle}>
                Allo<Text style={styles.brandAccent}>Tech</Text>
              </Text>
              <Text style={styles.brandSubtitle}>
                Parc CMDB • Carnet d'Entretien & Fiche de Vie Individuelle
              </Text>
            </View>
            <View style={styles.docMeta}>
              <Text style={styles.docTitle}>Carnet d'Entretien Officiel</Text>
              <Text style={styles.docSubtitle}>{equip.modele}</Text>
              <Text style={styles.docSubtitle}>Extrait le {nowStr}</Text>
            </View>
          </View>

          {/* Identification Actif & Client */}
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text
                style={{
                  fontFamily: 'Helvetica-Bold',
                  color: '#31525B',
                  marginBottom: 4,
                  fontSize: 8.5,
                }}
              >
                {isLogiciel ? 'Équipement Logiciel / Licence' : 'Équipement Matériel'}
              </Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Modèle :</Text>
                <Text style={styles.value}>{equip.modele}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>{isLogiciel ? 'Licence / S/N :' : 'N° de Série :'}</Text>
                <Text style={styles.value}>{equip.numeroSerie}</Text>
              </View>
              {equip.editeur && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Éditeur :</Text>
                  <Text style={styles.value}>{equip.editeur}</Text>
                </View>
              )}
              {equip.version && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Version :</Text>
                  <Text style={styles.value}>{equip.version}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.label}>Statut actuel :</Text>
                <Text style={styles.value}>{equip.statut}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text
                style={{
                  fontFamily: 'Helvetica-Bold',
                  color: '#31525B',
                  marginBottom: 4,
                  fontSize: 8.5,
                }}
              >
                Affectation Client & Site
              </Text>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Client :</Text>
                <Text style={styles.value}>{equip.client?.nom || 'Non assigné'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Téléphone :</Text>
                <Text style={styles.value}>{equip.client?.telephone || '—'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Site d'exploitation :</Text>
                <Text style={styles.value}>
                  {equip.siteAdresse || equip.client?.adresse || '—'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Mise en service :</Text>
                <Text style={styles.value}>
                  {equip.dateInstallation
                    ? new Date(equip.dateInstallation).toLocaleDateString('fr-FR')
                    : '—'}
                </Text>
              </View>
            </View>

            {qrDataUrl ? (
              <View
                style={[
                  styles.infoCard,
                  { flex: 0.45, alignItems: 'center', justifyContent: 'center' },
                ]}
              >
                <Image src={qrDataUrl} style={{ width: 55, height: 55 }} />
                <Text style={{ fontSize: 6.5, color: '#64748B', marginTop: 2 }}>QR Code CMDB</Text>
              </View>
            ) : null}
          </View>

          {/* Diagnostic de Fiabilité & KPIs */}
          <View style={styles.kpiRow}>
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiVal, { color: health.score >= 80 ? '#059669' : '#D97706' }]}>
                {health.score}%
              </Text>
              <Text style={styles.kpiLabel}>Indice de Fiabilité</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiVal}>{health.mtbfDays}j</Text>
              <Text style={styles.kpiLabel}>MTBF Moyen</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={styles.kpiVal}>{totalTickets}</Text>
              <Text style={styles.kpiLabel}>Total Interventions</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiVal, { color: pannesCount > 2 ? '#DC2626' : '#31525B' }]}>
                {pannesCount}
              </Text>
              <Text style={styles.kpiLabel}>Pannes signalées</Text>
            </View>
            <View style={styles.kpiBox}>
              <Text style={[styles.kpiVal, { color: '#059669' }]}>{cloturesCount}</Text>
              <Text style={styles.kpiLabel}>Résolues & clôturées</Text>
            </View>
          </View>

          {health.alerteMessage ? (
            <View style={styles.alertBox}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                Diagnostic CMDB : {health.label} (Score : {health.score}%)
              </Text>
              <Text style={{ marginTop: 2 }}>{health.alerteMessage}</Text>
            </View>
          ) : null}

          {/* Historique des interventions */}
          <Text style={styles.sectionTitle}>Historique des Opérations de Maintenance</Text>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <View style={[styles.tableHeaderCell, { width: '18%' }]}>
                <Text>Réf. / Date</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '14%' }]}>
                <Text>Type / Urgence</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '38%' }]}>
                <Text>Diagnostic & Solution</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '18%' }]}>
                <Text>Technicien(s)</Text>
              </View>
              <View style={[styles.tableHeaderCell, { width: '12%' }]}>
                <Text>Statut</Text>
              </View>
            </View>

            {equipTickets.length === 0 ? (
              <View style={[styles.tableRow, { padding: 12, justifyContent: 'center' }]}>
                <Text style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: 7.5 }}>
                  Aucune intervention enregistrée sur cet équipement.
                </Text>
              </View>
            ) : (
              equipTickets.slice(0, 15).map((t, idx) => {
                const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
                const dateStr = new Date(t.createdAt).toLocaleDateString('fr-FR');
                const techNames =
                  t.techniciens && t.techniciens.length > 0
                    ? t.techniciens
                        .map((te) => `${te.technicien.prenom} ${te.technicien.nom}`)
                        .join(', ')
                    : 'Non assigné';

                return (
                  <View key={t.id} style={[styles.tableRow, { backgroundColor: bg }]}>
                    <View style={[styles.tableCell, { width: '18%' }]}>
                      <Text style={{ fontFamily: 'Helvetica-Bold', color: '#0F172A' }}>
                        {t.reference}
                      </Text>
                      <Text style={{ fontSize: 6.5, color: '#64748B' }}>{dateStr}</Text>
                    </View>
                    <View style={[styles.tableCell, { width: '14%' }]}>
                      <Text>{t.typeDemande}</Text>
                      <Text style={{ fontSize: 6.5, color: '#DC2626' }}>{t.urgence}</Text>
                    </View>
                    <View style={[styles.tableCell, { width: '38%' }]}>
                      <Text style={{ fontSize: 7, color: '#334155' }}>
                        {t.description?.slice(0, 80) || '—'}
                      </Text>
                      {t.rapport?.contenu && (
                        <Text style={{ fontSize: 6.5, color: '#059669', marginTop: 1 }}>
                          Résolution: {t.rapport.contenu.slice(0, 75)}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.tableCell, { width: '18%' }]}>
                      <Text style={{ fontSize: 7 }}>{techNames}</Text>
                    </View>
                    <View style={[styles.tableCell, { width: '12%' }]}>
                      <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold' }}>
                        {t.statutActuel}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {/* Techniciens assignés / ayant intervenu */}
          {techList.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Techniciens Intervenus sur cet Actif</Text>
              <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                  <View style={[styles.tableHeaderCell, { width: '40%' }]}>
                    <Text>Nom du technicien</Text>
                  </View>
                  <View style={[styles.tableHeaderCell, { width: '25%' }]}>
                    <Text>Matricule</Text>
                  </View>
                  <View style={[styles.tableHeaderCell, { width: '15%' }]}>
                    <Text>Interventions</Text>
                  </View>
                  <View style={[styles.tableHeaderCell, { width: '20%' }]}>
                    <Text>Dernière op.</Text>
                  </View>
                </View>
                {techList.map((tech, idx) => (
                  <View
                    key={tech.matricule}
                    style={[
                      styles.tableRow,
                      { backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' },
                    ]}
                  >
                    <View style={[styles.tableCell, { width: '40%' }]}>
                      <Text style={{ fontFamily: 'Helvetica-Bold' }}>{tech.nom}</Text>
                    </View>
                    <View style={[styles.tableCell, { width: '25%' }]}>
                      <Text>{tech.matricule}</Text>
                    </View>
                    <View style={[styles.tableCell, { width: '15%' }]}>
                      <Text>{tech.count}</Text>
                    </View>
                    <View style={[styles.tableCell, { width: '20%' }]}>
                      <Text>{tech.lastDate}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Signatures officielles */}
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Visa Supervision AlloTech</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Visa Exploitant / Client</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer} fixed>
            <Text>AlloTech CMDB • Système de Supervision et de Maintenance Informatique</Text>
            <Text
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages || 1}`}
            />
          </View>
        </Page>
      </Document>
    );

    const pdfBuffer = await renderToBuffer(PdfDoc);
    const cleanModele = equip.modele.replace(/[^a-zA-Z0-9-_]/g, '_');
    const cleanSn = equip.numeroSerie.replace(/[^a-zA-Z0-9-_]/g, '_');

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Carnet-Entretien-${cleanModele}-${cleanSn}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur carnet PDF';
    console.error('Erreur génération carnet PDF:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
