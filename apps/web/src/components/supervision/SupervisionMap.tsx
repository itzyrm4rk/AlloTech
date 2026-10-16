'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import type { Map as MapLibreMap, Marker, StyleSpecification } from 'maplibre-gl';
import { useEffect, useRef, useState } from 'react';
import { type SupervisionTicket, URGENCE_COLORS } from './types';

interface SupervisionMapProps {
  tickets: SupervisionTicket[];
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
  mapRef: React.MutableRefObject<MapLibreMap | null>;
}

// Style OpenStreetMap raster ultra-rapide, sans dépendance de polices ou sprites distants
const OSM_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export function SupervisionMap({
  tickets,
  selectedTicketId,
  onSelectTicket,
  mapRef,
}: SupervisionMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const maplibreLibRef = useRef<typeof import('maplibre-gl') | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialisation de la carte MapLibre GL
  useEffect(() => {
    let mapInstance: MapLibreMap | null = null;
    let resizeObserver: ResizeObserver | null = null;

    async function initMap() {
      if (!mapContainerRef.current || mapRef.current) return;

      const maplibre = await import('maplibre-gl');
      maplibreLibRef.current = maplibre;

      // Coordonnées par défaut :  Douala (Cameroun) [lng, lat]
      const doualaLngLat: [number, number] = [9.7085, 4.0511];

      mapInstance = new maplibre.Map({
        container: mapContainerRef.current,
        style: OSM_STYLE,
        center: doualaLngLat,
        zoom: 12.5,
        attributionControl: false,
      });

      mapInstance.addControl(new maplibre.NavigationControl({ showCompass: true }), 'top-right');

      mapInstance.on('load', () => {
        mapRef.current = mapInstance;
        setMapLoaded(true);
        mapInstance?.resize();
      });

      // Redimensionnement automatique si le conteneur flex change de taille
      if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          mapInstance?.resize();
        });
        resizeObserver.observe(mapContainerRef.current);
      }
    }

    initMap();

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapRef]);

  // Mise à jour des marqueurs sur la carte lors des changements de tickets
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Supprimer les anciens marqueurs
    for (const m of markersRef.current) {
      m.remove();
    }
    markersRef.current = [];

    const maplibre = maplibreLibRef.current;
    if (!maplibre) return;

    for (const t of tickets) {
      const el = document.createElement('div');
      el.className = 'allotech-marker group cursor-pointer';

      const isCritical = t.urgence === 'CRITIQUE';
      const isEnCours = t.statutActuel === 'EN_COURS';
      const isSelected = selectedTicketId === t.id;
      const color = URGENCE_COLORS[t.urgence]?.hex || '#31525B';

      el.innerHTML = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          ${
            isCritical || isEnCours
              ? `<div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background-color: ${color}33; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
              : ''
          }
          <div style="
            width: ${isSelected ? '32px' : '26px'};
            height: ${isSelected ? '32px' : '26px'};
            border-radius: 9999px;
            background-color: ${color};
            border: 3px solid white;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: 800;
            transition: transform 0.2s;
            transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
          ">
            ${t.typeDemande === 'PANNE' ? '⚡' : '🔧'}
          </div>
        </div>
      `;

      el.addEventListener('click', () => {
        onSelectTicket(t.id);
      });

      // Création Popup
      const techNames =
        t.techniciens.length > 0
          ? t.techniciens.map((tech) => `${tech.prenom} ${tech.nom}`).join(', ')
          : 'Non assigné';

      const popupHtml = `
        <div style="padding: 10px; font-family: sans-serif; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-weight: 800; font-size: 11px; color: #64748B;">${t.reference}</span>
            <span style="font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px; background-color: ${color}20; color: ${color};">${t.urgence}</span>
          </div>
          <p style="font-weight: 800; font-size: 13px; color: #0F172A; margin: 0 0 4px 0;">${t.client?.nom || 'Client inconnu'}</p>
          <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0; line-height: 1.3;">📍 ${t.adresseSite}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; color: #334155; margin-bottom: 8px; padding-top: 6px; border-top: 1px solid #E2E8F0;">
            <span>Technicien :</span>
            <strong style="color: #31525B;">${techNames}</strong>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; margin-bottom: 8px;">
            <span style="color: #64748B;">SLA :</span>
            <strong style="color: ${t.sla.isDepasse ? '#C0392B' : t.sla.isImminent ? '#FFA101' : '#2E8B57'};">
              ${t.sla.isDepasse ? 'DÉPASSÉ' : `${t.sla.remainingMinutes} min restantes`}
            </strong>
          </div>
          <a href="/dashboard/tickets/${t.id}" style="
            display: block;
            text-align: center;
            background-color: #31525B;
            color: white;
            font-size: 11px;
            font-weight: 700;
            padding: 6px 10px;
            border-radius: 8px;
            text-decoration: none;
          ">Ouvrir l'intervention →</a>
        </div>
      `;

      const popup = new maplibre.Popup({ offset: 15 }).setHTML(popupHtml);

      const marker = new maplibre.Marker({ element: el })
        .setLngLat([t.coords.lng, t.coords.lat])
        .setPopup(popup)
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    }
  }, [tickets, selectedTicketId, mapLoaded, onSelectTicket, mapRef]);

  return (
    <div className="flex-1 relative min-h-[360px] lg:min-h-0 bg-slate-100">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Badge statut OpenStreetMap */}
      <div className="absolute bottom-3 left-3 z-10 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur border border-slate-200 shadow-xs flex items-center gap-2 text-[11px] text-slate-600 font-medium">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>OpenStreetMap • MapLibre Live</span>
      </div>
    </div>
  );
}
