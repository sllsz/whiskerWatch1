/**
 * SVG line art icon library for WhiskerWatch.
 * All icons are 24×24 by default, stroke-based line art style.
 * Each accepts `size` and `color` props.
 */

export function CatFaceIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      {/* ears — triangular with full sides */}
      <path d="M4 10L3 2L8 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 10L21 2L16 8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* head */}
      <ellipse cx="12" cy="14" rx="8" ry="7" stroke={color} strokeWidth="1.8" />
      {/* eyes */}
      <circle cx="9" cy="13" r="1" fill={color} />
      <circle cx="15" cy="13" r="1" fill={color} />
      {/* nose */}
      <path d="M12 15.5L11 16.5H13L12 15.5Z" fill={color} />
      {/* whiskers */}
      <line x1="7" y1="15" x2="2" y2="14" stroke={color} strokeWidth="1.2" />
      <line x1="7" y1="16.5" x2="2" y2="17" stroke={color} strokeWidth="1.2" />
      <line x1="17" y1="15" x2="22" y2="14" stroke={color} strokeWidth="1.2" />
      <line x1="17" y1="16.5" x2="22" y2="17" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

export function PawIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      {/* main pad */}
      <ellipse cx="12" cy="16" rx="4" ry="3.5" stroke={color} strokeWidth="1.8" />
      {/* toe pads */}
      <ellipse cx="7.5" cy="10" rx="2" ry="2.5" stroke={color} strokeWidth="1.5" />
      <ellipse cx="16.5" cy="10" rx="2" ry="2.5" stroke={color} strokeWidth="1.5" />
      <ellipse cx="10" cy="7.5" rx="1.8" ry="2.3" stroke={color} strokeWidth="1.5" />
      <ellipse cx="14" cy="7.5" rx="1.8" ry="2.3" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function BowlIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M3 10C3 10 4 18 12 18C20 18 21 10 21 10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="2" y1="10" x2="22" y2="10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* food bumps */}
      <path d="M7 10C7 8 8.5 7 10 8C11 7 12.5 7 13 8C14.5 7 16 8 16 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function RunningIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      {/* cat body running */}
      <path d="M4 14C6 10 9 9 12 11C15 9 18 10 20 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* head */}
      <circle cx="20" cy="11" r="2.5" stroke={color} strokeWidth="1.8" />
      {/* ear */}
      <path d="M19 8.5L18.5 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M21 8.5L21.5 6.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* legs */}
      <line x1="6" y1="14" x2="4" y2="19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="10" y1="13" x2="9" y2="19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="14" y1="13" x2="15" y2="19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="18" y1="14" x2="20" y2="19" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* tail */}
      <path d="M4 14C2 12 1 8 3 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function LitterBoxIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      {/* box */}
      <path d="M4 9L3 19H21L20 9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* litter texture */}
      <path d="M7 13L8 12L9 13" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 14L12 13L13 14" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M15 13L16 12L17 13" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 21C12 21 3 15 3 9C3 6 5.5 4 8 4C9.5 4 11 5 12 6.5C13 5 14.5 4 16 4C18.5 4 21 6 21 9C21 15 12 21 12 21Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DropletIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3C12 3 5 11 5 15C5 18.866 8.134 22 12 22C15.866 22 19 18.866 19 15C19 11 12 3 12 3Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 16C9 14 10.5 12 12 11" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function ChartIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <polyline points="3,18 8,12 13,15 21,6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="3" y1="21" x2="3" y2="4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="3" y1="21" x2="21" y2="21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BellIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M18 8C18 4.686 15.314 2 12 2C8.686 2 6 4.686 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21C13.37 21.64 12.74 22 12 22C11.26 22 10.63 21.64 10.27 21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function RulerIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <line x1="3" y1="8" x2="8" y2="8" stroke={color} strokeWidth="1.5" />
      <line x1="3" y1="12" x2="10" y2="12" stroke={color} strokeWidth="1.5" />
      <line x1="3" y1="16" x2="6" y2="16" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function NoteIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14,2 14,8 20,8" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="17" x2="13" y2="17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CalendarIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export function FireIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 2C12 2 8 7 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 7 12 2 12 2Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 22C7.58 22 4 18.42 4 14C4 10 8 6 8 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 22C16.42 22 20 18.42 20 14C20 10 16 6 16 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AlertIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 2L2 20H22L12 2Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="9" x2="12" y2="14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="0.5" fill={color} stroke={color} strokeWidth="1" />
    </svg>
  );
}

