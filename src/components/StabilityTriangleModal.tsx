import React from 'react';
import { AlertCircle, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { ForkliftTelemetry } from '../types/forklift';

interface StabilityTriangleModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: ForkliftTelemetry;
}

export const StabilityTriangleModal: React.FC<StabilityTriangleModalProps> = ({
  isOpen,
  onClose,
  telemetry,
}) => {
  if (!isOpen) return null;

  // Normalized coordinates for CG dot on SVG canvas (280x280)
  // Triangle coordinates:
  // Front Left wheel: (60, 220)
  // Front Right wheel: (220, 220)
  // Rear Steer Pivot: (140, 50)
  const trianglePoints = '60,220 220,220 140,50';

  // Calculate CG dot position from telemetry offsets
  // z: 0.35 -> base, negative moves toward front (Y down on SVG), positive toward rear (Y up on SVG)
  // x: lateral offset (-0.5 to 0.5)
  const cgSvgX = 140 + telemetry.cgOffset.x * 120;
  // z maps from [-1.2 (very forward) to 0.6 (very rear)] -> [230 to 70]
  const cgSvgY = 160 - (telemetry.cgOffset.z - 0.2) * 90;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 text-zinc-100 flex flex-col gap-4 sm:gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-6 bg-amber-500 rounded-sm" />
            <div>
              <h2 className="text-sm sm:text-base font-bold font-tech uppercase text-white tracking-wide">
                Física del Triángulo de Estabilidad
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                Principio Fundamental de Seguridad y Centro de Gravedad en Montacargas
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

        {/* Interactive Diagram & Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">
          {/* SVG Stability Triangle Canvas */}
          <div className="flex flex-col items-center bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl relative">
            <span className="text-xs font-semibold text-zinc-400 mb-2 font-tech uppercase">
              Monitoreo en Tiempo Real del CG
            </span>

            <svg viewBox="0 0 280 280" className="w-64 h-64">
              {/* Outer boundary buffer */}
              <polygon points="45,230 235,230 140,35" fill="none" stroke="#27272a" strokeWidth="2" strokeDasharray="4 4" />

              {/* The Stability Triangle (Base) */}
              <polygon
                points={trianglePoints}
                fill="rgba(245, 158, 11, 0.08)"
                stroke="#f59e0b"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              {/* Wheels Representations */}
              {/* Front Left Drive Wheel */}
              <rect x="42" y="210" width="36" height="20" rx="3" fill="#3f3f46" stroke="#71717a" strokeWidth="2" />
              <text x="35" y="245" fill="#a1a1aa" fontSize="10" fontWeight="bold">Rueda Del. Izq</text>

              {/* Front Right Drive Wheel */}
              <rect x="202" y="210" width="36" height="20" rx="3" fill="#3f3f46" stroke="#71717a" strokeWidth="2" />
              <text x="195" y="245" fill="#a1a1aa" fontSize="10" fontWeight="bold">Rueda Del. Der</text>

              {/* Rear Steer Axle Pivot (Muñón Central) */}
              <circle cx="140" cy="50" r="10" fill="#3f3f46" stroke="#71717a" strokeWidth="2" />
              <text x="140" y="30" fill="#a1a1aa" fontSize="10" fontWeight="bold" textAnchor="middle">
                Pivote Eje Trasero
              </text>

              {/* Fulcrum Line (Front Axle) */}
              <line x1="60" y1="220" x2="220" y2="220" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 3" />
              <text x="140" y="215" fill="#f43f5e" fontSize="9" textAnchor="middle">
                LÍNEA DE FULCRO (Punto de Vuelco Frontal)
              </text>

              {/* Real-time Dynamic CG Dot */}
              <circle
                cx={Math.max(20, Math.min(260, cgSvgX))}
                cy={Math.max(20, Math.min(260, cgSvgY))}
                r="9"
                fill={
                  telemetry.stabilityRisk === 'danger'
                    ? '#ef4444'
                    : telemetry.stabilityRisk === 'warning'
                    ? '#f59e0b'
                    : '#10b981'
                }
                stroke="#ffffff"
                strokeWidth="2.5"
                className="transition-all duration-150"
              />
              <circle
                cx={Math.max(20, Math.min(260, cgSvgX))}
                cy={Math.max(20, Math.min(260, cgSvgY))}
                r="16"
                fill="none"
                stroke={
                  telemetry.stabilityRisk === 'danger'
                    ? '#ef4444'
                    : telemetry.stabilityRisk === 'warning'
                    ? '#f59e0b'
                    : '#10b981'
                }
                strokeWidth="1.5"
                opacity="0.6"
                className="animate-ping"
              />
            </svg>

            {/* Current Risk Level Badge */}
            <div
              className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                telemetry.stabilityRisk === 'danger'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                  : telemetry.stabilityRisk === 'warning'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
              }`}
            >
              {telemetry.stabilityRisk === 'danger'
                ? '¡RIESGO DE VOLCADURA!'
                : telemetry.stabilityRisk === 'warning'
                ? 'PRECAUCIÓN DE ESTABILIDAD'
                : 'ZONA DE ESTABILIDAD SEGURA'}
            </div>
          </div>

          {/* Educational Explanatory Notes */}
          <div className="space-y-3.5 text-xs text-zinc-300">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">
                ¿Por qué es un triángulo si el montacargas tiene 4 ruedas?
              </h3>
              <p className="leading-relaxed">
                El eje trasero de dirección está montado sobre un único perno pivote (muñón central oscilante) en el chasis. Por lo tanto, el soporte geométrico de tres puntos forma un <strong className="text-amber-400">triángulo</strong> cuyos vértices son las dos ruedas motrices delanteras y el pivote central trasero.
              </p>
            </div>

            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1.5">
              <span className="font-semibold text-white block">Reglas de Oro de Estabilidad (OSHA):</span>
              <ul className="space-y-1 text-zinc-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500">•</span>
                  <span><strong>Altura de transporte:</strong> Traslade siempre la carga a 10-15 cm (4-6 pulgadas) del suelo con el mástil inclinado hacia atrás.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500">•</span>
                  <span><strong>Mástil elevado:</strong> A mayor elevación, el CG sube drásticamente, haciendo al equipo altamente vulnerable a volcarse con el menor giro.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500">•</span>
                  <span><strong>Curvas cerradas:</strong> Disminuya la velocidad antes de doblar; la fuerza centrífuga empuja el CG fuera del triángulo.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>
            Si el punto de gravedad sale de los límites del triángulo, el montacargas volcará de manera inevitable.
          </span>
        </div>
      </div>
    </div>
  );
};
