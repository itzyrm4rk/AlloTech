interface AlloTechLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  textColor?: string;
  variant?: 'full' | 'icon-only';
}

/**
 * Logo officiel AlloTech — Synthèse Visuelle de la Maintenance Informatique :
 * - Puce microprocesseur & circuits imprimés (Hardware / Matériel)
 * - Balises de code & terminal < / > (Software / Logiciel & Systèmes)
 * - Clé de précision intégrée (Maintenance & Dépannage Proactif)
 */
export function AlloTechLogo({
  size = 40,
  className = '',
  showText = false,
  textColor = 'text-slate-900',
  variant = 'full',
}: AlloTechLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105 duration-200"
        aria-label="Logo AlloTech — Maintenance Matérielle & Logicielle"
        role="img"
      >
        <title>Logo AlloTech — Maintenance Matérielle & Logicielle</title>
        <defs>
          {/* Gradient Fond Squircle */}
          <linearGradient
            id="allotech-bg"
            x1="4"
            y1="4"
            x2="60"
            y2="60"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#31525B" />
            <stop offset="60%" stopColor="#254148" />
            <stop offset="100%" stopColor="#1B3137" />
          </linearGradient>

          {/* Gradient Or / Ambre */}
          <linearGradient
            id="allotech-amber"
            x1="16"
            y1="16"
            x2="48"
            y2="48"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFA101" />
            <stop offset="100%" stopColor="#FF7A00" />
          </linearGradient>

          {/* Gradient Circuit Substrat */}
          <linearGradient
            id="allotech-chip"
            x1="18"
            y1="18"
            x2="46"
            y2="46"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#1E383F" />
            <stop offset="100%" stopColor="#15282D" />
          </linearGradient>

          {/* Glow filter subtil */}
          <filter id="allotech-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#FFA101" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* 1. Base Squircle Premium */}
        <rect
          x="3"
          y="3"
          width="58"
          height="58"
          rx="16"
          fill="url(#allotech-bg)"
          stroke="#416974"
          strokeWidth="1.5"
        />

        {/* 2. PINS DU MICROPROCESSEUR (Hardware / Matériel) */}
        {/* Haut */}
        <line
          x1="26"
          y1="3"
          x2="26"
          y2="8"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
        <line
          x1="32"
          y1="3"
          x2="32"
          y2="8"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
        <line
          x1="38"
          y1="3"
          x2="38"
          y2="8"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Bas */}
        <line
          x1="26"
          y1="56"
          x2="26"
          y2="61"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
        <line
          x1="32"
          y1="56"
          x2="32"
          y2="61"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
        <line
          x1="38"
          y1="56"
          x2="38"
          y2="61"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Gauche */}
        <line
          x1="3"
          y1="26"
          x2="8"
          y2="26"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
        <line
          x1="3"
          y1="32"
          x2="8"
          y2="32"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
        <line
          x1="3"
          y1="38"
          x2="8"
          y2="38"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Droite */}
        <line
          x1="56"
          y1="26"
          x2="61"
          y2="26"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
        <line
          x1="56"
          y1="32"
          x2="61"
          y2="32"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />
        <line
          x1="56"
          y1="38"
          x2="61"
          y2="38"
          stroke="#FFA101"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* 3. COEUR DE LA PUCE (Silicon Die) */}
        <rect
          x="12"
          y="12"
          width="40"
          height="40"
          rx="10"
          fill="url(#allotech-chip)"
          stroke="#416974"
          strokeWidth="1.2"
        />

        {/* Lignes de circuit imprimé (Trace PCB) */}
        <path
          d="M16 20H20V16 M48 20H44V16 M16 44H20V48 M48 44H44V48"
          stroke="#487582"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />

        {/* 4. BALISES DE CODE & TERMINAL SOFTWARE : < / > */}
        {/* Balise gauche < */}
        <path
          d="M26 24L20 32L26 40"
          stroke="url(#allotech-amber)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#allotech-glow)"
        />

        {/* Slash central / Outil de maintenance logiciel */}
        <line
          x1="35"
          y1="22"
          x2="29"
          y2="42"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.95"
        />

        {/* Balise droite > */}
        <path
          d="M38 24L44 32L38 40"
          stroke="url(#allotech-amber)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#allotech-glow)"
        />

        {/* 5. LED D'ÉTAT SYSTÈME ACTIF (Vert Émeraude Haute Disponibilité) */}
        <circle cx="32" cy="16.5" r="2" fill="#2E8B57" />
        <circle cx="32" cy="16.5" r="3.5" stroke="#2E8B57" strokeWidth="0.8" opacity="0.5" />
      </svg>

      {(showText || variant === 'full') && (
        <span
          className={`font-black tracking-tight ${textColor}`}
          style={{ fontSize: `${Math.max(16, size * 0.48)}px` }}
        >
          Allo<span className="text-[#FFA101]">Tech</span>
        </span>
      )}
    </div>
  );
}
