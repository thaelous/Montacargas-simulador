import React from 'react';
import { Command, X } from 'lucide-react';

interface KeyboardHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardHelpModal: React.FC<KeyboardHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const drivingControls = [
    { key: 'W / S', action: 'Movimiento: Adelante (W) / Atrás - Reversa (S)' },
    { key: 'A / D', action: 'Dirección de ruedas traseras: Giro Izquierda (A) / Derecha (D)' },
    { key: 'X', action: 'Freno de servicio (Freno de pie operativo, o Espacio)' },
    { key: 'R', action: 'Claxon / Bocina acústica de seguridad' },
    { key: 'V', action: 'Luces / Encender o apagar faros delanteros de trabajo' },
    { key: 'P', action: 'Freno de mano / Estacionamiento (Parking Brake toggle)' },
    { key: 'C', action: 'Cambiar modo de cámara (Tercera Persona, Cabina, Horquillas, 360°)' },
  ];

  const hydraulicControls = [
    { key: 'U / J', action: 'Palanca 1: Subir mástil (U) / Bajar mástil (J)' },
    { key: 'I / K', action: 'Palanca 2: Inclinación adelante (I) / Inclinación atrás (K)' },
    { key: 'O / L', action: 'Palanca 3: Desplazamiento lateral izq (O) / der (L)' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl max-w-xl w-full p-4 sm:p-6 text-zinc-100 flex flex-col gap-4 sm:gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Command className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold font-tech uppercase text-white tracking-wide">
                Guía de Controles y Atajos
              </h2>
              <p className="text-xs text-zinc-400">
                Operación dual por teclado físico y mandos táctiles en celular
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

        {/* Driving controls */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-amber-400 font-tech uppercase">
            1. Mandos de Conducción
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {drivingControls.map((c) => (
              <div key={c.key} className="flex items-center justify-between p-2 bg-zinc-900/70 border border-zinc-800/80 rounded-lg text-xs">
                <span className="text-zinc-300">{c.action}</span>
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 text-amber-400 font-mono font-bold rounded shadow-sm">
                  {c.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Hydraulic levers */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-amber-400 font-tech uppercase">
            2. Mandos del Sistema Hidráulico
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {hydraulicControls.map((c) => (
              <div key={c.key} className="flex items-center justify-between p-2 bg-zinc-900/70 border border-zinc-800/80 rounded-lg text-xs">
                <span className="text-zinc-300">{c.action}</span>
                <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 text-amber-400 font-mono font-bold rounded shadow-sm">
                  {c.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Touch & Mobile Controls */}
        <div className="p-3 bg-zinc-900/80 border border-amber-500/30 rounded-xl text-xs text-zinc-300 space-y-1.5">
          <span className="font-bold text-amber-400 font-tech uppercase block">
            3. Gestos Táctiles y Modo Celular (Mobile):
          </span>
          <p>• <strong>1 Dedo:</strong> Arrastre sobre el canvas para rotar la cámara 360° alrededor del equipo.</p>
          <p>• <strong>2 Dedos (Pinch-to-zoom):</strong> Pellizque o abra los dedos para alejar o acercar el zoom.</p>
          <p>• <strong>Cruceta Táctil (D-Pad):</strong> Botones grandes para acelerar (W), reversa (S), giro (A/D) y freno (X).</p>
          <p>• <strong>Mando Hidráulico:</strong> Botones dedicados para Subir/Bajar (U/J) e Inclinar Mástil (I/K).</p>
          <p>• <strong>Vista Limpia:</strong> Toque "Ocultar" en la barra inferior para ver el modelo 3D en pantalla completa.</p>
        </div>
      </div>
    </div>
  );
};
