import { Player } from '../types';

export const DEFAULT_JUNIOR_PLAYERS: Player[] = [
  {
    id: 'player-1',
    number: 4,
    name: 'Marc Soler',
    position: 'Base',
    role: 'Quintet Inicial',
    height: '1.84 m',
    averageMinutes: 28,
    ratings: {
      shooting: 8,
      defense: 7,
      tacticalIQ: 9,
      physical: 7,
      leadership: 9
    },
    strengths: ['Lectura de Pick & Roll', 'Direcció en transició', 'Lideratge verbal'],
    areasToImprove: ['Contacte en penetració', 'Control de pèrdues sota pressió alta'],
    notes: 'Capità de l’equip. Excel·lent comunicació en defensa de bloquejos.',
    statsSummary: {
      ppg: 11.5,
      rpg: 3.2,
      apg: 5.8,
      threePointPct: 38.5
    }
  },
  {
    id: 'player-2',
    number: 7,
    name: 'Adrià Font',
    position: 'Escorta',
    role: 'Quintet Inicial',
    height: '1.89 m',
    averageMinutes: 26,
    ratings: {
      shooting: 9,
      defense: 6,
      tacticalIQ: 8,
      physical: 7,
      leadership: 7
    },
    strengths: ['Tir de 3p de sortida de bloqueig', 'Primer pas explosiu'],
    areasToImprove: ['Balanç defensiu', 'Orientació de cames en l’1v1 defensiu'],
    notes: 'Anotador principal perimetral. Treballar agressivitat en l’ajuda defensiva.',
    statsSummary: {
      ppg: 14.8,
      rpg: 2.8,
      apg: 2.1,
      threePointPct: 41.2
    }
  },
  {
    id: 'player-3',
    number: 11,
    name: 'Pol Torres',
    position: 'Ala',
    role: 'Quintet Inicial',
    height: '1.93 m',
    averageMinutes: 24,
    ratings: {
      shooting: 7,
      defense: 8,
      tacticalIQ: 8,
      physical: 8,
      leadership: 7
    },
    strengths: ['Rebot d’atac', 'Defensa de múltiples posicions (2-4)', 'Joc sense pilota'],
    areasToImprove: ['Consistència en tiro lliure', 'Maneig amb mà no dominant'],
    notes: 'Jugador molt intens. Aporta energia i segones opcions en atac.',
    statsSummary: {
      ppg: 9.2,
      rpg: 6.4,
      apg: 1.8,
      threePointPct: 32.0
    }
  },
  {
    id: 'player-4',
    number: 15,
    name: 'Pau Vila',
    position: 'Ala-Pivot',
    role: 'Quintet Inicial',
    height: '1.98 m',
    averageMinutes: 25,
    ratings: {
      shooting: 7,
      defense: 8,
      tacticalIQ: 8,
      physical: 9,
      leadership: 8
    },
    strengths: ['Intimidació i taps', 'Tir de 4-5 metres', 'Pantalles eficaces'],
    areasToImprove: ['Velocitat de transició defensiva', 'Evitar faltes ràpides'],
    notes: 'Peça clau en l’esquema defensiu interior. Molt bo en la protecció de l’anella.',
    statsSummary: {
      ppg: 10.4,
      rpg: 7.8,
      apg: 1.2,
      threePointPct: 33.3
    }
  },
  {
    id: 'player-5',
    number: 23,
    name: 'Martí Serra',
    position: 'Pivot',
    role: 'Quintet Inicial',
    height: '2.02 m',
    averageMinutes: 22,
    ratings: {
      shooting: 6,
      defense: 9,
      tacticalIQ: 7,
      physical: 9,
      leadership: 7
    },
    strengths: ['Presència a la pintura', 'Cierre de rebot defensiu', 'Continuacions potents'],
    areasToImprove: ['Passada des del post alt', 'Resistència aeròbica en ritme alt'],
    notes: 'Dominant a la zona. Cal dosificar els seus minuts en partits de ritme molt ràpid.',
    statsSummary: {
      ppg: 8.6,
      rpg: 8.5,
      apg: 0.9,
      threePointPct: 0.0
    }
  },
  {
    id: 'player-6',
    number: 9,
    name: 'Guillem Rovira',
    position: 'Base',
    role: 'Rotació Principal',
    height: '1.81 m',
    averageMinutes: 16,
    ratings: {
      shooting: 7,
      defense: 8,
      tacticalIQ: 7,
      physical: 8,
      leadership: 6
    },
    strengths: ['Presió a tota pista a la pilota', 'Incisiu en penetració'],
    areasToImprove: ['Lectura en mitja pista', 'Paciència en situacions de 5v5'],
    notes: 'Revulsiu defensiu. Molt bo canviant el ritme del partit des de la banqueta.',
    statsSummary: {
      ppg: 5.4,
      rpg: 1.8,
      apg: 3.1,
      threePointPct: 29.5
    }
  },
  {
    id: 'player-7',
    number: 12,
    name: 'Arnau Pujol',
    position: 'Escorta',
    role: 'Rotació Principal',
    height: '1.86 m',
    averageMinutes: 14,
    ratings: {
      shooting: 8,
      defense: 6,
      tacticalIQ: 7,
      physical: 6,
      leadership: 6
    },
    strengths: ['Tirador de cantonada', 'Molt bon % en tir lliure'],
    areasToImprove: ['Agressivitat en rebot', 'Desplaçament lateral defensiu'],
    notes: 'Especialista en obrir el camp contra defenses zonals.',
    statsSummary: {
      ppg: 6.1,
      rpg: 1.5,
      apg: 1.0,
      threePointPct: 39.0
    }
  }
];
