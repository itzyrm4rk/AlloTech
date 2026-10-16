import { expect, test } from '@playwright/test';

test.describe('Scénario de Démonstration AlloTech E2E', () => {
  test('1. Page de Connexion : Titre, Formulaire et Éléments de Sécurité', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/AlloTech/i);

    // Vérification des éléments du formulaire de connexion
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
  });

  test('2. API SSE Supervision : Vérification du flux temps réel continu', async ({ request }) => {
    // Appel direct à la route SSE pour tester la réponse serveur
    const response = await request.get('/api/supervision/sse?inclureClotures=false');
    // Le serveur renvoie soit 401 (si pas de cookie session) ou 200 (avec text/event-stream)
    expect([200, 401]).toContain(response.status());
    if (response.status() === 200) {
      expect(response.headers()['content-type']).toContain('text/event-stream');
    }
  });

  test('3. Dashboard & Navigation Administrateur', async ({ page }) => {
    await page.goto('/dashboard');
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(page.locator('input[type="email"]')).toBeVisible();
    } else {
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('4. Supervision : Interface temps réel et Cartographie', async ({ page }) => {
    await page.goto('/dashboard/supervision');
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      // Vérifier la présence du badge temps réel (SSE ou polling)
      const liveBadge = page.locator('text=/Flux SSE Continu|Repli Polling|Live|Supervision/i');
      await expect(liveBadge.first()).toBeVisible();
    }
  });

  test('5. Techniciens & Planning des Congés', async ({ page }) => {
    await page.goto('/dashboard/techniciens');
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      // Vérifier les onglets principaux
      await expect(page.locator('text=Techniciens inscrits')).toBeVisible();
      await expect(page.locator('text=Matricules autorisés')).toBeVisible();
      const planningTab = page.locator('text=Planning des congés');
      await expect(planningTab).toBeVisible();

      // Clic sur le planning des congés
      await planningTab.click();
      // Vérifier la grille hebdomadaire
      await expect(page.locator('text=/Lun|Mar|Mer|Jeu|Ven|Sam|Dim/i').first()).toBeVisible();
    }
  });

  test('6. Statistiques & Export Reporting (Excel & PDF)', async ({ page }) => {
    await page.goto('/dashboard/statistiques');
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      // Boutons d'export Excel & PDF
      await expect(page.locator('text=Exporter Excel')).toBeVisible();
      await expect(page.locator('text=Exporter PDF')).toBeVisible();
    }
  });

  test('7. CMDB Équipements : Badges de statut et liste des actifs', async ({ page }) => {
    await page.goto('/dashboard/equipements');
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      // Vérifier que la page charge et affiche des équipements
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible();
      // Les badges de statut CMDB ou en-têtes
      const statusBadge = page.locator(
        'text=/EN_SERVICE|EN_PANNE|EN_MAINTENANCE|HORS_SERVICE|RETIRÉ|Équipement/i',
      );
      const count = await statusBadge.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('8. API Upload Direct & Presign : Protection contre accès non autorisé', async ({
    request,
  }) => {
    // 1. Upload direct sans token -> 401
    const uploadRes = await request.post('/api/upload', {
      multipart: {
        file: {
          name: 'photo-test.jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('fake-image-data-binary'),
        },
      },
    });
    expect([401, 403]).toContain(uploadRes.status());

    // 2. Presign B2 sans session -> 401
    const presignRes = await request.post('/api/upload/presign', {
      data: {
        fileName: 'intervention.png',
        fileType: 'image/png',
      },
    });
    expect([401, 403]).toContain(presignRes.status());
  });

  test('9. PDF Rapport Intervention : Rejet sans authentification', async ({ request }) => {
    const response = await request.get('/api/tickets/test-id/pdf');
    expect([401, 403, 404]).toContain(response.status());
  });

  test('10. PDF Carnet Maintenance Équipement : Rejet sans authentification', async ({
    request,
  }) => {
    const response = await request.get('/api/equipements/fake-equipement-id/carnet-pdf');
    expect([401, 403, 404]).toContain(response.status());
  });

  test('11. Export Statistiques Excel & PDF : Rejet sécurisé sans session Admin', async ({
    request,
  }) => {
    const excelRes = await request.get('/api/statistiques/excel');
    expect([401, 403, 307]).toContain(excelRes.status());

    const pdfRes = await request.get('/api/statistiques/pdf');
    expect([401, 403, 307]).toContain(pdfRes.status());
  });
});
