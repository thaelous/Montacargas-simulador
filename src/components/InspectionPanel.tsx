import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  Info,
  Maximize2,
  Minimize2,
  Wrench,
  X,
} from 'lucide-react';
import { InspectionHotspot } from '../types/forklift';
import { INSPECTION_HOTSPOTS } from '../simulation/forkliftModel';

const COMPONENT_SHORT_LABELS: Record<string, string> = {
  counterweight_fuel: 'Contrapeso',
  mast_assembly: 'Mástil',
  forks_carriage: 'Horquillas',
  rops_cabin: 'Cabina',
  fire_extinguisher: 'Extintor',
  steer_axle: 'Ruedas Tras.',
  drive_axle: 'Ruedas Del.',
  controls_dash: 'Mandos',
  tilt_cylinders: 'Cil. Inclin.',
  lift_cylinder_chains: 'Cadenas Mástil',
  engine_exhaust: 'Motor GLP',
};

export interface InspectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedHotspot: InspectionHotspot | null;
  onSelectHotspot: (hotspot: InspectionHotspot) => void;
  isMobileSheet?: boolean;
  onOpen?: () => void;
}

export const InspectionPanel: React.FC<InspectionPanelProps> = ({
  isOpen,
  onClose,
  selectedHotspot,
  onSelectHotspot,
  isMobileSheet = false,
  onOpen,
}) => {
  const [inspectedIds, setInspectedIds] = useState<Set<string>>(new Set());
  // Mobile Sheet Height: 'peek' (minimal bottom strip), 'half' (mid-height card), 'full' (expanded)
  const [sheetMode, setSheetMode] = useState<'peek' | 'half' | 'full'>('peek');

  const currentItem = selectedHotspot || INSPECTION_HOTSPOTS[0];

  const handleSelect = (item: InspectionHotspot) => {
    onSelectHotspot(item);
    setInspectedIds((prev) => new Set(prev).add(item.id));
  };

  const currentIndex = INSPECTION_HOTSPOTS.findIndex((s) => s.id === currentItem.id);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const prevIdx = (currentIndex - 1 + INSPECTION_HOTSPOTS.length) % INSPECTION_HOTSPOTS.length;
    handleSelect(INSPECTION_HOTSPOTS[prevIdx]);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const nextIdx = (currentIndex + 1) % INSPECTION_HOTSPOTS.length;
    handleSelect(INSPECTION_HOTSPOTS[nextIdx]);
  };

  const toggleSheetMode = () => {
    if (sheetMode === 'peek') setSheetMode('half');
    else if (sheetMode === 'half') setSheetMode('full');
    else setSheetMode('peek');
  };

  // -------------------------------------------------------------
  // MOBILE BOTTOM SHEET VARIANT
  // -------------------------------------------------------------
  if (isMobileSheet) {
    if (!isOpen) {
      return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={onOpen}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-2xl font-tech cursor-pointer border border-amber-300 active:scale-95 transition-all"
          >
            <Wrench className="w-4 h-4" />
            <span>Ficha Técnica: {COMPONENT_SHORT_LABELS[currentItem.id] || currentItem.name.split(' ')[0]} (▲ Abrir)</span>
          </button>
        </div>
      );
    }

    const heightClass =
      sheetMode === 'peek'
        ? 'h-[62px]'
        : sheetMode === 'half'
        ? 'h-[48vh]'
        : 'h-[82vh]';

    return (
      <div
        className={`fixed bottom-0 inset-x-0 z-30 pointer-events-auto bg-zinc-950/95 backdrop-blur-2xl border-t border-amber-500/40 shadow-2xl rounded-t-3xl flex flex-col overflow-hidden text-zinc-100 select-none transition-[height] duration-300 ease-out ${heightClass}`}
      >
        {/* Drag Handle Bar & Compact Header */}
        <div
          onClick={toggleSheetMode}
          className="flex flex-col items-center pt-2 pb-1.5 px-3 bg-zinc-900/80 border-b border-zinc-800/80 cursor-pointer shrink-0"
        >
          {/* Subtle grab bar indicator */}
          <div className="w-12 h-1 bg-zinc-600 hover:bg-amber-400 rounded-full mb-1 transition-colors" />

          <div className="flex items-center justify-between w-full">
            {/* Left: Component identifier */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center text-[11px] font-bold font-mono shrink-0">
                {currentIndex + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold font-tech uppercase text-white truncate">
                  {currentItem.name}
                </h3>
                <span className="text-[10px] text-zinc-400 truncate block">
                  {currentItem.category} · {inspectedIds.size}/{INSPECTION_HOTSPOTS.length} partes
                </span>
              </div>
            </div>

            {/* Right: Quick Navigation & Height controls */}
            <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handlePrev}
                className="p-1 text-zinc-300 hover:text-white bg-zinc-800 active:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors cursor-pointer"
                title="Componente anterior"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="p-1 text-zinc-300 hover:text-white bg-zinc-800 active:bg-zinc-700 rounded-lg border border-zinc-700 transition-colors cursor-pointer"
                title="Componente siguiente"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={toggleSheetMode}
                className="p-1 text-amber-400 hover:text-amber-300 bg-amber-500/20 active:bg-amber-500/30 rounded-lg border border-amber-500/40 transition-colors cursor-pointer"
                title={sheetMode === 'peek' ? 'Expandir ficha técnica' : 'Colapsar'}
              >
                {sheetMode === 'peek' ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : sheetMode === 'half' ? (
                  <Maximize2 className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1 text-zinc-400 hover:text-white bg-zinc-800/80 active:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                title="Minimizar tarjeta"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Sheet Content (Visible when not in peek mode) */}
        {sheetMode !== 'peek' && (
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 scrollbar-thin select-text">
            {/* Progress Bar */}
            <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden shrink-0">
              <div
                className="bg-amber-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(inspectedIds.size / INSPECTION_HOTSPOTS.length) * 100}%` }}
              />
            </div>

            {/* Horizontal Component Pills */}
            <div className="overflow-x-auto flex gap-1.5 scrollbar-thin py-1 shrink-0">
              {INSPECTION_HOTSPOTS.map((spot, idx) => {
                const isSelected = spot.id === currentItem.id;
                const isDone = inspectedIds.has(spot.id);
                const shortLabel = COMPONENT_SHORT_LABELS[spot.id] || spot.name.split(' ')[0];
                return (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => handleSelect(spot)}
                    className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg whitespace-nowrap transition-all font-tech font-semibold cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-md ring-1 ring-amber-300'
                        : isDone
                        ? 'bg-zinc-900 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-900/90 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    <span className="opacity-70 font-mono text-[9px]">{idx + 1}.</span>
                    <span>{shortLabel}</span>
                    {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Component Summary */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl">
              <p className="text-xs text-zinc-200 leading-relaxed">{currentItem.summary}</p>
            </div>

            {/* Function Description */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 mb-1">
                <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="font-tech uppercase text-[10px] tracking-wide">Función Mecánica y Operativa</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{currentItem.functionDesc}</p>
            </div>

            {/* OSHA Checklist */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1.5">
                <ClipboardCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-tech uppercase text-[10px] tracking-wide">
                  Inspección Pre-Operacional (OSHA 1910.178)
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {currentItem.oshaChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold leading-none mt-0.5">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Safety Warnings */}
            <div className="bg-amber-950/30 border border-amber-500/40 p-2.5 rounded-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-tech uppercase text-[10px] tracking-wide">Advertencias de Seguridad Críticas</span>
              </div>
              <ul className="space-y-1 text-xs text-amber-200/95">
                {currentItem.safetyWarnings.map((warn, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="text-amber-400 shrink-0">⚠</span>
                    <span className="leading-relaxed">{warn}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technical Specifications */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-2.5 rounded-xl">
              <span className="text-[10px] font-bold text-zinc-300 block mb-1.5 font-tech uppercase tracking-wide">
                Especificaciones Técnicas
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {Object.entries(currentItem.specs).map(([key, value]) => (
                  <div key={key} className="bg-zinc-950/70 p-1.5 rounded-lg border border-zinc-800">
                    <div className="text-[9px] text-zinc-400 truncate">{key}</div>
                    <div className="font-semibold text-white mt-0.5 font-mono text-[10px] truncate">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // DESKTOP SIDEBAR VARIANT
  // -------------------------------------------------------------
  if (!isOpen) return null;

  return (
    <div className="w-full h-full bg-zinc-950/98 backdrop-blur-2xl flex flex-col overflow-hidden text-zinc-100 select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800/90 bg-zinc-900/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-tech uppercase text-white tracking-wider">
              Capacitación e Inspección 360°
            </h2>
            <div className="text-[11px] text-zinc-400">
              {inspectedIds.size} de {INSPECTION_HOTSPOTS.length} partes inspeccionadas
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Ocultar panel lateral (Modo expandido)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-900 h-1 shrink-0">
        <div
          className="bg-amber-500 h-1 transition-all duration-300"
          style={{ width: `${(inspectedIds.size / INSPECTION_HOTSPOTS.length) * 100}%` }}
        />
      </div>

      {/* Component Selector Pills */}
      <div className="px-3 py-2 border-b border-zinc-800/80 bg-zinc-950/90 overflow-x-auto flex gap-1.5 scrollbar-thin shrink-0">
        {INSPECTION_HOTSPOTS.map((spot, idx) => {
          const isSelected = spot.id === currentItem.id;
          const isDone = inspectedIds.has(spot.id);
          const shortLabel = COMPONENT_SHORT_LABELS[spot.id] || spot.name.split(' ')[0];
          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => handleSelect(spot)}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-all font-tech font-semibold cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/25 ring-1 ring-amber-300'
                  : isDone
                  ? 'bg-zinc-900 text-emerald-400 border border-emerald-500/30 hover:bg-zinc-800'
                  : 'bg-zinc-900/90 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800'
              }`}
            >
              <span className="text-[10px] opacity-70 font-mono">{idx + 1}.</span>
              <span className="truncate">{shortLabel}</span>
              {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Detailed Technical Sheet for Selected Component */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin select-text">
        {/* Title & Category */}
        <div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mb-1">
            <span className="font-semibold text-amber-500 uppercase font-tech">{currentItem.category}</span>
            <span aria-hidden="true">·</span>
            <span className="text-zinc-400">{currentItem.nameEn}</span>
          </div>
          <h3 className="text-base font-bold text-white font-tech tracking-wide">{currentItem.name}</h3>
          <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{currentItem.summary}</p>
        </div>

        {/* Function Description */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-xl shadow-inner">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200 mb-1">
            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="font-tech uppercase text-[11px] tracking-wide">Función Mecánica y Operativa</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">{currentItem.functionDesc}</p>
        </div>

        {/* OSHA Checklist */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-xl shadow-inner">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-tech uppercase text-[11px] tracking-wide">Puntos de Inspección Diaria (OSHA 1910.178)</span>
          </div>
          <ul className="space-y-2 text-xs text-zinc-300">
            {currentItem.oshaChecklist.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold leading-none mt-0.5">•</span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Safety Warnings */}
        <div className="bg-amber-950/30 border border-amber-500/40 p-3 rounded-xl shadow-inner">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-tech uppercase text-[11px] tracking-wide">Advertencias de Seguridad Críticas</span>
          </div>
          <ul className="space-y-1.5 text-xs text-amber-200/95">
            {currentItem.safetyWarnings.map((warn, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-400 shrink-0">⚠</span>
                <span className="leading-relaxed">{warn}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Technical Specifications */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-xl shadow-inner">
          <span className="text-[11px] font-bold text-zinc-300 block mb-2 font-tech uppercase tracking-wide">
            Especificaciones Técnicas
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(currentItem.specs).map(([key, value]) => (
              <div key={key} className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800/80">
                <div className="text-[10px] text-zinc-400 truncate">{key}</div>
                <div className="font-semibold text-white mt-0.5 font-mono text-[11px] truncate">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-zinc-800/90 bg-zinc-950/90 shrink-0 flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrev}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-xl transition-colors font-tech text-xs font-bold cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition-colors font-tech cursor-pointer shadow-md shadow-amber-500/20"
        >
          <span>Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
