import React, { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  Award,
  Compass,
  Gauge,
  HelpCircle,
  RotateCcw,
  ShieldAlert,
  Tag,
  Volume2,
  VolumeX,
  Wrench,
} from 'lucide-react';
import { CameraMode, ForkliftControls, ForkliftTelemetry } from '../types/forklift';
import { forkliftAudio } from '../simulation/sound';

// --- Header Navigation Bar ---
export interface HUDHeaderProps {
  mode: 'driving' | 'inspection';
  onModeChange: (mode: 'driving' | 'inspection') => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  onOpenHelp: () => void;
  onOpenStabilityTriangle: () => void;
  onOpenMissions: () => void;
  onResetPosition: () => void;
  isInspectionPanelOpen?: boolean;
  onToggleInspectionPanel?: () => void;
  stabilityRisk: 'safe' | 'warning' | 'danger';
}

export const HUDHeader: React.FC<HUDHeaderProps> = ({
  mode,
  onModeChange,
  showLabels,
  onToggleLabels,
  onOpenHelp,
  onOpenStabilityTriangle,
  onOpenMissions,
  onResetPosition,
  isInspectionPanelOpen = true,
  onToggleInspectionPanel,
  stabilityRisk,
}) => {
  const [isMuted, setIsMuted] = useState(forkliftAudio.isSoundMuted());

  const handleToggleMute = () => {
    const muted = forkliftAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="h-14 shrink-0 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/90 px-4 flex items-center justify-between z-30 select-none">
      {/* Brand Zone */}
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-6 bg-amber-500 rounded-sm shadow-sm shadow-amber-500/50" />
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold tracking-tight text-white uppercase font-tech">
              FORKLIFT SIMULATOR 3D
            </h1>
            <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono border border-amber-500/30">
              OSHA 1910.178
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 hidden xs:block">
            Montacargas de Combustión Interna · Hombre Sentado
          </p>
        </div>
      </div>

      {/* Mode Switcher & Tools */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shadow-inner">
          <button
            onClick={() => onModeChange('driving')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'driving'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
            title="Operación estándar de conducción y mástil hidráulico"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Modo Manejo</span>
          </button>

          <button
            onClick={() => onModeChange('inspection')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'inspection'
                ? 'bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/25 ring-1 ring-amber-400'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
            title="Capacitación técnica e inspección 360° en pantalla dividida"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Modo Inspección</span>
          </button>
        </div>

        {/* Training Missions Button */}
        <button
          onClick={onOpenMissions}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white transition-all cursor-pointer shadow-sm"
          title="Abrir retos de capacitación y procedimientos operativos de montacargas"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Misiones</span>
        </button>

        {/* Real-time Stability Triangle Modal Button */}
        <button
          onClick={onOpenStabilityTriangle}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-sm ${
            stabilityRisk !== 'safe'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 animate-pulse'
              : 'bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-200 hover:text-white'
          }`}
          title="Monitor en tiempo real del Centro de Gravedad y Física del Triángulo de Estabilidad"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden md:inline">Triángulo OSHA</span>
        </button>

        {/* In Inspection Mode: Toggle 3D Labels Button */}
        {mode === 'inspection' && (
          <>
            <button
              onClick={onToggleLabels}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                showLabels
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/30 ring-1 ring-blue-300'
                  : 'bg-zinc-850 hover:bg-zinc-750 text-zinc-300 border-zinc-700'
              }`}
              title="Activar o desactivar las etiquetas flotantes 3D de las partes del montacargas"
            >
              <Tag className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{showLabels ? 'Etiquetas 3D: On' : 'Etiquetas 3D: Off'}</span>
            </button>

            {onToggleInspectionPanel && (
              <button
                onClick={onToggleInspectionPanel}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                  isInspectionPanelOpen
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/25 ring-1 ring-amber-300'
                    : 'bg-zinc-850 hover:bg-zinc-750 text-zinc-300 border-zinc-700'
                }`}
                title="Mostrar u ocultar el panel lateral de capacitación (35% pantalla)"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{isInspectionPanelOpen ? 'Panel: 35% Fijo' : 'Panel: Oculto'}</span>
              </button>
            )}
          </>
        )}

        {/* Reset Forklift Position */}
        <button
          onClick={onResetPosition}
          className="p-1.5 text-zinc-300 hover:text-white bg-zinc-850 hover:bg-zinc-750 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
          title="Reiniciar posición del montacargas"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Audio Mute */}
        <button
          onClick={handleToggleMute}
          className="p-1.5 text-zinc-300 hover:text-white bg-zinc-850 hover:bg-zinc-750 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
          title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Help & Shortcuts */}
        <button
          onClick={onOpenHelp}
          className="p-1.5 text-zinc-300 hover:text-white bg-zinc-850 hover:bg-zinc-750 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
          title="Guía de mandos y atajos de teclado"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

// --- Tip-Over & Stability Alert Overlays ---
export interface HUDAlertsProps {
  telemetry: ForkliftTelemetry;
  onOpenStabilityTriangle: () => void;
  onResetPosition: () => void;
}

export const HUDAlerts: React.FC<HUDAlertsProps> = ({
  telemetry,
  onOpenStabilityTriangle,
  onResetPosition,
}) => {
  const [countdown, setCountdown] = useState<number>(3);
  const onResetPositionRef = useRef(onResetPosition);
  onResetPositionRef.current = onResetPosition;

  useEffect(() => {
    if (!telemetry.isTippedOver) {
      setCountdown(3);
      return;
    }

    setCountdown(3);

    // Pure countdown tick
    const interval = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    // Asynchronous reset trigger outside of state reducer
    const timeout = setTimeout(() => {
      onResetPositionRef.current();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [telemetry.isTippedOver]);

  return (
    <>
      {/* 1. TIP-OVER OVERTURN ALERT MODAL */}
      {telemetry.isTippedOver && (
        <div className="fixed inset-0 z-50 pointer-events-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-zinc-950 border-2 border-red-600 rounded-3xl p-6 shadow-2xl shadow-red-950/80 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-500 mb-4 animate-pulse">
              <ShieldAlert className="w-10 h-10" />
            </div>

            <span className="px-3 py-1 bg-red-950 text-red-400 border border-red-800 rounded-full text-xs font-bold font-tech uppercase tracking-wider mb-2">
              Alerta de Seguridad Crítica
            </span>

            <h2 className="text-2xl font-black font-tech text-white uppercase tracking-wide">
              ¡VOLCAMIENTO POR INESTABILIDAD OPERATIVA!
            </h2>

            <p className="text-sm text-red-300 font-medium mt-2 leading-relaxed">
              {telemetry.tipReason || 'El montacargas ha superado los límites dinámicos del triángulo de estabilidad.'}
            </p>

            {/* Countdown / Auto-Reset Progress Badge */}
            <div className="w-full bg-red-950/60 border border-red-800/80 rounded-xl p-3 my-3 flex flex-col items-center gap-1.5">
              <div className="flex items-center justify-between w-full text-xs font-mono font-bold text-red-300">
                <span className="flex items-center gap-1.5 font-tech uppercase text-amber-400">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Reseteo Automático de Seguridad:</span>
                </span>
                <span className="text-white font-black bg-red-600/50 px-2 py-0.5 rounded border border-red-500/50">
                  {countdown}s
                </span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                <div
                  className="bg-gradient-to-r from-amber-500 to-red-500 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(countdown / 3) * 100}%` }}
                />
              </div>
            </div>

            <div className="my-2 p-3.5 bg-red-950/40 border border-red-900/60 rounded-xl text-left text-xs text-zinc-300 space-y-1.5 w-full">
              <div className="font-bold text-red-200 flex items-center gap-1.5 font-tech uppercase">
                <span>Normativa OSHA 1910.178 - Protocolo de Seguridad en Vuelco:</span>
              </div>
              <ul className="list-disc list-inside text-zinc-400 space-y-1 text-[11px]">
                <li><strong className="text-zinc-200">Permanezca en la cabina:</strong> NUNCA intente saltar mientras el equipo se inclina.</li>
                <li><strong className="text-zinc-200">Sujétese con fuerza:</strong> Aférrese firmemente al volante con ambos brazos.</li>
                <li><strong className="text-zinc-200">Afirme los pies:</strong> Presione con fuerza la espalda contra el asiento y los pies en el piso.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-2">
              <button
                onClick={onOpenStabilityTriangle}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/60 text-amber-300 font-bold text-xs rounded-xl transition-all font-tech uppercase tracking-wider cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Analizar Triángulo CG</span>
              </button>

              <button
                onClick={onResetPosition}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-900/50 transition-all font-tech uppercase tracking-wider cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar Simulación Ahora</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DANGER WARNING BANNER (when not yet overturned) */}
      {!telemetry.isTippedOver && telemetry.stabilityRisk !== 'safe' && (
        <div
          onClick={onOpenStabilityTriangle}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-auto px-4 py-2 bg-red-950/90 hover:bg-red-900/90 border border-red-500/80 rounded-xl shadow-xl flex items-center gap-3 animate-bounce cursor-pointer transition-colors max-w-lg"
          title="Haga clic para ver el desplazamiento del Centro de Gravedad en el Triángulo de Estabilidad"
        >
          <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-red-200 uppercase font-tech tracking-wider flex items-center gap-2">
              <span>{telemetry.stabilityRisk === 'danger' ? '¡PELIGRO CRÍTICO DE VUELCO!' : 'ADVERTENCIA DE ESTABILIDAD'}</span>
              <span className="text-[10px] text-amber-400 underline font-normal">(Ver Triángulo)</span>
            </div>
            <div className="text-[11px] text-red-300">
              {telemetry.forkHeightM > 1.8
                ? 'Conducir con el mástil elevado traslada el CG hacia arriba y adelante. Baje las horquillas a nivel de piso.'
                : 'Fuerza centrífuga excesiva en giro o carga descentrada.'}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// --- Bottom Controls & Gauges HUD (Inside 3D Viewport) ---
export interface HUDControlsProps {
  telemetry: ForkliftTelemetry;
  controls: ForkliftControls;
  cameraMode: CameraMode;
  onCameraChange: (mode: CameraMode) => void;
  onLeverAction: (type: 'lift' | 'tilt' | 'sideshift', value: number) => void;
  onDriveAction: (type: 'throttle' | 'steering' | 'brake', value: number | boolean) => void;
  onToggleParkingBrake: () => void;
  onToggleLights: () => void;
  onHorn: (active: boolean) => void;
  mode: 'driving' | 'inspection';
}

export const HUDControls: React.FC<HUDControlsProps> = ({
  telemetry,
  controls,
  cameraMode,
  onCameraChange,
  onLeverAction,
  onDriveAction,
  onToggleParkingBrake,
  onToggleLights,
  onHorn,
  mode,
}) => {
  const cameraModes: { id: CameraMode; label: string }[] = [
    { id: 'chase', label: 'Tercera Persona' },
    { id: 'cabin', label: 'Cabina Operador' },
    { id: 'forks', label: 'Cámara Horquillas' },
    { id: 'orbit', label: '360° Libre' },
  ];

  // Virtual Draggable Lever Component
  const DraggableLever = ({
    label,
    keys,
    type,
    color,
    value,
    stepLabels,
  }: {
    label: string;
    keys: string;
    type: 'lift' | 'tilt' | 'sideshift';
    color: string;
    value: number;
    stepLabels: [string, string];
  }) => {
    const trackRef = useRef<HTMLDivElement>(null);

    const updateFromClientY = (clientY: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const diffY = clientY - centerY;
      // Invert Y so up is positive
      const normalized = Math.max(-1, Math.min(1, -diffY / (rect.height / 2)));
      onLeverAction(type, normalized);
    };

    const handlePointerDown = (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updateFromClientY(e.clientY);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (e.buttons > 0) {
        updateFromClientY(e.clientY);
      }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe catch
      }
      onLeverAction(type, 0);
    };

    return (
      <div className="flex flex-col items-center select-none w-20">
        <span className="text-[10px] text-zinc-400 font-semibold mb-0.5">{stepLabels[0]}</span>

        {/* Track */}
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-7 h-28 bg-zinc-900 rounded-full border border-zinc-700/80 shadow-inner flex items-center justify-center cursor-ns-resize"
        >
          {/* Neutral detent line */}
          <div className="absolute w-full h-0.5 bg-zinc-700/60 top-1/2 -translate-y-1/2" />

          {/* Knob handle */}
          <div
            className={`absolute w-6 h-6 rounded-full ${color} shadow-lg border-2 border-white/60 transition-transform duration-75 flex items-center justify-center pointer-events-none`}
            style={{
              transform: `translateY(${-value * 42}px)`,
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
          </div>
        </div>

        <span className="text-[10px] text-zinc-400 font-semibold mt-0.5">{stepLabels[1]}</span>

        <div className="text-center mt-0.5">
          <span className="text-[11px] font-bold text-zinc-200 block">{label}</span>
          <span className="text-[10px] text-zinc-400 font-tech">{keys}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-end select-none">
      {mode === 'driving' ? (
        <div className="flex items-end justify-between w-full pointer-events-none">
          {/* LEFT: Cockpit Instrument Cluster & Pedals */}
          <div className="pointer-events-auto bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 p-3 rounded-2xl shadow-2xl flex flex-col gap-2.5 min-w-[270px] max-w-[320px]">
            {/* Top Indicators Row: Speed & Gear & RPM */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Velocidad</div>
                <div className="text-2xl font-black font-tech text-white leading-none">
                  {Math.abs(telemetry.speedKmh).toFixed(1)}{' '}
                  <span className="text-xs font-normal text-zinc-400 font-sans">km/h</span>
                </div>
              </div>

              <div className="text-center px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="text-[9px] uppercase tracking-wider text-zinc-400">Marcha</div>
                <div
                  className={`text-lg font-black font-tech ${
                    telemetry.gear === 'F' ? 'text-emerald-400' : telemetry.gear === 'R' ? 'text-amber-400' : 'text-zinc-400'
                  }`}
                >
                  {telemetry.gear}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Motor</div>
                <div className="text-xs font-mono font-bold text-zinc-300">
                  {Math.round(telemetry.engineRpm)} <span className="text-[10px] font-normal text-zinc-500">RPM</span>
                </div>
              </div>
            </div>

            {/* Middle Row: Fork Height & Mast Tilt */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800/60">
                <div className="text-[10px] text-zinc-400">Altura Horquillas</div>
                <div className="text-sm font-bold font-tech text-amber-400">
                  {telemetry.forkHeightM.toFixed(2)} m
                </div>
              </div>

              <div className="bg-zinc-900/60 p-1.5 rounded-lg border border-zinc-800/60">
                <div className="text-[10px] text-zinc-400">Inclinación Mástil</div>
                <div className="text-sm font-bold font-tech text-blue-400">
                  {telemetry.tiltAngleDeg.toFixed(1)}°
                </div>
              </div>
            </div>

            {/* INTUITIVE DIRECTIONAL D-PAD (CRUCETA DE CONDUCCIÓN) & SYSTEM BUTTONS */}
            <div className="flex items-center gap-3 pt-1 border-t border-zinc-800/80">
              {/* 3x3 D-Pad Matrix for W/A/S/D movement */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl shadow-inner place-items-center shrink-0">
                {/* Row 1: Top -> Adelante (W) */}
                <div className="w-8 h-8" />
                <button
                  onMouseDown={() => onDriveAction('throttle', 1)}
                  onMouseUp={() => onDriveAction('throttle', 0)}
                  onMouseLeave={() => onDriveAction('throttle', 0)}
                  onTouchStart={() => onDriveAction('throttle', 1)}
                  onTouchEnd={() => onDriveAction('throttle', 0)}
                  className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-tech font-bold transition-all select-none cursor-pointer ${
                    controls.throttle > 0
                      ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/40 scale-95 border-emerald-400 ring-2 ring-emerald-300'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 active:scale-95'
                  }`}
                  title="Acelerar Adelante (Tecla W)"
                >
                  <span className="text-[9px] leading-none text-emerald-400 font-sans font-black">▲</span>
                  <span className="text-xs font-black leading-tight">W</span>
                </button>
                <div className="w-8 h-8" />

                {/* Row 2: Left -> Izquierda (A) | Center -> Freno Mano (P) | Right -> Derecha (D) */}
                <button
                  onMouseDown={() => onDriveAction('steering', -1)}
                  onMouseUp={() => onDriveAction('steering', 0)}
                  onMouseLeave={() => onDriveAction('steering', 0)}
                  onTouchStart={() => onDriveAction('steering', -1)}
                  onTouchEnd={() => onDriveAction('steering', 0)}
                  className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-tech font-bold transition-all select-none cursor-pointer ${
                    controls.steering < 0
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/40 scale-95 border-amber-400 ring-2 ring-amber-300'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 active:scale-95'
                  }`}
                  title="Girar Ruedas a la Izquierda (Tecla A)"
                >
                  <span className="text-[9px] leading-none text-amber-400 font-sans font-black">◀</span>
                  <span className="text-xs font-black leading-tight">A</span>
                </button>

                <button
                  onClick={onToggleParkingBrake}
                  className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-tech transition-all select-none cursor-pointer ${
                    telemetry.parkingBrake
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/40 border border-red-400 animate-pulse'
                      : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-400 border border-zinc-750 hover:text-zinc-200'
                  }`}
                  title="Freno de Mano / Parqueo Toggle (Tecla P)"
                >
                  <span className="leading-none text-[8px] font-bold">PARK</span>
                  <span className="text-[11px] font-black">P</span>
                </button>

                <button
                  onMouseDown={() => onDriveAction('steering', 1)}
                  onMouseUp={() => onDriveAction('steering', 0)}
                  onMouseLeave={() => onDriveAction('steering', 0)}
                  onTouchStart={() => onDriveAction('steering', 1)}
                  onTouchEnd={() => onDriveAction('steering', 0)}
                  className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-tech font-bold transition-all select-none cursor-pointer ${
                    controls.steering > 0
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/40 scale-95 border-amber-400 ring-2 ring-amber-300'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 active:scale-95'
                  }`}
                  title="Girar Ruedas a la Derecha (Tecla D)"
                >
                  <span className="text-[9px] leading-none text-amber-400 font-sans font-black">▶</span>
                  <span className="text-xs font-black leading-tight">D</span>
                </button>

                {/* Row 3: Bottom -> Reversa / Atrás (S) */}
                <div className="w-8 h-8" />
                <button
                  onMouseDown={() => onDriveAction('throttle', -1)}
                  onMouseUp={() => onDriveAction('throttle', 0)}
                  onMouseLeave={() => onDriveAction('throttle', 0)}
                  onTouchStart={() => onDriveAction('throttle', -1)}
                  onTouchEnd={() => onDriveAction('throttle', 0)}
                  className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-tech font-bold transition-all select-none cursor-pointer ${
                    controls.throttle < 0
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/40 scale-95 border-amber-400 ring-2 ring-amber-300'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 active:scale-95'
                  }`}
                  title="Marcha Atrás / Reversa (Tecla S)"
                >
                  <span className="text-[9px] leading-none text-amber-400 font-sans font-black">▼</span>
                  <span className="text-xs font-black leading-tight">S</span>
                </button>
                <div className="w-8 h-8" />
              </div>

              {/* Side Column: System Functions (Freno de Servicio X, Claxon R, Luces V) */}
              <div className="flex-1 flex flex-col gap-1.5 justify-center">
                {/* Service Brake Pedal Button */}
                <button
                  onMouseDown={() => onDriveAction('brake', true)}
                  onMouseUp={() => onDriveAction('brake', false)}
                  onMouseLeave={() => onDriveAction('brake', false)}
                  onTouchStart={() => onDriveAction('brake', true)}
                  onTouchEnd={() => onDriveAction('brake', false)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold font-tech flex items-center justify-between transition-all select-none cursor-pointer ${
                    controls.brake
                      ? 'bg-red-600 text-white border-red-400 shadow-md shadow-red-600/50 scale-98 ring-2 ring-red-400'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                  }`}
                  title="Freno de Servicio Operativo (Tecla X o Espacio)"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                    <span>Freno Pie</span>
                  </div>
                  <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-[10px] font-mono border border-zinc-700">X</kbd>
                </button>

                {/* Horn Button */}
                <button
                  onMouseDown={() => onHorn(true)}
                  onMouseUp={() => onHorn(false)}
                  onMouseLeave={() => onHorn(false)}
                  onTouchStart={() => onHorn(true)}
                  onTouchEnd={() => onHorn(false)}
                  className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold font-tech flex items-center justify-between transition-all select-none cursor-pointer ${
                    controls.horn
                      ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-md shadow-amber-400/40 scale-98'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                  }`}
                  title="Bocina / Claxon Acústico (Tecla R)"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 text-xs">📢</span>
                    <span>Claxon</span>
                  </div>
                  <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-[10px] font-mono border border-zinc-700">R</kbd>
                </button>

                {/* Lights Button */}
                <button
                  onClick={onToggleLights}
                  className={`py-1.5 px-2.5 rounded-xl border text-xs font-bold font-tech flex items-center justify-between transition-all select-none cursor-pointer ${
                    telemetry.lightsOn
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/25'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                  }`}
                  title="Faros de Trabajo (Tecla V)"
                >
                  <div className="flex items-center gap-1.5">
                    <span className={telemetry.lightsOn ? 'text-zinc-950' : 'text-amber-400'}>💡</span>
                    <span>Luces</span>
                  </div>
                  <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-[10px] font-mono border border-zinc-700">V</kbd>
                </button>
              </div>
            </div>
          </div>

          {/* TOP CENTER: Discreet Floating Camera Mode Switcher (leaves central 3D space 100% open) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-auto bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 px-1 py-1 rounded-xl shadow-xl flex items-center gap-1">
            {cameraModes.map((cam) => (
              <button
                key={cam.id}
                onClick={() => onCameraChange(cam.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  cameraMode === cam.id
                    ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>

          {/* RIGHT: Physical Hydraulic Levers Console (Lift, Tilt, Sideshift) */}
          <div className="pointer-events-auto bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 p-3 rounded-2xl shadow-2xl flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-tech">
                Distribuidor Hidráulico
              </span>
              <span className="text-[10px] text-zinc-400">Palancas</span>
            </div>

            <div className="flex items-end gap-3 pt-0.5">
              {/* Lever 1: Elevación (Lift) */}
              <DraggableLever
                label="1. Elevación"
                keys="U / J"
                type="lift"
                color="bg-zinc-950 border-zinc-500"
                value={controls.lift}
                stepLabels={['▲ Subir (U)', '▼ Bajar (J)']}
              />

              {/* Lever 2: Inclinación (Tilt) */}
              <DraggableLever
                label="2. Inclinación"
                keys="I / K"
                type="tilt"
                color="bg-amber-600 border-amber-300"
                value={controls.tilt}
                stepLabels={['▲ Adelante (I)', '▼ Atrás (K)']}
              />

              {/* Lever 3: Desplazamiento Lateral (Sideshift) */}
              <DraggableLever
                label="3. Desplazam."
                keys="O / L"
                type="sideshift"
                color="bg-blue-600 border-blue-300"
                value={controls.sideshift}
                stepLabels={['◀ Izq (O)', '▶ Der (L)']}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between w-full pointer-events-none">
          <div className="pointer-events-auto bg-zinc-950/90 backdrop-blur-md border border-zinc-800/80 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2.5 text-xs text-zinc-300">
            <Compass className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-tech text-white font-bold">Modo Inspección 360°:</span>
            <span>Arrastre sobre el canvas para orbitar 360°. Seleccione una pieza en el menú derecho para auto-centrar y enfocar.</span>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Backwards-compatible Full HUD Component ---
export interface HUDProps extends HUDHeaderProps, HUDAlertsProps, HUDControlsProps {}

export const HUD: React.FC<HUDProps> = (props) => {
  return (
    <>
      <HUDHeader
        mode={props.mode}
        onModeChange={props.onModeChange}
        showLabels={props.showLabels}
        onToggleLabels={props.onToggleLabels}
        onOpenHelp={props.onOpenHelp}
        onOpenStabilityTriangle={props.onOpenStabilityTriangle}
        onOpenMissions={props.onOpenMissions}
        onResetPosition={props.onResetPosition}
        isInspectionPanelOpen={props.isInspectionPanelOpen}
        onToggleInspectionPanel={props.onToggleInspectionPanel}
        stabilityRisk={props.telemetry.stabilityRisk}
      />
      <HUDAlerts
        telemetry={props.telemetry}
        onOpenStabilityTriangle={props.onOpenStabilityTriangle}
        onResetPosition={props.onResetPosition}
      />
      <HUDControls
        telemetry={props.telemetry}
        controls={props.controls}
        cameraMode={props.cameraMode}
        onCameraChange={props.onCameraChange}
        onLeverAction={props.onLeverAction}
        onDriveAction={props.onDriveAction}
        onToggleParkingBrake={props.onToggleParkingBrake}
        onToggleLights={props.onToggleLights}
        onHorn={props.onHorn}
        mode={props.mode}
      />
    </>
  );
};
