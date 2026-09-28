import React, { useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  Film,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { TrainingMission } from '../types/forklift';

interface TrainingMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: TrainingMission[];
  currentMissionIndex: number;
  onSelectMission: (index: number) => void;
}

export const TrainingMissionsModal: React.FC<TrainingMissionsModalProps> = ({
  isOpen,
  onClose,
  missions,
  currentMissionIndex,
  onSelectMission,
}) => {
  const [activeTab, setActiveTab] = useState<'missions' | 'catalog'>('missions');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(38); // 38% progress
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  if (!isOpen) return null;

  const currentMission = missions[currentMissionIndex] || missions[0];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/85 backdrop-blur-md select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl max-w-3xl w-full p-4 sm:p-6 text-zinc-100 flex flex-col gap-3.5 sm:gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/90 pb-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-tech uppercase text-white tracking-wide">
                Centro de Capacitación y Certificación Operativa
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                Normativas OSHA 1910.178, Retos de Maniobra y Catálogo de Bitlearning
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-800/70 pb-2 overflow-x-auto scrollbar-thin shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('missions')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold font-tech transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'missions'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-300'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Retos Operativos (Misiones)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold font-tech transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'catalog'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/25 ring-1 ring-amber-300'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Catálogo & Bitlearning de Ergonomía</span>
            <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded text-[10px] font-mono">
              Nuevo
            </span>
          </button>
        </div>

        {/* Tab 1: Practical Missions */}
        {activeTab === 'missions' && (
          <div className="flex flex-col gap-4">
            {/* Mission List */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
              {missions.map((m, idx) => {
                const isSelected = idx === currentMissionIndex;
                return (
                  <button
                    key={m.id}
                    onClick={() => onSelectMission(idx)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md shadow-amber-500/10'
                        : m.completed
                        ? 'bg-zinc-900/60 border-emerald-500/40 text-zinc-300'
                        : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-[10px] font-semibold uppercase text-amber-500 font-tech">
                        Misión 0{idx + 1}
                      </span>
                      {m.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="text-[10px] text-zinc-500">{m.estimatedTime}</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-zinc-100 line-clamp-1">{m.title}</span>
                    <span className="text-[11px] text-zinc-400 mt-1 line-clamp-2">{m.objective}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Mission Active Card */}
            <div className="bg-zinc-900/80 border border-zinc-800/90 p-4 rounded-2xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-400 uppercase font-tech">
                    Dificultad: {currentMission.difficulty} · Tiempo estimado: {currentMission.estimatedTime}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{currentMission.title}</h3>
                </div>
                {currentMission.completed && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold font-tech">
                    <Award className="w-3.5 h-3.5" />
                    <span>COMPLETADA</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">{currentMission.objective}</p>

              {/* Steps checklist */}
              <div className="border-t border-zinc-800/80 pt-3">
                <span className="text-xs font-semibold text-zinc-400 block mb-2 font-tech uppercase">
                  Pasos del Procedimiento Operativo:
                </span>
                <div className="space-y-2">
                  {currentMission.steps.map((st) => (
                    <div key={st.id} className="flex items-start gap-2.5 text-xs">
                      {st.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                      )}
                      <span className={st.completed ? 'text-zinc-400 line-through' : 'text-zinc-200'}>
                        {st.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition-colors font-tech flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Práctica en Simulador</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Catalog & Bitlearning de Ergonomía with Video Thumbnail */}
        {activeTab === 'catalog' && (
          <div className="flex flex-col gap-4 select-text">
            {/* FEATURED: Bitlearning de Ergonomía Card */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-2 border-amber-500/40 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row gap-4">
              {/* VIDEO THUMBNAIL / INTERACTIVE PLAYER */}
              <div className="md:w-5/12 shrink-0 flex flex-col gap-2">
                <div className="relative w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 group shadow-lg">
                  {/* Poster / Thumbnail Graphic */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-zinc-900/60 to-black/30 flex items-center justify-center">
                    {/* Visual 3D Ergonomics Wireframe Diagram Representation */}
                    <div className="absolute inset-0 opacity-40 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-amber-400/60 flex items-center justify-center animate-spin-slow">
                        <div className="w-16 h-16 rounded-full border border-blue-400/60" />
                      </div>
                    </div>

                    {/* Play/Pause Central Trigger Button */}
                    <button
                      onClick={() => setIsVideoPlaying((p) => !p)}
                      className="relative z-10 w-12 h-12 rounded-full bg-amber-500/90 hover:bg-amber-400 text-zinc-950 flex items-center justify-center shadow-xl shadow-amber-500/40 transition-transform group-hover:scale-110 cursor-pointer"
                      title={isVideoPlaying ? 'Pausar video' : 'Reproducir video de ergonomía'}
                    >
                      {isVideoPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Video Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                    <span className="px-2 py-0.5 bg-red-600/90 text-white rounded text-[10px] font-bold font-tech uppercase tracking-wider shadow">
                      Bitlearning HD
                    </span>
                    <span className="px-1.5 py-0.5 bg-black/70 text-zinc-300 rounded text-[10px] font-mono">
                      1080p
                    </span>
                  </div>

                  <div className="absolute top-2 right-2 z-10">
                    <span className="px-2 py-0.5 bg-amber-500/90 text-zinc-950 font-bold rounded text-[10px] font-tech uppercase">
                      Ergonomía OSHA
                    </span>
                  </div>

                  {/* Bottom Video Progress & Controls Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 to-transparent p-2 z-10 flex flex-col gap-1">
                    {/* Scrub Bar */}
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                        setVideoProgress(Math.min(100, Math.max(0, pct)));
                      }}
                      className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden cursor-pointer"
                    >
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-150"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-300">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">01:25 / 03:45</span>
                        {isVideoPlaying && (
                          <span className="text-[9px] text-emerald-400 font-bold animate-pulse">● En vivo</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setIsVideoMuted((m) => !m)}
                          className="hover:text-white transition-colors"
                        >
                          {isVideoMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3" />}
                        </button>
                        <span className="font-mono text-[9px] bg-zinc-800 px-1 rounded">1.0x</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Duración: 3 min 45 s</span>
                  </span>
                  <span className="text-zinc-500">Formato Microlearning</span>
                </div>
              </div>

              {/* Resource Content Info */}
              <div className="flex-1 flex flex-col justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase font-tech text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      Recurso Audiovisual Acreditado
                    </span>
                    <span className="text-[10px] text-zinc-400">Norma ISO 2631 / OSHA 1910</span>
                  </div>

                  <h3 className="text-base font-bold text-white font-tech">
                    Bitlearning: Ergonomía y Postura Operativa en Montacargas
                  </h3>

                  <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                    Micro-cápsula interactiva orientada a la prevención de fatiga neuromuscular, trastornos músculo-esqueléticos
                    y reducción de vibraciones de cuerpo entero (WBV) en turnos continuos de manejo.
                  </p>
                </div>

                {/* 4 Pillars of Ergonomics */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/80">
                    <div className="font-bold text-amber-400 font-tech text-[11px]">1. Asiento Amortiguado</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                      Regulación por peso corporal y ángulo de 90° en rodillas y caderas.
                    </div>
                  </div>

                  <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/80">
                    <div className="font-bold text-amber-400 font-tech text-[11px]">2. Pomo Giratorio (9:00)</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                      Agarre ergonómico con mano izquierda; mínimo esfuerzo de muñeca.
                    </div>
                  </div>

                  <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/80">
                    <div className="font-bold text-amber-400 font-tech text-[11px]">3. Rotación en Reversa</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                      Giro completo de cintura con apoyo en asidero, protegiendo cervicales.
                    </div>
                  </div>

                  <div className="bg-zinc-950/80 p-2 rounded-xl border border-zinc-800/80">
                    <div className="font-bold text-amber-400 font-tech text-[11px]">4. Regla de 3 Puntos</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                      Acceso seguro a cabina sin saltar para evitar sobrecargas articulares.
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setIsVideoPlaying((p) => !p)}
                    className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl font-tech flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isVideoPlaying ? 'Pausar Reproducción' : 'Ver Video de Ergonomía'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Catalog Resources Grid */}
            <div className="border-t border-zinc-800/80 pt-3">
              <span className="text-xs font-bold text-zinc-300 font-tech uppercase tracking-wide block mb-2.5">
                Guías Técnicas y Recursos Descargables del Catálogo:
              </span>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex flex-col justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-blue-400 font-mono">GUÍA TÉCNICA #01</span>
                    <h4 className="font-bold text-white text-xs mt-0.5">Triángulo de Estabilidad OSHA</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      Cálculo dinámico de fulcro, momento de vuelco y fuerzas centrífugas en curvas.
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold font-tech">✓ Incluido en Simulador</span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex flex-col justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 font-mono">MANUAL #02</span>
                    <h4 className="font-bold text-white text-xs mt-0.5">Manejo Seguro de Gas LP</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      Inspección de tanque, válvulas de alivio, protocolo de fugas y cambio de cilindro.
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold font-tech">✓ Incluido en Módulo 360°</span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl flex flex-col justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-red-400 font-mono">CHECKLIST #03</span>
                    <h4 className="font-bold text-white text-xs mt-0.5">Inspección de Horquillas y Talón</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      Regla de tolerancia del 10% de desgaste y pruebas de líquidos penetrantes.
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold font-tech">✓ Certificación OSHA</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

