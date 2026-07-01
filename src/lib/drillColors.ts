import { Drill } from '../types';

export interface ColorProfile {
  cardClass: string;
  badgeClass: string;
  conceptClass: string;
  textClass: string;
  hoverBorderClass: string;
  accentColor: string;
  borderLeftClass: string;
}

const COLOR_PROFILES: ColorProfile[] = [
  {
    // 0. Amber / Warm Gold
    cardClass: 'border-l-4 border-l-amber-500 border-amber-200 bg-amber-50/10 hover:border-amber-400',
    badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
    conceptClass: 'bg-amber-50 text-amber-800 border border-amber-200',
    textClass: 'text-amber-900',
    hoverBorderClass: 'hover:border-amber-400',
    borderLeftClass: 'border-l-amber-500',
    accentColor: '#f59e0b'
  },
  {
    // 1. Sky Blue / Cyan
    cardClass: 'border-l-4 border-l-sky-500 border-sky-200 bg-sky-50/10 hover:border-sky-400',
    badgeClass: 'bg-sky-100 text-sky-900 border border-sky-300',
    conceptClass: 'bg-sky-50 text-sky-800 border border-sky-200',
    textClass: 'text-sky-900',
    hoverBorderClass: 'hover:border-sky-400',
    borderLeftClass: 'border-l-sky-500',
    accentColor: '#0ea5e9'
  },
  {
    // 2. Rose / Coral Red
    cardClass: 'border-l-4 border-l-rose-500 border-rose-200 bg-rose-50/10 hover:border-rose-400',
    badgeClass: 'bg-rose-100 text-rose-950 border border-rose-300',
    conceptClass: 'bg-rose-50 text-rose-800 border border-rose-200',
    textClass: 'text-rose-900',
    hoverBorderClass: 'hover:border-rose-400',
    borderLeftClass: 'border-l-rose-500',
    accentColor: '#f43f5e'
  },
  {
    // 3. Purple / Royal Violet
    cardClass: 'border-l-4 border-l-purple-500 border-purple-200 bg-purple-50/10 hover:border-purple-400',
    badgeClass: 'bg-purple-100 text-purple-900 border border-purple-300',
    conceptClass: 'bg-purple-50 text-purple-800 border border-purple-200',
    textClass: 'text-purple-900',
    hoverBorderClass: 'hover:border-purple-400',
    borderLeftClass: 'border-l-purple-500',
    accentColor: '#a855f7'
  },
  {
    // 4. Emerald / Fresh Green
    cardClass: 'border-l-4 border-l-emerald-500 border-emerald-200 bg-emerald-50/10 hover:border-emerald-400',
    badgeClass: 'bg-emerald-100 text-emerald-950 border border-emerald-300',
    conceptClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    textClass: 'text-emerald-900',
    hoverBorderClass: 'hover:border-emerald-400',
    borderLeftClass: 'border-l-emerald-500',
    accentColor: '#10b981'
  },
  {
    // 5. Indigo / Deep Blue
    cardClass: 'border-l-4 border-l-indigo-500 border-indigo-200 bg-indigo-50/10 hover:border-indigo-400',
    badgeClass: 'bg-indigo-100 text-indigo-900 border border-indigo-300',
    conceptClass: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
    textClass: 'text-indigo-900',
    hoverBorderClass: 'hover:border-indigo-400',
    borderLeftClass: 'border-l-indigo-500',
    accentColor: '#6366f1'
  },
  {
    // 6. Orange / Bright Tangelo
    cardClass: 'border-l-4 border-l-orange-500 border-orange-200 bg-orange-50/10 hover:border-orange-400',
    badgeClass: 'bg-orange-100 text-orange-950 border border-orange-300',
    conceptClass: 'bg-orange-50 text-orange-800 border border-orange-200',
    textClass: 'text-orange-900',
    hoverBorderClass: 'hover:border-orange-400',
    borderLeftClass: 'border-l-orange-500',
    accentColor: '#f97316'
  },
  {
    // 7. Teal / Marine Cyan
    cardClass: 'border-l-4 border-l-teal-500 border-teal-200 bg-teal-50/10 hover:border-teal-400',
    badgeClass: 'bg-teal-100 text-teal-900 border border-teal-300',
    conceptClass: 'bg-teal-50 text-teal-800 border border-teal-200',
    textClass: 'text-teal-900',
    hoverBorderClass: 'hover:border-teal-400',
    borderLeftClass: 'border-l-teal-500',
    accentColor: '#14b8a6'
  },
  {
    // 8. Fuchsia / Orchid Pink
    cardClass: 'border-l-4 border-l-fuchsia-500 border-fuchsia-200 bg-fuchsia-50/10 hover:border-fuchsia-400',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-300',
    conceptClass: 'bg-fuchsia-50 text-fuchsia-800 border border-fuchsia-200',
    textClass: 'text-fuchsia-900',
    hoverBorderClass: 'hover:border-fuchsia-400',
    borderLeftClass: 'border-l-fuchsia-500',
    accentColor: '#d946ef'
  },
  {
    // 9. Lime / Electric Green
    cardClass: 'border-l-4 border-l-lime-500 border-lime-200 bg-lime-50/10 hover:border-lime-400',
    badgeClass: 'bg-lime-100 text-lime-950 border border-lime-300',
    conceptClass: 'bg-lime-50 text-lime-800 border border-lime-200',
    textClass: 'text-lime-900',
    hoverBorderClass: 'hover:border-lime-400',
    borderLeftClass: 'border-l-lime-500',
    accentColor: '#84cc16'
  },
  {
    // 10. Violet / Amethyst
    cardClass: 'border-l-4 border-l-violet-600 border-violet-200 bg-violet-50/10 hover:border-violet-550',
    badgeClass: 'bg-violet-100 text-violet-900 border border-violet-300',
    conceptClass: 'bg-violet-50 text-violet-850 border border-violet-200',
    textClass: 'text-violet-900',
    hoverBorderClass: 'hover:border-violet-500',
    borderLeftClass: 'border-l-violet-600',
    accentColor: '#7c3aed'
  },
  {
    // 11. Pink / Deep Rose
    cardClass: 'border-l-4 border-l-pink-500 border-pink-200 bg-pink-50/10 hover:border-pink-400',
    badgeClass: 'bg-pink-100 text-pink-900 border border-pink-300',
    conceptClass: 'bg-pink-50 text-pink-800 border border-pink-200',
    textClass: 'text-pink-900',
    hoverBorderClass: 'hover:border-pink-400',
    borderLeftClass: 'border-l-pink-500',
    accentColor: '#ec4899'
  }
];

function getHashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getDrillColorProfile(drill: Drill): ColorProfile {
  if (!drill || !drill.id) return COLOR_PROFILES[0];
  const hash = getHashCode(drill.id + drill.title);
  const index = hash % COLOR_PROFILES.length;
  return COLOR_PROFILES[index];
}
