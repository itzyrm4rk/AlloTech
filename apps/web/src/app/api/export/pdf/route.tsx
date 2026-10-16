import { auth } from '@allotech/auth';
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

interface ExportColumnDef {
  header: string;
  key: string;
}

interface ExportPdfPayload {
  title: string;
  subtitle?: string;
  filename: string;
  columns: ExportColumnDef[];
  rows: Array<Array<string | number | null | undefined>>;
  activeFilters?: Array<{ label: string; value: string }>;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#1E293B',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#31525B',
    paddingBottom: 10,
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 18,
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
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 8,
    color: '#334155',
  },
  filterList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  filterBadge: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 3,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#31525B',
  },
  tableHeaderCell: {
    paddingVertical: 6,
    paddingHorizontal: 6,
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
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 7.5,
    color: '#334155',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 6,
    fontSize: 7,
    color: '#94A3B8',
  },
});

export async function POST(req: Request) {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const body = (await req.json()) as ExportPdfPayload;
    const { title, subtitle, filename, columns, rows, activeFilters } = body;

    if (!title || !columns || !rows) {
      return NextResponse.json({ error: 'Données incomplètes.' }, { status: 400 });
    }

    const isLandscape = columns.length > 5;
    const nowStr = new Date().toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    });

    const validFilters = (activeFilters || []).filter(
      (f) => f.value && f.value !== 'TOUS' && f.value !== 'TOUTES',
    );

    // Distribution équitable des largeurs de colonnes
    const colWidth = `${(100 / columns.length).toFixed(2)}%`;

    const PdfDoc = (
      <Document>
        <Page size="A4" orientation={isLandscape ? 'landscape' : 'portrait'} style={styles.page}>
          {/* En-tête officiel AlloTech */}
          <View style={styles.header}>
            <View>
              <Text style={styles.brandTitle}>
                Allo<Text style={styles.brandAccent}>Tech</Text>
              </Text>
              <Text style={styles.brandSubtitle}>
                Système de Supervision Opérationnelle & Parc CMDB
              </Text>
            </View>
            <View style={styles.docMeta}>
              <Text style={styles.docTitle}>{title}</Text>
              {subtitle ? <Text style={styles.docSubtitle}>{subtitle}</Text> : null}
              <Text style={styles.docSubtitle}>Généré le {nowStr}</Text>
            </View>
          </View>

          {/* Barre de métadonnées & filtres */}
          <View style={styles.metaBar}>
            <Text style={styles.metaText}>
              Total : {rows.length} enregistrement{rows.length > 1 ? 's' : ''}
            </Text>
            <View style={styles.filterList}>
              {validFilters.length > 0 ? (
                validFilters.map((f, i) => (
                  <Text key={`${f.label}-${i}`} style={styles.filterBadge}>
                    {f.label}: {f.value}
                  </Text>
                ))
              ) : (
                <Text style={{ fontSize: 7, color: '#64748B', fontStyle: 'italic' }}>
                  Vue globale (aucun filtre actif)
                </Text>
              )}
            </View>
          </View>

          {/* Tableau */}
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              {columns.map((col) => (
                <View
                  key={col.key || col.header}
                  style={[styles.tableHeaderCell, { width: colWidth }]}
                >
                  <Text>{col.header}</Text>
                </View>
              ))}
            </View>

            {rows.length === 0 ? (
              <View style={[styles.tableRow, { padding: 16, justifyContent: 'center' }]}>
                <Text style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: 8 }}>
                  Aucun enregistrement disponible.
                </Text>
              </View>
            ) : (
              rows.map((row, rIdx) => {
                const bg = rIdx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: Static PDF render
                  <View key={`tr-${rIdx}`} style={[styles.tableRow, { backgroundColor: bg }]}>
                    {row.map((cell, cIdx) => (
                      <View
                        // biome-ignore lint/suspicious/noArrayIndexKey: Static PDF render
                        key={`cell-${rIdx}-${cIdx}`}
                        style={[styles.tableCell, { width: colWidth }]}
                      >
                        <Text>{cell !== null && cell !== undefined ? String(cell) : '—'}</Text>
                      </View>
                    ))}
                  </View>
                );
              })
            )}
          </View>

          {/* Pied de page */}
          <View style={styles.footer} fixed>
            <Text>
              AlloTech • Cameroun • Plateforme de Gestion Système de Supervision et de Maintenance
              Informatique
            </Text>
            <Text
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages || 1}`}
            />
          </View>
        </Page>
      </Document>
    );

    const pdfBuffer = await renderToBuffer(PdfDoc);
    const cleanFilename = (filename || 'export-allotech').replace(/[^a-zA-Z0-9-_]/g, '_');

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${cleanFilename}.pdf"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erreur génération PDF';
    console.error('Erreur export PDF:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