export function StethoscopeIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 4V10C6 13.31 8.69 16 12 16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 4V10C18 13.31 15.31 16 12 16V20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="21" r="1" stroke={color} strokeWidth="1.8" />
      <circle cx="6" cy="3" r="1" stroke={color} strokeWidth="1.5" />
      <circle cx="18" cy="3" r="1" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function SparkleIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 2L14 8L20 10L14 12L12 18L10 12L4 10L10 8L12 2Z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19 15L20 17L22 18L20 19L19 21L18 19L16 18L18 17L19 15Z" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronLeftIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <polyline points="15,4 7,12 15,20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <polyline points="9,4 17,12 9,20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DownloadIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3V15" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <polyline points="7,12 12,17 17,12" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="4" y1="21" x2="20" y2="21" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function FilterIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <polygon points="3,4 21,4 14,13 14,20 10,22 10,13" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function XIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ size = 24, color = 'currentColor', ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <polyline points="4,12 9,17 20,6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Cat Avatar Generator ──

/** Available fur color palettes, keyed for the avatar customizer. */
export const AVATAR_COLORS = {
  orange:  { label: 'Orange Tabby', body: '#F4C79E', inner: '#FDEEE4', nose: '#E8A090' },
  ginger:  { label: 'Ginger',      body: '#E8915A', inner: '#F4C79E', nose: '#D4784A' },
  gray:    { label: 'Gray',        body: '#C8C8C8', inner: '#E8E8E8', nose: '#D4A0A0' },
  brown:   { label: 'Brown',       body: '#4A3728', inner: '#8B7262', nose: '#B47B6B' },
  cream:   { label: 'Cream',       body: '#F0DDD0', inner: '#FFF8F2', nose: '#E8A090' },
  siamese: { label: 'Siamese',     body: '#B0A090', inner: '#D4C4B0', nose: '#C0A090' },
  black:   { label: 'Black',       body: '#2C2C2C', inner: '#4A4A4A', nose: '#888' },
  white:   { label: 'White',       body: '#F5E6D3', inner: '#FFF5EB', nose: '#E8B0A0' },
};

export const AVATAR_EARS = {
  pointed: 'Pointed',
  rounded: 'Rounded',
  folded:  'Folded',
};

export const AVATAR_EYES = {
  round: 'Round',
  oval:  'Oval',
};

export const AVATAR_PATTERNS = {
  none:    'None',
  stripes: 'Stripes',
  spot:    'Spot',
};

const COLOR_KEYS = Object.keys(AVATAR_COLORS);

function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Generates a cat face SVG. If avatar preferences (color, ear, eye, pattern)
 * are provided, uses those. Otherwise falls back to hash-based generation
 * from the cat's name.
 */
