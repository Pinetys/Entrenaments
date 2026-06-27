import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Filter, 
  Clock, 
  Users, 
  Wrench, 
  CheckCircle,
  Undo2,
  Copy,
  ChevronRight,
  BookOpen,
  Sparkles,
  Image as ImageIcon,
  FileImage,
  X,
  Loader2,
  QrCode,
  Smartphone,
  RefreshCw,
  Star
} from 'lucide-react';
import { Drill, DrillCategory, BoardState } from '../types';
import TacticalBoard from './TacticalBoard';
import DrillManualBooklet from './DrillManualBooklet';
import { compressAndResizeImage } from '../lib/imageCompressor';

// Pre-populated High-Level Drills for Junior Nivel A Catalan Federation
export const PRE_POPULATED_DRILLS: Drill[] = [
  {
    id: 'drill-rueda-11',
    title: "Roda d'11 FCBQ de Contraatac Continuat",
    category: 'Atac',
    concept: 'Contraatac Ràpid',
    duration: 12,
    objectives: [
      "Desenvolupament del primer passe de sortida (outlet pass) en menys de 2 segons.",
      "Coordinació espacial de les tres línies de carril de contraatac a màxima velocitat.",
      "Entrenar la finalització en velocitat sota pressió i el balanç defensiu dinàmic."
    ],
    description: "Exercici insígnia de l'Escola d'Entrenadors del Bàsquet Català per a escalfaments competitius. Es col·loquen tres files a línia de fons (un passador a l'eix i dos corredors a les cantonades). El jugador amb pilota llança voluntàriament contra el taulell, agafa el rebot ràpid d'embranzida, gira l'eix de malucs per obrir el passe ràpid a la banda i inicia una trena de pista sencera a 3 passades sense botar fins a resoldre en entrada.",
    setupInstructions: "Dividir el grup en 3 files darrere de la línia de fons. El d'enmig comença amb pilota llançant al taulell. Els dos dels costats corren pegats a la banda preparant-se per a la trena de transició.",
    playersNeeded: 10,
    materials: ['Pilotes de bàsquet (S7)', 'Cons de demarcació'],
    boardState: {
      courtType: 'full',
      paths: [
        { id: 'p1', points: [{ x: 50, y: 88 }, { x: 50, y: 55 }, { x: 20, y: 75 }], color: '#0ea5e9', type: 'dashed' }
      ],
      pins: [
        { id: 'att1', label: '1', x: 50, y: 90, type: 'attacker' },
        { id: 'att2', label: '2', x: 20, y: 92, type: 'attacker' },
        { id: 'att3', label: '3', x: 80, y: 92, type: 'attacker' },
        { id: 'cone1', label: '▲', x: 20, y: 50, type: 'cone' },
        { id: 'cone2', label: '▲', x: 80, y: 50, type: 'cone' }
      ]
    }
  },
  {
    id: 'drill-pnr-def',
    title: 'Defensa de Bloqueig Directe (Pick & Roll) Central Drop',
    category: 'Defensa',
    concept: 'Pick & Roll',
    duration: 15,
    objectives: [
      "Negar el pas central al base contrari forçant-lo cap a la banda per reduir angle de decisió.",
      "Treballar la comunicació verbal ràpida del defensor de l'home gran ('Bloqueig!', 'Drop!').",
      "Assegurar l'ajuda de fons (costat feble) en la recuperació de la continuació (Roll)."
    ],
    description: "Syllabus de Nivell A de la Federació Catalana. Treball defensiu de 3x3 de Pick & Roll central. Apliquem la defense de contenció tipus 'Drop' (l'home de l'interior recula fins a línia de lliures per protegir la penetració) mentre que el defensor del base lluita per sobre de la pantalla atacant per darrere o recuperant l'eix d'ajudes.",
    setupInstructions: "Situar un 3 contra 3 a mitja pista. Pilota en posició de base central. Ajustar el cos de fons defensant especialment les ajudes de segon esforç des de cantonades.",
    playersNeeded: 6,
    materials: ['Pilotes de joc', 'Petos de contrast'],
    boardState: {
      paths: [
        { id: 'path-block', points: [{ x: 65, y: 55 }, { x: 50, y: 65 }], color: '#000000', type: 'solid' },
        { id: 'path-def', points: [{ x: 50, y: 72 }, { x: 40, y: 78 }], color: '#000000', type: 'dashed' }
      ],
      pins: [
        { id: 'att1', label: '1', x: 50, y: 65, type: 'attacker' }, // Ballhandler
        { id: 'att2', label: '5', x: 65, y: 55, type: 'attacker' }, // Screener
        { id: 'att3', label: '2', x: 25, y: 75, type: 'attacker' }, // Corner spacing
        { id: 'def1', label: '1', x: 50, y: 72, type: 'defender' }, // Def ball
        { id: 'def2', label: '5', x: 61, y: 59, type: 'defender' }, // Def screener
        { id: 'def3', label: '2', x: 28, y: 72, type: 'defender' }, // Def corner
        { id: 'ball', label: '🏀', x: 48, y: 65, type: 'ball' }
      ]
    }
  },
  {
    id: 'drill-press-break',
    title: 'Sortida de Pressió 1-3-1 amb Connexió Vertical',
    category: 'Atac',
    concept: 'Sortida de Pressió',
    duration: 15,
    objectives: [
      "Evitar rebre l'embolcall doble de la defense (Traps) a les cantonades fatídiques del camp.",
      "Exigir el 'tercer home' al mig del camp per canviar l'eix de visió de la línia de pressió bàsica.",
      "Assegurar una recepció en moviment llançant passades diagonals de seguretat de dalt a baix."
    ],
    description: "Estructura defensiva de l'Escola de l'FCBQ per combatre defenses zonals en premsa (com la 1-2-1-1). Es defineix un sacador ràpid (pivot), el base que fa el rebuig i el 'post de fons' situat al mig de la pista per fer d'enllaç amortidor. Queda absolutament penalitzat fer servir el bot abans de canviar l'eix de costat de camp.",
    setupInstructions: "Muntar 4 contra 4 a camp sencer simulant un llançament lliure contrari anotat. Un cop la pilota es posa en joc, s'activen les llançadores d'ajuda al pivot central de connexió ràpida.",
    playersNeeded: 8,
    materials: ['Pilotes de bàsquet', 'Petos bicolor'],
    boardState: {
      courtType: 'full',
      paths: [
        { id: 'pass-in', points: [{ x: 50, y: 97 }, { x: 25, y: 85 }], color: '#0ea5e9', type: 'dashed' },
        { id: 'pass-mid', points: [{ x: 25, y: 85 }, { x: 50, y: 60 }], color: '#0ea5e9', type: 'dashed' }
      ],
      pins: [
        { id: 'att1', label: '4', x: 50, y: 97, type: 'attacker' }, // inbounder
        { id: 'att2', label: '1', x: 25, y: 85, type: 'attacker' }, // base
        { id: 'att3', label: '5', x: 50, y: 60, type: 'attacker' }, // centro
        { id: 'def1', label: '1', x: 25, y: 80, type: 'defender' }, // defender base
        { id: 'def2', label: '2', x: 45, y: 70, type: 'defender' }, // defender centro
        { id: 'ball', label: '🏀', x: 50, y: 97, type: 'ball' }
      ]
    }
  },
  {
    id: 'drill-rueda-tiro-competitiva',
    title: 'Roda de Tir Tecnificació FCBQ - Sortida d’Indirecte',
    category: 'Atac',
    concept: 'Bloqueig Indirecte',
    duration: 10,
    objectives: [
      "Polir la mecànica de preparació de peus ràpids per al llançament triple continuat de Nivel A.",
      "Garantir la qualitat de passada directa amb rosca de canell a les mans altes del tirador.",
      "Establir metes de pressió competitiva: l'equip ha de fer 25 cistelles en 4 minuts de rellotge."
    ],
    description: "Roda ràpida de llançament des de l'exterior fent servir d'esquer un tallador. L'atacant de cantonada corre de fons rep una pantalla indirecta (bloqueig), de canell l'home interior li entrega la pilota netament, i el tirador planta peus en un temps per un Catch & shoot suspès.",
    setupInstructions: "Dues línies de passadors des de l'eix central, dues cantonades on es preparen els receptors que sortiran sota bloqueig de con tàctic per rebre.",
    playersNeeded: 8,
    materials: ['3 Pilotes oficials de bàsquet', 'Cons tàctics'],
    boardState: {
      paths: [
        { id: 'sp-pass', points: [{ x: 50, y: 55 }, { x: 80, y: 72 }], color: '#000000', type: 'dotted' },
        { id: 'sp-run', points: [{ x: 65, y: 85 }, { x: 80, y: 72 }], color: '#000000', type: 'solid' }
      ],
      pins: [
        { id: 'att1', label: 'P1', x: 50, y: 55, type: 'attacker' }, // pasador
        { id: 'att2', label: 'T1', x: 65, y: 85, type: 'attacker' }, // tirador
        { id: 'cone1', label: '▲', x: 70, y: 80, type: 'cone' }, // cono bloqueo
        { id: 'ball', label: '🏀', x: 50, y: 55, type: 'ball' }
      ]
    }
  },
  {
    id: 'drill-junior-transicion-3x2',
    title: '3x2 Continu amb Retorn en 2x1 (Transició d’Alt Nivell)',
    category: 'Atac',
    concept: 'Superioritat 3x2 / 2x1',
    duration: 15,
    objectives: [
      "Treballar la presa de decisions en superioritat numèrica ràpida (3x2 en transició).",
      "Exigir un balanç defensiu ràpid (recuperació Sprint) on el llançador i un atacant addicional repliquen en 2x1 cap a l'altre costat.",
      "Maximitzar la comunicació dels dos defensors establint assignacions de 'Home-Pilota' i 'Home-Cistella'."
    ],
    description: "Exercici clàssic de ritme i transició per a equips Junior de rendiment. Tres atacants inicien un 3x2 a un camp. El jugador que llença (o perd la pilota) i l'atacant més allunyat han de fer balanç defensiu ràpid, convertint-se en defensors. Els dos defensors inicials que agafen el rebot o reben la pilota ataquen ràpidament l'altre cèrcol en un contraatac 2x1 dinamitzat de màxima intensitat.",
    setupInstructions: "Tres files a mitja pista amb pilotes, dos defensors col·locats a la zona de l'altre camp. Es juega el 3 contra 2. Els dos defensors surten atacant en 2 contra 1 contra el tirador que recula a defensar.",
    playersNeeded: 10,
    materials: ['Pilotes de bàsquet (S7)', 'Petos de colors per diferenciar parelles'],
    boardState: {
      courtType: 'full',
      paths: [
        { id: 'path-t1', points: [{ x: 50, y: 40 }, { x: 35, y: 20 }], color: '#f97316', type: 'solid' },
        { id: 'path-t2', points: [{ x: 35, y: 20 }, { x: 15, y: 15 }], color: '#22c55e', type: 'dotted' }
      ],
      pins: [
        { id: 'att1', label: '1', x: 50, y: 45, type: 'attacker' },
        { id: 'att2', label: '2', x: 25, y: 45, type: 'attacker' },
        { id: 'att3', label: '3', x: 75, y: 45, type: 'attacker' },
        { id: 'def1', label: 'D1', x: 35, y: 15, type: 'defender' },
        { id: 'def2', label: 'D2', x: 65, y: 15, type: 'defender' },
        { id: 'ball', label: '🏀', x: 48, y: 45, type: 'ball' }
      ]
    }
  },
  {
    id: 'drill-spacing-junior-spacing',
    title: 'Espaiat de Joc Dinàmic (Spacing) i Reemplaçaments Extra Passe',
    category: 'Atac',
    concept: 'Espaiat i Extra Passe',
    duration: 12,
    objectives: [
      "Interioritzar la rotació de l'espaiat (spacing) d'atac de 4 oberts i 1 a dins (4 Out 1 In).",
      "Puntuar la velocitat del passe en l'extrapasse o inversió ràpida de pilota per desplaçar la defensa zonal.",
      "Exercitar les línies de penetració recta de fons i el reemplaçament dinàmic de línia de passada."
    ],
    description: "Treball fonamental en categoria Júnior per polir el 'drive and kick' (penetrar i descarregar). Jugadors se situen en posicions de base, ràfegues (wings) i cantonades. Quan un jugador d'un costat penetra per línia de fons o eix central, els altres tres han de rotar per oferir línies de passada de seguretat (Safety) i d'extrapasse, assegurant que mai hi ha dos jugadors col·locats en un mateix sector de la pista.",
    setupInstructions: "Col·locar 4 atacants a l'exterior de la línia de tres punts (posicions clares) i 1 defensor fictici que realitza ajudes intencionals sobre les penetracions.",
    playersNeeded: 8,
    materials: ['Pilotes de bàsquet', 'Cons baixos de referència espacial'],
    boardState: {
      paths: [
        { id: 'p-drive', points: [{ x: 15, y: 65 }, { x: 15, y: 85 }], color: '#f97316', type: 'solid' },
        { id: 'p-kick', points: [{ x: 15, y: 85 }, { x: 50, y: 80 }], color: '#3b82f6', type: 'dotted' }
      ],
      pins: [
        { id: 'att1', label: '1', x: 50, y: 55, type: 'attacker' },
        { id: 'att2', label: '2', x: 15, y: 65, type: 'attacker' },
        { id: 'att3', label: '3', x: 85, y: 65, type: 'attacker' },
        { id: 'att4', label: '4', x: 50, y: 80, type: 'attacker' },
        { id: 'def1', label: 'D1', x: 30, y: 75, type: 'defender' },
        { id: 'ball', label: '🏀', x: 18, y: 65, type: 'ball' }
      ]
    }
  },
  {
    id: 'drill-defensa-shell',
    title: 'Roda de Defensa Shell 4x4 (Alineació i Ajudes de la Línia de Passe)',
    category: 'Defensa',
    concept: 'Defensa Shell',
    duration: 15,
    objectives: [
      "Alinear perfectament la defensa segons la posició de la pilota: Línia de Passe (Deny), Ajuda (Help) o Helpin' (pistola).",
      "Coordinar la comunicació verbal col·lectiva cridant 'Pilota!', 'Negació!' i 'Ajuda!'.",
      "Executar relliscades defensives ràpides davant de talls de fons (backdoor cuts) en Júnior de màxim rendiment."
    ],
    description: "L'exercici per excel·lència de l'FCBQ per ensenyar els fonaments col·lectius de la defensa individual. Quatre atacants es passen la pilota des de fora de la línia de tres de forma estàtica, mentre que els quatre defensors es mouen dinàmicament en funció de la pilota. Quan la pilota està a la cantonada, el defensor de l'atacant més distant (costat feble) ha d'estar posicionat dins de la zona (línia d'ajuda), mentre que el defensor de la pilota exerceix pressió de mans actives.",
    setupInstructions: "Posicionar 4 atacants a l'exterior i 4 defensors en posició individual. La pilota es mou en rotació perifèrica per forçar els canvis defensius d'eix de fons.",
    playersNeeded: 8,
    materials: ['Pilotes de joc', 'Petos de fons de contrast extrem'],
    boardState: {
      paths: [
        { id: 'p-slide-1', points: [{ x: 50, y: 65 }, { x: 42, y: 75 }], color: '#ef4444', type: 'solid' },
        { id: 'p-slide-2', points: [{ x: 80, y: 70 }, { x: 60, y: 82 }], color: '#ef4444', type: 'solid' }
      ],
      pins: [
        { id: 'att1', label: '1', x: 50, y: 55, type: 'attacker' },
        { id: 'att2', label: '2', x: 15, y: 65, type: 'attacker' },
        { id: 'att3', label: '3', x: 85, y: 65, type: 'attacker' },
        { id: 'att4', label: '4', x: 50, y: 90, type: 'attacker' },
        { id: 'def1', label: 'D1', x: 50, y: 62, type: 'defender' },
        { id: 'def2', label: 'D2', x: 25, y: 68, type: 'defender' },
        { id: 'def3', label: 'D3', x: 70, y: 72, type: 'defender' },
        { id: 'def4', label: 'D4', x: 50, y: 82, type: 'defender' },
        { id: 'ball', label: '🏀', x: 18, y: 65, type: 'ball' }
      ]
    }
  },
  {
    id: 'drill-dejan-cikic-decisions',
    title: "Roda de Decisions i Passades de Dejan Cikic",
    category: 'Escalfament',
    concept: 'Presa de Decisions',
    duration: 15,
    objectives: [
      "Perfeccionar el passe de beisbol i la recepció en carrera amb pressió de llançament ràpid.",
      "Forçar la presa de decisions instantània davant el moviment defensiu de contenció.",
      "Entrenar la reubicació espacial directa ocupant cantonades i prolongació de lliures."
    ],
    description: "Exercici extret directament dels populars manuals de Dejan Cikic, reconegut coordinator de formació en el bàsquet eslovè. Circuit dinàmic a 2 pilotes de passada contínua on el jugador de l'eix central ha de reaccionar i decidir ràpidament si realitza una penetració explosiva, un passe lateral addicional o un tir en suspensió immediat, tot en funció de l'estímul defensiu fictici o senyal acústic.",
    setupInstructions: "Dividir els jugadors en quatre cantonades de la mitja pista i un pivot de recolzament dinàmic a la línia de tirs lliures per forçar l'extrapasse ràpid.",
    playersNeeded: 10,
    materials: ['Pilotes de bàsquet (S7)', 'Cons de color d’alt contrast'],
    boardState: {
      paths: [
        { id: 'p-cikic-1', points: [{ x: 15, y: 65 }, { x: 50, y: 65 }], color: '#22c55e', type: 'dotted' },
        { id: 'p-cikic-2', points: [{ x: 50, y: 65 }, { x: 80, y: 80 }], color: '#f97316', type: 'solid' }
      ],
      pins: [
        { id: 'att1', label: '1', x: 15, y: 65, type: 'attacker' },
        { id: 'att2', label: '2', x: 50, y: 65, type: 'attacker' },
        { id: 'att3', label: '3', x: 85, y: 80, type: 'attacker' },
        { id: 'def1', label: 'D1', x: 45, y: 72, type: 'defender' },
        { id: 'ball', label: '🏀', x: 18, y: 65, type: 'ball' }
      ]
    }
  },
  {
    id: 'drill-dejan-cikic-spacing',
    title: "Spacing Actiu 3x0 i Reemplaçaments de Fons d’en Dejan Cikic",
    category: 'Atac',
    concept: 'Espaiat Actiu 3x0',
    duration: 12,
    objectives: [
      "Aprendre a desplaçar-se segons el principi fonamental de 'Penetrar i Reemplaçar' de fons.",
      "Dominar els talls d'esquena (backdoor cuts) davant de situacions negatives de pressió agressiva.",
      "Optimitzar el sincronisme de passada generant angles d'anotació molt més nets."
    ],
    description: "Syllabus de formació d'elit dissenyat per Dejan Cikic per a categories Júnior i Cadet. L'exercici educa la sincronia de moviments sin pilota de tres atacants exteriors. Quan un company inicia una penetració forçada fins a línia de fons, la resta reacciona a velocitat de partit per reajustar l'espaiat, oferint línies de passada curtes (safety passes) i extrapasses a l'extrem contrari.",
    setupInstructions: "Tres línies situades a fons oposat, ala dreta de 45 graus, i un organitzador al cap de l'àrea. Moviments ràpids i constants de rotació circular consecutiva.",
    playersNeeded: 9,
    materials: ['Pilotes de joc', 'Cons de marcatge espacial'],
    boardState: {
      paths: [
        { id: 'p-cikic-sp1', points: [{ x: 85, y: 60 }, { x: 85, y: 85 }], color: '#ef4444', type: 'solid' },
        { id: 'p-cikic-sp2', points: [{ x: 50, y: 55 }, { x: 15, y: 75 }], color: '#22c55e', type: 'dotted' }
      ],
      pins: [
        { id: 'att1', label: '1', x: 50, y: 55, type: 'attacker' },
        { id: 'att2', label: '2', x: 85, y: 60, type: 'attacker' },
        { id: 'att3', label: '3', x: 15, y: 75, type: 'attacker' },
        { id: 'ball', label: '🏀', x: 82, y: 60, type: 'ball' }
      ]
    }
  },
  {
    id: 'drill-bojan-cikic-motion',
    title: "Tallades i Reaccions de Tall d'en Bojan Cikic (Motion)",
    category: 'Atac',
    concept: 'Tallades i Motion',
    duration: 15,
    objectives: [
      "Coordinar els talls de fons i vora de zona en situacions de 'Motion'.",
      "Perfeccionar el passe de rebot després de bloqueig cec o 'Backscreen'.",
      "Llegir la posició de l'ajuda defensiva per descarregar ràpidament a la banda contrària."
    ],
    description: "Un exercici de referència dels llibres de Bojan Cikic que perfecciona el llançament i els lliuraments després de passades ràpides. Tres atacants passen la pilota contínuament des de l'exterior de la línia de tres. Al senyal de fons, l'home de la cantonada realitza un tall cec fins a l'eix defensiu. Ha de llegir el desplaçament d'ajuda d'un con o defensor i realitzar un rebot ràpid o extrapasse curtet a l'interior.",
    setupInstructions: "Col·locar 3 atacants i 2 defensors semi-actius. Iniciar el moviment des de l'eix oposat. Passar, tallar a l'espai buit i reemplaçar la línia.",
    playersNeeded: 6,
    materials: ['Pilotes de bàsquet', 'Cons de marcatge', 'Petos de contrast'],
    boardState: {
      paths: [
        { id: 'bc-m1', points: [{ x: 20, y: 75 }, { x: 50, y: 70 }], color: '#f97316', type: 'dotted' },
        { id: 'bc-m2', points: [{ x: 80, y: 75 }, { x: 50, y: 85 }], color: '#22c55e', type: 'solid' }
      ],
      pins: [
        { id: 'att1', label: '1', x: 20, y: 75, type: 'attacker' },
        { id: 'att2', label: '2', x: 80, y: 75, type: 'attacker' },
        { id: 'att3', label: '3', x: 50, y: 60, type: 'attacker' },
        { id: 'def1', label: 'D1', x: 45, y: 70, type: 'defender' },
        { id: 'ball', label: '🏀', x: 23, y: 75, type: 'ball' }
      ]
    },
    boardStates: [
      {
        paths: [
          { id: 'bc-m1', points: [{ x: 20, y: 75 }, { x: 50, y: 70 }], color: '#f97316', type: 'dotted' },
          { id: 'bc-m2', points: [{ x: 80, y: 75 }, { x: 50, y: 85 }], color: '#22c55e', type: 'solid' }
        ],
        pins: [
          { id: 'att1', label: '1', x: 20, y: 75, type: 'attacker' },
          { id: 'att2', label: '2', x: 80, y: 75, type: 'attacker' },
          { id: 'att3', label: '3', x: 50, y: 60, type: 'attacker' },
          { id: 'def1', label: 'D1', x: 45, y: 70, type: 'defender' },
          { id: 'ball', label: '🏀', x: 23, y: 75, type: 'ball' }
        ],
        courtType: 'half'
      },
      {
        paths: [
          { id: 'bc-m3', points: [{ x: 50, y: 85 }, { x: 85, y: 65 }], color: '#ef4444', type: 'dotted' }
        ],
        pins: [
          { id: 'att1', label: '1', x: 50, y: 70, type: 'attacker' },
          { id: 'att2', label: '2', x: 50, y: 85, type: 'attacker' },
          { id: 'att3', label: '3', x: 85, y: 65, type: 'attacker' },
          { id: 'def1', label: 'D1', x: 40, y: 75, type: 'defender' },
          { id: 'ball', label: '🏀', x: 50, y: 85, type: 'ball' }
        ],
        courtType: 'half'
      }
    ]
  },
  {
    id: 'drill-bojan-cikic-trap',
    title: "Pressió de Mans Actives i Trap Frontal d'en Bojan Cikic",
    category: 'Defensa',
    duration: 15,
    objectives: [
      "Establir el parany (Trap) o dos contra un al lateral de la transició.",
      "Optimitzar la posició d'anticipació de l'home de tancament exterior.",
      "Forçar passades bombades molt lentes per assegurar la intercepció defensiva."
    ],
    description: "Exercici intensiu en línia de tota la pista extret dels apunts tàctics de Bojan Cikic. S'entrena la resistència de la pressió i el tancament de línies de sortida. Amb un 4 contra 4 a tota la pista, l'equip defensor ha de forçar que el base rebi en una banda lateral i tancar-lo agressivament realitzant un Trap frontal coordinat per forçar un error de passada.",
    setupInstructions: "Col·locar els equips a camp sencer. L'atacant treu de fons i rep als 2/3 de l'amplada. El defensor de pilota i l'ajuda salten a fer pressió doble.",
    playersNeeded: 8,
    materials: ['Pilotes oficials', 'Petos de contrast'],
    boardState: {
      courtType: 'full',
      paths: [
        { id: 'bc-trap-1', points: [{ x: 50, y: 95 }, { x: 20, y: 85 }], color: '#3b82f6', type: 'dotted' },
        { id: 'bc-trap-2', points: [{ x: 20, y: 85 }, { x: 28, y: 65 }], color: '#ef4444', type: 'solid' }
      ],
      pins: [
        { id: 'att1', label: '1', x: 20, y: 85, type: 'attacker' },
        { id: 'att2', label: '4', x: 50, y: 95, type: 'attacker' },
        { id: 'def1', label: 'D1', x: 18, y: 80, type: 'defender' },
        { id: 'def2', label: 'D2', x: 30, y: 82, type: 'defender' },
        { id: 'ball', label: '🏀', x: 50, y: 95, type: 'ball' }
      ]
    },
    boardStates: [
      {
        paths: [
          { id: 'bc-trap-1', points: [{ x: 50, y: 95 }, { x: 20, y: 85 }], color: '#3b82f6', type: 'dotted' },
          { id: 'bc-trap-2', points: [{ x: 20, y: 85 }, { x: 28, y: 65 }], color: '#ef4444', type: 'solid' }
        ],
        pins: [
          { id: 'att1', label: '1', x: 20, y: 85, type: 'attacker' },
          { id: 'att2', label: '4', x: 50, y: 95, type: 'attacker' },
          { id: 'def1', label: 'D1', x: 18, y: 80, type: 'defender' },
          { id: 'def2', label: 'D2', x: 30, y: 82, type: 'defender' },
          { id: 'ball', label: '🏀', x: 50, y: 95, type: 'ball' }
        ],
        courtType: 'full'
      },
      {
        paths: [
          { id: 'bc-trap-3', points: [{ x: 28, y: 65 }, { x: 60, y: 40 }], color: '#ef4444', type: 'dotted' }
        ],
        pins: [
          { id: 'att1', label: '1', x: 28, y: 65, type: 'attacker' },
          { id: 'att2', label: '4', x: 22, y: 70, type: 'attacker' },
          { id: 'def1', label: 'D1', x: 26, y: 60, type: 'defender' },
          { id: 'def2', label: 'D2', x: 34, y: 62, type: 'defender' },
          { id: 'ball', label: '🏀', x: 28, y: 65, type: 'ball' }
        ],
        courtType: 'full'
      }
    ]
  }
];

