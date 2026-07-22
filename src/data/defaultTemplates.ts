import { SessionTemplate } from '../types';

export const DEFAULT_SESSION_TEMPLATES: SessionTemplate[] = [
  {
    id: 'tpl-transicio-balanc',
    name: 'Sessió Tàctica: Transició Ràpida i Balanç Defensiu',
    description: 'Sessió d’alta intensitat orientada a un ritme de joc elevat, sortida ràpida de contraatac i balanç defensiu d’emergència.',
    category: 'Transició',
    totalDuration: 75,
    drills: [
      { drillId: 'drill-rueda-11', duration: 12, notes: 'Sortida explosiva de primer passador.' },
      { drillId: 'virtual-hydration', duration: 3, notes: 'Pausa d’hidratació de 90 segons.' },
      { drillId: 'drill-pnr-def', duration: 15, notes: 'Comunicació intensa de la línia de fons.' },
      { drillId: 'virtual-freethrows', duration: 4, notes: 'Tirs lliures amb fatiga acumulada.' },
      { drillId: 'drill-press-break', duration: 16, notes: 'Ruptura de pressió sense botar.' },
      { drillId: 'drill-rueda-tiro-competitiva', duration: 10, notes: 'Series de tir competitives per equips.' },
      { drillId: 'drill-5v5-real', duration: 15, notes: 'Joc real 5v5 amb normatives de transició.' }
    ]
  },
  {
    id: 'tpl-atac-spacing',
    name: 'Sessió d’Atac: Spacing, Extra-Pass i Continuïtat',
    description: 'Enfocada en l’espaiament ofensiu, lectura del Pick & Roll i circulació ràpida de pilota per trobar el millor tirador.',
    category: 'Atac',
    totalDuration: 75,
    drills: [
      { drillId: 'drill-rueda-tiro-competitiva', duration: 12, notes: 'Escalfament de tir des de 5 posicions.' },
      { drillId: 'drill-rueda-11', duration: 10, notes: 'Circulació ràpida per la banda.' },
      { drillId: 'virtual-hydration', duration: 3, notes: 'Hidratació i ajustos d’espaiament.' },
      { drillId: 'drill-pnr-def', duration: 20, notes: 'Lectura de bloquejos i talls des de la feble.' },
      { drillId: 'virtual-freethrows', duration: 5, notes: '10 tirs lliures per parella.' },
      { drillId: 'drill-press-break', duration: 10, notes: 'Superació de primera línia de pressió.' },
      { drillId: 'drill-5v5-real', duration: 15, notes: '5v5 aplicant espaiament i extra-pass.' }
    ]
  },
  {
    id: 'tpl-defensa-pressio',
    name: 'Sessió Defensiva: Pressió a Tot Camp i 2es Ajudes',
    description: 'Sessió d’alta exigència física per treballar la línia de pressió a tot camp, tancament de rebot i ajudes de segon esforç.',
    category: 'Defensa',
    totalDuration: 75,
    drills: [
      { drillId: 'drill-press-break', duration: 18, notes: 'Defensa agressiva a 3/4 de pista.' },
      { drillId: 'virtual-hydration', duration: 3, notes: 'Recuperació cardíaca i hidratació.' },
      { drillId: 'drill-pnr-def', duration: 18, notes: 'Defensa de Pick & Roll amb ajudes del pivot.' },
      { drillId: 'virtual-freethrows', duration: 4, notes: 'Tirs de fatiga sota pulsacions altes.' },
      { drillId: 'drill-rueda-tiro-competitiva', duration: 12, notes: 'Tir baix fatiga.' },
      { drillId: 'drill-5v5-real', duration: 20, notes: '5v5 real puntuant dobles les accions de recuperació.' }
    ]
  }
];
