export type CameraMode = 'chase' | 'cabin' | 'forks' | 'orbit';

export interface ForkliftControls {
  throttle: number; // -1 to 1 (W/S)
  steering: number; // -1 to 1 (A/D)
  brake: boolean; // Tecla X (o Espacio)
  parkingBrake: boolean; // toggle P
  lift: number; // -1 to 1 (U/J)
  tilt: number; // -1 to 1 (I/K)
  sideshift: number; // -1 to 1 (O/L)
  horn: boolean; // Tecla R
  lights: boolean; // Tecla V
}

export interface ForkliftTelemetry {
  speedKmh: number;
  engineRpm: number;
  gear: 'F' | 'N' | 'R';
  forkHeightM: number;
  tiltAngleDeg: number;
  sideshiftM: number;
  parkingBrake: boolean;
  lightsOn: boolean;
  fuelPercent: number;
  hours: number;
  isCarryingPallet: boolean;
  stabilityRisk: 'safe' | 'warning' | 'danger';
  cgOffset: { x: number; y: number; z: number };
  isTippedOver: boolean;
  tipReason?: string;
}

export interface InspectionHotspot {
  id: string;
  name: string;
  nameEn: string;
  category: 'Seguridad' | 'Estructura' | 'Hidráulica' | 'Tren Motriz' | 'Mandos';
  position: [number, number, number];
  targetLookAt: [number, number, number];
  cameraOffset: [number, number, number];
  summary: string;
  functionDesc: string;
  oshaChecklist: string[];
  safetyWarnings: string[];
  specs: { [key: string]: string };
}

export interface TrainingMission {
  id: string;
  title: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  estimatedTime: string;
  objective: string;
  steps: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  completed: boolean;
}
