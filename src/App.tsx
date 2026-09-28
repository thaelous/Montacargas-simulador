import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { CameraMode, ForkliftControls, ForkliftTelemetry, InspectionHotspot, TrainingMission } from './types/forklift';
import { buildWarehouseScene, CollisionBox, PalletObject } from './simulation/warehouse';
import { buildForkliftModel, ForkliftModelData, INSPECTION_HOTSPOTS } from './simulation/forkliftModel';
import { ForkliftPhysicsEngine } from './simulation/physicsEngine';
import { forkliftAudio } from './simulation/sound';
import { HUDHeader, HUDControls, HUDAlerts } from './components/HUD';
import { InspectionPanel } from './components/InspectionPanel';
import { KeyboardHelpModal } from './components/KeyboardHelpModal';
import { StabilityTriangleModal } from './components/StabilityTriangleModal';
import { TrainingMissionsModal } from './components/TrainingMissionsModal';
import { Wrench } from 'lucide-react';

const DEFAULT_MISSIONS: TrainingMission[] = [
  {
    id: 'm1_inspection',
    title: 'Inspección Pre-Operacional 360° (OSHA)',
    difficulty: 'Básico',
    estimatedTime: '3 min',
    objective: 'Efectuar la ronda de inspección visual obligatoria antes de operar el equipo, revisando el mástil, horquillas, extintor y neumáticos.',
    steps: [
      { id: 's1', text: 'Cambiar al "Modo Inspección" desde la barra superior', completed: false },
      { id: 's2', text: 'Inspeccionar las Horquillas y el Mástil hidráulico', completed: false },
      { id: 's3', text: 'Comprobar el Extintor de incendios y la Cabina ROPS', completed: false },
      { id: 's4', text: 'Verificar el Contrapeso y el tanque de combustible GLP', completed: false },
    ],
    completed: false,
  },
  {
    id: 'm2_driving',
    title: 'Conducción y Circulación Segura',
    difficulty: 'Básico',
    estimatedTime: '4 min',
    objective: 'Conducir por el pasillo central del almacén manteniendo la altura segura de transporte (a ras de suelo, < 35 cm) y activar el claxon en cruces.',
    steps: [
      { id: 's1', text: 'Quitar freno de mano (Tecla P o X)', completed: false },
      { id: 's2', text: 'Acelerar hacia adelante con tecla W manteniendo el rumbo', completed: false },
      { id: 's3', text: 'Sonar el claxon (Tecla R) para alertar peatones en pasillo', completed: false },
      { id: 's4', text: 'Mantener las horquillas a nivel de piso (< 0.35m)', completed: false },
    ],
    completed: false,
  },
  {
    id: 'm3_pallet',
    title: 'Enganche y Elevación de Tarima',
    difficulty: 'Intermedio',
    estimatedTime: '5 min',
    objective: 'Alinear las horquillas con la tarima de madera en el almacén, ingresar suavemente e inclinar el mástil hacia atrás antes de elevar.',
    steps: [
      { id: 's1', text: 'Aproximarse a la tarima con velocidad controlada', completed: false },
      { id: 's2', text: 'Ingresar las horquillas y asegurar la carga (Pallet enganchado)', completed: false },
      { id: 's3', text: 'Elevar la carga a más de 0.5m del suelo (Tecla U)', completed: false },
      { id: 's4', text: 'Inclinar el mástil hacia atrás para retener el pallet (Tecla K)', completed: false },
    ],
    completed: false,
  },
  {
    id: 'm4_stability',
    title: 'Control del Triángulo de Estabilidad',
    difficulty: 'Avanzado',
    estimatedTime: '5 min',
    objective: 'Analizar la física del Centro de Gravedad (CG). Observar cómo al elevar la carga o virar rápidamente el CG se desplaza hacia los límites del triángulo.',
    steps: [
      { id: 's1', text: 'Abrir el monitor del "Triángulo de Estabilidad (OSHA)"', completed: false },
      { id: 's2', text: 'Elevar el mástil a más de 2.0 metros para observar la subida del CG', completed: false },
      { id: 's3', text: 'Bajar las horquillas a ras de piso para restaurar la zona segura', completed: false },
      { id: 's4', text: 'Realizar una maniobra de frenado controlado sin volcar', completed: false },
    ],
    completed: false,
  },
];

