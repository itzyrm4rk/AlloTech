import { calculateEquipmentHealth } from './health-utils';

export interface ExportColumn<T = Record<string, unknown>> {
  header: string;
  key: string;
  width?: number;
  format?: (value: unknown, row: T) => string | number;
}

export interface ExportOptions<T = Record<string, unknown>> {
  title: string;
  subtitle?: string;
  filename: string;
  sheetName?: string;
  columns: ExportColumn<T>[];
  data: T[];
  activeFilters?: { label: string; value: string }[];
}

/**
 * Exporte des données filtrées vers un classeur Excel (.xlsx)
 */
export async function exportToExcel<T = Record<string, unknown>>(
  options: ExportOptions<T>,
): Promise<void> {
  const { title, filename, sheetName, columns, data, activeFilters } = options;

  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AlloTech CMDB';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName || 'Données', {
    properties: { tabColor: { argb: 'FF31525B' } },
  });

  // 1. Titre principal
  const lastColLetter = String.fromCharCode(64 + Math.max(columns.length, 1));
  worksheet.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `ALLOTECH — ${title.toUpperCase()}`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF31525B' },
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 32;

  // 2. Métadonnées & Filtres actifs
  worksheet.mergeCells(`A2:${lastColLetter}2`);
  const metaCell = worksheet.getCell('A2');
  const nowStr = new Date().toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
  const filterParts = (activeFilters || [])
    .filter((f) => f.value && f.value !== 'TOUS' && f.value !== 'TOUTES')
    .map((f) => `${f.label}: ${f.value}`);
  const filterText = filterParts.length > 0 ? ` | Filtres: ${filterParts.join(', ')}` : '';
  metaCell.value = `Extrait le ${nowStr} • ${data.length} enregistrement(s)${filterText}`;
  metaCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 20;

  worksheet.addRow([]); // Ligne vide

  // 3. En-têtes du tableau
  const headerRow = worksheet.addRow(columns.map((c) => c.header));
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF31525B' },
    };
    cell.alignment = { horizontal: 'left', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF31525B' } },
    };
  });

  // 4. Lignes de données
  data.forEach((row, index) => {
    const rowRecord = row as Record<string, unknown>;
    const rowValues = columns.map((col) => {
      const raw = rowRecord[col.key];
      if (col.format) {
        return col.format(raw, row);
      }
      return raw !== null && raw !== undefined ? String(raw) : '';
    });

    const dataRow = worksheet.addRow(rowValues);
    dataRow.height = 20;

    const isEven = index % 2 === 0;
    dataRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle' };
      if (!isEven) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        };
      }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  // 5. Largeurs de colonnes & Auto-filtre
  columns.forEach((col, idx) => {
    worksheet.getColumn(idx + 1).width = col.width || 20;
  });
  worksheet.autoFilter = { from: 'A4', to: `${lastColLetter}${data.length + 4}` };

  // 6. Écriture du fichier et téléchargement
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const cleanName = filename.replace(/\.xlsx$/i, '');
  anchor.download = `${cleanName}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Exporte les données filtrées sous la forme d'un document PDF imprimable
 */
export function exportToPdfReport<T = Record<string, unknown>>(options: ExportOptions<T>): void {
  const { title, subtitle, columns, data, activeFilters } = options;
  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) {
    alert("Veuillez autoriser l'ouverture des fenêtres pop-up pour générer le rapport PDF.");
    return;
  }

  const nowStr = new Date().toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const filterBadges = (activeFilters || [])
    .filter((f) => f.value && f.value !== 'TOUS' && f.value !== 'TOUTES')
    .map(
      (f) =>
        `<span style="display:inline-block;padding:2px 8px;background:#FEF3C7;color:#92400E;border-radius:4px;font-size:11px;font-weight:700;margin-right:6px;">${f.label}: ${f.value}</span>`,
    )
    .join('');

  const tableHeadersHtml = columns
    .map(
      (c) =>
        `<th style="padding:8px 10px;text-align:left;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#FFFFFF;background-color:#31525B;border-bottom:2px solid #233b41;">${c.header}</th>`,
    )
    .join('');

  const tableRowsHtml =
    data.length === 0
      ? `<tr><td colspan="${columns.length}" style="padding:24px;text-align:center;color:#94a3b8;font-style:italic;">Aucun enregistrement ne correspond aux critères.</td></tr>`
      : data
          .map((row, idx) => {
            const bg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
            const rowRecord = row as Record<string, unknown>;
            const cells = columns
              .map((col) => {
                const raw = rowRecord[col.key];
                const formatted = col.format
                  ? col.format(raw, row)
                  : raw !== null && raw !== undefined
                    ? String(raw)
                    : '—';
                return `<td style="padding:8px 10px;font-size:11px;color:#1E293B;border-bottom:1px solid #E2E8F0;vertical-align:middle;">${formatted}</td>`;
              })
              .join('');
            return `<tr style="background-color:${bg};">${cells}</tr>`;
          })
          .join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${title} — AlloTech</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 12mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 16px;
      color: #0f172a;
      background: #FFFFFF;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2px solid #31525B;
      margin-bottom: 16px;
    }
    .brand {
      font-size: 22px;
      font-weight: 900;
      color: #31525B;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: #FFA101;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
      font-weight: 500;
    }
    .doc-info {
      text-align: right;
    }
    .doc-title {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .doc-date {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .meta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #F1F5F9;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 14px;
      font-size: 12px;
      border: 1px solid #E2E8F0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Allo<span>Tech</span></div>
      <div class="brand-sub">Système de Supervision Opérationnelle & Parc CMDB</div>
    </div>
    <div class="doc-info">
      <div class="doc-title">${title}</div>
      ${subtitle ? `<div class="doc-date">${subtitle}</div>` : ''}
      <div class="doc-date">Généré le ${nowStr}</div>
    </div>
  </div>

  <div class="meta-bar">
    <div>
      <strong>Total :</strong> ${data.length} enregistrement(s)
    </div>
    <div>
      ${filterBadges || '<span style="color:#64748b;font-style:italic;">Aucun filtre actif (vue globale)</span>'}
    </div>
  </div>

  <table>
    <thead>
      <tr>${tableHeadersHtml}</tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
    </tbody>
  </table>

  <div class="footer">
    <div>AlloTech • Douala, Cameroun • Plateforme de Gestion Technique</div>
    <div>Document officiel généré pour usage interne</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export interface ParsedRapportDetails {
  resolution: string;
  observations: string | null;
  piecesChangees: string | null;
  correctifLogiciel: string | null;
  dureeMinutes: number | null;
  auteurNom: string | null;
  dateCloture: string | null;
}

/**
 * Analyse et structure intelligemment le rapport technique d'un ticket,
 * qu'il soit stocké en JSON ou en texte libre rédigé par le technicien sur le terrain.
 * Prend en compte les spécificités des pannes matérielles (pièces changées)
 * et des pannes logicielles (correctifs, licences, patchs).
 */
export function parseRapportDetails(ticket: {
  rapport?: {
    contenu?: string | null;
    resolution?: string | null;
    observations?: string | null;
    piecesChangees?: string | null;
    tempsPasseMinutes?: number | null;
    createdAt?: string;
    technicien?: { prenom: string; nom: string; matricule: string } | null;
  } | null;
  heureDemarrage?: string | null;
  heureFinale?: string | null;
  clotureAt?: string | null;
  statutActuel?: string;
  typeDemande?: string;
}): ParsedRapportDetails | null {
  if (!ticket.rapport && ticket.statutActuel !== 'CLOTUREE' && ticket.statutActuel !== 'RESOLU') {
    return null;
  }

  const raw = ticket.rapport?.contenu?.trim() || '';
  let resolution = ticket.rapport?.resolution || '';
  let observations = ticket.rapport?.observations || null;
  let piecesChangees = ticket.rapport?.piecesChangees || null;
  let correctifLogiciel: string | null = null;
  let dureeMinutes = ticket.rapport?.tempsPasseMinutes || null;

  // 1. Détection de JSON structuré
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.resolution) resolution = parsed.resolution;
      if (parsed.observations) observations = parsed.observations;
      if (parsed.piecesChangees) piecesChangees = parsed.piecesChangees;
      if (parsed.correctifLogiciel) correctifLogiciel = parsed.correctifLogiciel;
      if (parsed.tempsPasseMinutes || parsed.dureeMinutes) {
        dureeMinutes = Number(parsed.tempsPasseMinutes || parsed.dureeMinutes);
      }
    } catch {
      // Texte brut standard
    }
  }

  // 2. Si non structuré en JSON, extraction par motifs clés dans le texte
  if (!resolution && raw) {
    const resMatch = raw.match(
      /(?:résolution|démarche|solution|actions? réalisées?|travaux effectués?)\s*:\s*([\s\S]+?)(?=(?:observations?|remarques?|pièces?|correctif|durée|$))/i,
    );
    const obsMatch = raw.match(
      /(?:observations?|remarques?|notes?|constat)\s*:\s*([\s\S]+?)(?=(?:résolution|pièces?|correctif|durée|$))/i,
    );
    const pcsMatch = raw.match(
      /(?:pièces? remplacées?|pièces? changées?|composants? remplacés?)\s*:\s*([\s\S]+?)(?=(?:résolution|observations?|correctif|durée|$))/i,
    );
    const corrMatch = raw.match(
      /(?:correctif|action logicielle|mise à jour|patch|licence)\s*:\s*([\s\S]+?)(?=(?:résolution|observations?|pièces?|durée|$))/i,
    );
    const durMatch = raw.match(/(?:durée|temps passé)\s*:\s*(\d+)\s*(min|minutes|h|heures?)?/i);

    if (resMatch) resolution = resMatch[1].trim();
    if (obsMatch && !observations) observations = obsMatch[1].trim();
    if (pcsMatch && !piecesChangees) piecesChangees = pcsMatch[1].trim();
    if (corrMatch && !correctifLogiciel) correctifLogiciel = corrMatch[1].trim();
    if (durMatch && !dureeMinutes) {
      const val = Number.parseInt(durMatch[1], 10);
      const unit = durMatch[2]?.toLowerCase();
      dureeMinutes = unit?.startsWith('h') ? val * 60 : val;
    }

    // Si aucune section explicite n'a été balisée, le texte complet est la résolution
    if (!resolution) {
      resolution = raw;
    }
  }

  // 3. Cas de repli pour ticket clôturé sans rapport saisi
  if (!resolution && (ticket.statutActuel === 'CLOTUREE' || ticket.statutActuel === 'RESOLU')) {
    resolution = 'Intervention réalisée et validée avec le client sur site.';
  }

  // 4. Calcul de durée par différence de timestamps (heureDemarrage -> heureFinale / clotureAt)
  if (!dureeMinutes && ticket.heureDemarrage) {
    const end = ticket.heureFinale || ticket.clotureAt;
    if (end) {
      const diff = Math.round(
        (new Date(end).getTime() - new Date(ticket.heureDemarrage).getTime()) / 60000,
      );
      if (diff > 0 && diff < 1440) {
        dureeMinutes = diff;
      }
    }
  }

  const tech = ticket.rapport?.technicien;
  const auteurNom = tech ? `${tech.prenom} ${tech.nom} (${tech.matricule})` : null;
  const dateCloture = ticket.clotureAt || ticket.rapport?.createdAt || null;

  return {
    resolution,
    observations,
    piecesChangees,
    correctifLogiciel,
    dureeMinutes,
    auteurNom,
    dateCloture,
  };
}

export interface EquipementCarnetTicket {
  id: string;
  reference: string;
  typeDemande: 'PANNE' | 'INSTALLATION' | 'MAINTENANCE';
  statutActuel: string;
  urgence: string;
  description: string;
  createdAt: string;
  dateSouhaitee?: string | null;
  categoriePanne?: string | null;
  sousTypePanneMat?: string | null;
  sousTypePanneLog?: string | null;
  heureDemarrage?: string | null;
  heureFinale?: string | null;
  clotureAt?: string | null;
  techniciens?: {
    technicien: {
      id: string;
      matricule: string;
      prenom: string;
      nom: string;
      telephone?: string | null;
      photoUrl?: string | null;
    };
  }[];
  rapport?: {
    id: string;
    contenu?: string | null;
    resolution?: string | null;
    observations?: string | null;
    piecesChangees?: string | null;
    tempsPasseMinutes?: number | null;
    createdAt?: string;
    technicien?: {
      id: string;
      matricule: string;
      prenom: string;
      nom: string;
    } | null;
  } | null;
}

export interface EquipementCarnetData {
  id: string;
  typeActif?: 'MATERIEL' | 'LOGICIEL';
  modele: string;
  numeroSerie: string;
  editeur?: string | null;
  version?: string | null;
  siteAdresse?: string | null;
  dateInstallation?: string | null;
  statut: 'EN_SERVICE' | 'EN_PANNE' | 'EN_REFORME';
  qrCodeData: string;
  createdAt: string;
  client?: {
    id: string;
    nom: string;
    telephone: string;
    adresse?: string | null;
  };
  tickets?: EquipementCarnetTicket[];
}

/**
 * Génère et imprime le « Carnet d'entretien & Fiche de vie individuelle » de l'équipement CMDB
 */
export function exportCarnetEntretienPdf(equipement: EquipementCarnetData): void {
  const printWindow = window.open('', '_blank', 'width=1050,height=900');
  if (!printWindow) {
    alert(
      "Veuillez autoriser l'ouverture des fenêtres pop-up pour générer le carnet d'entretien PDF.",
    );
    return;
  }

  const isLogiciel = equipement.typeActif === 'LOGICIEL';
  const nowStr = new Date().toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const tickets = equipement.tickets || [];
  const health = calculateEquipmentHealth(equipement);
  const totalTickets = tickets.length;
  const pannesCount = tickets.filter((t) => t.typeDemande === 'PANNE').length;
  const cloturesCount = tickets.filter(
    (t) => t.statutActuel === 'CLOTUREE' || t.statutActuel === 'RESOLU',
  ).length;

  // Calcul du temps total passé en intervention
  let totalDureeMinutes = 0;
  for (const t of tickets) {
    const details = parseRapportDetails(t);
    if (details?.dureeMinutes) {
      totalDureeMinutes += details.dureeMinutes;
    }
  }
  const totalDureeStr =
    totalDureeMinutes >= 60
      ? `${Math.floor(totalDureeMinutes / 60)}h ${totalDureeMinutes % 60}min`
      : `${totalDureeMinutes} min`;

  // Déduplication des techniciens ayant officié sur cet équipement
  const techMap = new Map<
    string,
    {
      id: string;
      matricule: string;
      nomComplet: string;
      telephone?: string | null;
      count: number;
      lastDate: string;
    }
  >();

  for (const t of tickets) {
    if (t.techniciens) {
      for (const { technicien } of t.techniciens) {
        const existing = techMap.get(technicien.id);
        if (existing) {
          existing.count += 1;
          if (new Date(t.createdAt) > new Date(existing.lastDate)) {
            existing.lastDate = t.createdAt;
          }
        } else {
          techMap.set(technicien.id, {
            id: technicien.id,
            matricule: technicien.matricule,
            nomComplet: `${technicien.prenom} ${technicien.nom}`,
            telephone: technicien.telephone,
            count: 1,
            lastDate: t.createdAt,
          });
        }
      }
    }
  }
  const techniciensList = Array.from(techMap.values()).sort((a, b) => b.count - a.count);

  // Construction du HTML de l'historique des tickets
  const ticketsHtml =
    tickets.length === 0
      ? `<div style="padding: 24px; text-align: center; color: #64748b; font-style: italic; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">
          Aucun incident ni intervention de maintenance répertorié dans la CMDB pour cet actif.
        </div>`
      : tickets
          .map((ticket, index) => {
            const parsed = parseRapportDetails(ticket);
            const isPanne = ticket.typeDemande === 'PANNE';
            const isInstall = ticket.typeDemande === 'INSTALLATION';
            const typeBg = isPanne ? '#FEE2E2' : isInstall ? '#E0F2FE' : '#FEF3C7';
            const typeColor = isPanne ? '#991B1B' : isInstall ? '#075985' : '#92400E';

            // Diagnostic et sous-type
            let subTypeBadge = '';
            if (ticket.sousTypePanneMat) {
              subTypeBadge = `<span style="display:inline-block;padding:2px 8px;background:#F1F5F9;color:#334155;border-radius:4px;font-size:11px;font-weight:700;margin-left:6px;">Matériel : ${ticket.sousTypePanneMat}</span>`;
            } else if (ticket.sousTypePanneLog) {
              subTypeBadge = `<span style="display:inline-block;padding:2px 8px;background:#F1F5F9;color:#334155;border-radius:4px;font-size:11px;font-weight:700;margin-left:6px;">Logiciel : ${ticket.sousTypePanneLog}</span>`;
            } else if (ticket.categoriePanne) {
              subTypeBadge = `<span style="display:inline-block;padding:2px 8px;background:#F1F5F9;color:#334155;border-radius:4px;font-size:11px;font-weight:700;margin-left:6px;">Catégorie : ${ticket.categoriePanne}</span>`;
            }

            // Techniciens assignés
            const techsNames =
              ticket.techniciens && ticket.techniciens.length > 0
                ? ticket.techniciens
                    .map(
                      (tt) =>
                        `${tt.technicien.prenom} ${tt.technicien.nom} (${tt.technicien.matricule})`,
                    )
                    .join(', ')
                : 'Non assigné';

            // Rapport de clôture / démarche de résolution
            let rapportSectionHtml = '';
            if (parsed) {
              const dureeFormatted =
                parsed.dureeMinutes && parsed.dureeMinutes > 0
                  ? parsed.dureeMinutes >= 60
                    ? `${Math.floor(parsed.dureeMinutes / 60)}h ${parsed.dureeMinutes % 60}min`
                    : `${parsed.dureeMinutes} min`
                  : null;

              rapportSectionHtml = `
                <div style="margin-top: 10px; padding: 10px 12px; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 6px; font-size: 11px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <strong style="color: #065F46; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Rapport de résolution technique</strong>
                    ${dureeFormatted ? `<span style="background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:4px;font-weight:700;">Durée d'intervention : ${dureeFormatted}</span>` : ''}
                  </div>
                  <div style="color: #1E293B; line-height: 1.45; margin-bottom: 6px;">
                    <strong>Démarche appliquée :</strong> ${parsed.resolution}
                  </div>
                  ${
                    parsed.piecesChangees
                      ? `<div style="color: #92400E; background: #FEF3C7; padding: 4px 8px; border-radius: 4px; margin-bottom: 6px; font-weight: 600;">
                          Composants / Pièces physiques remplacées : ${parsed.piecesChangees}
                        </div>`
                      : ''
                  }
                  ${
                    parsed.correctifLogiciel
                      ? `<div style="color: #0369A1; background: #E0F2FE; padding: 4px 8px; border-radius: 4px; margin-bottom: 6px; font-weight: 600;">
                          Correctifs logiciels & Mises à jour appliqués : ${parsed.correctifLogiciel}
                        </div>`
                      : ''
                  }
                  ${
                    parsed.observations
                      ? `<div style="color: #475569; font-style: italic;">
                          <strong>Observations du technicien :</strong> ${parsed.observations}
                        </div>`
                      : ''
                  }
                  ${
                    parsed.auteurNom
                      ? `<div style="margin-top: 4px; color: #047857; font-size: 10px;">
                          Clôturé et validé par : <strong>${parsed.auteurNom}</strong>
                        </div>`
                      : ''
                  }
                </div>
              `;
            } else if (ticket.statutActuel === 'EN_COURS') {
              rapportSectionHtml = `
                <div style="margin-top: 8px; padding: 8px 10px; background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 6px; font-size: 11px; color: #1E40AF;">
                  <strong>Intervention en cours sur le terrain :</strong> Diagnostic en cours par ${techsNames}.
                </div>
              `;
            }

            return `
              <div style="margin-bottom: 14px; padding: 12px; border: 1px solid #E2E8F0; border-radius: 8px; background: ${index % 2 === 0 ? '#FFFFFF' : '#F8FAFC'}; page-break-inside: avoid;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; border-bottom: 1px solid #F1F5F9; padding-bottom: 6px;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <strong style="color: #31525B; font-family: monospace; font-size: 13px;">${ticket.reference}</strong>
                    <span style="display:inline-block;padding:2px 8px;background:${typeBg};color:${typeColor};border-radius:4px;font-size:10px;font-weight:800;">${ticket.typeDemande}</span>
                    <span style="display:inline-block;padding:2px 8px;background:#F1F5F9;color:#475569;border-radius:4px;font-size:10px;font-weight:700;">Urgence : ${ticket.urgence}</span>
                    <span style="display:inline-block;padding:2px 8px;background:#F1F5F9;color:#1E293B;border-radius:4px;font-size:10px;font-weight:800;">Statut : ${ticket.statutActuel}</span>
                    ${subTypeBadge}
                  </div>
                  <div style="font-size: 11px; color: #64748b;">
                    Déclaré le ${new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                <div style="font-size: 12px; color: #0F172A; margin-bottom: 6px; line-height: 1.4;">
                  <strong>Description du problème :</strong> ${ticket.description}
                </div>

                <div style="font-size: 11px; color: #475569; margin-bottom: 4px;">
                  <strong>Technicien(s) mobilisé(s) :</strong> ${techsNames}
                </div>

                ${rapportSectionHtml}
              </div>
            `;
          })
          .join('');

  // Tableau des techniciens
  const techTableRowsHtml =
    techniciensList.length === 0
      ? `<tr><td colspan="4" style="padding:12px;text-align:center;color:#94a3b8;font-style:italic;">Aucun technicien n'est encore intervenu sur cet équipement.</td></tr>`
      : techniciensList
          .map(
            (tc, idx) => `
          <tr style="background:${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
            <td style="padding:8px 10px;font-size:11px;color:#0F172A;font-weight:700;border-bottom:1px solid #E2E8F0;">${tc.nomComplet}</td>
            <td style="padding:8px 10px;font-size:11px;color:#31525B;font-family:monospace;font-weight:700;border-bottom:1px solid #E2E8F0;">${tc.matricule}</td>
            <td style="padding:8px 10px;font-size:11px;color:#475569;border-bottom:1px solid #E2E8F0;">${tc.telephone || '—'}</td>
            <td style="padding:8px 10px;font-size:11px;color:#0F172A;font-weight:800;border-bottom:1px solid #E2E8F0;text-align:center;">${tc.count}</td>
            <td style="padding:8px 10px;font-size:11px;color:#64748B;border-bottom:1px solid #E2E8F0;">${new Date(tc.lastDate).toLocaleDateString('fr-FR')}</td>
          </tr>
        `,
          )
          .join('');

  const statutColor =
    equipement.statut === 'EN_SERVICE'
      ? '#059669'
      : equipement.statut === 'EN_PANNE'
        ? '#DC2626'
        : '#475569';
  const statutBg =
    equipement.statut === 'EN_SERVICE'
      ? '#ECFDF5'
      : equipement.statut === 'EN_PANNE'
        ? '#FEF2F2'
        : '#F1F5F9';
  const statutLabel =
    equipement.statut === 'EN_SERVICE'
      ? 'En service opérationnel'
      : equipement.statut === 'EN_PANNE'
        ? 'En panne technique'
        : 'Mis au rebut / Réformé';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Carnet d'Entretien — ${equipement.modele} — AlloTech</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 16px;
      color: #0F172A;
      background: #FFFFFF;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2.5px solid #31525B;
      margin-bottom: 14px;
    }
    .brand {
      font-size: 24px;
      font-weight: 900;
      color: #31525B;
      letter-spacing: -0.5px;
    }
    .brand span {
      color: #FFA101;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748B;
      margin-top: 2px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-info {
      text-align: right;
    }
    .doc-title {
      font-size: 16px;
      font-weight: 900;
      color: #0F172A;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .doc-date {
      font-size: 11px;
      color: #64748B;
      margin-top: 2px;
    }
    .card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 14px;
    }
    .info-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px;
    }
    .info-card h3 {
      margin: 0 0 8px 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #31525B;
      font-weight: 800;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 5px;
    }
    .info-row strong {
      color: #475569;
      font-weight: 600;
    }
    .info-row span {
      color: #0F172A;
      font-weight: 700;
      text-align: right;
    }
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .kpi-box {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 8px;
      text-align: center;
    }
    .kpi-val {
      font-size: 18px;
      font-weight: 900;
      color: #31525B;
    }
    .kpi-label {
      font-size: 10px;
      color: #64748B;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 2px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0F172A;
      margin: 16px 0 10px 0;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1.5px solid #CBD5E1;
      padding-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    th {
      padding: 8px 10px;
      text-align: left;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #FFFFFF;
      background-color: #31525B;
      border-bottom: 2px solid #233B41;
    }
    .signatures-block {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-top: 20px;
      page-break-inside: avoid;
    }
    .sig-box {
      border: 1px dashed #CBD5E1;
      border-radius: 6px;
      padding: 12px;
      height: 70px;
      background: #FAFAFA;
      position: relative;
    }
    .sig-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748B;
    }
    .footer {
      border-top: 1px solid #E2E8F0;
      padding-top: 8px;
      margin-top: 14px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #94a3b8;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Allo<span>Tech</span></div>
      <div class="brand-sub">Parc CMDB • Carnet de Maintenance & Fiche de Vie</div>
    </div>
    <div class="doc-info">
      <div class="doc-title">Carnet d'Entretien Officiel</div>
      <div class="doc-date">Réf. Actif : <strong>${equipement.numeroSerie}</strong></div>
      <div class="doc-date">Extrait le ${nowStr}</div>
    </div>
  </div>

  <div class="card-grid">
    <div class="info-card">
      <h3>Identification de l'Équipement</h3>
      <div class="info-row">
        <strong>Type d'actif :</strong>
        <span>${isLogiciel ? 'LOGICIEL & LICENCE' : 'MATÉRIEL PHYSIQUE'}</span>
      </div>
      <div class="info-row">
        <strong>Modèle / Progiciel :</strong>
        <span>${equipement.modele}</span>
      </div>
      <div class="info-row">
        <strong>${isLogiciel ? 'Clé de licence / S/N :' : 'Numéro de série (S/N) :'}</strong>
        <span style="font-family: monospace;">${equipement.numeroSerie}</span>
      </div>
      <div class="info-row">
        <strong>Statut opérationnel :</strong>
        <span style="color: ${statutColor}; background: ${statutBg}; padding: 1px 6px; border-radius: 4px;">${statutLabel}</span>
      </div>
      <div class="info-row">
        <strong>Date de mise en service :</strong>
        <span>${
          equipement.dateInstallation
            ? new Date(equipement.dateInstallation).toLocaleDateString('fr-FR')
            : 'Non renseignée'
        }</span>
      </div>
    </div>

    <div class="info-card">
      <h3>Affectation Client & Localisation</h3>
      <div class="info-row">
        <strong>Client propriétaire :</strong>
        <span>${equipement.client?.nom || 'Non assigné'}</span>
      </div>
      <div class="info-row">
        <strong>Contact client :</strong>
        <span>${equipement.client?.telephone || 'Non renseigné'}</span>
      </div>
      <div class="info-row">
        <strong>Site d'installation :</strong>
        <span>${equipement.siteAdresse || equipement.client?.adresse || 'Site principal'}</span>
      </div>
      ${
        isLogiciel
          ? `
        <div class="info-row">
          <strong>Éditeur progiciel :</strong>
          <span>${equipement.editeur || 'Non renseigné'}</span>
        </div>
        <div class="info-row">
          <strong>Version déployée :</strong>
          <span>${equipement.version || 'Non renseignée'}</span>
        </div>
      `
          : `
        <div class="info-row">
          <strong>Code QR CMDB :</strong>
          <span style="font-family: monospace; font-size: 10px;">${equipement.qrCodeData}</span>
        </div>
        <div class="info-row">
          <strong>Date d'enregistrement :</strong>
          <span>${new Date(equipement.createdAt).toLocaleDateString('fr-FR')}</span>
        </div>
      `
      }
    </div>
  </div>

  ${
    health.alerteMessage
      ? `
  <div style="margin-bottom: 14px; padding: 10px 14px; border-radius: 8px; font-size: 11px; background: ${
    health.level === 'CRITIQUE' ? '#FFF1F2' : '#FFFBEB'
  }; border: 1.5px solid ${
    health.level === 'CRITIQUE' ? '#FDA4AF' : '#FCD34D'
  }; color: ${health.level === 'CRITIQUE' ? '#9F1239' : '#92400E'};">
    <div style="font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">
      Diagnostic de Fiabilité CMDB : ${health.label} (Score : ${health.score}%)
    </div>
    <div>${health.alerteMessage}</div>
    ${
      health.recommandation
        ? `<div style="margin-top: 4px; font-style: italic;"><strong>Recommandation :</strong> ${health.recommandation}</div>`
        : ''
    }
  </div>
  `
      : ''
  }

  <div class="kpi-row">
    <div class="kpi-box">
      <div class="kpi-val" style="color: ${
        health.level === 'CRITIQUE'
          ? '#DC2626'
          : health.level === 'SURVEILLANCE'
            ? '#D97706'
            : '#059669'
      };">${health.score}%</div>
      <div class="kpi-label">Fiabilité</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-val" style="color: #31525B;">${health.mtbfDays}j</div>
      <div class="kpi-label">MTBF Moyen</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-val">${totalTickets}</div>
      <div class="kpi-label">Interventions</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-val" style="color: #DC2626;">${pannesCount}</div>
      <div class="kpi-label">Pannes</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-val" style="color: #059669;">${cloturesCount}</div>
      <div class="kpi-label">Résolues</div>
    </div>
    <div class="kpi-box">
      <div class="kpi-val" style="color: #D97706;">${totalDureeStr}</div>
      <div class="kpi-label">Temps d'arrêt</div>
    </div>
  </div>

  <div class="section-title">
    Registre Chronologique des Pannes, Maintenances & Résolutions (${totalTickets})
  </div>
  ${ticketsHtml}

  <div class="section-title">
    Intervenants Techniques Ayant Opéré sur cet Actif (${techniciensList.length})
  </div>
  <table>
    <thead>
      <tr>
        <th>Nom du Technicien</th>
        <th>Matricule</th>
        <th>Téléphone</th>
        <th style="text-align: center;">Interventions</th>
        <th>Dernière Intervention</th>
      </tr>
    </thead>
    <tbody>
      ${techTableRowsHtml}
    </tbody>
  </table>

  <div class="signatures-block">
    <div class="sig-box">
      <div class="sig-label">Visa Responsable Supervision AlloTech</div>
    </div>
    <div class="sig-box">
      <div class="sig-label">Visa Responsable Client / Exploitant</div>
    </div>
  </div>

  <div class="footer">
    <div>AlloTech CMDB • Système de Supervision et de Maintenance • Douala, Cameroun</div>
    <div>Document officiel certifié conforme extrait le ${nowStr}</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
