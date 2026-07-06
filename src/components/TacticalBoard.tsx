import React, { useRef, useState, useEffect } from 'react';
import { 
  Brush, 
  Move, 
  RotateCcw, 
  Trash2, 
  Undo,
  Circle,
  PlaySquare,
  Sparkles,
  Eraser
} from 'lucide-react';
import { BoardState, BoardPin, BoardPath } from '../types';

function getZigzagPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  
  const resampled: {x: number, y: number, nx: number, ny: number}[] = [];
  let accumulatedDist = 0;
  let nextTarget = 0;
  const step = 1.2; // Wave width
  const amplitude = 0.6; // Wave peak altitude (bote zig-zag)
  
  resampled.push({
    x: points[0].x,
    y: points[0].y,
    nx: 0,
    ny: 0
  });
  
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) continue;
    
    let segmentProgress = 0;
    while (accumulatedDist + (dist - segmentProgress) >= nextTarget) {
      const needed = nextTarget - accumulatedDist;
      const t = needed / dist;
      const x = p1.x * (1 - t) + p2.x * t;
      const y = p1.y * (1 - t) + p2.y * t;
      
      const nx = -dy / dist;
      const ny = dx / dist;
      
      resampled.push({ x, y, nx, ny });
      nextTarget += step;
    }
    accumulatedDist += dist;
  }
  
  const lastPt = points[points.length - 1];
  resampled.push({ x: lastPt.x, y: lastPt.y, nx: 0, ny: 0 });
  
  if (resampled.length < 2) return '';
  
  let d = `M ${resampled[0].x} ${resampled[0].y}`;
  for (let j = 1; j < resampled.length - 1; j++) {
    const r = resampled[j];
    const sign = (j % 2 === 0) ? 1 : -1;
    const zx = r.x + r.nx * amplitude * sign;
    const zy = r.y + r.ny * amplitude * sign;
    d += ` L ${zx} ${zy}`;
  }
  const last = resampled[resampled.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

interface TacticalBoardProps {
  boardState: BoardState;
  onChange: (newState: BoardState) => void;
  readOnly?: boolean;
}

const DEFAULT_PINS: BoardPin[] = [
  // Attackers (O1 - O5)
  { id: 'att1', label: '1', x: 50, y: 88, type: 'attacker' },
  { id: 'att2', label: '2', x: 20, y: 75, type: 'attacker' },
  { id: 'att3', label: '3', x: 80, y: 75, type: 'attacker' },
  { id: 'att4', label: '4', x: 30, y: 60, type: 'attacker' },
  { id: 'att5', label: '5', x: 70, y: 60, type: 'attacker' },
  // Defenders (X1 - X5)
  { id: 'def1', label: '1', x: 50, y: 80, type: 'defender' },
  { id: 'def2', label: '2', x: 25, y: 70, type: 'defender' },
  { id: 'def3', label: '3', x: 75, y: 70, type: 'defender' },
  { id: 'def4', label: '4', x: 35, y: 55, type: 'defender' },
  { id: 'def5', label: '5', x: 65, y: 55, type: 'defender' },
  // Balls - Pre-populate 3 balls so the user can easily map multi-ball exercises
  { id: 'ball', label: '🏀', x: 47, y: 84, type: 'ball' },
  { id: 'ball2', label: '🏀', x: 50, y: 84, type: 'ball' },
  { id: 'ball3', label: '🏀', x: 53, y: 84, type: 'ball' },
  // Cones
  { id: 'cone1', label: '▲', x: 15, y: 50, type: 'cone' },
  { id: 'cone2', label: '▲', x: 85, y: 50, type: 'cone' },
];

export default function TacticalBoard({ boardState, onChange, readOnly = false }: TacticalBoardProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [boardType, setBoardType] = useState<'half' | 'full'>(boardState?.courtType || 'half');
  const [mode, setMode] = useState<'move' | 'draw_pass' | 'draw_cut' | 'draw_run' | 'draw_dribble' | 'eraser'>('move');
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<BoardPath | null>(null);
  const [pathToDeleteId, setPathToDeleteId] = useState<string | null>(null);
  
  const isDraggingRef = useRef(false);

  useEffect(() => {
    isDraggingRef.current = activePinId !== null;
  }, [activePinId]);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setSelectedPinId(null);
    }
  }, [boardState]);

  // States for touch-based zoom & pan on mobile/desktop
  const [zoom, setZoom] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  const touchStartRef = useRef<{
    distance: number;
    centerX: number;
    centerY: number;
    panX: number;
    panY: number;
    zoom: number;
  } | null>(null);

  const handleTouchStartCustom = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;
      
      touchStartRef.current = {
        distance: dist,
        centerX,
        centerY,
        panX,
        panY,
        zoom
      };
    } else if (e.touches.length === 1 && zoom > 1 && mode === 'move' && !activePinId) {
      const t = e.touches[0];
      touchStartRef.current = {
        distance: 0,
        centerX: t.clientX,
        centerY: t.clientY,
        panX,
        panY,
        zoom
      };
    }
  };

  const handleTouchMoveCustom = (e: React.TouchEvent<SVGSVGElement> | TouchEvent) => {
    const touches = 'touches' in e ? e.touches : [];
    if (touches.length === 2 && touchStartRef.current) {
      e.preventDefault();
      const t1 = touches[0];
      const t2 = touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;

      const scaleChange = dist / touchStartRef.current.distance;
      const newZoom = Math.max(1, Math.min(4, touchStartRef.current.zoom * scaleChange));
      
      const dx = centerX - touchStartRef.current.centerX;
      const dy = centerY - touchStartRef.current.centerY;
      
      setZoom(newZoom);
      const maxPan = 100 * (newZoom - 1);
      setPanX(Math.max(-maxPan, Math.min(maxPan, touchStartRef.current.panX + dx)));
      setPanY(Math.max(-maxPan, Math.min(maxPan, touchStartRef.current.panY + dy)));
    } else if (touches.length === 1 && zoom > 1 && touchStartRef.current && mode === 'move' && !activePinId) {
      e.preventDefault();
      const t = touches[0];
      const dx = t.clientX - touchStartRef.current.centerX;
      const dy = t.clientY - touchStartRef.current.centerY;
      
      const maxPan = 100 * (zoom - 1);
      setPanX(Math.max(-maxPan, Math.min(maxPan, touchStartRef.current.panX + dx)));
      setPanY(Math.max(-maxPan, Math.min(maxPan, touchStartRef.current.panY + dy)));
    }
  };

  // Sync boardType with incoming boardState
  useEffect(() => {
    if (boardState?.courtType && boardState.courtType !== boardType) {
      setBoardType(boardState.courtType);
    }
  }, [boardState?.courtType]);

  const pins = boardState.pins || DEFAULT_PINS;
  const paths = boardState.paths || [];

  const updateBoard = (update: Partial<BoardState>) => {
    onChange({
      paths: update.paths !== undefined ? update.paths : paths,
      pins: update.pins !== undefined ? update.pins : pins,
      courtType: update.courtType !== undefined ? update.courtType : boardType
    });
  };

  // Initialize pins if empty
  useEffect(() => {
    if (!boardState.pins || boardState.pins.length === 0) {
      onChange({
        paths: boardState.paths || [],
        pins: DEFAULT_PINS,
        courtType: boardState.courtType || 'half'
      });
    }
  }, [boardState, onChange]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as MouseEvent).clientX;
      clientY = (e as MouseEvent).clientY;
    }
    
    const pctX = (clientX - rect.left) / rect.width;
    const pctY = (clientY - rect.top) / rect.height;
    
    let x = pctX * 100;
    let y = 0;
    
    if (boardType === 'full') {
      y = pctY * 100;
    } else {
      y = 48 + pctY * 52;
    }
    
    const minCalculatedY = boardType === 'full' ? 0 : 48;
    
    return { 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(minCalculatedY, Math.min(100, y)) 
    };
  };

  // Handling drawing / dragging
  const handleStart = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>, targetPinId?: string) => {
    if (readOnly) return;
    
    // Guard against multiple touches (pinch to zoom)
    if ('touches' in e && e.touches.length > 1) {
      return;
    }
    
    // Guard against single finger panning when zoomed in and not dragging a specific pin
    if ('touches' in e && e.touches.length === 1 && zoom > 1 && mode === 'move' && !targetPinId) {
      return;
    }

    const coords = getCoordinates(e);
    if (!coords) return;

    if (mode === 'eraser') {
      if (targetPinId) {
        e.stopPropagation();
        const updatedPins = pins.filter(pin => pin.id !== targetPinId);
        const finalPins = updatedPins.map(pin => 
          pin.type === 'ball' && pin.anchoredTo === targetPinId 
            ? { ...pin, anchoredTo: undefined } 
            : pin
        );
        updateBoard({ pins: finalPins });
      }
      return;
    }

    if (mode === 'move') {
      if (targetPinId) {
        e.stopPropagation();
        setActivePinId(targetPinId);
        setSelectedPinId(targetPinId);
      } else {
        setSelectedPinId(null);
      }
    } else {
      // Drawing mode
      e.preventDefault();
      let color = '#000000'; // Black for official Catalan tactical manual
      let type: 'solid' | 'dashed' | 'dotted' | 'zigzag' = 'solid';

      if (mode === 'draw_pass') {
        type = 'dotted';
      } else if (mode === 'draw_run') {
        type = 'dashed';
      } else if (mode === 'draw_dribble') {
        type = 'zigzag';
      }

      const newPath: BoardPath = {
        id: crypto.randomUUID(),
        points: [coords],
        color,
        type
      };
      setCurrentPath(newPath);
    }
  };

  const handleMove = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement> | MouseEvent | TouchEvent) => {
    if (readOnly) return;
    
    // Guard against multiple touches (pinch to zoom)
    if ('touches' in e && e.touches.length > 1) {
      return;
    }
    
    // Guard against single finger panning when zoomed in and not dragging a pin
    if ('touches' in e && e.touches.length === 1 && zoom > 1 && mode === 'move' && !activePinId) {
      return;
    }
    
    if (activePinId && mode === 'move') {
      const coords = getCoordinates(e);
      if (!coords) return;
      
      const updatedPins = pins.map(p => {
        if (p.id === activePinId) {
          if (p.type === 'ball') {
            return { ...p, x: coords.x, y: coords.y, anchoredTo: undefined };
          }
          return { ...p, x: coords.x, y: coords.y };
        }
        // If this is the ball and it is anchored to the currently dragged player, move it too!
        if (p.type === 'ball' && p.anchoredTo === activePinId) {
          return { ...p, x: coords.x, y: coords.y };
        }
        return p;
      });
      updateBoard({ pins: updatedPins });
    } else if (currentPath) {
      const coords = getCoordinates(e);
      if (!coords) return;

      // Avoid adding duplicate points
      const lastPoint = currentPath.points[currentPath.points.length - 1];
      const dist = lastPoint ? Math.hypot(coords.x - lastPoint.x, coords.y - lastPoint.y) : 999;
      
      if (dist > 1.5) {
        const updatedPath = {
          ...currentPath,
          points: [...currentPath.points, coords]
        };
        setCurrentPath(updatedPath);
      }
    }
  };

  const handleEnd = () => {
    if (activePinId) {
      const draggedPin = pins.find(p => p.id === activePinId);
      let updatedPins = [...pins];

      if (draggedPin) {
        if (draggedPin.type === 'ball') {
          // Find nearest player (attacker or defender) within snapping range
          let nearestPlayer: BoardPin | null = null;
          let minDist = 6.0;

          pins.forEach(p => {
            if (p.type === 'attacker' || p.type === 'defender') {
              const d = Math.hypot(p.x - draggedPin.x, p.y - draggedPin.y);
              if (d < minDist) {
                minDist = d;
                nearestPlayer = p;
              }
            }
          });

          if (nearestPlayer) {
            // Anchor ball to nearest player!
            updatedPins = pins.map(p => 
              p.id === draggedPin.id 
                ? { ...p, x: (nearestPlayer as BoardPin).x, y: (nearestPlayer as BoardPin).y, anchoredTo: (nearestPlayer as BoardPin).id }
                : p
            );
          } else {
            // Unanchor ball
            updatedPins = pins.map(p => 
              p.id === draggedPin.id 
                ? { ...p, anchoredTo: undefined }
                : p
            );
          }
        } else if (draggedPin.type === 'attacker' || draggedPin.type === 'defender') {
          // If we drag a player, check if there is an unanchored ball close to them. If yes, snap the ball!
          let nearestBall: BoardPin | null = null;
          let minBallDist = 6.0;

          pins.forEach(p => {
            if (p.type === 'ball' && (!p.anchoredTo || p.anchoredTo === draggedPin.id)) {
              const d = Math.hypot(draggedPin.x - p.x, draggedPin.y - p.y);
              if (d < minBallDist) {
                minBallDist = d;
                nearestBall = p;
              }
            }
          });

          if (nearestBall) {
            updatedPins = pins.map(p => {
              if (p.id === (nearestBall as BoardPin).id) {
                return { ...p, x: draggedPin.x, y: draggedPin.y, anchoredTo: draggedPin.id };
              }
              return p;
            });
          }
        }
      }

      updateBoard({ pins: updatedPins });
      setActivePinId(null);
    }
    if (currentPath) {
      if (currentPath.points.length > 1) {
        updateBoard({ paths: [...paths, currentPath] });
      }
      setCurrentPath(null);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => handleEnd();
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [activePinId, currentPath, pins, paths]);

  const undoPath = () => {
    if (paths.length > 0) {
      updateBoard({ paths: paths.slice(0, -1) });
    }
  };

  const clearDrawings = () => {
    updateBoard({ paths: [] });
  };

  const resetPins = () => {
    updateBoard({
      pins: DEFAULT_PINS.map(p => ({
        ...p,
        y: boardType === 'half' ? (p.y < 50 ? p.y + 40 : p.y) : p.y
      }))
    });
  };

  const setFormat = (type: 'half' | 'full') => {
    setBoardType(type);
    let adjustedPins = pins;
    if (type === 'half') {
      adjustedPins = pins.map(p => {
        if (p.type === 'cone') return p;
        if (p.y < 50) {
          return { ...p, y: p.y + 40 };
        }
        return p;
      });
    }
    onChange({
      paths,
      pins: adjustedPins,
      courtType: type
    });
  };

  return (
    <div id="pizarra-tactica-seccion" className="flex flex-col bg-white border-y sm:border border-slate-250 rounded-none sm:rounded-2xl overflow-hidden shadow-md w-full">
      {/* Visual Controls Toolbar */}
      {!readOnly && (
        <div id="pizarra-toolbar" className="flex flex-wrap items-center justify-between gap-1.5 py-1 px-2.5 bg-slate-50 border-b border-slate-200 text-[10.5px]">
          <div className="flex items-center gap-1">
            <button
              id="btn-board-half"
              type="button"
              onClick={() => setFormat('half')}
              className={`px-2 py-1 rounded-md border font-bold transition text-[10px] ${
                boardType === 'half' 
                  ? 'bg-orange-500 border-orange-500 text-white' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Media Pista
            </button>
            <button
              id="btn-board-full"
              type="button"
              onClick={() => setFormat('full')}
              className={`px-2 py-1 rounded-md border font-bold transition text-[10px] ${
                boardType === 'full' 
                  ? 'bg-orange-500 border-orange-500 text-white' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Pista Sencera
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <button
              id="btn-mode-move"
              type="button"
              title="Mover Fichas"
              onClick={() => setMode('move')}
              className={`py-1 px-2 rounded-md transition flex items-center gap-1 text-[10px] border ${
                mode === 'move' ? 'bg-indigo-650 border-indigo-650 text-white font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Move size={11} />
              Moure
            </button>

            <button
              id="btn-mode-cut"
              type="button"
              title="Corte o Desmarque de Ataque (Línea Amarilla)"
              onClick={() => setMode('draw_cut')}
              className={`py-1 px-2 rounded-md transition flex items-center gap-1 text-[10px] border ${
                mode === 'draw_cut' ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Brush size={11} />
              Tall (Atac)
            </button>

            <button
              id="btn-mode-pass"
              type="button"
              title="Pase (Línea de Puntos Azul)"
              onClick={() => setMode('draw_pass')}
              className={`py-1 px-2 rounded-md transition flex items-center gap-1 text-[10px] border ${
                mode === 'draw_pass' ? 'bg-sky-500 border-sky-500 text-slate-950 font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Brush size={11} />
              Passada
            </button>

            <button
              id="btn-mode-run"
              type="button"
              title="Movimiento de Defensa (Línea de Guiones Roja)"
              onClick={() => setMode('draw_run')}
              className={`py-1 px-2 rounded-md transition flex items-center gap-1 text-[10px] border ${
                mode === 'draw_run' ? 'bg-red-500 border-red-500 text-white font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Brush size={11} />
              Defensa
            </button>

            <button
              id="btn-mode-dribble"
              type="button"
              title="Bote / Dribling (Línea en Zigzag)"
              onClick={() => setMode('draw_dribble')}
              className={`py-1 px-2 rounded-md transition flex items-center gap-1 text-[10px] border ${
                mode === 'draw_dribble' ? 'bg-orange-500 border-orange-500 text-white font-bold' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Brush size={11} />
              Botar
            </button>

            <button
              id="btn-mode-eraser"
              type="button"
              title="Goma d'esborrar (Clica a sobre d'un traç o d'un jugador per eliminar-lo)"
              onClick={() => setMode('eraser')}
              className={`py-1 px-2 rounded-md transition flex items-center gap-1 text-[10px] border ${
                mode === 'eraser' ? 'bg-rose-600 border-rose-600 text-white font-bold' : 'bg-white border-slate-200 text-rose-650 hover:bg-rose-50'
              }`}
            >
              <Eraser size={11} />
              Esborrador
            </button>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-200 pl-1.5">
            <button
              id="btn-board-undo"
              type="button"
              onClick={undoPath}
              disabled={paths.length === 0}
              title="Deshacer último trazo"
              className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Undo size={11} />
            </button>
            <button
              id="btn-board-clear-drawings"
              type="button"
              onClick={clearDrawings}
              title="Borrar todos los trazos"
              className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              <Trash2 size={11} />
            </button>
            <button
              id="btn-board-reset-pins"
              type="button"
              onClick={resetPins}
              title="Reiniciar posiciones"
              className="p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
            >
              <RotateCcw size={11} />
            </button>
          </div>
        </div>
      )}

      {/* Chip Management Panel */}
      {!readOnly && (
        <div id="pizarra-elements-panel" className="flex flex-wrap items-center justify-between gap-1.5 py-1 px-2.5 bg-slate-50 border-b border-slate-200 text-[10px] select-none">
          <div className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <span>⚙️</span>
            <span>Fitxes:</span>
            {selectedPinId && (
              <button
                type="button"
                onClick={() => {
                  const updatedPins = pins.filter(p => p.id !== selectedPinId);
                  const finalPins = updatedPins.map(pin => 
                    pin.type === 'ball' && pin.anchoredTo === selectedPinId 
                      ? { ...pin, anchoredTo: undefined } 
                      : pin
                  );
                  updateBoard({ pins: finalPins });
                  setSelectedPinId(null);
                }}
                className="ml-1 px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-[8px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-0.5 transition active:scale-95"
                title="Eliminar fitxa seleccionada"
              >
                <Trash2 size={8} />
                <span>Borrar seleccionada</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Attackers control */}
            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-md border border-slate-200">
              <span className="text-[9px] font-bold text-slate-600 font-sans">Atacants (O):</span>
              <button
                type="button"
                onClick={() => {
                  const attackers = pins.filter(p => p.type === 'attacker');
                  if (attackers.length > 0) {
                    const maxAtt = attackers.reduce((prev, current) => {
                      const prevNum = parseInt(prev.label, 10);
                      const currNum = parseInt(current.label, 10);
                      if (isNaN(prevNum)) return current;
                      if (isNaN(currNum)) return prev;
                      return currNum > prevNum ? current : prev;
                    }, attackers[0]);
                    const updatedPins = pins.filter(p => p.id !== maxAtt.id);
                    const finalPins = updatedPins.map(p => 
                      p.type === 'ball' && p.anchoredTo === maxAtt.id ? { ...p, anchoredTo: undefined } : p
                    );
                    updateBoard({ pins: finalPins });
                  }
                }}
                disabled={pins.filter(p => p.type === 'attacker').length === 0}
                className="w-4 h-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-35 disabled:hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-bold flex items-center justify-center cursor-pointer transition text-[9px]"
                title="Treure l'últim atacant"
              >
                -
              </button>
              <span className="w-3 text-center font-mono font-bold text-orange-600 text-[9px]">
                {pins.filter(p => p.type === 'attacker').length}
              </span>
              <button
                type="button"
                onClick={() => {
                  const attackers = pins.filter(p => p.type === 'attacker');
                  const nextLabel = attackers.length > 0 ? Math.max(...attackers.map(a => {
                    const num = parseInt(a.label, 10);
                    return isNaN(num) ? 0 : num;
                  })) + 1 : 1;
                  const defaultY = boardType === 'half' ? 75 : 60;
                  const newAtt: BoardPin = {
                    id: 'att_' + crypto.randomUUID(),
                    label: String(nextLabel),
                    x: 35 + (attackers.length % 5) * 8,
                    y: defaultY + Math.floor(attackers.length / 5) * 5,
                    type: 'attacker'
                  };
                  updateBoard({ pins: [...pins, newAtt] });
                }}
                className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded font-bold flex items-center justify-center cursor-pointer transition text-[9px]"
                title="Afegir nou atacant"
              >
                +
              </button>
            </div>

            {/* Defenders control */}
            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-md border border-slate-200">
              <span className="text-[9px] font-bold text-slate-600 font-sans">Defensors (X):</span>
              <button
                type="button"
                onClick={() => {
                  const defenders = pins.filter(p => p.type === 'defender');
                  if (defenders.length > 0) {
                    const maxDef = defenders.reduce((prev, current) => {
                      const prevNum = parseInt(prev.label, 10);
                      const currNum = parseInt(current.label, 10);
                      if (isNaN(prevNum)) return current;
                      if (isNaN(currNum)) return prev;
                      return currNum > prevNum ? current : prev;
                    }, defenders[0]);
                    const updatedPins = pins.filter(p => p.id !== maxDef.id);
                    const finalPins = updatedPins.map(p => 
                      p.type === 'ball' && p.anchoredTo === maxDef.id ? { ...p, anchoredTo: undefined } : p
                    );
                    updateBoard({ pins: finalPins });
                  }
                }}
                disabled={pins.filter(p => p.type === 'defender').length === 0}
                className="w-4 h-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-35 disabled:hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-bold flex items-center justify-center cursor-pointer transition text-[9px]"
                title="Treure l'últim defensor"
              >
                -
              </button>
              <span className="w-3 text-center font-mono font-bold text-sky-600 text-[9px]">
                {pins.filter(p => p.type === 'defender').length}
              </span>
              <button
                type="button"
                onClick={() => {
                  const defenders = pins.filter(p => p.type === 'defender');
                  const nextLabel = defenders.length > 0 ? Math.max(...defenders.map(d => {
                    const num = parseInt(d.label, 10);
                    return isNaN(num) ? 0 : num;
                  })) + 1 : 1;
                  const defaultY = boardType === 'half' ? 65 : 40;
                  const newDef: BoardPin = {
                    id: 'def_' + crypto.randomUUID(),
                    label: String(nextLabel),
                    x: 35 + (defenders.length % 5) * 8,
                    y: defaultY + Math.floor(defenders.length / 5) * 5,
                    type: 'defender'
                  };
                  updateBoard({ pins: [...pins, newDef] });
                }}
                className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded font-bold flex items-center justify-center cursor-pointer transition text-[9px]"
                title="Afegir nou defensor"
              >
                +
              </button>
            </div>

            {/* Cones control */}
            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-md border border-slate-200">
              <span className="text-[9px] font-bold text-orange-650 font-sans">Conus (Cone Taronja):</span>
              <button
                type="button"
                onClick={() => {
                  const cones = pins.filter(p => p.type === 'cone');
                  if (cones.length > 0) {
                    const lastCone = cones[cones.length - 1];
                    updateBoard({ pins: pins.filter(p => p.id !== lastCone.id) });
                  }
                }}
                disabled={pins.filter(p => p.type === 'cone').length === 0}
                className="w-4 h-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-35 disabled:hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-bold flex items-center justify-center cursor-pointer transition text-[9px]"
                title="Treure un conus"
              >
                -
              </button>
              <span className="w-3 text-center font-mono font-bold text-orange-650 text-[9px]">
                {pins.filter(p => p.type === 'cone').length}
              </span>
              <button
                type="button"
                onClick={() => {
                  const cones = pins.filter(p => p.type === 'cone');
                  const newCone: BoardPin = {
                    id: 'cone_' + crypto.randomUUID(),
                    label: '▲',
                    x: 15 + (cones.length % 6) * 14,
                    y: boardType === 'half' ? 52 + Math.floor(cones.length / 6) * 10 : 25 + Math.floor(cones.length / 6) * 15,
                    type: 'cone'
                  };
                  updateBoard({ pins: [...pins, newCone] });
                }}
                className="w-4 h-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded font-bold flex items-center justify-center cursor-pointer transition text-[9px]"
                title="Afegir conus"
              >
                +
              </button>
            </div>

            {/* Ball control */}
            <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-md border border-slate-200">
              <span className="text-[9px] font-bold text-slate-600 font-sans">Pilotes (🏀):</span>
              <button
                type="button"
                onClick={() => {
                  const balls = pins.filter(p => p.type === 'ball');
                  if (balls.length > 0) {
                    const lastBall = balls[balls.length - 1];
                    updateBoard({ pins: pins.filter(p => p.id !== lastBall.id) });
                  }
                }}
                disabled={pins.filter(p => p.type === 'ball').length === 0}
                className="w-4 h-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-35 disabled:hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-bold flex items-center justify-center cursor-pointer transition text-[9px]"
                title="Treure pilota"
              >
                -
              </button>
              <span className="w-3 text-center font-mono font-bold text-amber-600 text-[9px]">
                {pins.filter(p => p.type === 'ball').length}
              </span>
              <button
                type="button"
                onClick={() => {
                  const balls = pins.filter(p => p.type === 'ball');
                  const defaultY = boardType === 'half' ? 84 : 75;
                  const newBall: BoardPin = {
                    id: balls.length === 0 ? 'ball' : 'ball_' + crypto.randomUUID(),
                    label: '🏀',
                    x: 48 + (balls.length % 5) * 4,
                    y: defaultY + Math.floor(balls.length / 5) * 4,
                    type: 'ball'
                  };
                  updateBoard({ pins: [...pins, newBall] });
                }}
                disabled={pins.filter(p => p.type === 'ball').length >= 10}
                className="w-4 h-4 bg-slate-100 hover:bg-slate-200 disabled:opacity-35 disabled:hover:bg-slate-100 text-slate-700 border border-slate-200 rounded font-bold flex items-center justify-center cursor-pointer transition text-[9px]"
                title="Afegir pilota"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SVG Canvas Board */}
      <div className={`relative w-full ${boardType === 'full' ? 'aspect-square' : 'aspect-[100/52]'} bg-white cursor-crosshair overflow-hidden touch-none select-none border border-slate-300`}>
        {/* Custom Confirmation Overlay for Path Deletion */}
        {pathToDeleteId && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-[#fdfbf7] border-2 border-slate-200 rounded-lg p-5 max-w-xs w-full text-center shadow-lg space-y-3">
              <span className="text-2xl">⚠️</span>
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Eliminar traç tàctic?</h4>
              <p className="text-[11px] text-slate-500">Estàs segur que vols esborrar aquest traç del gràfic?</p>
              <div className="flex items-center gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    const updatedPaths = paths.filter(item => item.id !== pathToDeleteId);
                    updateBoard({ paths: updatedPaths });
                    setPathToDeleteId(null);
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                >
                  Sí, eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setPathToDeleteId(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-black uppercase tracking-wider transition cursor-pointer"
                >
                  No, mantenir
                </button>
              </div>
            </div>
          </div>
        )}

        <svg
          id="svg-court"
          ref={svgRef}
          className="w-full h-full"
          viewBox={boardType === 'full' ? "0 0 100 100" : "0 48 100 52"}
          preserveAspectRatio="xMidYMid meet"
          onMouseDown={(e) => handleStart(e)}
          onTouchStart={(e) => {
            handleTouchStartCustom(e);
            handleStart(e);
          }}
          onMouseMove={handleMove}
          onTouchMove={(e) => {
            handleTouchMoveCustom(e);
            handleMove(e);
          }}
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: activePinId || currentPath ? 'none' : 'transform 0.15s ease-out',
            touchAction: 'none'
          }}
        >
          {/* DEFINITIONS FOR DYNAMIC ARROW MARKERS */}
          <defs>
            {['black', 'yellow', 'blue', 'red', 'orange', 'green'].map((colorName) => {
              const hex = colorName === 'yellow' ? '#eab308' :
                          colorName === 'blue' ? '#0ea5e9' :
                          colorName === 'red' ? '#ef4444' :
                          colorName === 'orange' ? '#f97316' :
                          colorName === 'green' ? '#22c55e' : '#000000';
              return (
                <marker
                  key={colorName}
                  id={`arrow-${colorName}`}
                  viewBox="0 0 10 10"
                  refX="6.0"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={hex} />
                </marker>
              );
            })}
          </defs>

          {/* COURT LINES DESIGN - Clinic pure white background */}
          <rect x="0" y="0" width="100" height="100" fill="#ffffff" />
          
          {/* Subtle grid lines matching the technical planner blueprint */}
          <g stroke="#e2e8f0" strokeWidth="0.5">
            <line x1="10" y1="0" x2="10" y2="100" />
            <line x1="20" y1="0" x2="20" y2="100" />
            <line x1="30" y1="0" x2="30" y2="100" />
            <line x1="40" y1="0" x2="40" y2="100" />
            <line x1="50" y1="0" x2="50" y2="100" />
            <line x1="60" y1="0" x2="60" y2="100" />
            <line x1="70" y1="0" x2="70" y2="100" />
            <line x1="80" y1="0" x2="80" y2="100" />
            <line x1="90" y1="0" x2="90" y2="100" />
            
            <line x1="0" y1="10" x2="100" y2="10" />
            <line x1="0" y1="20" x2="100" y2="20" />
            <line x1="0" y1="30" x2="100" y2="30" />
            <line x1="0" y1="40" x2="100" y2="40" />
            <line x1="0" y1="50" x2="100" y2="50" />
            <line x1="0" y1="60" x2="100" y2="60" />
            <line x1="0" y1="70" x2="100" y2="70" />
            <line x1="0" y1="80" x2="100" y2="80" />
            <line x1="0" y1="90" x2="100" y2="90" />
          </g>

          {/* Boundaries with deep classic black lines */}
          <rect x="3" y="3" width="94" height="94" fill="none" stroke="#000000" strokeWidth="1.2" />

          {/* Center line */}
          <line x1="3" y1="50" x2="97" y2="50" stroke="#000000" strokeWidth="0.8" />
          {/* Center circle */}
          <circle cx="50" cy="50" r="12" fill="none" stroke="#000000" strokeWidth="0.8" />
          <circle cx="50" cy="50" r="2.0" fill="#000000" />

          {/* BOTTOM COURT (Main half court) */}
          {/* Area Paint with slight high-class technical dash background */}
          <rect x="35" y="77.5" width="30" height="19.5" fill="#000000" fillOpacity="0.015" stroke="#000000" strokeWidth="0.8" />
          {/* Free throw circle top */}
          <path d="M 35 77.5 A 15 8.2 0 0 1 65 77.5" fill="none" stroke="#000000" strokeWidth="0.8" />
          {/* Free throw circle bottom (dashed) */}
          <path d="M 35 77.5 A 15 8.2 0 0 0 65 77.5" fill="none" stroke="#000000" strokeWidth="0.8" strokeDasharray="1.5, 1.5" />
          {/* Backboard & Rim */}
          <line x1="44" y1="93" x2="56" y2="93" stroke="#000000" strokeWidth="1.0" />
          <line x1="50" y1="93" x2="50" y2="97" stroke="#000000" strokeWidth="1.0" />
          <circle cx="50" cy="91.2" r="1.8" fill="none" stroke="#000000" strokeWidth="1.0" /> {/* Rim */}

          {/* Three point line (International / FIBA compliant scale) */}
          <path d="M 8.5 97 L 8.5 86.5 A 41.5 22.5 0 0 1 91.5 86.5 L 91.5 97" fill="none" stroke="#000000" strokeWidth="0.8" />
          {/* Restricted area arc */}
          <path d="M 43.5 91.2 A 6.5 4.0 0 0 1 56.5 91.2" fill="none" stroke="#000000" strokeWidth="0.7" />

          {/* TOP COURT */}
          {boardType === 'full' && (
            <g>
              {/* Restricted area with classic paint stain */}
              <rect x="35" y="3" width="30" height="19.5" fill="#000000" fillOpacity="0.015" stroke="#000000" strokeWidth="0.8" />
              {/* Free throw circle bottom */}
              <path d="M 35 22.5 A 15 8.2 0 0 0 65 22.5" fill="none" stroke="#000000" strokeWidth="0.8" />
              {/* Free throw circle top (dashed) */}
              <path d="M 35 22.5 A 15 8.2 0 0 1 65 22.5" fill="none" stroke="#000000" strokeWidth="0.8" strokeDasharray="1.5, 1.5" />
              {/* Backboard & Rim */}
              <line x1="44" y1="7" x2="56" y2="7" stroke="#000000" strokeWidth="1.0" />
              <line x1="50" y1="7" x2="50" y2="3" stroke="#000000" strokeWidth="1.0" />
              <circle cx="50" cy="8.8" r="1.8" fill="none" stroke="#000000" strokeWidth="1.0" />

              {/* Three point line */}
              <path d="M 8.5 3 L 8.5 13.5 A 41.5 22.5 0 0 0 91.5 13.5 L 91.5 3" fill="none" stroke="#000000" strokeWidth="0.8" />
              {/* Restricted area arc */}
              <path d="M 43.5 8.8 A 6.5 4.0 0 0 0 56.5 8.8" fill="none" stroke="#000000" strokeWidth="0.7" />
            </g>
          )}

          {/* DRAWN PATHS */}
          {paths.map((p) => {
            if (p.points.length < 2) return null;
            const dPath = p.type === 'zigzag' 
              ? getZigzagPath(p.points)
              : p.points.reduce((acc, pt, index) => 
                  index === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`,
                '');

            let dashArray = '';
            if (p.type === 'dashed') dashArray = '2, 3';
            if (p.type === 'dotted') dashArray = '0.5, 2.5';

            const colorLower = (p.color || '#000000').toLowerCase();
            let markerId = 'black';
            if (colorLower.includes('eab308') || colorLower.includes('yellow')) markerId = 'yellow';
            else if (colorLower.includes('0ea5e9') || colorLower.includes('blue') || colorLower.includes('sky')) markerId = 'blue';
            else if (colorLower.includes('ef4444') || colorLower.includes('red')) markerId = 'red';
            else if (colorLower.includes('f97316') || colorLower.includes('orange')) markerId = 'orange';
            else if (colorLower.includes('22c55e') || colorLower.includes('green')) markerId = 'green';

            return (
              <g key={p.id}>
                {/* Thick interactive overlay path for easy clicking/touching */}
                {!readOnly && (
                  <path
                     d={dPath}
                     stroke={mode === 'eraser' ? 'rgba(239, 68, 68, 0.45)' : 'transparent'}
                     strokeWidth={mode === 'eraser' ? 5.0 : 3.0}
                     fill="none"
                     style={{ pointerEvents: 'stroke' }}
                     className={`cursor-pointer ${mode === 'eraser' ? 'hover:stroke-red-650 animate-pulse' : 'hover:stroke-orange-500/20'}`}
                     onClick={(e) => {
                       e.stopPropagation();
                       if (mode === 'eraser') {
                         const updatedPaths = paths.filter(item => item.id !== p.id);
                         updateBoard({ paths: updatedPaths });
                       } else {
                         setPathToDeleteId(p.id);
                       }
                     }}
                     onTouchStart={(e) => {
                       e.stopPropagation();
                       if (mode === 'eraser') {
                         const updatedPaths = paths.filter(item => item.id !== p.id);
                         updateBoard({ paths: updatedPaths });
                       } else {
                         setPathToDeleteId(p.id);
                       }
                     }}
                     title="Clica per eliminar aquest traç"
                  />
                )}
                <path
                  d={dPath}
                  stroke={p.color || '#000000'}
                  strokeWidth={p.type === 'zigzag' ? 0.6 : 0.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  strokeDasharray={dashArray}
                  markerEnd={`url(#arrow-${markerId})`}
                  style={{ pointerEvents: 'none' }}
                />
              </g>
            );
          })}

          {/* CURRENT DRAWING PATH */}
          {currentPath && currentPath.points.length > 1 && (
            (() => {
              const colorLower = (currentPath.color || '#000000').toLowerCase();
              let markerId = 'black';
              if (colorLower.includes('eab308') || colorLower.includes('yellow')) markerId = 'yellow';
              else if (colorLower.includes('0ea5e9') || colorLower.includes('blue') || colorLower.includes('sky')) markerId = 'blue';
              else if (colorLower.includes('ef4444') || colorLower.includes('red')) markerId = 'red';
              else if (colorLower.includes('f97316') || colorLower.includes('orange')) markerId = 'orange';
              else if (colorLower.includes('22c55e') || colorLower.includes('green')) markerId = 'green';

              return (
                <path
                  d={currentPath.type === 'zigzag'
                    ? getZigzagPath(currentPath.points)
                    : currentPath.points.reduce((acc, pt, idx) => 
                        idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`,
                      '')}
                  stroke={currentPath.color || '#000000'}
                  strokeWidth={currentPath.type === 'zigzag' ? 0.6 : 0.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  strokeDasharray={currentPath.type === 'dashed' ? '2, 3' : currentPath.type === 'dotted' ? '0.5, 2.5' : ''}
                  opacity={0.8}
                  markerEnd={`url(#arrow-${markerId})`}
                />
              );
            })()
          )}

          {/* INTERACTIVE MAGNETIC PINS */}
          {pins
            .filter(p => boardType === 'full' || p.y >= 45 || p.type === 'cone')
            .map((p) => {
              // High contrast vintage black and white styling (scaled up for high legibility)
              let pinBg = '#ffffff'; // White circle with thin black border for attackers "O"
              let pinText = '#000000';
              let pinBorder = '#000000';
              let radius = 2.4; // Scaled up from 1.7 for superb visibility

              if (p.type === 'defender') {
                pinBg = '#000000'; // Black circle with white label for defenders "X"
                pinText = '#ffffff';
                pinBorder = '#000000';
              } else if (p.type === 'ball') {
                pinBg = '#ffffff';
                pinText = '#000000';
                radius = 1.3; // Scaled up from 0.9 for better prominence
                pinBorder = '#000000';
              } else if (p.type === 'cone') {
                pinBg = '#555555';
                pinText = '#ffffff';
                radius = 1.8; // Scaled up from 1.2 to be easily noticeable
                pinBorder = '#000000';
              }

              return (
                <g
                  key={p.id}
                  className={`select-none ${readOnly ? '' : mode === 'eraser' ? 'cursor-pointer hover:opacity-50 transition' : 'cursor-grab active:cursor-grabbing'}`}
                  title={readOnly ? undefined : mode === 'eraser' ? "Clica per eliminar" : "Doble clic per eliminar"}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleStart(e, p.id);
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    handleStart(e, p.id);
                  }}
                  onDoubleClick={(e) => {
                    if (readOnly) return;
                    e.stopPropagation();
                    const updatedPins = pins.filter(pin => pin.id !== p.id);
                    const finalPins = updatedPins.map(pin => 
                      pin.type === 'ball' && pin.anchoredTo === p.id 
                        ? { ...pin, anchoredTo: undefined } 
                        : pin
                    );
                    updateBoard({ pins: finalPins });
                  }}
                >
                  {/* Highlight ring for selected pin */}
                  {selectedPinId === p.id && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={radius + 1.2}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={0.5}
                      strokeDasharray="1, 1"
                    />
                  )}

                  {p.type === 'cone' ? (
                    <>
                      {/* Cone dropshadow (oval) */}
                      <ellipse
                        cx={p.x}
                        cy={p.y + radius * 0.9}
                        rx={radius * 1.3}
                        ry={radius * 0.4}
                        fill="#000000"
                        opacity={0.25}
                      />
                      
                      {/* Cone base (dark orange heavy rubber bottom) */}
                      <path
                        d={`M ${p.x - radius * 1.3} ${p.y + radius * 0.9} 
                            L ${p.x + radius * 1.3} ${p.y + radius * 0.9} 
                            A ${radius * 1.3} ${radius * 0.4} 0 0 1 ${p.x - radius * 1.3} ${p.y + radius * 0.9} Z`}
                        fill="#c2410c"
                        stroke="#1e293b"
                        strokeWidth={0.3}
                      />

                      {/* Main Triangle Body (Vibrant safety Orange) */}
                      <path
                        d={`M ${p.x} ${p.y - radius * 1.2} 
                            L ${p.x + radius * 0.95} ${p.y + radius * 0.8} 
                            A ${radius * 0.95} ${radius * 0.3} 0 0 1 ${p.x - radius * 0.95} ${p.y + radius * 0.8} Z`}
                        fill="#ea580c"
                        stroke="#1e293b"
                        strokeWidth={0.4}
                      />

                      {/* White stripe in the middle (reflective tape) */}
                      <path
                        d={`M ${p.x - radius * 0.35} ${p.y - radius * 0.2}
                            L ${p.x + radius * 0.35} ${p.y - radius * 0.2}
                            L ${p.x + radius * 0.6} ${p.y + radius * 0.3}
                            L ${p.x - radius * 0.6} ${p.y + radius * 0.3} Z`}
                        fill="#ffffff"
                        stroke="#1e293b"
                        strokeWidth={0.25}
                      />
                    </>
                  ) : (
                    <>
                      {/* Subtle dropshadow under standard pins */}
                      <circle
                        cx={p.x}
                        cy={p.y + 0.5}
                        r={radius}
                        fill="#000000"
                        opacity={0.15}
                      />

                      {/* Pin outer body ring */}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={radius}
                        fill={pinBg}
                        stroke={pinBorder}
                        strokeWidth={0.5}
                      />

                      {/* Labels on pins */}
                      <text
                        x={p.x}
                        y={p.y}
                        dy="0.33em"
                        fontSize={p.type === 'ball' ? '1.8px' : '2.5px'}
                        fontWeight="bold"
                        fontFamily="Inter, system-ui, sans-serif"
                        fill={pinText}
                        textAnchor="middle"
                      >
                        {p.type === 'attacker' ? `O${p.label}` : p.type === 'defender' ? `X${p.label}` : p.label}
                      </text>
                    </>
                  )}

                  {/* Floating close/delete button for the selected pin */}
                  {selectedPinId === p.id && !readOnly && (
                    <g
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedPins = pins.filter(pin => pin.id !== p.id);
                        const finalPins = updatedPins.map(pin => 
                          pin.type === 'ball' && pin.anchoredTo === p.id 
                            ? { ...pin, anchoredTo: undefined } 
                            : pin
                        );
                        updateBoard({ pins: finalPins });
                        setSelectedPinId(null);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        const updatedPins = pins.filter(pin => pin.id !== p.id);
                        const finalPins = updatedPins.map(pin => 
                          pin.type === 'ball' && pin.anchoredTo === p.id 
                            ? { ...pin, anchoredTo: undefined } 
                            : pin
                        );
                        updateBoard({ pins: finalPins });
                        setSelectedPinId(null);
                      }}
                    >
                      <circle
                        cx={p.x + radius + 1.0}
                        cy={p.y - radius - 1.0}
                        r={1.2}
                        fill="#ef4444"
                        stroke="#ffffff"
                        strokeWidth={0.3}
                      />
                      <text
                        x={p.x + radius + 1.0}
                        y={p.y - radius - 1.0}
                        dy="0.33em"
                        fontSize="1.6px"
                        fontWeight="black"
                        fill="#ffffff"
                        textAnchor="middle"
                      >
                        ×
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
        </svg>

        {/* Quick Help Overlay Indicator for Touch devices */}
        {!readOnly && (
          <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2 py-1 rounded text-[10px] text-slate-300 font-mono flex items-center gap-1 backdrop-blur-xs">
            {mode === 'move' ? (
              <>
                <Move size={10} className="text-indigo-400" />
                <span>{zoom > 1 ? 'Mueve con 1/2 dedos' : 'Arrastra las fichas'}</span>
              </>
            ) : (
              <>
                <Brush size={10} className="text-yellow-400 animate-pulse" />
                <span>{zoom > 1 ? 'Dibuja ampliado' : 'Dibuja en la pantalla'}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