const INITIAL_TELEMETRY: ForkliftTelemetry = {
  speedKmh: 0,
  engineRpm: 750,
  gear: 'N',
  forkHeightM: 0.0, // A ras de piso
  tiltAngleDeg: 2.8,
  sideshiftM: 0,
  parkingBrake: false,
  lightsOn: true,
  fuelPercent: 88,
  hours: 1248.4,
  isCarryingPallet: false,
  stabilityRisk: 'safe',
  cgOffset: { x: 0, y: 0.65, z: 0.35 },
  isTippedOver: false,
  tipReason: '',
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);

  // Application State
  const [telemetry, setTelemetry] = useState<ForkliftTelemetry>(INITIAL_TELEMETRY);
  const [cameraMode, setCameraMode] = useState<CameraMode>('chase');
  const cameraModeRef = useRef<CameraMode>('chase');

  // Exactly TWO Modes: 'driving' (Manejo) vs 'inspection' (Inspección 360°)
  const [mode, setMode] = useState<'driving' | 'inspection'>('driving');
  const modeRef = useRef<'driving' | 'inspection'>('driving');

  // Toggle for 3D Floating Labels in Inspection Mode
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const showLabelsRef = useRef<boolean>(true);

  // Selected technical component for technical sheet & industrial safety questions
  const [selectedHotspot, setSelectedHotspot] = useState<InspectionHotspot | null>(null);
  const [isInspectionPanelOpen, setIsInspectionPanelOpen] = useState<boolean>(true);

  // Screen projected coordinates of 3D hotspots for floating badges
  const [screenHotspots, setScreenHotspots] = useState<
    { spot: InspectionHotspot; x: number; y: number; visible: boolean; index: number }[]
  >([]);

  // Modals
  const [isHelpModalOpen, setIsHelpModalOpen] = useState<boolean>(false);
  const [isStabilityModalOpen, setIsStabilityModalOpen] = useState<boolean>(false);
  const [isMissionsModalOpen, setIsMissionsModalOpen] = useState<boolean>(false);
  const [missions, setMissions] = useState<TrainingMission[]>(DEFAULT_MISSIONS);
  const [currentMissionIndex, setCurrentMissionIndex] = useState<number>(0);

  // Controls State and Reference
  const [activeControls, setActiveControls] = useState<ForkliftControls>({
    throttle: 0,
    steering: 0,
    brake: false,
    parkingBrake: false,
    lift: 0,
    tilt: 0,
    sideshift: 0,
    horn: false,
    lights: true,
  });

  const controlsRef = useRef<ForkliftControls>({
    throttle: 0,
    steering: 0,
    brake: false,
    parkingBrake: false,
    lift: 0,
    tilt: 0,
    sideshift: 0,
    horn: false,
    lights: true,
  });

  // Dynamic Training Mission Progress Tracking
  useEffect(() => {
    setMissions((prevMissions) => {
      let changed = false;
      const updated = prevMissions.map((mission) => {
        const steps = mission.steps.map((st) => {
          let done = st.completed;
          if (mission.id === 'm1_inspection') {
            if (st.id === 's1' && mode === 'inspection') done = true;
            if (st.id === 's2' && (selectedHotspot?.id === 'forks_carriage' || selectedHotspot?.id === 'mast_assembly')) done = true;
            if (st.id === 's3' && (selectedHotspot?.id === 'fire_extinguisher' || selectedHotspot?.id === 'rops_cabin')) done = true;
            if (st.id === 's4' && (selectedHotspot?.id === 'counterweight_fuel' || selectedHotspot?.id === 'engine_exhaust')) done = true;
          } else if (mission.id === 'm2_driving') {
            if (st.id === 's1' && !telemetry.parkingBrake) done = true;
            if (st.id === 's2' && Math.abs(telemetry.speedKmh) > 1.5) done = true;
            if (st.id === 's3' && activeControls.horn) done = true;
            if (st.id === 's4' && telemetry.forkHeightM <= 0.35 && Math.abs(telemetry.speedKmh) > 1.0) done = true;
          } else if (mission.id === 'm3_pallet') {
            if (st.id === 's1' && Math.abs(telemetry.speedKmh) > 0.5) done = true;
            if (st.id === 's2' && telemetry.isCarryingPallet) done = true;
            if (st.id === 's3' && telemetry.isCarryingPallet && telemetry.forkHeightM > 0.45) done = true;
            if (st.id === 's4' && telemetry.isCarryingPallet && telemetry.tiltAngleDeg > 3.0) done = true;
          } else if (mission.id === 'm4_stability') {
            if (st.id === 's1' && isStabilityModalOpen) done = true;
            if (st.id === 's2' && telemetry.forkHeightM > 2.0) done = true;
            if (st.id === 's3' && telemetry.forkHeightM < 0.25) done = true;
            if (st.id === 's4' && !telemetry.isTippedOver && Math.abs(telemetry.speedKmh) > 2.0) done = true;
          }
          if (done !== st.completed) changed = true;
          return { ...st, completed: done };
        });
        const isAllDone = steps.every((s) => s.completed);
        if (isAllDone !== mission.completed) changed = true;
        return { ...mission, steps, completed: isAllDone };
      });
      return changed ? updated : prevMissions;
    });
  }, [
    mode,
    selectedHotspot,
    telemetry.parkingBrake,
    telemetry.speedKmh,
    telemetry.forkHeightM,
    telemetry.tiltAngleDeg,
    telemetry.isCarryingPallet,
    telemetry.isTippedOver,
    activeControls.horn,
    isStabilityModalOpen,
  ]);

  // Sync references
  useEffect(() => {
    cameraModeRef.current = cameraMode;
  }, [cameraMode]);

  useEffect(() => {
    modeRef.current = mode;
    if (hotspotGroupRef.current) {
      hotspotGroupRef.current.visible = mode === 'inspection' && showLabels;
    }
  }, [mode, showLabels]);

  useEffect(() => {
    showLabelsRef.current = showLabels;
    if (hotspotGroupRef.current) {
      hotspotGroupRef.current.visible = mode === 'inspection' && showLabels;
    }
  }, [showLabels, mode]);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const physicsRef = useRef<ForkliftPhysicsEngine | null>(null);
  const forkliftModelRef = useRef<ForkliftModelData | null>(null);
  const collisionBoxesRef = useRef<CollisionBox[]>([]);
  const palletsRef = useRef<PalletObject[]>([]);
  const hotspotGroupRef = useRef<THREE.Group | null>(null);
  const hotspotMarkersRef = useRef<{ mesh: THREE.Mesh; spot: InspectionHotspot }[]>([]);
  const chaseLookTargetRef = useRef<THREE.Vector3 | null>(null);

  // Orbit / Interaction State with smooth dynamic auto-centering
  const orbitStateRef = useRef<{
    isDragging: boolean;
    prevX: number;
    prevY: number;
    // Current interpolated state
    theta: number;
    phi: number;
    distance: number;
    target: THREE.Vector3;
    // Target animation values
    targetTheta: number;
    targetPhi: number;
    targetDistance: number;
    targetLookAt: THREE.Vector3;
  }>({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    theta: 0.65,
    phi: Math.PI / 3,
    distance: 5.8,
    target: new THREE.Vector3(0, 1.15, 0),
    targetTheta: 0.65,
    targetPhi: Math.PI / 3,
    targetDistance: 5.8,
    targetLookAt: new THREE.Vector3(0, 1.15, 0),
  });

  // Dynamic Canvas Resizing to Free Space
  const updateCanvasDimensions = useCallback(() => {
    if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;
    if (w > 0 && h > 0) {
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h, false);
      if (rendererRef.current.domElement) {
        rendererRef.current.domElement.style.width = '100%';
        rendererRef.current.domElement.style.height = '100%';
      }
    }
  }, []);

  // Recalculate and trigger canvas resizing when mode or sidebar visibility toggles
  useEffect(() => {
    updateCanvasDimensions();
    const t1 = setTimeout(updateCanvasDimensions, 50);
    const t2 = setTimeout(updateCanvasDimensions, 150);
    const t3 = setTimeout(updateCanvasDimensions, 320);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [mode, isInspectionPanelOpen, updateCanvasDimensions]);

  // 1. Initialize Three.js Scene and Forklift Simulation
  useEffect(() => {
    if (!mountRef.current) return;

    const w = Math.max(mountRef.current.clientWidth, 320);
    const h = Math.max(mountRef.current.clientHeight, 240);

    // Scene setup with high-visibility slate industrial background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x181e28);
    scene.fog = new THREE.Fog(0x181e28, 28, 80);
    sceneRef.current = scene;

    // Camera focused squarely on the forklift at origin
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 150);
    camera.position.set(0, 3.2, 7.5);
    camera.lookAt(0, 1.15, 0);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Ample Industrial Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x475569, 1.5);
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const mainSun = new THREE.DirectionalLight(0xfff8eb, 2.2);
    mainSun.position.set(12, 22, 10);
    mainSun.castShadow = true;
    mainSun.shadow.mapSize.width = 2048;
    mainSun.shadow.mapSize.height = 2048;
    mainSun.shadow.camera.near = 1;
    mainSun.shadow.camera.far = 60;
    const d = 24;
    mainSun.shadow.camera.left = -d;
    mainSun.shadow.camera.right = d;
    mainSun.shadow.camera.top = d;
    mainSun.shadow.camera.bottom = -d;
    mainSun.shadow.bias = -0.0005;
    scene.add(mainSun);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.1);
    fillLight.position.set(-12, 14, -10);
    scene.add(fillLight);

    // Warehouse Scene Build
    const warehouseData = buildWarehouseScene();
    scene.add(warehouseData.group);
    collisionBoxesRef.current = warehouseData.collisionBoxes;
    palletsRef.current = warehouseData.pallets;

    // Forklift 3D Model Build
    const forkliftData = buildForkliftModel();
    scene.add(forkliftData.rootGroup);
    forkliftModelRef.current = forkliftData;

    // Physics Engine
    const physics = new ForkliftPhysicsEngine(0);
    physicsRef.current = physics;

    // Build Hotspot Visual Markers on Forklift for Inspection Mode
    const hotspotGroup = new THREE.Group();
    hotspotGroup.name = 'Hotspot_Markers';
    const markers: { mesh: THREE.Mesh; spot: InspectionHotspot }[] = [];

    const markerMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.85,
    });
    const markerGlowMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.4,
    });

    for (let spot of INSPECTION_HOTSPOTS) {
      const marker = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), markerMat);
      marker.position.set(...spot.position);

      const glow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), markerGlowMat);
      marker.add(glow);

      hotspotGroup.add(marker);
      markers.push({ mesh: marker, spot });
    }

    hotspotGroup.visible = false; // Solo visible en Modo Inspección
    forkliftData.rootGroup.add(hotspotGroup);
    hotspotGroupRef.current = hotspotGroup;
    hotspotMarkersRef.current = markers;

    // Browser audio unlock on first user gesture
    const unlockAudio = () => {
      forkliftAudio.init();
      forkliftAudio.resume();
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    // ResizeObserver: monitors clientWidth/clientHeight changes of mountRef
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasDimensions();
    });
    resizeObserver.observe(mountRef.current);
    window.addEventListener('resize', updateCanvasDimensions);

    // Animation Loop
    let lastTime = performance.now();
    let animId: number;

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);
      const dt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      // Update Physics & Kinematics
      if (physicsRef.current && forkliftModelRef.current) {
        const tele = physicsRef.current.update(
          dt,
          controlsRef.current,
          forkliftModelRef.current,
          collisionBoxesRef.current,
          palletsRef.current,
        );
        setTelemetry(tele);
      }

      // Update Camera Choreography
      updateCameraChoreography(dt);

      // Pulse Hotspot Markers ONLY when inspection mode is active and visible
      if (hotspotGroupRef.current?.visible && hotspotMarkersRef.current.length > 0) {
        const pulse = 1 + Math.sin(currentTime * 0.005) * 0.2;
        hotspotMarkersRef.current.forEach((m) => {
          m.mesh.scale.set(pulse, pulse, pulse);
        });
      }

      // Project 3D Hotspot Coordinates for Interactive Floating Labels (Modo Inspección)
      if (
        cameraRef.current &&
        mountRef.current &&
        forkliftModelRef.current &&
        modeRef.current === 'inspection' &&
        showLabelsRef.current
      ) {
        const canvasW = mountRef.current.clientWidth;
        const canvasH = mountRef.current.clientHeight;
        const root = forkliftModelRef.current.rootGroup;
        const cam = cameraRef.current;

        const projected = INSPECTION_HOTSPOTS.map((spot, idx) => {
          const p = new THREE.Vector3(...spot.position);
          root.localToWorld(p);
          p.project(cam);

          const isBehind = p.z > 1.0;
          const sx = (p.x * 0.5 + 0.5) * canvasW;
          const sy = (-(p.y * 0.5) + 0.5) * canvasH;

          return {
            spot,
            x: sx,
            y: sy,
            visible: !isBehind && sx >= 20 && sx <= canvasW - 20 && sy >= 20 && sy <= canvasH - 20,
            index: idx + 1,
          };
        });

        setScreenHotspots(projected);
      } else if (modeRef.current === 'driving' && screenHotspots.length > 0) {
        setScreenHotspots([]);
      }

      // Render Frame
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateCanvasDimensions);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      if (rendererRef.current && rendererRef.current.domElement && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [updateCanvasDimensions]);

  // 2. Camera Choreography (Chase, Cabin, Forks, Orbit)
  const updateCameraChoreography = (dt: number) => {
    if (!cameraRef.current || !physicsRef.current || !forkliftModelRef.current) return;

    const camera = cameraRef.current;
    const physics = physicsRef.current;
    const forkliftRoot = forkliftModelRef.current.rootGroup;
    const currentMode = cameraModeRef.current;

    if (currentMode === 'chase') {
      // Third-person vehicle chase camera: dynamic camera-follow logic keeping the forklift
      // permanently visible in the unobstructed central-left viewport, clear of all HUD panels!
      const followDist = 6.6;
      const followHeight = 2.9;

      // Right vector perpendicular to vehicle heading
      const rightHeading = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), physics.rotationY);

      // Camera position offset in forklift heading frame:
      // Offset slightly to the left (-0.55m) and behind (+followDist)
      const offsetLocal = new THREE.Vector3(-0.55, followHeight, followDist);
      offsetLocal.applyAxisAngle(new THREE.Vector3(0, 1, 0), physics.rotationY);

      const targetCamPos = physics.position.clone().add(offsetLocal);
      camera.position.lerp(targetCamPos, Math.min(1, dt * 6.5));

      // Focal look target:
      // By aiming slightly to the right of the forklift (+0.70m), the vehicle itself is projected
      // into the central-left area of the screen (around 42% of width).
      // By aiming at Y ~ 0.90m while camera is at Y ~ 2.9m, the vehicle projects safely above the bottom cluster and D-pad!
      const targetLook = physics.position.clone()
        .add(new THREE.Vector3(0, 0.90, 0))
        .add(rightHeading.clone().multiplyScalar(0.70));

      if (!chaseLookTargetRef.current) {
        chaseLookTargetRef.current = targetLook.clone();
      } else {
        chaseLookTargetRef.current.lerp(targetLook, Math.min(1, dt * 7.5));
      }

      camera.lookAt(chaseLookTargetRef.current);
    } else if (currentMode === 'cabin') {
      // First-person view from the operator's eye level
      const eyeLocal = new THREE.Vector3(0, 1.62, 0.28);
      const eyeWorld = eyeLocal.clone();
      forkliftRoot.localToWorld(eyeWorld);
      camera.position.lerp(eyeWorld, Math.min(1, dt * 14.0));

      const lookForwardLocal = new THREE.Vector3(0, 1.30, -4.0);
      const lookWorld = lookForwardLocal.clone();
      forkliftRoot.localToWorld(lookWorld);
      camera.lookAt(lookWorld);
    } else if (currentMode === 'forks') {
      // Close-up camera pointing directly at the fork carriage and tips
      const forkCamLocal = new THREE.Vector3(0, physics.forkHeight + 1.2, -1.8);
      const forkCamWorld = forkCamLocal.clone();
      forkliftRoot.localToWorld(forkCamWorld);
      camera.position.lerp(forkCamWorld, Math.min(1, dt * 10.0));

      const tipLookLocal = new THREE.Vector3(0, physics.forkHeight + 0.1, -2.6);
      const tipLookWorld = tipLookLocal.clone();
      forkliftRoot.localToWorld(tipLookWorld);
      camera.lookAt(tipLookWorld);
    } else if (currentMode === 'orbit') {
      // 360° Free orbit camera with dynamic auto-centering on the forklift
      const orbit = orbitStateRef.current;
      const lerpSpeed = Math.min(1, dt * 6.0);

      // In driving mode, apply dynamic compensation so the forklift sits in the central-left zone away from the hydraulic deck
      if (modeRef.current === 'driving') {
        const rightVec = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), physics.rotationY);
        const desiredFocal = physics.position.clone()
          .add(new THREE.Vector3(0, 1.0, 0))
          .add(rightVec.clone().multiplyScalar(0.65));
        orbit.targetLookAt.copy(desiredFocal);
      }

      // Smoothly update target focal point
      orbit.target.lerp(orbit.targetLookAt, lerpSpeed);

      // Smoothly update distance
      orbit.distance += (orbit.targetDistance - orbit.distance) * lerpSpeed;

      // Smoothly update angles if not dragging
      if (!orbit.isDragging) {
        let diffTheta = (orbit.targetTheta - orbit.theta) % (Math.PI * 2);
        if (diffTheta > Math.PI) diffTheta -= Math.PI * 2;
        if (diffTheta < -Math.PI) diffTheta += Math.PI * 2;
        orbit.theta += diffTheta * lerpSpeed;

        orbit.phi += (orbit.targetPhi - orbit.phi) * lerpSpeed;
      }

      const x = orbit.distance * Math.sin(orbit.phi) * Math.sin(orbit.theta);
      const y = orbit.distance * Math.cos(orbit.phi);
      const z = orbit.distance * Math.sin(orbit.phi) * Math.cos(orbit.theta);

      const targetCamPos = orbit.target.clone().add(new THREE.Vector3(x, y, z));
      camera.position.lerp(targetCamPos, Math.min(1, dt * 10.0));
      camera.lookAt(orbit.target);
    }
  };

  // 3. Reconfigured Keyboard Event Handlers (Exact specifications)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      forkliftAudio.init();
      forkliftAudio.resume();
      if (e.repeat) return;
      const key = e.key.toLowerCase();

      switch (key) {
        // --- 1. Movimiento del montacargas ---
        case 'w':
        case 'arrowup':
          controlsRef.current.throttle = 1; // Adelante: Tecla W
          setActiveControls((prev) => ({ ...prev, throttle: 1 }));
          break;
        case 's':
        case 'arrowdown':
          controlsRef.current.throttle = -1; // Atrás: Tecla S
          setActiveControls((prev) => ({ ...prev, throttle: -1 }));
          break;
        case 'a':
        case 'arrowleft':
          controlsRef.current.steering = -1; // Izquierda: Tecla A
          setActiveControls((prev) => ({ ...prev, steering: -1 }));
          break;
        case 'd':
        case 'arrowright':
          controlsRef.current.steering = 1; // Derecha: Tecla D
          setActiveControls((prev) => ({ ...prev, steering: 1 }));
          break;

        // --- 2. Sistemas y Funciones ---
        case 'x':
        case ' ': // Espacio como soporte secundario
          controlsRef.current.brake = true; // Freno: Tecla X
          setActiveControls((prev) => ({ ...prev, brake: true }));
          break;
        case 'r':
          // Claxon: Tecla R
          controlsRef.current.horn = true;
          setActiveControls((prev) => ({ ...prev, horn: true }));
          forkliftAudio.setHorn(true);
          break;
        case 'v':
          // Luces: Tecla V
          if (physicsRef.current) {
            physicsRef.current.lightsActive = !physicsRef.current.lightsActive;
            setActiveControls((prev) => ({ ...prev, lights: !prev.lights }));
          }
          break;
        case 'p':
          // Freno de mano toggle
          if (physicsRef.current) {
            physicsRef.current.parkingBrakeActive = !physicsRef.current.parkingBrakeActive;
            setActiveControls((prev) => ({ ...prev, parkingBrake: !prev.parkingBrake }));
          }
          break;

        // --- 3. Sistema Hidráulico (Mástil y Horquillas) ---
        case 'u':
          // Subir (Elevación arriba): Tecla U
          controlsRef.current.lift = 1;
          setActiveControls((prev) => ({ ...prev, lift: 1 }));
          break;
        case 'j':
          // Bajar (Elevación abajo): Tecla J
          controlsRef.current.lift = -1;
          setActiveControls((prev) => ({ ...prev, lift: -1 }));
          break;
        case 'i':
          // Adelante (Inclinación adelante): Tecla I
          controlsRef.current.tilt = 1;
          setActiveControls((prev) => ({ ...prev, tilt: 1 }));
          break;
        case 'k':
          // Atrás (Inclinación atrás): Tecla K
          controlsRef.current.tilt = -1;
          setActiveControls((prev) => ({ ...prev, tilt: -1 }));
          break;
        case 'o':
          // Desplazar a la izquierda (Side shift izq): Tecla O
          controlsRef.current.sideshift = -1;
          setActiveControls((prev) => ({ ...prev, sideshift: -1 }));
          break;
        case 'l':
          // Desplazar a la derecha (Side shift der): Tecla L
          controlsRef.current.sideshift = 1;
          setActiveControls((prev) => ({ ...prev, sideshift: 1 }));
          break;

        // Modo de cámara
        case 'c':
          cycleCamera();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      switch (key) {
        // Movimiento
        case 'w':
        case 's':
        case 'arrowup':
        case 'arrowdown':
          controlsRef.current.throttle = 0;
          setActiveControls((prev) => ({ ...prev, throttle: 0 }));
          break;
        case 'a':
        case 'd':
        case 'arrowleft':
        case 'arrowright':
          controlsRef.current.steering = 0;
          setActiveControls((prev) => ({ ...prev, steering: 0 }));
          break;

        // Sistemas y Funciones
        case 'x':
        case ' ':
          controlsRef.current.brake = false;
          setActiveControls((prev) => ({ ...prev, brake: false }));
          break;
        case 'r':
          controlsRef.current.horn = false;
          setActiveControls((prev) => ({ ...prev, horn: false }));
          forkliftAudio.setHorn(false);
          break;

        // Sistema Hidráulico
        case 'u':
        case 'j':
          controlsRef.current.lift = 0;
          setActiveControls((prev) => ({ ...prev, lift: 0 }));
          break;
        case 'i':
        case 'k':
          controlsRef.current.tilt = 0;
          setActiveControls((prev) => ({ ...prev, tilt: 0 }));
          break;
        case 'o':
        case 'l':
          controlsRef.current.sideshift = 0;
          setActiveControls((prev) => ({ ...prev, sideshift: 0 }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const cycleCamera = () => {
    setCameraMode((prev) => {
      if (prev === 'chase') return 'cabin';
      if (prev === 'cabin') return 'forks';
      if (prev === 'forks') return 'orbit';
      return 'chase';
    });
  };

  // 4. Mouse Orbit / Drag Handlers for 360° Inspection & Canvas Interaction
  const dragDistRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    orbitStateRef.current.isDragging = true;
    orbitStateRef.current.prevX = e.clientX;
    orbitStateRef.current.prevY = e.clientY;
    dragDistRef.current = 0;

    // Raycast to check if user clicked an inspection marker in 3D
    handleHotspotRaycast(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!orbitStateRef.current.isDragging) return;
    const dx = e.clientX - orbitStateRef.current.prevX;
    const dy = e.clientY - orbitStateRef.current.prevY;
    orbitStateRef.current.prevX = e.clientX;
    orbitStateRef.current.prevY = e.clientY;
    dragDistRef.current += Math.hypot(dx, dy);

    // If user is actively dragging the scene, enable free orbit view
    if (dragDistRef.current > 4) {
      orbitStateRef.current.theta -= dx * 0.006;
      orbitStateRef.current.targetTheta = orbitStateRef.current.theta;
      orbitStateRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbitStateRef.current.phi + dy * 0.006));
      orbitStateRef.current.targetPhi = orbitStateRef.current.phi;

      if (cameraModeRef.current !== 'orbit') {
        handleSetCameraView('orbit');
      }
    }
  };

  const handleMouseUp = () => {
    orbitStateRef.current.isDragging = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    orbitStateRef.current.distance = Math.max(2.5, Math.min(16, orbitStateRef.current.distance + e.deltaY * 0.008));
    orbitStateRef.current.targetDistance = orbitStateRef.current.distance;
    if (cameraModeRef.current !== 'orbit') {
      handleSetCameraView('orbit');
    }
  };

  // Touch handlers for mobile/tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      orbitStateRef.current.isDragging = true;
      orbitStateRef.current.prevX = e.touches[0].clientX;
      orbitStateRef.current.prevY = e.touches[0].clientY;
      dragDistRef.current = 0;
      handleHotspotRaycast(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!orbitStateRef.current.isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - orbitStateRef.current.prevX;
    const dy = e.touches[0].clientY - orbitStateRef.current.prevY;
    orbitStateRef.current.prevX = e.touches[0].clientX;
    orbitStateRef.current.prevY = e.touches[0].clientY;
    dragDistRef.current += Math.hypot(dx, dy);

    if (dragDistRef.current > 4) {
      orbitStateRef.current.theta -= dx * 0.008;
      orbitStateRef.current.targetTheta = orbitStateRef.current.theta;
      orbitStateRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, orbitStateRef.current.phi + dy * 0.008));
      orbitStateRef.current.targetPhi = orbitStateRef.current.phi;

      if (cameraModeRef.current !== 'orbit') {
        handleSetCameraView('orbit');
      }
    }
  };

  const handleTouchEnd = () => {
    orbitStateRef.current.isDragging = false;
  };

  // Raycast click detection on 3D inspection markers
  const handleHotspotRaycast = (screenX: number, screenY: number) => {
    if (modeRef.current !== 'inspection' || !hotspotGroupRef.current?.visible) return;
    if (!cameraRef.current || !mountRef.current || hotspotMarkersRef.current.length === 0) return;
    const rect = mountRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((screenX - rect.left) / rect.width) * 2 - 1,
      -((screenY - rect.top) / rect.height) * 2 + 1,
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const meshes = hotspotMarkersRef.current.map((m) => m.mesh);
    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const found = hotspotMarkersRef.current.find(
        (m) => m.mesh === hitMesh || m.mesh.children.includes(hitMesh as THREE.Mesh),
      );
      if (found) {
        handleSelectHotspot(found.spot);
      }
    }
  };

  // Select component: auto-center the whole forklift in the free canvas space and frame the component
  const handleSelectHotspot = (spot: InspectionHotspot) => {
    setSelectedHotspot(spot);
    setIsInspectionPanelOpen(true);
    setMode('inspection');
    setCameraMode('orbit');
    cameraModeRef.current = 'orbit';

    if (!physicsRef.current) return;
    const physics = physicsRef.current;

    // 1. Overall forklift bounding center in world coordinates
    const forkliftCenter = new THREE.Vector3(0, 1.15, -0.05)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), physics.rotationY)
      .add(physics.position);

    // 2. Inspected component position in world coordinates
    const localPartPos = new THREE.Vector3(...spot.position);
    const worldPartPos = localPartPos.clone()
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), physics.rotationY)
      .add(physics.position);

    // 3. Focal center target: 78% on vehicle center, 22% on part position
    // Guarantees the whole forklift stays dead-center in the free canvas without cutoffs
    const targetFocalPoint = forkliftCenter.clone().lerp(worldPartPos, 0.22);
    orbitStateRef.current.targetLookAt.copy(targetFocalPoint);

    // 4. Direction angle from part's ideal cameraOffset rotated by forklift heading
    const localOffsetDir = new THREE.Vector3(spot.cameraOffset[0], 0, spot.cameraOffset[2]).normalize();
    localOffsetDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), physics.rotationY);
    const targetTheta = Math.atan2(localOffsetDir.x, localOffsetDir.z);

    // 5. Polar elevation angle (high-angle ~60° for optimal depth and clarity)
    const targetPhi = Math.PI / 3;

    // 6. Distance dynamically scaled to aspect ratio of the free canvas container
    const canvasWidth = mountRef.current?.clientWidth || 1000;
    const canvasHeight = mountRef.current?.clientHeight || 700;
    const aspect = canvasWidth / Math.max(canvasHeight, 1);
    const targetDistance = Math.max(6.2, 5.4 / Math.min(aspect, 1.15));

    orbitStateRef.current.targetTheta = targetTheta;
    orbitStateRef.current.targetPhi = targetPhi;
    orbitStateRef.current.targetDistance = targetDistance;
  };

  // Virtual Controls Callbacks
  const handleLeverAction = (type: 'lift' | 'tilt' | 'sideshift', value: number) => {
    forkliftAudio.resume();
    controlsRef.current[type] = value;
    setActiveControls((prev) => ({ ...prev, [type]: value }));
  };

  const handleDriveAction = (type: 'throttle' | 'steering' | 'brake', value: number | boolean) => {
    forkliftAudio.resume();
    if (type === 'throttle') {
      controlsRef.current.throttle = value as number;
      setActiveControls((prev) => ({ ...prev, throttle: value as number }));
    }
    if (type === 'steering') {
      controlsRef.current.steering = value as number;
      setActiveControls((prev) => ({ ...prev, steering: value as number }));
    }
    if (type === 'brake') {
      controlsRef.current.brake = value as boolean;
      setActiveControls((prev) => ({ ...prev, brake: value as boolean }));
    }
  };

  const handleSetCameraView = (camMode: CameraMode) => {
    setCameraMode(camMode);
    cameraModeRef.current = camMode;

    if (camMode === 'orbit') {
      const canvasWidth = mountRef.current?.clientWidth || 1000;
      const canvasHeight = mountRef.current?.clientHeight || 700;
      const aspect = canvasWidth / Math.max(canvasHeight, 1);
      const idealDist = Math.max(6.4, 5.6 / Math.min(aspect, 1.15));
      orbitStateRef.current.distance = idealDist;
      orbitStateRef.current.targetDistance = idealDist;
      orbitStateRef.current.theta = 0.65;
      orbitStateRef.current.targetTheta = 0.65;
      orbitStateRef.current.phi = Math.PI / 3;
      orbitStateRef.current.targetPhi = Math.PI / 3;
      if (physicsRef.current) {
        const center = new THREE.Vector3(0, 1.15, -0.05)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), physicsRef.current.rotationY)
          .add(physicsRef.current.position);
        orbitStateRef.current.targetLookAt.copy(center);
      }
    }
  };

  const handleToggleParkingBrake = () => {
    if (physicsRef.current) {
      physicsRef.current.parkingBrakeActive = !physicsRef.current.parkingBrakeActive;
      setActiveControls((prev) => ({ ...prev, parkingBrake: physicsRef.current?.parkingBrakeActive || false }));
    }
  };

  const handleToggleLights = () => {
    if (physicsRef.current) {
      physicsRef.current.lightsActive = !physicsRef.current.lightsActive;
      setActiveControls((prev) => ({ ...prev, lights: physicsRef.current?.lightsActive || false }));
    }
  };

  const handleHorn = (active: boolean) => {
    controlsRef.current.horn = active;
    setActiveControls((prev) => ({ ...prev, horn: active }));
    forkliftAudio.setHorn(active);
  };

  // Reseteo completo e instantáneo de la simulación tras volcamiento o reinicio manual
  const resetSimulation = useCallback(() => {
    if (physicsRef.current) {
      physicsRef.current.reset(
        new THREE.Vector3(0, 0, 0),
        palletsRef.current,
        forkliftModelRef.current || undefined,
      );
      const tele = physicsRef.current.getTelemetry();
      setTelemetry(tele);
    }

    controlsRef.current = {
      throttle: 0,
      steering: 0,
      brake: false,
      parkingBrake: false,
      lift: 0,
      tilt: 0,
      sideshift: 0,
      horn: false,
      lights: true,
    };

    setActiveControls({
      throttle: 0,
      steering: 0,
      brake: false,
      parkingBrake: false,
      lift: 0,
      tilt: 0,
      sideshift: 0,
      horn: false,
      lights: true,
    });

    chaseLookTargetRef.current = null;

    if (cameraRef.current && cameraModeRef.current === 'chase') {
      cameraRef.current.position.set(-0.55, 2.9, 6.6);
      cameraRef.current.lookAt(0.70, 0.90, -1.0);
    }

    if (orbitStateRef.current) {
      const center = new THREE.Vector3(0, 1.15, -0.05);
      orbitStateRef.current.targetLookAt.copy(center);
      orbitStateRef.current.target.copy(center);
    }

    forkliftAudio.playEngineStart();
  }, []);

  // Expose globally for convenience
  useEffect(() => {
    (window as unknown as { resetSimulation?: () => void }).resetSimulation = resetSimulation;
  }, [resetSimulation]);

  // Switch between the TWO dedicated modes
  const handleModeChange = (newMode: 'driving' | 'inspection') => {
    setMode(newMode);
    if (newMode === 'inspection') {
      setIsInspectionPanelOpen(true);
      setCameraMode('orbit');
      cameraModeRef.current = 'orbit';

      const spotToInspect = selectedHotspot || INSPECTION_HOTSPOTS[0];
      handleSelectHotspot(spotToInspect);
    } else {
      setSelectedHotspot(null);
      if (cameraMode === 'orbit') {
        setCameraMode('chase');
        cameraModeRef.current = 'chase';
      }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950 font-sans flex flex-col select-none">
      {/* 1. Full-Width Top Navigation Bar */}
      <HUDHeader
        mode={mode}
        onModeChange={handleModeChange}
        showLabels={showLabels}
        onToggleLabels={() => setShowLabels((prev) => !prev)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onOpenStabilityTriangle={() => setIsStabilityModalOpen(true)}
        onOpenMissions={() => setIsMissionsModalOpen(true)}
        onResetPosition={resetSimulation}
        isInspectionPanelOpen={isInspectionPanelOpen}
        onToggleInspectionPanel={() => setIsInspectionPanelOpen((prev) => !prev)}
        stabilityRisk={telemetry.stabilityRisk}
      />

      {/* 2. Main Workspace: Responsive Split View in Inspection, Full View in Driving */}
      <div className="relative flex-1 w-full flex flex-row overflow-hidden">
        {/* Left Viewport: Occupies ONLY the remaining space to the left of the fixed panel in Inspection Mode */}
        <div
          className={`relative h-full transition-[width] duration-200 flex flex-col overflow-hidden min-w-0 ${
            mode === 'inspection' && isInspectionPanelOpen
              ? 'w-full md:w-[calc(100%-380px)] lg:w-[calc(100%-420px)] xl:w-[calc(100%-460px)] 2xl:w-[calc(100%-480px)] flex-1'
              : 'w-full flex-1'
          }`}
        >
          {/* 3D WebGL Canvas Mount */}
          <div
            ref={mountRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-0"
          />

          {/* Floating 3D Interactive Hotspot Labels (Modo Inspección) */}
          {mode === 'inspection' && showLabels && (
            <div className="absolute inset-0 pointer-events-none z-15 overflow-hidden">
              {screenHotspots.map(({ spot, x, y, visible, index }) => {
                if (!visible) return null;
                const isSelected = selectedHotspot?.id === spot.id;
                return (
                  <button
                    key={spot.id}
                    type="button"
                    onClick={() => handleSelectHotspot(spot)}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: 'translate(-50%, -120%)',
                    }}
                    className={`absolute pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-xl cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 ring-2 ring-amber-300 scale-110 shadow-amber-500/50'
                        : 'bg-zinc-900/90 text-zinc-100 hover:bg-zinc-800 hover:scale-105 border border-amber-500/50 shadow-black/80'
                    }`}
                    title="Haga clic para enfocar y ver ficha técnica"
                  >
                    <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-400 border border-amber-500/60 flex items-center justify-center text-[10px] font-bold">
                      {index}
                    </span>
                    <span className="font-tech whitespace-nowrap">{spot.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Button to reopen training panel if minimized in inspection mode */}
          {mode === 'inspection' && !isInspectionPanelOpen && (
            <button
              type="button"
              onClick={() => setIsInspectionPanelOpen(true)}
              className="absolute top-4 right-4 z-20 pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-xl font-tech cursor-pointer transition-transform hover:scale-105"
            >
              <Wrench className="w-4 h-4" />
              <span>Mostrar Panel de Capacitación (35%)</span>
            </button>
          )}

          {/* Bottom HUD Driving Controls or Inspection Guide */}
          <HUDControls
            telemetry={telemetry}
            controls={activeControls}
            cameraMode={cameraMode}
            onCameraChange={handleSetCameraView}
            onLeverAction={handleLeverAction}
            onDriveAction={handleDriveAction}
            onToggleParkingBrake={handleToggleParkingBrake}
            onToggleLights={handleToggleLights}
            onHorn={handleHorn}
            mode={mode}
          />
        </div>

        {/* Right Fixed Training & Inspection Details Panel (Modo Inspección) */}
        {mode === 'inspection' && isInspectionPanelOpen && (
          <aside className="w-full md:w-[380px] lg:w-[420px] xl:w-[460px] 2xl:w-[480px] h-full shrink-0 border-l border-zinc-800/90 bg-zinc-950 flex flex-col z-20 shadow-2xl overflow-hidden">
            <InspectionPanel
              isOpen={true}
              onClose={() => setIsInspectionPanelOpen(false)}
              selectedHotspot={selectedHotspot || INSPECTION_HOTSPOTS[0]}
              onSelectHotspot={handleSelectHotspot}
            />
          </aside>
        )}
      </div>

      {/* Critical Overlays: Tip-over Alert and Danger Warning */}
      <HUDAlerts
        telemetry={telemetry}
        onOpenStabilityTriangle={() => setIsStabilityModalOpen(true)}
        onResetPosition={resetSimulation}
      />

      {/* Controls & Shortcuts Help Modal */}
      <KeyboardHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Stability Triangle OSHA Modal */}
      <StabilityTriangleModal
        isOpen={isStabilityModalOpen}
        onClose={() => setIsStabilityModalOpen(false)}
        telemetry={telemetry}
      />

      {/* Training Missions & Operational Challenges Modal */}
      <TrainingMissionsModal
        isOpen={isMissionsModalOpen}
        onClose={() => setIsMissionsModalOpen(false)}
        missions={missions}
        currentMissionIndex={currentMissionIndex}
        onSelectMission={(idx) => setCurrentMissionIndex(idx)}
      />
    </div>
  );
}