export function CatAvatar({ name = 'Cat', size = 48, avatarColor, avatarEar, avatarEye, avatarPattern, ...props }) {
  const seed = hashStr(name);

  // Use stored preferences if set, otherwise derive from name hash
  const colorKey = avatarColor || COLOR_KEYS[seed % COLOR_KEYS.length];
  const palette = AVATAR_COLORS[colorKey] || AVATAR_COLORS.orange;
  const earKey = avatarEar || ['pointed', 'rounded', 'folded'][seed % 3];
  const eyeKey = avatarEye || ['round', 'oval'][seed % 2];
  const patternKey = avatarPattern || ['none', 'stripes', 'spot', 'none'][seed % 4];

  const earStyle = earKey === 'pointed' ? 0 : earKey === 'rounded' ? 1 : 2;
  const eyeStyle = eyeKey === 'round' ? 0 : 1;
  const hasStripes = patternKey === 'stripes';
  const hasSpot = patternKey === 'spot';

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" {...props}>
      {/* ears */}
      {earStyle === 0 && (
        <>
          <path d="M12 18L18 4L26 18" fill={palette.body} stroke={palette.body} strokeWidth="1" />
          <path d="M15 18L18 8L23 18" fill={palette.inner} />
          <path d="M38 18L46 4L52 18" fill={palette.body} stroke={palette.body} strokeWidth="1" />
          <path d="M41 18L46 8L49 18" fill={palette.inner} />
        </>
      )}
      {earStyle === 1 && (
        <>
          <path d="M14 20Q12 6 24 16" fill={palette.body} stroke={palette.body} strokeWidth="1" />
          <path d="M16 19Q15 10 22 17" fill={palette.inner} />
          <path d="M50 20Q52 6 40 16" fill={palette.body} stroke={palette.body} strokeWidth="1" />
          <path d="M48 19Q49 10 42 17" fill={palette.inner} />
        </>
      )}
      {earStyle === 2 && (
        <>
          <path d="M12 22L18 6L26 18" fill={palette.body} stroke={palette.body} strokeWidth="1" />
          <path d="M14 19L18 10L22 17" fill={palette.inner} />
          <path d="M12 22Q14 16 22 18" fill={palette.body} />
          <path d="M52 22L46 6L38 18" fill={palette.body} stroke={palette.body} strokeWidth="1" />
          <path d="M50 19L46 10L42 17" fill={palette.inner} />
          <path d="M52 22Q50 16 42 18" fill={palette.body} />
        </>
      )}
      {/* head */}
      <ellipse cx="32" cy="36" rx="20" ry="18" fill={palette.body} />
      {/* stripes */}
      {hasStripes && (
        <>
          <path d="M26 20L28 26" stroke={palette.inner} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <path d="M32 18L32 24" stroke={palette.inner} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <path d="M38 20L36 26" stroke={palette.inner} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </>
      )}
      {/* spot */}
      {hasSpot && <circle cx="38" cy="30" r="5" fill="white" opacity="0.5" />}
      {/* eyes */}
      {eyeStyle === 0 ? (
        <>
          <circle cx="24" cy="34" r="3.5" fill="white" />
          <circle cx="24" cy="34" r="2" fill="#333" />
          <circle cx="23" cy="33" r="0.8" fill="white" />
          <circle cx="40" cy="34" r="3.5" fill="white" />
          <circle cx="40" cy="34" r="2" fill="#333" />
          <circle cx="39" cy="33" r="0.8" fill="white" />
        </>
      ) : (
        <>
          <ellipse cx="24" cy="34" rx="3.5" ry="3" fill="white" />
          <ellipse cx="24" cy="34" rx="1.5" ry="2.5" fill="#333" />
          <circle cx="23" cy="33" r="0.7" fill="white" />
          <ellipse cx="40" cy="34" rx="3.5" ry="3" fill="white" />
          <ellipse cx="40" cy="34" rx="1.5" ry="2.5" fill="#333" />
          <circle cx="39" cy="33" r="0.7" fill="white" />
        </>
      )}
      {/* nose */}
      <path d="M32 39L30 41H34L32 39Z" fill={palette.nose} />
      {/* mouth */}
      <path d="M30 41.5Q32 43.5 34 41.5" stroke={palette.nose} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      {/* whiskers */}
      <line x1="22" y1="39" x2="10" y2="37" stroke={palette.body} strokeWidth="1" opacity="0.6" />
      <line x1="22" y1="41" x2="10" y2="42" stroke={palette.body} strokeWidth="1" opacity="0.6" />
      <line x1="42" y1="39" x2="54" y2="37" stroke={palette.body} strokeWidth="1" opacity="0.6" />
      <line x1="42" y1="41" x2="54" y2="42" stroke={palette.body} strokeWidth="1" opacity="0.6" />
    </svg>
  );
}