interface DrillDatabaseProps {
  drills: Drill[];
  onAddDrill: (drill: Drill) => void;
  onEditDrill: (drill: Drill) => void;
  onDeleteDrill: (drillId: string) => void;
  triggerToast?: (msg: string) => void;
  favoriteDrillIds?: string[];
  onToggleFavorite?: (drillId: string) => void;
}

export default function DrillDatabase({ 
  drills, 
  onAddDrill, 
  onEditDrill, 
  onDeleteDrill, 
  triggerToast,
  favoriteDrillIds = [],
  onToggleFavorite
}: DrillDatabaseProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | 'Favoritos' | 'Defensa' | 'Atac' | 'Escalfament'>('Todos');
  const [isEditing, setIsEditing] = useState(false);
  const [editDrillId, setEditDrillId] = useState<string | null>(null);
  const [drillToDelete, setDrillToDelete] = useState<Drill | null>(null);

  // IA analyzing image states
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedDrillForOverlay, setSelectedDrillForOverlay] = useState<Drill | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DrillCategory>('Atac');
  const [concept, setConcept] = useState('');
  const [duration, setDuration] = useState(15);
  const [objectivesString, setObjectivesString] = useState('');
  const [description, setDescription] = useState('');
  const [setupInstructions, setSetupInstructions] = useState('');
  const [playersNeeded, setPlayersNeeded] = useState(8);
  const [materialsString, setMaterialsString] = useState('');
  const [boardState, setBoardState] = useState<BoardState>({ paths: [], pins: [] });
  const [boardStates, setBoardStates] = useState<BoardState[]>([{ paths: [], pins: [] }]);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);

  // Mobile pairing status
  const [pairingCode] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [isPollingMobile] = useState(true);

  // Modular helper to process raw image uploads from both local input AND mobile phone
  const analyzeImageContent = async (base64String: string, mimeType: string) => {
    setAnalyzing(true);
    if (triggerToast) {
      triggerToast("⏳ Enllestint l'anàlisi de la imatge de l'exercici amb Gemini...");
    }

    try {
      const res = await fetch('/api/analyze-drill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64String,
          mimeType: mimeType
        })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Sense resposta del servidor d’intel·ligència artificial.');
      }
      
      const data = await res.json();
      if (data.drill) {
        setTitle(data.drill.title || '');
        setCategory(data.drill.category || 'Atac');
        setConcept(data.drill.concept || '');
        setDuration(data.drill.duration || 15);
        setObjectivesString(Array.isArray(data.drill.objectives) ? data.drill.objectives.join('\n') : '');
        setDescription(data.drill.description || '');
        setSetupInstructions(data.drill.setupInstructions || '');
        setPlayersNeeded(data.drill.playersNeeded || 8);
        setMaterialsString(Array.isArray(data.drill.materials) ? data.drill.materials.join(', ') : '');
        
        const bState = data.drill.boardState || { paths: [], pins: [] };
        const bStates = data.drill.boardStates && data.drill.boardStates.length > 0
          ? data.drill.boardStates
          : [bState];

        setBoardState(bState);
        setBoardStates(bStates);
        setActivePhaseIndex(0);

        if (triggerToast) {
          triggerToast("✨ S'ha importat correctament l'exercici gràcies a l'anàlisi de la imatge!");
        }
      } else {
        throw new Error('No es va rebre cap estructura d’exercici vàlida.');
      }
    } catch (innerErr: any) {
      console.error("Error processant resposta d'anàlisi:", innerErr);
      if (triggerToast) {
        triggerToast("💥 Error formatant: " + (innerErr.message || innerErr));
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // Poll for mobile photo upload corresponding with pairingCode in real-time
  useEffect(() => {
    if (isEditing || !isPollingMobile || analyzing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/check-mobile-upload?code=${pairingCode}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'found' && data.image) {
            if (data.drill) {
              if (triggerToast) {
                triggerToast("📱 S'ha importat instantàniament l'exercici digitalitzat des del mòbil amb èxit!");
              }
              // Set state fields directly
              setTitle(data.drill.title || '');
              setCategory(data.drill.category || 'Atac');
              setConcept(data.drill.concept || '');
              setDuration(data.drill.duration || 15);
              setObjectivesString(Array.isArray(data.drill.objectives) ? data.drill.objectives.join('\n') : '');
              setDescription(data.drill.description || '');
              setSetupInstructions(data.drill.setupInstructions || '');
              setPlayersNeeded(data.drill.playersNeeded || 8);
              setMaterialsString(Array.isArray(data.drill.materials) ? data.drill.materials.join(', ') : '');
              
              const bState = data.drill.boardState || { paths: [], pins: [] };
              const bStates = data.drill.boardStates && data.drill.boardStates.length > 0
                ? data.drill.boardStates
                : [bState];

              setBoardState(bState);
              setBoardStates(bStates);
              setActivePhaseIndex(0);
            } else {
              if (triggerToast) {
                triggerToast("📱 S'ha detectat la fotografia enviada des del mòbil! Analitzant amb Gemini...");
              }
              await analyzeImageContent(data.image, data.mimeType || 'image/jpeg');
            }
          }
        }
      } catch (err) {
        console.error("Error polling mobile upload list:", err);
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [pairingCode, isEditing, isPollingMobile, analyzing]);

  const handleCloneDrill = (drill: Drill) => {
    try {
      const clonedDrill: Drill = {
        ...JSON.parse(JSON.stringify(drill)),
        id: `drill-cloned-${Date.now()}`,
        title: `${drill.title} (Còpia)`
      };
      onAddDrill(clonedDrill);
      if (triggerToast) {
        triggerToast(`S'ha clonat l'exercici "${drill.title}" de la biblioteca!`);
      }
    } catch (e) {
      console.error(e);
      if (triggerToast) triggerToast("No s'ha pogut duplicar l'exercici.");
    }
  };

  const handleImageUploaded = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (triggerToast) {
        triggerToast("⚡ Reduint mida de la imatge i optimitzant resolució...");
      }
      const { base64Data, mimeType } = await compressAndResizeImage(file, 1200);
      await analyzeImageContent(base64Data, mimeType);
    } catch (err: any) {
      console.error(err);
      if (triggerToast) {
        triggerToast("⚠️ Error en carregar l'arxiu d'imatge de l'exercici.");
      }
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('Atac');
    setConcept('');
    setDuration(15);
    setObjectivesString('');
    setDescription('');
    setSetupInstructions('');
    setPlayersNeeded(8);
    setMaterialsString('');
    setBoardState({ paths: [], pins: [] });
    setBoardStates([{ paths: [], pins: [] }]);
    setActivePhaseIndex(0);
    setIsEditing(false);
    setEditDrillId(null);
  };

  const handleEditClick = (drill: Drill) => {
    setIsEditing(true);
    setEditDrillId(drill.id);
    setTitle(drill.title);
    setCategory(drill.category);
    setConcept(drill.concept || '');
    setDuration(drill.duration);
    setObjectivesString(drill.objectives.join('\n'));
    setDescription(drill.description);
    setSetupInstructions(drill.setupInstructions || '');
    setPlayersNeeded(drill.playersNeeded || 8);
    setMaterialsString(drill.materials.join(', '));
    setBoardState(drill.boardState || { paths: [], pins: [] });
    const initialStates = drill.boardStates && drill.boardStates.length > 0 
      ? drill.boardStates 
      : [drill.boardState || { paths: [], pins: [] }];
    setBoardStates(initialStates);
    setActivePhaseIndex(0);
    
    // Smooth scroll to top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert('Por favor ingresa un título para el ejercicio');

    const cleanObjectives = objectivesString
      .split('\n')
      .map(o => o.trim())
      .filter(o => o.length > 0);

    const cleanMaterials = materialsString
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);

    const drillData: Drill = {
      id: editDrillId || `drill-${Date.now()}`,
      title,
      category,
      concept: concept.trim() || undefined,
      duration: Number(duration),
      objectives: cleanObjectives.length > 0 ? cleanObjectives : ['Mejorar conceptos de baloncesto'],
      description,
      setupInstructions,
      playersNeeded: Number(playersNeeded),
      materials: cleanMaterials,
      boardState: boardStates[0] || boardState,
      boardStates: boardStates,
      isCustom: true
    };

    if (editDrillId) {
      onEditDrill(drillData);
    } else {
      onAddDrill(drillData);
    }

    resetForm();
  };

  // Filters
  const filteredDrills = drills.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.description.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'Favoritos') {
      return matchesSearch && favoriteDrillIds.includes(d.id);
    }
    if (selectedCategory === 'Defensa') {
      return matchesSearch && d.category === 'Defensa';
    }
    if (selectedCategory === 'Escalfament') {
      return matchesSearch && d.category === 'Escalfament';
    }
    if (selectedCategory === 'Atac') {
      return matchesSearch && d.category === 'Atac';
    }
    return matchesSearch; // 'Todos'
  });

  return (
    <div id="drill-database-view" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT: Drill Creator / Editor Form (5 columns) - Reskinned with sharp-geometry style */}
      <div id="drill-creator-panel" className="lg:col-span-5 bg-white border border-slate-200 rounded-sm p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-wide">
            <BookOpen className="text-orange-500" size={18} />
            {isEditing ? 'EDITAR EXERCICI' : 'CREAR EXERCICI MANUAL'}
          </h2>
          {isEditing && (
            <button
              id="btn-cancel-edit"
              onClick={resetForm}
              className="text-[10px] px-2.5 py-1.5 rounded-sm bg-slate-950 text-white hover:bg-slate-800 transition font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <Undo2 size={12} /> Cancel·la
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nom de l'Exercici *</label>
            <input
              id="form-drill-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Contraatac continu 3 contra 2"
              className="w-full px-3 py-2 border border-slate-250 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
              <span>Anotació Tàctica / Concepte</span>
              <span className="text-[8px] text-slate-400 font-normal">Ex: Pick & Roll, Bloqueig Indirecte, Defensa Zonal, Atac 1x1...</span>
            </label>
            <input
              id="form-drill-concept"
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ex: Pick & Roll"
              className="w-full px-3 py-2 border border-slate-250 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Categoria</label>
              <select
                id="form-drill-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as DrillCategory)}
                className="w-full px-3 py-2 border border-slate-250 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition bg-white font-medium"
              >
                <option value="Atac">Atac</option>
                <option value="Defensa">Defensa</option>
                <option value="Escalfament">Escalfament</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duració (Mins)</label>
              <input
                id="form-drill-duration"
                type="number"
                min="1"
                max="75"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-250 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
              />
            </div>
          </div>

          {/* Drills drawing canvas with Multi-Graphic capability */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-between">
              <span>CROQUIS TÀCTIC (MULTIGRAFISME DE PISTA)</span>
              <span className="text-[9px] text-orange-600 bg-orange-50 font-semibold px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                <Sparkles size={11} className="text-orange-500 animate-pulse" /> Suporta múltiples fases per exercits complexos!
              </span>
            </label>

            {/* Phase Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 border border-slate-200 rounded">
              {boardStates.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhaseIndex(idx)}
                  className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-sm cursor-pointer transition ${
                    activePhaseIndex === idx
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Grafisme {idx + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  const currentBS = boardStates[activePhaseIndex] || { paths: [], pins: [] };
                  // Clone pins of current board state to make drawing successive phases extremely easy
                  const clonedBS: BoardState = {
                    paths: [], // Start with fresh paths so they don't overlap, but keep play position
                    pins: JSON.parse(JSON.stringify(currentBS.pins)),
                    courtType: currentBS.courtType || 'half'
                  };
                  setBoardStates([...boardStates, clonedBS]);
                  setActivePhaseIndex(boardStates.length);
                  if (triggerToast) triggerToast(`Grafisme ${boardStates.length + 1} afegit amb èxit.`);
                }}
                className="px-2.5 py-1 bg-slate-800 text-white hover:bg-slate-900 rounded-sm text-[10px] font-black uppercase tracking-wider ml-auto cursor-pointer"
              >
                + Afegir Grafisme
              </button>
              {boardStates.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Vols eliminar aquest grafisme de la llista d\'esquemes?')) {
                      const updated = boardStates.filter((_, i) => i !== activePhaseIndex);
                      setBoardStates(updated);
                      setActivePhaseIndex(Math.max(0, activePhaseIndex - 1));
                      if (triggerToast) triggerToast('S\'ha eliminat el grafisme actiu.');
                    }
                  }}
                  className="px-2.5 py-1 bg-red-650 hover:bg-red-750 text-white rounded-sm text-[10px] font-black uppercase tracking-wider cursor-pointer"
                >
                  ✘ Eliminar Grafisme
                </button>
              )}
            </div>

            {/* Mini board view */}
            <div className="bg-white p-1 border border-slate-200 rounded">
              <TacticalBoard
                boardState={boardStates[activePhaseIndex] || { paths: [], pins: [] }}
                onChange={(newBS) => {
                  const updated = [...boardStates];
                  updated[activePhaseIndex] = newBS;
                  setBoardStates(updated);
                  if (activePhaseIndex === 0) {
                    setBoardState(newBS);
                  }
                }}
              />
            </div>
            <p className="text-[10px] text-slate-450 italic leading-tight">
              Afegeix els grafismes que vulguis per seqüenciar de principi a fi el joc! Cada grafisme guarda els seus propis camins i xips.
            </p>
          </div>

          {/* LLEGIR EXERCICI DES D'IMATGE (IA) - PLACED DIRECTLY BELOW THE GRAPHICS CONTAINER AS REQUESTED */}
          {!isEditing && (
            <div className="p-4 bg-orange-50/50 border border-orange-200/60 rounded-lg space-y-2 mt-4 text-center">
              <div className="flex items-center justify-center gap-2 text-xs font-black text-orange-800 uppercase tracking-wider">
                <Sparkles size={15} className="text-orange-500 animate-pulse" />
                <span>Escàner de Pissarres amb IA</span>
              </div>
              
              <p className="text-[11px] text-slate-600 leading-relaxed max-w-md mx-auto">
                Per passar amb fotografia el teu grafisme i digitalitzar automàticament qualsevol exercici, utilitza la nova opció unificada de la barra superior del menú principal: <strong className="text-orange-700">📸 Escàner IA</strong>.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jugadors Req.</label>
              <input
                id="form-drill-players"
                type="number"
                min="1"
                value={playersNeeded}
                onChange={(e) => setPlayersNeeded(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-250 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Materials</label>
              <input
                id="form-drill-materials"
                type="text"
                value={materialsString}
                onChange={(e) => setMaterialsString(e.target.value)}
                placeholder="Pilotes, Cons, Petos"
                className="w-full px-3 py-2 border border-slate-250 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Objectius de l'Exercici (Un per línia)</label>
            <textarea
              id="form-drill-objectives"
              rows={2}
              value={objectivesString}
              onChange={(e) => setObjectivesString(e.target.value)}
              placeholder="Ex: Treballar contraatac 3v2&#13;Evitar bots innecessaris&#13;Balanç defensiu ràpid"
              className="w-full px-3 py-2 border border-slate-250 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition font-sans resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripció / Dinàmica</label>
            <textarea
              id="form-drill-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica com es rota, els espais de passada..."
              className="w-full px-3 py-2 border border-slate-250 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition resize-none font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Anotacions tàctiques de Pista</label>
            <input
              id="form-drill-setup"
              type="text"
              value={setupInstructions}
              onChange={(e) => setSetupInstructions(e.target.value)}
              placeholder="Ex: Defensor no roba fins a línia de tres"
              className="w-full px-3 py-2 border border-slate-250 rounded-sm text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
            />
          </div>

          <button
            id="btn-submit-drill"
            type="submit"
            className="w-full py-3 px-4 rounded-sm text-xs font-black uppercase tracking-widest text-white bg-slate-900 hover:bg-slate-800 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Plus size={16} />
            {isEditing ? 'Desar Canvis' : 'Afegir a Biblioteca'}
          </button>
        </form>
      </div>

      {/* RIGHT: List of Available Drills (7 columns) */}
      <div id="drill-list-panel" className="lg:col-span-7 space-y-5">
        
        {/* Dynamic Filtering Toolbar */}
        <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="relative w-full md:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450">
              <Search size={14} />
            </span>
            <input
              id="input-drill-search"
              type="text"
              placeholder="Cerca exercicis en català..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-250 rounded-sm focus:outline-none focus:ring-1 focus:ring-orange-500 bg-slate-50 font-medium"
            />
          </div>

          {/* Category Chips Horizontal bar */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto overflow-x-auto select-none no-scrollbar">
            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mr-1 flex items-center gap-1">
              <Filter size={11} />
              Filtrar:
            </span>
            {(['Todos', 'Favoritos', 'Defensa', 'Atac', 'Escalfament'] as const).map((cat) => (
              <button
                id={`chip-${cat}`}
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                type="button"
                className={`px-2.5 py-1.5 rounded-none text-[9px] font-black uppercase tracking-wider transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white border border-slate-900'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat === 'Todos' ? 'TOTS' : cat === 'Favoritos' ? '⭐ FAVORITS' : cat === 'Defensa' ? 'DEFENSA' : cat === 'Atac' ? 'ATAC' : 'ESCALFAMENT'}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises Loop list count */}
        <div className="text-[10px] text-slate-400 font-extrabold font-mono uppercase tracking-widest pl-1">
          Mostrant {filteredDrills.length} de {drills.length} exercicis a la llista
        </div>

        {/* Drill Cards */}
        <div id="drills-scrollable-container" className="space-y-4 max-h-[750px] overflow-y-auto pr-1">
          {filteredDrills.length === 0 ? (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-sm">
              <BookOpen size={44} className="text-slate-300 mx-auto mb-2.5" />
              <p className="text-slate-705 font-bold uppercase text-sm">No s’han trobat exercicis</p>
              <p className="text-slate-400 text-xs mt-1">Crea un manual nou a la finestreta esquerra.</p>
            </div>
          ) : (
            filteredDrills.map((drill) => (
              <div
                id={`drill-card-${drill.id}`}
                key={drill.id}
                className="bg-white border border-slate-200 rounded-sm hover:border-orange-400 transition p-3 md:p-5 flex flex-row md:flex-row gap-3 md:gap-5 group items-start"
              >
                {/* Micro diagram static render or thumbnail */}
                <div className="w-20 h-20 md:w-44 md:h-auto bg-white border border-slate-200 rounded shadow-sm overflow-hidden shrink-0 p-0.5 md:p-1 relative hover:shadow-xs transition duration-150">
                  <TacticalBoard boardState={drill.boardState || { paths: [], pins: [] }} onChange={() => {}} readOnly={true} />
                  {drill.boardStates && drill.boardStates.length > 1 && (
                    <div className="absolute bottom-1.5 right-1.5 bg-orange-600/90 text-[8px] text-white font-extrabold uppercase px-1.5 py-0.5 rounded tracking-widest font-mono">
                      {drill.boardStates.length} Grafismes
                    </div>
                  )}
                </div>

                {/* Drill written Details info panel */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-wider ${
                          drill.category === 'Atac' ? 'bg-orange-100 text-orange-850' :
                          drill.category === 'Defensa' ? 'bg-rose-100 text-rose-850' : 'bg-emerald-100 text-emerald-850'
                        }`}>
                          {drill.category}
                        </span>
                        {drill.concept && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[8.5px] font-black uppercase tracking-wider">
                            {drill.concept}
                          </span>
                        )}
                      </div>
                      <h3 
                        onClick={() => setSelectedDrillForOverlay(drill)}
                        title="Clica per veure el gràfic tàctic ampliat"
                        className="text-sm font-black text-slate-800 mt-1 uppercase tracking-tight group-hover:text-orange-600 hover:underline cursor-pointer transition-colors"
                      >
                        {drill.title}
                      </h3>
                    </div>

                     {/* Card action controls */}
                    <div className="flex items-center gap-1.5 shrink-0 select-none">
                      <button
                        id={`btn-fav-drill-${drill.id}`}
                        onClick={() => onToggleFavorite && onToggleFavorite(drill.id)}
                        title={favoriteDrillIds.includes(drill.id) ? "Treure de preferits" : "Afegir a preferits"}
                        className={`p-2 rounded-sm transition cursor-pointer border border-transparent ${
                          favoriteDrillIds.includes(drill.id)
                            ? 'bg-amber-50 text-amber-500 hover:text-amber-600 hover:bg-amber-100 border-amber-200'
                            : 'hover:bg-amber-50 text-slate-400 hover:text-amber-500 hover:border-amber-200'
                        }`}
                      >
                        <Star size={14} fill={favoriteDrillIds.includes(drill.id) ? "currentColor" : "none"} />
                      </button>
                      <button
                        id={`btn-clone-drill-${drill.id}`}
                        onClick={() => handleCloneDrill(drill)}
                        title="Duplicar / Clonar exercici"
                        className="p-2 rounded-sm hover:bg-orange-50 text-slate-400 hover:text-orange-600 transition cursor-pointer border border-transparent hover:border-orange-200"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        id={`btn-edit-drill-${drill.id}`}
                        onClick={() => handleEditClick(drill)}
                        title="Modificar exercici"
                        className="p-2 rounded-sm hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition cursor-pointer border border-transparent hover:border-slate-300"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        id={`btn-delete-drill-${drill.id}`}
                        onClick={() => setDrillToDelete(drill)}
                        title="Esborrar de la biblioteca"
                        className="p-2 rounded-sm hover:bg-rose-50 text-slate-400 hover:text-red-700 transition cursor-pointer border border-transparent hover:border-rose-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed font-medium line-clamp-3">
                    {drill.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Clock size={12} className="text-slate-400" />
                      {drill.duration} Mins
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <Users size={12} className="text-slate-400" />
                      {drill.playersNeeded || 'X'} Jugadors
                    </span>
                    {drill.materials.length > 0 && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Wrench size={12} className="text-slate-400" />
                        {drill.materials.slice(0, 2).join(', ')}
                        {drill.materials.length > 2 ? '...' : ''}
                      </span>
                    )}
                  </div>

                  {/* Bullet point objective highlights */}
                  {drill.objectives && drill.objectives.length > 0 && (
                    <div className="border-t border-slate-200 pt-2.5 mt-2">
                      <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase block mb-1">OBJECTIUS DE PISTA:</span>
                      <ul className="space-y-1 text-xs text-slate-600 font-medium">
                        {drill.objectives.slice(0, 2).map((obj, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5 font-bold" />
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* DETALL D'EXERCICI (SITUACIÓ QUADERN DE PISTA REALST) */}
      {selectedDrillForOverlay && (
        <DrillManualBooklet 
          drill={selectedDrillForOverlay} 
          onClose={() => setSelectedDrillForOverlay(null)} 
        />
      )}

      {/* CUSTOM CONFIRMATION DIALOG FOR DRILL DELETION */}
      {drillToDelete && (
        <div className="fixed inset-0 bg-slate-950/75 flex items-center justify-center p-4 z-50 backdrop-blur-xs select-none">
          <div className="bg-white border border-slate-105 rounded-3xl shadow-2xl p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Trash2 size={24} />
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Esborrar Exercici?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Estàs segur que vols eliminar permanentment l'exercici <strong className="text-slate-800">"{drillToDelete.title}"</strong> de la biblioteca de l'equip?
              </p>
              <div className="text-[10px] text-red-650 font-bold bg-amber-50/50 border border-amber-200 p-2.5 rounded-xl text-left">
                ⚠️ Aquesta acció és irreversible i el traurà automàticament de qualsevol sessió d'entrenament on estigui programat.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onDeleteDrill(drillToDelete.id);
                  setDrillToDelete(null);
                  if (triggerToast) {
                    triggerToast(`🗑️ S'ha eliminat "${drillToDelete.title}" de la biblioteca.`);
                  }
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Sí, esborrar
              </button>
              <button
                type="button"
                onClick={() => setDrillToDelete(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Cancel·lar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
