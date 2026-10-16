import { calculateMttr, formatMttr, isSlaRespected } from '@allotech/api';
import { auth } from '@allotech/auth';
import { and, db, gte, lte } from '@allotech/db';
import { tickets } from '@allotech/db/schema';
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

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
    paddingBottom: 14,
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
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#1A2C31',
  },
  docPeriode: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#64748B',
    marginTop: 2,
  },
  kpisGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#31525B',
  },
  kpiLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#64748B',
    textTransform: 'uppercase',
    marginTop: 2,
    textAlign: 'center',
  },
  section: {
    marginBottom: 14,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#31525B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 3,
  },
  table: {
    width: '100%',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  thText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tdText: {
    fontSize: 8,
    color: '#1E293B',
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 3,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  badgeGreen: {
    backgroundColor: '#DCFCE7',
    color: '#166534',
  },
  badgeAmber: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
  badgeBlue: {
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
  },
  badgeGray: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
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

export async function GET(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const defaultStart = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate') as string)
      : new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const defaultEnd = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate') as string)
      : new Date();

    const [allTickets, allTechs] = await Promise.all([
      db.query.tickets.findMany({
        where: and(gte(tickets.createdAt, defaultStart), lte(tickets.createdAt, defaultEnd)),
        with: { client: true, techniciens: { with: { technicien: true } } },
      }),
      db.query.techniciens.findMany({
        with: { user: true },
      }),
    ]);

    const resolus = allTickets.filter(
      (t) => t.statutActuel === 'TERMINEE' || t.statutActuel === 'CLOTUREE',
    );
    const mttrMinutes = calculateMttr(
      resolus.map((t) => ({
        heureDemarrage: t.heureDemarrage ?? undefined,
        heureFinale: t.heureFinale ?? undefined,
        clotureAt: t.clotureAt ?? undefined,
        createdAt: t.createdAt,
      })),
    );
    let slaRespected = 0;
    for (const t of resolus) {
      const resolvedAt = t.clotureAt ?? t.heureFinale;
      if (
        resolvedAt &&
        isSlaRespected(
          t.urgence as 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE',
          t.createdAt,
          resolvedAt,
        )
      ) {
        slaRespected++;
      }
    }
    const tauxSla = resolus.length > 0 ? Math.round((slaRespected / resolus.length) * 100) : 100;
    const dateRange = `${defaultStart.toLocaleDateString('fr-FR')} au ${defaultEnd.toLocaleDateString('fr-FR')}`;
    const nowStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    // Agrégation techniciens exhaustive
    const techList = allTechs.map((tech) => {
      const techTickets = allTickets.filter((t) =>
        t.techniciens.some((tt) => tt.technicienId === tech.id),
      );
      const techResolus = techTickets.filter(
        (t) => t.statutActuel === 'TERMINEE' || t.statutActuel === 'CLOTUREE',
      );
      const techEnCours = techTickets.length - techResolus.length;

      const techMttr = calculateMttr(
        techResolus.map((t) => ({
          heureDemarrage: t.heureDemarrage ?? undefined,
          heureFinale: t.heureFinale ?? undefined,
          clotureAt: t.clotureAt ?? undefined,
          createdAt: t.createdAt,
        })),
      );

      let techSlaOk = 0;
      for (const t of techResolus) {
        const resolvedAt = t.clotureAt ?? t.heureFinale;
        if (
          resolvedAt &&
          isSlaRespected(
            t.urgence as 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE',
            t.createdAt,
            resolvedAt,
          )
        ) {
          techSlaOk++;
        }
      }

      const techTauxSla =
        techResolus.length > 0 ? Math.round((techSlaOk / techResolus.length) * 100) : null;

      return {
        id: tech.id,
        matricule: tech.matricule,
        nom: tech.nom,
        prenom: tech.prenom,
        isActif: tech.isActif,
        assignes: techTickets.length,
        resolus: techResolus.length,
        enCours: techEnCours,
        tauxSla: techTauxSla,
        mttrFormate: formatMttr(techMttr),
      };
    });

    const countPanne = allTickets.filter((t) => t.typeDemande === 'PANNE').length;
    const countInstallation = allTickets.filter((t) => t.typeDemande === 'INSTALLATION').length;
    const countCritique = allTickets.filter((t) => t.urgence === 'CRITIQUE').length;
    const countHaute = allTickets.filter((t) => t.urgence === 'HAUTE').length;
    const countNormale = allTickets.filter((t) => t.urgence === 'NORMALE').length;
    const countBasse = allTickets.filter((t) => t.urgence === 'BASSE').length;

    const PdfDoc = (
      <Document
        title={`Rapport Statistiques AlloTech - ${defaultStart.toISOString().slice(0, 10)}`}
        author="AlloTech Douala"
        subject="Rapport d'activité technique & métriques de performance SLA"
      >
        <Page size="A4" style={styles.page}>
          {/* En-tête */}
          <View style={styles.header}>
            <View>
              <Text style={styles.logoBrand}>AlloTech</Text>
              <Text style={styles.logoSubtitle}>
                Tableau de Bord des Opérations & Statistiques • Douala, Cameroun
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.docTitle}>RAPPORT D'ACTIVITÉ & REPORTING</Text>
              <Text style={styles.docPeriode}>Période : {dateRange}</Text>
              <Text style={{ fontSize: 7.5, color: '#94A3B8', marginTop: 2 }}>
                Généré le {nowStr}
              </Text>
            </View>
          </View>

          {/* Cartes KPIs */}
          <View style={styles.kpisGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{allTickets.length}</Text>
              <Text style={styles.kpiLabel}>Interventions totales</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: '#0E7490' }]}>{resolus.length}</Text>
              <Text style={styles.kpiLabel}>Résolues & Clôturées</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={[styles.kpiValue, { color: '#2E8B57' }]}>{formatMttr(mttrMinutes)}</Text>
              <Text style={styles.kpiLabel}>MTTR Moyen</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text
                style={[
                  styles.kpiValue,
                  { color: tauxSla >= 80 ? '#2E8B57' : tauxSla >= 60 ? '#FFA101' : '#C0392B' },
                ]}
              >
                {tauxSla}%
              </Text>
              <Text style={styles.kpiLabel}>Respect des SLA</Text>
            </View>
          </View>

          {/* Section 1 : Répartition Volume */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Répartition par Type & Priorité</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thText, { flex: 2 }]}>Type d'opération</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>Pannes</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>Installations</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>Critique</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>Haute</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>Normale</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>Basse</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tdText, { flex: 2, fontFamily: 'Helvetica-Bold' }]}>
                  Volume période
                </Text>
                <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>{countPanne}</Text>
                <Text
                  style={[
                    styles.tdText,
                    {
                      flex: 1,
                      textAlign: 'center',
                      color: '#D97706',
                      fontFamily: 'Helvetica-Bold',
                    },
                  ]}
                >
                  {countInstallation}
                </Text>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[styles.badge, styles.badgeRed]}>{countCritique}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={[styles.badge, styles.badgeAmber]}>{countHaute}</Text>
                </View>
                <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>
                  {countNormale}
                </Text>
                <Text style={[styles.tdText, { flex: 1, textAlign: 'center', color: '#64748B' }]}>
                  {countBasse}
                </Text>
              </View>
            </View>
          </View>

          {/* Section 2 : Performance des techniciens */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Performance des Techniciens Terrain</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thText, { flex: 1.4 }]}>Matricule</Text>
                <Text style={[styles.thText, { flex: 2.4 }]}>Technicien</Text>
                <Text style={[styles.thText, { flex: 1.1, textAlign: 'center' }]}>Assignés</Text>
                <Text style={[styles.thText, { flex: 1.1, textAlign: 'center' }]}>Résolus</Text>
                <Text style={[styles.thText, { flex: 1.1, textAlign: 'center' }]}>En cours</Text>
                <Text style={[styles.thText, { flex: 1.3, textAlign: 'center' }]}>Taux SLA</Text>
                <Text style={[styles.thText, { flex: 1.4, textAlign: 'center' }]}>MTTR Moyen</Text>
                <Text style={[styles.thText, { flex: 1.1, textAlign: 'center' }]}>Statut</Text>
              </View>

              {techList.length === 0 ? (
                <View style={styles.tableRow}>
                  <Text style={[styles.tdText, { color: '#94A3B8', fontStyle: 'italic' }]}>
                    Aucun technicien enregistré sur la période sélectionnée.
                  </Text>
                </View>
              ) : (
                techList.map((t) => (
                  <View key={t.id} style={styles.tableRow}>
                    <View style={{ flex: 1.4 }}>
                      <Text style={[styles.badge, styles.badgeBlue, { alignSelf: 'flex-start' }]}>
                        {t.matricule}
                      </Text>
                    </View>
                    <Text style={[styles.tdText, { flex: 2.4, fontFamily: 'Helvetica-Bold' }]}>
                      {t.prenom} {t.nom}
                    </Text>
                    <Text style={[styles.tdText, { flex: 1.1, textAlign: 'center' }]}>
                      {t.assignes}
                    </Text>
                    <Text style={[styles.tdText, { flex: 1.1, textAlign: 'center' }]}>
                      {t.resolus}
                    </Text>
                    <Text
                      style={[
                        styles.tdText,
                        {
                          flex: 1.1,
                          textAlign: 'center',
                          color: t.enCours > 0 ? '#D97706' : '#64748B',
                        },
                      ]}
                    >
                      {t.enCours}
                    </Text>
                    <View style={{ flex: 1.3, alignItems: 'center' }}>
                      {t.tauxSla === null ? (
                        <Text style={[styles.tdText, { color: '#94A3B8' }]}>N/A</Text>
                      ) : (
                        <Text
                          style={[
                            styles.badge,
                            t.tauxSla >= 80
                              ? styles.badgeGreen
                              : t.tauxSla >= 60
                                ? styles.badgeAmber
                                : styles.badgeRed,
                          ]}
                        >
                          {t.tauxSla}%
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.tdText,
                        {
                          flex: 1.4,
                          textAlign: 'center',
                          fontFamily: 'Helvetica-Bold',
                          color: '#31525B',
                        },
                      ]}
                    >
                      {t.mttrFormate}
                    </Text>
                    <View style={{ flex: 1.1, alignItems: 'center' }}>
                      <Text
                        style={[styles.badge, t.isActif ? styles.badgeGreen : styles.badgeGray]}
                      >
                        {t.isActif ? 'Actif' : 'Inactif'}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Section 3 : Engagements de Service */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Engagements SLA & Qualité de Service</Text>
            <Text style={{ fontSize: 8, color: '#475569', lineHeight: 1.5 }}>
              • Critique : Intervention & résolution sous 2 heures (Impact direct sur l'activité
              cliente).{'\n'}• Haute : Prise en charge sous 4 heures pour les équipements
              stratégiques.{'\n'}• Normale / Installation : Prise en charge sous 24h avec
              vérification de conformité sur site et signature client.
            </Text>
          </View>

          {/* Pied de page */}
          <View style={styles.footer}>
            <Text>AlloTech — Système de Supervision et de Maintenance Informatique</Text>
            <Text>Rapport d'activité officiel • Usage interne confidentiel</Text>
          </View>
        </Page>
      </Document>
    );

    const pdfBuffer = await renderToBuffer(PdfDoc);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="AlloTech-Statistiques-${defaultStart.toISOString().slice(0, 10)}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur interne de génération PDF';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
