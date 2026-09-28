import * as THREE from 'three';
import { InspectionHotspot } from '../types/forklift';

export interface ForkliftModelData {
  rootGroup: THREE.Group;
  chassisMesh: THREE.Group;
  mastBaseGroup: THREE.Group; // Pivots around tilt axis (X)
  innerMastGroup: THREE.Group; // Slides up along mast (Y)
  carriageGroup: THREE.Group; // Slides up inner mast & holds forks
  forksGroup: THREE.Group; // Slides left/right for sideshift
  leftForkMesh: THREE.Mesh;
  rightForkMesh: THREE.Mesh;

  // Hydraulic cylinders
  tiltCylinderLeft: { body: THREE.Mesh; rod: THREE.Mesh };
  tiltCylinderRight: { body: THREE.Mesh; rod: THREE.Mesh };
  liftCylinderRod: THREE.Mesh;

  // Wheels
  frontLeftWheel: THREE.Group;
  frontRightWheel: THREE.Group;
  rearLeftKnuckle: THREE.Group; // Pivots for steering
  rearRightKnuckle: THREE.Group; // Pivots for steering
  rearLeftWheel: THREE.Mesh;
  rearRightWheel: THREE.Mesh;

  // Cockpit
  steeringWheel: THREE.Group;
  leverLift: THREE.Group;
  leverTilt: THREE.Group;
  leverSideshift: THREE.Group;
  beaconLight: THREE.PointLight;
  beaconMesh: THREE.Mesh;
  headlights: THREE.SpotLight[];
}

export function buildForkliftModel(): ForkliftModelData {
  const root = new THREE.Group();
  root.name = 'Forklift_Root';

  // --- Industrial Materials ---
  const safetyYellowMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Industrial OSHA Yellow/Amber
    metalness: 0.35,
    roughness: 0.3,
  });

  const darkCastIronMat = new THREE.MeshStandardMaterial({
    color: 0x27272a, // Cast iron chassis & counterweight
    metalness: 0.5,
    roughness: 0.55,
  });

  const mastSteelMat = new THREE.MeshStandardMaterial({
    color: 0x18181b, // Mast channel steel
    metalness: 0.7,
    roughness: 0.35,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xf4f4f5, // Chrome hydraulic piston rods
    metalness: 0.95,
    roughness: 0.08,
  });

  const forkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x52525b, // Forged high-tensile steel
    metalness: 0.85,
    roughness: 0.25,
  });

  const tireRubberMat = new THREE.MeshStandardMaterial({
    color: 0x18181b, // Solid industrial rubber tire
    metalness: 0.08,
    roughness: 0.85,
  });

  const wheelRimMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Safety orange/amber wheel rims
    metalness: 0.6,
    roughness: 0.3,
  });

  const vinylSeatMat = new THREE.MeshStandardMaterial({
    color: 0x09090b,
    metalness: 0.1,
    roughness: 0.7,
  });

  // 1. Chassis Body (Main structure)
  const chassisGroup = new THREE.Group();
  root.add(chassisGroup);

  // Lower chassis frame
  const lowerChassis = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.45, 2.2), darkCastIronMat);
  lowerChassis.position.set(0, 0.45, 0);
  lowerChassis.castShadow = true;
  lowerChassis.receiveShadow = true;
  chassisGroup.add(lowerChassis);

  // Anatomical Chassis & Operator Cabin Geometry
  // 1. Engine Compartment Hood (Bajo el asiento del operador)
  const engineHood = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.32, 0.82), safetyYellowMat);
  engineHood.position.set(0, 0.65, 0.46); // Top sits at y = 0.81m
  engineHood.castShadow = true;
  chassisGroup.add(engineHood);

  // Engine hood side cowls
  for (let side of [-0.58, 0.58]) {
    const sideCowl = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, 0.82), safetyYellowMat);
    sideCowl.position.set(side, 0.67, 0.46);
    sideCowl.castShadow = true;
    chassisGroup.add(sideCowl);
  }

  // 2. Lowered Operator Footwell Floor (Espacio para pies y pedales de conducción)
  const footwellDeck = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.04, 0.54), darkCastIronMat);
  footwellDeck.position.set(0, 0.48, -0.20);
  footwellDeck.receiveShadow = true;
  chassisGroup.add(footwellDeck);

  // Anti-slip ribbed rubber floor mat
  const rubberMatMaterial = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
  const floorMat = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.015, 0.50), rubberMatMaterial);
  floorMat.position.set(0, 0.505, -0.20);
  floorMat.receiveShadow = true;
  chassisGroup.add(floorMat);

  // Operator Driving Foot Pedals (Accelerator, Brake, Inching)
  const pedalMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8, roughness: 0.4 });
  // Throttle pedal (right)
  const throttlePedal = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.03), pedalMat);
  throttlePedal.rotation.x = -0.55;
  throttlePedal.position.set(0.24, 0.54, -0.34);
  chassisGroup.add(throttlePedal);

  // Brake pedal (center - wide industrial pad)
  const brakePedal = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.04), pedalMat);
  brakePedal.rotation.x = -0.50;
  brakePedal.position.set(0.06, 0.55, -0.36);
  chassisGroup.add(brakePedal);

  // Inching clutch pedal (left)
  const inchingPedal = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.04), pedalMat);
  inchingPedal.rotation.x = -0.50;
  inchingPedal.position.set(-0.16, 0.55, -0.36);
  chassisGroup.add(inchingPedal);

  // 3. Front Bulkhead / Cowl Panel (delante del espacio de los pies)
  const frontCowl = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.52, 0.16), safetyYellowMat);
  frontCowl.position.set(0, 0.72, -0.42);
  frontCowl.castShadow = true;
  chassisGroup.add(frontCowl);

  // Front wheel fender cowls
  const fenderLeft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.4, 0.8), safetyYellowMat);
  fenderLeft.position.set(-0.7, 0.65, -0.6);
  fenderLeft.castShadow = true;
  chassisGroup.add(fenderLeft);

  const fenderRight = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.4, 0.8), safetyYellowMat);
  fenderRight.position.set(0.7, 0.65, -0.6);
  fenderRight.castShadow = true;
  chassisGroup.add(fenderRight);

  // Operator foot well / step
  const stepMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7, roughness: 0.6 });
  const stepLeft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.5), stepMat);
  stepLeft.position.set(-0.72, 0.38, 0.2);
  chassisGroup.add(stepLeft);

  // 2. Heavy Cast Iron Rear Counterweight & LP Propane Tank
  // Solid, clean rectangular counterweight block
  const counterweight = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.8, 0.7), darkCastIronMat);
  counterweight.position.set(0, 0.75, 1.25);
  counterweight.castShadow = true;
  counterweight.name = 'counterweight_block';
  chassisGroup.add(counterweight);

  // Vertical exhaust pipe rooted cleanly on right side of counterweight (free of LP tank interference)
  const exhaustFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.03, 12), darkCastIronMat);
  exhaustFlange.position.set(0.55, 1.16, 1.3);
  exhaustFlange.name = 'exhaust_flange';
  chassisGroup.add(exhaustFlange);

  const exhaustPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 12), darkCastIronMat);
  exhaustPipe.position.set(0.55, 1.55, 1.3);
  exhaustPipe.name = 'exhaust_pipe';
  chassisGroup.add(exhaustPipe);

  const exhaustCap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.1, 12), darkCastIronMat);
  exhaustCap.position.set(0.55, 2.0, 1.3);
  exhaustCap.name = 'exhaust_cap';
  chassisGroup.add(exhaustCap);

  // LP Propane Gas Tank mounted horizontally on counterweight cradle
  const lpTankMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // White / aluminum tank cylinder
    metalness: 0.6,
    roughness: 0.35,
  });
  const lpTank = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.85, 20), lpTankMat);
  lpTank.rotation.z = Math.PI / 2;
  lpTank.position.set(0, 1.25, 1.15);
  lpTank.castShadow = true;
  chassisGroup.add(lpTank);

  // LP Tank hemispherical end caps
  const capL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), lpTankMat);
  capL.rotation.z = Math.PI / 2;
  capL.position.set(-0.42, 1.25, 1.15);
  chassisGroup.add(capL);

  const capR = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), lpTankMat);
  capR.rotation.z = -Math.PI / 2;
  capR.position.set(0.42, 1.25, 1.15);
  chassisGroup.add(capR);

  // Tank mounting steel straps
  const strapMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
  for (let sx of [-0.25, 0.25]) {
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.02, 8, 20, Math.PI), strapMat);
    strap.rotation.x = Math.PI;
    strap.position.set(sx, 1.25, 1.15);
    chassisGroup.add(strap);
  }

  // LP shutoff service valve handle (brass/bronze)
  const valveMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 });
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12), valveMat);
  valve.position.set(0.45, 1.35, 1.15);
  chassisGroup.add(valve);

  // 3. Operator Cabin (ROPS/FOPS Safety Cage)
  const cagePillarMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7, roughness: 0.3 });
  const cageRadius = 0.04;

  // 4 Pillars (front left, front right, rear left, rear right)
  const pillarHeight = 1.45;
  const pFL = new THREE.Mesh(new THREE.CylinderGeometry(cageRadius, cageRadius, pillarHeight, 12), cagePillarMat);
  pFL.position.set(-0.6, 1.4, -0.2);
  pFL.castShadow = true;
  chassisGroup.add(pFL);

  const pFR = new THREE.Mesh(new THREE.CylinderGeometry(cageRadius, cageRadius, pillarHeight, 12), cagePillarMat);
  pFR.position.set(0.6, 1.4, -0.2);
  pFR.castShadow = true;
  chassisGroup.add(pFR);

  const pRL = new THREE.Mesh(new THREE.CylinderGeometry(cageRadius, cageRadius, pillarHeight, 12), cagePillarMat);
  pRL.position.set(-0.6, 1.4, 0.9);
  pRL.castShadow = true;
  chassisGroup.add(pRL);

  const pRR = new THREE.Mesh(new THREE.CylinderGeometry(cageRadius, cageRadius, pillarHeight, 12), cagePillarMat);
  pRR.position.set(0.6, 1.4, 0.9);
  pRR.castShadow = true;
  chassisGroup.add(pRR);

  // Overhead Guard Protective Roof Lattice
  const roofTop = new THREE.Group();
  roofTop.position.set(0, 2.12, 0.35);
  chassisGroup.add(roofTop);

  // Outer frame
  const roofFrame = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.06, 1.2), cagePillarMat);
  roofTop.add(roofFrame);

  // Cross protection bars (FOPS - falling object protection)
  for (let rz = -0.5; rz <= 0.5; rz += 0.14) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.04, 0.03), cagePillarMat);
    bar.position.set(0, 0, rz);
    roofTop.add(bar);
  }

  // Clear polycarbonate rain guard roof cover
  const polycarbMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
    roughness: 0.1,
    transmission: 0.8,
  });
  const rainCover = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.01, 1.15), polycarbMat);
  rainCover.position.set(0, 0.04, 0);
  roofTop.add(rainCover);

  // Rotating amber strobe beacon light
  const beaconBaseMat = new THREE.MeshStandardMaterial({ color: 0x18181b });
  const beaconGlassMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.85,
  });
  const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16), beaconBaseMat);
  beaconBase.position.set(0, 0.06, 0.4);
  roofTop.add(beaconBase);

  const beaconMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 16), beaconGlassMat);
  beaconMesh.position.set(0, 0.14, 0.4);
  roofTop.add(beaconMesh);

  const beaconLight = new THREE.PointLight(0xf59e0b, 4, 10, 1.5);
  beaconLight.position.set(0, 0.15, 0.4);
  roofTop.add(beaconLight);

  // Front Working Headlights
  const headlights: THREE.SpotLight[] = [];
  for (let side of [-0.55, 0.55]) {
    const lightHousing = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.1), darkCastIronMat);
    lightHousing.position.set(side, 1.9, -0.2);
    chassisGroup.add(lightHousing);

    const lightLens = new THREE.Mesh(
      new THREE.CircleGeometry(0.05, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    lightLens.rotation.y = Math.PI;
    lightLens.position.set(side, 1.9, -0.26);
    chassisGroup.add(lightLens);

    const spot = new THREE.SpotLight(0xffffff, 25, 20, Math.PI / 4, 0.4, 1.5);
    spot.position.set(side, 1.9, -0.28);
    spot.target.position.set(side, 0, -10);
    chassisGroup.add(spot);
    chassisGroup.add(spot.target);
    headlights.push(spot);
  }

  // Rear tail/brake lights
  const brakeLightMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0x991b1b,
    emissiveIntensity: 0.4,
  });
  for (let side of [-0.5, 0.5]) {
    const brakeLight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.03), brakeLightMat);
    brakeLight.position.set(side, 0.95, 1.605);
    brakeLight.name = `brake_light_${side < 0 ? 'left' : 'right'}`;
    chassisGroup.add(brakeLight);
  }

  // 4. Operator Station: Elevated Ergonomic Seat, Visible Steering Column, and Hydraulic Console
  // Mechanical Suspension Base & Slide Rails (sobre el capó del motor)
  const seatSuspensionBase = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.07, 0.46), darkCastIronMat);
  seatSuspensionBase.position.set(0, 0.83, 0.38);
  seatSuspensionBase.castShadow = true;
  chassisGroup.add(seatSuspensionBase);

  // Contoured Operator Seat (totalmente elevado sobre el chasis sin hundimiento)
  const seatGroup = new THREE.Group();
  seatGroup.position.set(0, 0.88, 0.38);
  chassisGroup.add(seatGroup);

  const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.12, 0.48), vinylSeatMat);
  seatCushion.position.set(0, 0.06, 0);
  seatCushion.castShadow = true;
  seatGroup.add(seatCushion);

  // Ergonomic high-back seatback with lumbar contour
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.12), vinylSeatMat);
  seatBack.position.set(0, 0.40, 0.22);
  seatBack.rotation.x = -0.14; // Slight ergonomic recline
  seatBack.castShadow = true;
  seatGroup.add(seatBack);

  // Headrest support extension
  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.10), vinylSeatMat);
  headrest.position.set(0, 0.74, 0.26);
  headrest.rotation.x = -0.14;
  seatGroup.add(headrest);

  // Side hip restraints / armrests
  const seatArmL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.10, 0.34), vinylSeatMat);
  seatArmL.position.set(-0.28, 0.20, 0.05);
  seatGroup.add(seatArmL);

  const seatArmR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.10, 0.34), vinylSeatMat);
  seatArmR.position.set(0.28, 0.20, 0.05);
  seatGroup.add(seatArmR);

  // Safety lap seatbelt buckle
  const buckleMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.8 });
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.08), buckleMat);
  buckle.position.set(0.28, 0.16, 0.1);
  seatGroup.add(buckle);

  // Dashboard Cowl & Console (montada limpiamente sobre el mamparo frontal)
  const dashMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
  const dashConsole = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.28), dashMat);
  dashConsole.rotation.x = 0.35;
  dashConsole.position.set(0, 1.08, -0.28);
  chassisGroup.add(dashConsole);

  // Prominent Visible Steering Column Tube (elevada y bien definida)
  const steeringColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.44, 16), dashMat);
  steeringColumn.rotation.x = 0.52;
  steeringColumn.position.set(0, 1.15, -0.20);
  chassisGroup.add(steeringColumn);

  // Dashboard Instrument Cluster Display
  const gaugeCanvas = document.createElement('canvas');
  gaugeCanvas.width = 256;
  gaugeCanvas.height = 128;
  const gCtx = gaugeCanvas.getContext('2d')!;
  gCtx.fillStyle = '#09090b';
  gCtx.fillRect(0, 0, 256, 128);
  gCtx.strokeStyle = '#22c55e';
  gCtx.lineWidth = 4;
  gCtx.beginPath();
  gCtx.arc(64, 64, 40, Math.PI * 0.8, Math.PI * 2.2);
  gCtx.stroke();
  gCtx.fillStyle = '#22c55e';
  gCtx.font = 'bold 16px monospace';
  gCtx.fillText('RPM x100', 30, 70);
  gCtx.fillStyle = '#f59e0b';
  gCtx.fillText('GLP 85%', 150, 50);
  gCtx.fillStyle = '#38bdf8';
  gCtx.fillText('1,248 h', 150, 80);

  const gaugeTex = new THREE.CanvasTexture(gaugeCanvas);
  const gaugeDisplay = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.16), new THREE.MeshBasicMaterial({ map: gaugeTex }));
  gaugeDisplay.position.set(0, 1.20, -0.26);
  gaugeDisplay.rotation.x = -0.55;
  chassisGroup.add(gaugeDisplay);

  // Steering Wheel with Spinner Knob ("Pomo Suicida") montado sobre la columna
  const steeringWheelGroup = new THREE.Group();
  steeringWheelGroup.position.set(0, 1.28, -0.06);
  steeringWheelGroup.rotation.x = -0.65; // Inclinado 45° hacia el operador
  chassisGroup.add(steeringWheelGroup);

  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 12, 24), darkCastIronMat);
  wheelRim.castShadow = true;
  steeringWheelGroup.add(wheelRim);

  const wheelCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16), darkCastIronMat);
  wheelCenter.rotation.x = Math.PI / 2;
  steeringWheelGroup.add(wheelCenter);

  // 3 Spokes
  for (let a = 0; a < 3; a++) {
    const angle = (a * Math.PI * 2) / 3;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.17, 8), darkCastIronMat);
    spoke.position.set(Math.cos(angle) * 0.085, Math.sin(angle) * 0.085, 0);
    spoke.rotation.z = angle + Math.PI / 2;
    steeringWheelGroup.add(spoke);
  }

  // Industrial Spinner Knob (Broche giratorio del volante)
  const spinnerKnob = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 16), safetyYellowMat);
  spinnerKnob.position.set(-0.13, 0.08, -0.04);
  steeringWheelGroup.add(spinnerKnob);

  // Dedicated Right-Hand Hydraulic Valve Console Pedestal (Consola ergonómica lateral)
  const leverBaseMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
  const leverConsole = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.14, 0.32), darkCastIronMat);
  leverConsole.position.set(0.36, 1.08, -0.14);
  leverConsole.castShadow = true;
  chassisGroup.add(leverConsole);

  function createHydraulicLever(color: number, posX: number, posZ: number) {
    const lever = new THREE.Group();
    lever.position.set(posX, 1.15, posZ);

    // Chromed hydraulic valve rod
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.20, 8), chromeMat);
    rod.position.y = 0.10;
    lever.add(rod);

    // Color-coded ergonomic ball knob
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 14), new THREE.MeshStandardMaterial({ color, roughness: 0.25 }));
    knob.position.y = 0.20;
    lever.add(knob);

    chassisGroup.add(lever);
    return lever;
  }

  const leverLift = createHydraulicLever(0x18181b, 0.29, -0.14); // P1: Elevación (Black knob)
  const leverTilt = createHydraulicLever(0xf59e0b, 0.36, -0.14); // P2: Inclinación (Orange knob)
  const leverSideshift = createHydraulicLever(0x2563eb, 0.43, -0.14); // P3: Sideshift (Blue knob)

  // 4.5 Industrial Fire Extinguisher (Extintor de Incendios ABC según OSHA / NFPA)
  const extinguisherGroup = new THREE.Group();
  extinguisherGroup.position.set(-0.55, 1.18, 0.86); // Montado en el pilar trasero izquierdo de la cabina
  chassisGroup.add(extinguisherGroup);

  // Mounting bracket with quick-release metal straps
  const bracketMat = new THREE.MeshStandardMaterial({ color: 0x27272a, metalness: 0.8 });
  const extBracket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.04), bracketMat);
  extBracket.position.set(-0.06, 0, 0);
  extinguisherGroup.add(extBracket);

  for (let by of [-0.08, 0.08]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 8, 16, Math.PI * 1.5), bracketMat);
    band.position.set(0, by, 0);
    band.rotation.x = Math.PI / 2;
    extinguisherGroup.add(band);
  }

  // Red pressure vessel body
  const extBodyMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626, // Bright OSHA Fire Safety Red
    metalness: 0.4,
    roughness: 0.25,
  });
  const extCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.30, 16), extBodyMat);
  extCylinder.castShadow = true;
  extinguisherGroup.add(extCylinder);

  const extDomeTop = new THREE.Mesh(new THREE.SphereGeometry(0.062, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), extBodyMat);
  extDomeTop.position.set(0, 0.15, 0);
  extinguisherGroup.add(extDomeTop);

  const extDomeBottom = new THREE.Mesh(new THREE.SphereGeometry(0.062, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), extBodyMat);
  extDomeBottom.position.set(0, -0.15, 0);
  extinguisherGroup.add(extDomeBottom);

  // Label Band (ABC Dry Chemical Instructions)
  const extLabelMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const extLabel = new THREE.Mesh(new THREE.CylinderGeometry(0.063, 0.063, 0.12, 16), extLabelMat);
  extinguisherGroup.add(extLabel);

  // Brass/metal valve head
  const extValveMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });
  const extValve = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.05, 12), extValveMat);
  extValve.position.set(0, 0.20, 0);
  extinguisherGroup.add(extValve);

  // Squeeze operating levers (Black steel)
  const extLeverMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.7 });
  const extHandle = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.08), extLeverMat);
  extHandle.position.set(0, 0.22, 0.03);
  extinguisherGroup.add(extHandle);

  const extTrigger = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.012, 0.07), extLeverMat);
  extTrigger.position.set(0, 0.24, 0.03);
  extTrigger.rotation.x = -0.15;
  extinguisherGroup.add(extTrigger);

  // Pressure gauge with green zone
  const gaugeRing = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.01, 12), extValveMat);
  gaugeRing.rotation.x = Math.PI / 2;
  gaugeRing.position.set(0.03, 0.20, 0.02);
  extinguisherGroup.add(gaugeRing);

  const gaugeDial = new THREE.Mesh(new THREE.CircleGeometry(0.014, 12), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
  gaugeDial.position.set(0.03, 0.20, 0.026);
  extinguisherGroup.add(gaugeDial);

  // Flexible discharge hose & nozzle
  const extHoseMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
  const extHose = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.28, 8), extHoseMat);
  extHose.position.set(-0.045, 0.06, 0.045);
  extinguisherGroup.add(extHose);

  // 5. Wheels (Front Drive Wheels & Rear Steer Wheels)
  // Front Axle (motriz - fixed rotation around roll axis)
  function createWheel(radius: number, width: number, isDrive: boolean) {
    const wheel = new THREE.Group();

    // Tire
    const tire = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 24), tireRubberMat);
    tire.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wheel.add(tire);

    // Deep traction tread grooves on tire
    if (isDrive) {
      const treadMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
      for (let t = 0; t < 18; t++) {
        const angle = (t * Math.PI * 2) / 18;
        const rib = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.015, 0.02), treadMat);
        rib.position.set(0, Math.sin(angle) * (radius + 0.005), Math.cos(angle) * (radius + 0.005));
        rib.rotation.x = angle;
        wheel.add(rib);
      }
    }

    // Heavy Rim & Hub
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, width * 1.02, 16), wheelRimMat);
    rim.rotation.z = Math.PI / 2;
    wheel.add(rim);

    // Center Hub Cap
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.25, radius * 0.25, width * 1.08, 16), darkCastIronMat);
    hub.rotation.z = Math.PI / 2;
    wheel.add(hub);

    // Lug nuts
    const nutMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f5, metalness: 0.9 });
    for (let n = 0; n < 6; n++) {
      const nAngle = (n * Math.PI * 2) / 6;
      const nut = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, width * 1.1, 6), nutMat);
      nut.rotation.z = Math.PI / 2;
      nut.position.set(0, Math.sin(nAngle) * (radius * 0.38), Math.cos(nAngle) * (radius * 0.38));
      wheel.add(nut);
    }

    return wheel;
  }

  const frontWheelRadius = 0.36;
  const frontWheelWidth = 0.24;
  const frontLeftWheel = createWheel(frontWheelRadius, frontWheelWidth, true);
  frontLeftWheel.position.set(-0.68, frontWheelRadius, -0.65);
  chassisGroup.add(frontLeftWheel);

  const frontRightWheel = createWheel(frontWheelRadius, frontWheelWidth, true);
  frontRightWheel.position.set(0.68, frontWheelRadius, -0.65);
  chassisGroup.add(frontRightWheel);

  // Rear Steering Knuckles (Pivots around vertical axis Y for steering, wheel rolls around X)
  const rearWheelRadius = 0.28;
  const rearWheelWidth = 0.18;

  const rearLeftKnuckle = new THREE.Group();
  rearLeftKnuckle.position.set(-0.52, rearWheelRadius, 0.85);
  chassisGroup.add(rearLeftKnuckle);

  const rearLeftWheel = createWheel(rearWheelRadius, rearWheelWidth, false) as unknown as THREE.Mesh;
  rearLeftKnuckle.add(rearLeftWheel);

  const rearRightKnuckle = new THREE.Group();
  rearRightKnuckle.position.set(0.52, rearWheelRadius, 0.85);
  chassisGroup.add(rearRightKnuckle);

  const rearRightWheel = createWheel(rearWheelRadius, rearWheelWidth, false) as unknown as THREE.Mesh;
  rearRightKnuckle.add(rearRightWheel);

  // 6. Hydraulic Mast & Articulated Elevation Assembly
  // Base Pivot of the mast: located at front axle level
  const mastBaseGroup = new THREE.Group();
  mastBaseGroup.position.set(0, 0.36, -0.9);
  root.add(mastBaseGroup);

  // Outer Mast Stage (Fixed channel rails pivoting on mastBaseGroup)
  const outerMastHeight = 2.6;
  const mastChannelProfile = new THREE.BoxGeometry(0.08, outerMastHeight, 0.14);

  const leftChannel = new THREE.Mesh(mastChannelProfile, mastSteelMat);
  leftChannel.position.set(-0.48, outerMastHeight / 2, 0);
  leftChannel.castShadow = true;
  mastBaseGroup.add(leftChannel);

  const rightChannel = new THREE.Mesh(mastChannelProfile, mastSteelMat);
  rightChannel.position.set(0.48, outerMastHeight / 2, 0);
  rightChannel.castShadow = true;
  mastBaseGroup.add(rightChannel);

  // Outer mast top and bottom cross tie braces
  const mastTieTop = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.1, 0.08), mastSteelMat);
  mastTieTop.position.set(0, outerMastHeight - 0.05, 0);
  mastBaseGroup.add(mastTieTop);

  const mastTieBottom = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.1, 0.08), mastSteelMat);
  mastTieBottom.position.set(0, 0.2, 0);
  mastBaseGroup.add(mastTieBottom);

  // Main Central Lift Hydraulic Cylinder (Body attached to outer mast)
  const liftCylinderBody = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, outerMastHeight * 0.85, 16), darkCastIronMat);
  liftCylinderBody.position.set(0, (outerMastHeight * 0.85) / 2 + 0.1, 0.06);
  liftCylinderBody.castShadow = true;
  mastBaseGroup.add(liftCylinderBody);

  // Chromed lift piston rod (extends upward)
  const liftCylinderRod = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, outerMastHeight * 0.85, 16), chromeMat);
  liftCylinderRod.position.set(0, (outerMastHeight * 0.85) / 2 + 0.1, 0.06);
  mastBaseGroup.add(liftCylinderRod);

  // Inner Telescoping Mast Stage (Slides vertically inside outer mast channels)
  const innerMastGroup = new THREE.Group();
  mastBaseGroup.add(innerMastGroup);

  const innerMastHeight = 2.45;
  const innerChannelProfile = new THREE.BoxGeometry(0.06, innerMastHeight, 0.1);

  const innerLeft = new THREE.Mesh(innerChannelProfile, mastSteelMat);
  innerLeft.position.set(-0.41, innerMastHeight / 2, 0);
  innerLeft.castShadow = true;
  innerMastGroup.add(innerLeft);

  const innerRight = new THREE.Mesh(innerChannelProfile, mastSteelMat);
  innerRight.position.set(0.41, innerMastHeight / 2, 0);
  innerRight.castShadow = true;
  innerMastGroup.add(innerRight);

  // Inner mast pulley wheels for lift chains at top
  const pulleyMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8 });
  const pulleyL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16), pulleyMat);
  pulleyL.rotation.z = Math.PI / 2;
  pulleyL.position.set(-0.3, innerMastHeight, 0.02);
  innerMastGroup.add(pulleyL);

  const pulleyR = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16), pulleyMat);
  pulleyR.rotation.z = Math.PI / 2;
  pulleyR.position.set(0.3, innerMastHeight, 0.02);
  innerMastGroup.add(pulleyR);

  // 7. Fork Carriage (Carro Portahorquillas de Mástil Panorámico / Clear-View)
  const carriageGroup = new THREE.Group();
  carriageGroup.position.set(0, -0.345, -0.08); // Posición inicial: horquillas a ras de piso (Y ≈ 0)
  innerMastGroup.add(carriageGroup);

  // Perfiles horizontales superior e inferior del carro portahorquillas (marco abierto que garantiza visibilidad total al operador)
  const carriageBarTop = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.045, 0.035), darkCastIronMat);
  carriageBarTop.position.set(0, 0.58, 0);
  carriageBarTop.castShadow = true;
  carriageGroup.add(carriageBarTop);

  const carriageBarBottom = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.045, 0.035), darkCastIronMat);
  carriageBarBottom.position.set(0, 0.08, 0);
  carriageBarBottom.castShadow = true;
  carriageGroup.add(carriageBarBottom);

  // 8. Sideshift mechanism & Dual Forged Steel Forks
  const forksGroup = new THREE.Group();
  carriageGroup.add(forksGroup);

  // Sideshift hydraulic cylinder horizontal bar
  const sideshiftBar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 12), chromeMat);
  sideshiftBar.rotation.z = Math.PI / 2;
  sideshiftBar.position.set(0, 0.4, -0.02);
  forksGroup.add(sideshiftBar);

  function createFork(posX: number) {
    const forkGroup = new THREE.Group();
    forkGroup.position.set(posX, 0, -0.02);

    // Vertical shank (vástago vertical de la horquilla)
    const shank = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.62, 0.04), forkSteelMat);
    shank.position.set(0, 0.31, 0);
    shank.castShadow = true;
    forkGroup.add(shank);

    // Top mounting hook with lock latch
    const hook = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.08), darkCastIronMat);
    hook.position.set(0, 0.6, 0.02);
    forkGroup.add(hook);

    // Horizontal blade / tine (hoja horizontal rectangular sólida de 1.18m)
    const bladeLength = 1.18;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.042, bladeLength), forkSteelMat);
    blade.position.set(0, 0.021, -bladeLength / 2);
    blade.castShadow = true;
    forkGroup.add(blade);

    forksGroup.add(forkGroup);
    return forkGroup as unknown as THREE.Mesh;
  }

  const leftForkMesh = createFork(-0.28);
  const rightForkMesh = createFork(0.28);

  // 9. Dual Base Tilt Hydraulic Cylinders
  // Connect chassis frame anchor to lower mast uprights
  function createTiltCylinder(anchorX: number) {
    // Body anchored to chassis
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.48, 16), darkCastIronMat);
    body.castShadow = true;
    chassisGroup.add(body);

    // Chromed rod extending from cylinder
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.45, 16), chromeMat);
    body.add(rod);

    return { body, rod };
  }

  const tiltCylinderLeft = createTiltCylinder(-0.45);
  const tiltCylinderRight = createTiltCylinder(0.45);

  return {
    rootGroup: root,
    chassisMesh: chassisGroup,
    mastBaseGroup,
    innerMastGroup,
    carriageGroup,
    forksGroup,
    leftForkMesh,
    rightForkMesh,
    tiltCylinderLeft,
    tiltCylinderRight,
    liftCylinderRod,
    frontLeftWheel,
    frontRightWheel,
    rearLeftKnuckle,
    rearRightKnuckle,
    rearLeftWheel,
    rearRightWheel,
    steeringWheel: steeringWheelGroup,
    leverLift,
    leverTilt,
    leverSideshift,
    beaconLight,
    beaconMesh,
    headlights,
  };
}

/**
 * Inspection Hotspots Data (10 Industrial Key Points for 360° Training & OSHA Checklist)
 */
export const INSPECTION_HOTSPOTS: InspectionHotspot[] = [
  {
    id: 'counterweight_fuel',
    name: 'Contrapeso y Tanque de GLP / Diésel',
    nameEn: 'Counterweight & LP Gas System',
    category: 'Seguridad',
    position: [0, 1.25, 1.3],
    targetLookAt: [0, 1.0, 1.2],
    cameraOffset: [1.8, 1.8, 2.8],
    summary: 'Masa de fundición para compensar la carga frontal y depósito de combustible presurizado.',
    functionDesc: 'El contrapeso equilibra el momento de vuelco generado por la carga levantada en las horquillas respecto al eje motriz delantero (punto de fulcro). El tanque horizontal almacena gas licuado de petróleo (GLP) a alta presión.',
    oshaChecklist: [
      'Verificar que el tanque de GLP esté firmemente fijado con los cinchos de seguridad.',
      'Comprobar la válvula de alivio y detectar posibles fugas de gas (olor a mercaptano o siseo).',
      'Inspeccionar el contrapeso en busca de fisuras, grietas o impactos estructurales severos.',
      'Verificar la manguera flexible de alta presión por grietas, resequedad o dobleces excesivos.',
    ],
    safetyWarnings: [
      'NUNCA manipular las válvulas de gas fumando o cerca de chispas.',
      'NO agregar peso adicional no autorizado al contrapeso; altera el triángulo de estabilidad.',
    ],
    specs: {
      'Peso del contrapeso': '1,850 kg',
      'Combustible': 'Gas Licuado de Petróleo (GLP) / Diésel',
      'Presión del cilindro': '100 - 200 PSI',
      'Capacidad del tanque': '33.5 lbs (15 kg)',
    },
  },
  {
    id: 'mast_assembly',
    name: 'Mástil Telescópico de Elevación',
    nameEn: 'Telescopic Mast Assembly',
    category: 'Estructura',
    position: [0, 1.8, -0.9],
    targetLookAt: [0, 1.6, -0.9],
    cameraOffset: [1.8, 2.2, -2.4],
    summary: 'Torre de perfiles de acero I-Beam para elevación vertical de dos etapas con rodillos guía.',
    functionDesc: 'Estructura vertical reforzada que guía los rieles de elevación. La etapa interior se desliza mediante rodillos de empuje lateral lubricados, permitiendo elevar tarimas a diferentes niveles de estantería.',
    oshaChecklist: [
      'Inspeccionar los perfiles del mástil por torceduras, deformaciones o soldaduras agrietadas.',
      'Verificar la lubricación con grasa grafitada en las pistas de rodadura de los rodillos guía.',
      'Comprobar la ausencia de objetos extraños atorados en los canales.',
      'Revisar el apriete de los pernos de fijación de los topes mecánicos superiores e inferiores.',
    ],
    safetyWarnings: [
      'NUNCA colocar las manos, brazos o cabeza a través de las celosías del mástil.',
      'Desconectar el motor antes de cualquier trabajo de inspección cercana en los rieles.',
    ],
    specs: {
      'Tipo': 'Dúplex / Etapas telescópicas 2-Stage',
      'Altura máxima de horquillas': '4.50 m',
      'Altura colapsada': '2.15 m',
      'Ángulo de inclinación': '6° adelante / 10° atrás',
    },
  },
  {
    id: 'tilt_cylinders',
    name: 'Cilindros Hidráulicos de Inclinación',
    nameEn: 'Tilt Hydraulic Cylinders',
    category: 'Hidráulica',
    position: [0.45, 0.45, -0.7],
    targetLookAt: [0.45, 0.45, -0.75],
    cameraOffset: [1.2, 0.8, -1.8],
    summary: 'Cilindros de doble efecto que controlan la inclinación del mástil para estabilizar la carga.',
    functionDesc: 'Permiten vascular el mástil hacia adelante (para recoger o posicionar tarimas en racks) y hacia atrás (para asegurar la carga contra el respaldo durante el traslado). Vástagos de acero rectificado con recubrimiento de cromo duro.',
    oshaChecklist: [
      'Inspeccionar los vástagos cromados por rayaduras, picaduras o melladuras.',
      'Comprobar que no haya fugas de líquido hidráulico en los retenes o sellos del cabezal.',
      'Verificar los pasadores de pivote y sus seguros chaveta en los soportes del chasis.',
      'Revisar las mangueras hidráulicas por hinchazón, abrasión o goteo.',
    ],
    safetyWarnings: [
      'El fluido hidráulico a alta presión puede penetrar la piel. NUNCA buscar fugas con la mano.',
      'Durante el transporte, el mástil DEBE estar inclinado completamente hacia atrás.',
    ],
    specs: {
      'Presión operativa': '2,400 PSI (165 bar)',
      'Diámetro del vástago': '38 mm',
      'Rango de inclinación': '-4° a +10°',
      'Tipo de fluido': 'Aceite hidráulico ISO VG 46/68',
    },
  },
  {
    id: 'forks_carriage',
    name: 'Horquillas (Uñas) y Carro Portahorquillas',
    nameEn: 'Forks & Load Backrest Carriage',
    category: 'Estructura',
    position: [0, 0.35, -1.6],
    targetLookAt: [0, 0.25, -1.4],
    cameraOffset: [1.4, 1.0, -2.6],
    summary: 'Uñas forjadas de alta resistencia y rejilla de apoyo para soporte y protección de la carga.',
    functionDesc: 'Las horquillas penetran los túneles de las tarimas para soportar el 100% de la carga. La rejilla de apoyo (backrest) previene que cajas o bultos sueltos caigan hacia atrás sobre el compartimento del operador.',
    oshaChecklist: [
      'Medir el desgaste en el talón de las horquillas: no debe superar el 10% del espesor original.',
      'Comprobar la alineación de las puntas (diferencia no mayor a 6 mm entre ambas uñas).',
      'Verificar que los pestillos de bloqueo de posición en el riel superior funcionen correctamente.',
      'Inspeccionar fisuras con líquidos penetrantes o inspección visual minuciosa en la curva del talón.',
    ],
    safetyWarnings: [
      'PROHIBIDO enderezar o soldar horquillas dobladas; pierden su temple térmico y se fracturan.',
      'NUNCA sobrepasar el centro de carga nominal (típicamente 24 pulgadas / 600 mm).',
    ],
    specs: {
      'Longitud de hoja': '1,150 mm (45 in)',
      'Ancho de hoja': '120 mm',
      'Espesor de talón': '45 mm',
      'Capacidad nominal': '2,500 kg a 500 mm de centro',
    },
  },
  {
    id: 'rops_cabin',
    name: 'Cabina y Estructura Antivuelco (ROPS/FOPS)',
    nameEn: 'Overhead Guard / ROPS / FOPS',
    category: 'Seguridad',
    position: [0, 1.8, 0.3],
    targetLookAt: [0, 1.6, 0.3],
    cameraOffset: [2.2, 2.4, 1.2],
    summary: 'Jaula de acero certificada para protección contra caída de objetos y vuelco del montacargas.',
    functionDesc: 'Estructura tubular con travesaños que protege al operador en caso de colapso de estanterías, caída de tarimas o volcadura lateral. Incluye cinturón de seguridad y torreta estroboscópica ámbar.',
    oshaChecklist: [
      'Verificar que no tenga cortes, deformaciones por impactos o modificaciones no autorizadas.',
      'Comprobar el apriete de los 4 pernos de sujeción al chasis principal.',
      'Verificar el funcionamiento del cinturón de seguridad de 2 o 3 puntos y su mecanismo retráctil.',
      'Comprobar la visibilidad a través de la cubierta protectora superior de policarbonato.',
    ],
    safetyWarnings: [
      'El uso del CINTURÓN DE SEGURIDAD ES OBLIGATORIO en todo momento. En caso de volcadura, sosténgase fuerte del volante y permanezca dentro de la cabina.',
      'NUNCA intente saltar de un montacargas en proceso de vuelco.',
    ],
    specs: {
      'Norma de diseño': 'OSHA 1910.178 / ANSI B56.1',
      'Resistencia al impacto': 'Energía de prueba según masa del equipo',
      'Dispositivos': 'Cinturón retráctil, torreta ámbar estroboscópica',
    },
  },
  {
    id: 'fire_extinguisher',
    name: 'Extintor de Incendios ABC (2.5 kg)',
    nameEn: 'Fire Extinguisher ABC Type',
    category: 'Seguridad',
    position: [-0.55, 1.25, 0.86],
    targetLookAt: [-0.55, 1.18, 0.86],
    cameraOffset: [-1.4, 1.5, 1.6],
    summary: 'Equipo portátil de primera respuesta contra conatos de incendio clase A (sólidos), B (líquidos/gases) y C (eléctricos).',
    functionDesc: 'Extintor de polvo químico seco presurizado fijado al pilar trasero izquierdo de la cabina mediante abrazaderas de desenganche rápido. Exigido por las normativas de seguridad industrial OSHA 1910.157 y NFPA 505 para montacargas de combustión interna.',
    oshaChecklist: [
      'Comprobar que la aguja del manómetro esté firmemente en la zona verde (195 PSI).',
      'Verificar que el pasador de seguridad metálico y el precinto plástico amarillo no estén rotos.',
      'Inspeccionar el cilindro rojo por golpes, corrosión o daños en la pintura epóxica.',
      'Revisar que la manguera y boquilla de descarga no tengan obstrucciones de polvo o fisuras.',
      'Verificar la tarjeta de inspección mensual al día con el sello del responsable de seguridad.',
      'Comprobar que el soporte permita retirar el extintor en menos de 3 segundos en una emergencia.',
    ],
    safetyWarnings: [
      'NUNCA operar el montacargas si el extintor se encuentra descargado, despresurizado o ausente.',
      'En conatos de fuego en el motor, detenga el montacargas, cierre la válvula de GLP y aplique a la base de la llama.',
    ],
    specs: {
      'Agente extintor': 'Polvo Químico Seco (Fosfato Monoamónico 90%)',
      'Capacidad': '2.5 kg (5.5 lbs)',
      'Presión operativa': '195 PSI (13.5 bar)',
      'Normas': 'OSHA 1910.157 / NFPA 10 / NFPA 505',
    },
  },
  {
    id: 'steer_axle',
    name: 'Eje y Llantas Traseras de Dirección',
    nameEn: 'Rear Steer Axle & Pivots',
    category: 'Tren Motriz',
    position: [0, 0.35, 0.85],
    targetLookAt: [0, 0.3, 0.85],
    cameraOffset: [1.6, 1.0, 1.8],
    summary: 'Eje oscilante de dirección con muñones hidráulicos que permiten giros cerrados en pasillos.',
    functionDesc: 'A diferencia de un automóvil, los montacargas doblan con las ruedas traseras para maniobrar en pasillos estrechos de almacén. Esto provoca un "latigazo de cola" (rear-end swing) al virar rápidamente.',
    oshaChecklist: [
      'Comprobar la presión de inflado (en neumáticos) o cortes/desprendimientos (en llantas sólidas).',
      'Revisar el cilindro transversal de dirección hidráulica por fugas de fluido.',
      'Verificar juego o holgura excesiva en las rótulas y terminales de articulación.',
      'Comprobar el apriete de las tuercas de rueda.',
    ],
    safetyWarnings: [
      'ATENCIÓN AL LATIGAZO TRASERO: La parte trasera del montacargas describe un radio mucho más amplio al girar.',
      'Reduzca la velocidad a menos de 5 km/h antes de iniciar cualquier curva pronunciada.',
    ],
    specs: {
      'Tipo de dirección': 'Hidrostática asistida por órbita',
      'Ángulo de giro': 'Hasta 78°',
      'Tipo de llanta': 'Sólida de caucho antipinchazos (Cushion/Solid)',
      'Medida': '18 x 7 - 8',
    },
  },
  {
    id: 'drive_axle',
    name: 'Eje Delantero Motriz y Frenos',
    nameEn: 'Front Drive Axle & Brakes',
    category: 'Tren Motriz',
    position: [0.68, 0.38, -0.65],
    targetLookAt: [0.65, 0.38, -0.65],
    cameraOffset: [1.6, 0.9, -1.2],
    summary: 'Diferencial de tracción de trabajo pesado y sistema de frenos de servicio y estacionamiento.',
    functionDesc: 'Transmite el par motor al piso para tracción y retención. Actúa como el punto de apoyo fulcro del montacargas. Incorpora zapatas de freno de tambor o discos húmedos en baño de aceite.',
    oshaChecklist: [
      'Comprobar el desgaste de la banda de rodadura de los neumáticos delanteros.',
      'Verificar la ausencia de objetos incrustados (clavos, esquirlas de madera de tarimas).',
      'Revisar el nivel y posibles fugas de aceite del diferencial central.',
      'Comprobar la efectividad del pedal de freno de servicio y del freno de mano.',
    ],
    safetyWarnings: [
      'La capacidad de frenado disminuye drásticamente al transportar cargas pesadas en bajadas.',
      'Siempre descienda pendientes con la carga mirando cuesta arriba.',
    ],
    specs: {
      'Tracción': 'Delantera 4x2 con diferencial cónico',
      'Tipo de freno': 'Frenos hidráulicos de tambor con zapata autorregulable',
      'Freno de estacionamiento': 'Mecánico por palanca / trinquete',
    },
  },
  {
    id: 'controls_dash',
    name: 'Puesto de Mandos y Palancas Hidráulicas',
    nameEn: 'Operator Controls & Hydraulic Levers',
    category: 'Mandos',
    position: [0.2, 1.25, -0.1],
    targetLookAt: [0.1, 1.2, -0.15],
    cameraOffset: [0.5, 1.8, 0.6],
    summary: 'Volante con pomo giratorio, panel de instrumentos y palancas ergonómicas de control hidráulico.',
    functionDesc: 'Interfaz del operador para gobernar el equipo. La palanca 1 controla subida/bajada de horquillas; la palanca 2 controla inclinación del mástil; la palanca 3 controla desplazamiento lateral (sideshift).',
    oshaChecklist: [
      'Comprobar el retorno automático al neutro de todas las palancas hidráulicas al soltarlas.',
      'Verificar el funcionamiento del claxon (bocina) en el centro del volante.',
      'Inspeccionar las luces testigo de presión de aceite de motor, temperatura y freno de mano.',
      'Verificar que el volante gire suavemente sin atascos de tope a tope.',
    ],
    safetyWarnings: [
      'Toque la bocina en todas las intersecciones ciegas y puertas peatonales.',
      'NUNCA opere palancas hidráulicas mientras conduce a velocidad de crucero.',
    ],
    specs: {
      'Palancas': 'Distribuidor hidráulico de 3 o 4 carretes',
      'Bocina': '105 dB industrial integrada',
      'Testigos': 'Presión de aceite, alternador, freno de parqueo, horómetro',
    },
  },
  {
    id: 'lift_cylinder_chains',
    name: 'Cilindro de Elevación y Cadenas de Hoja',
    nameEn: 'Lift Cylinder & Leaf Chains',
    category: 'Hidráulica',
    position: [0, 1.4, -0.85],
    targetLookAt: [0, 1.4, -0.85],
    cameraOffset: [1.4, 1.8, -1.8],
    summary: 'Cilindro central de empuje hidráulico y cadenas de elevación de eslabones múltiples.',
    functionDesc: 'El cilindro central eleva el mástil secundario, mientras que las cadenas gemelas de alta resistencia multiplican la carrera 2:1 para elevar el carro portahorquillas con suavidad y precisión.',
    oshaChecklist: [
      'Verificar la tensión uniforme en ambas cadenas (no debe haber una cadena floja).',
      'Comprobar la lubricación adecuada con aceite para cadenas (no grasa seca apelmazada).',
      'Medir la elongación de la cadena con un calibrador (reemplazar si supera 2% a 3%).',
      'Inspeccionar los rodillos de polea superior por desgaste de pestañas.',
    ],
    safetyWarnings: [
      'Si una cadena se rompe, la carga caerá inmediatamente. NUNCA transite bajo horquillas elevadas.',
      'Revise los pernos ancla de las cadenas en el mástil y en el carro portahorquillas.',
    ],
    specs: {
      'Tipo de cadena': 'Cadena de hojas de acero al carbono (Leaf chain BL-series)',
      'Relación de elevación': '2:1 (Carrera de carro = 2x Carrera de cilindro)',
      'Factor de seguridad': 'Mínimo 5:1 según normativa',
    },
  },
  {
    id: 'engine_exhaust',
    name: 'Motor de Combustión y Disipación Térmica',
    nameEn: 'Internal Combustion Engine Compartment',
    category: 'Tren Motriz',
    position: [0, 0.7, 0.4],
    targetLookAt: [0, 0.7, 0.3],
    cameraOffset: [1.8, 1.4, 0.6],
    summary: 'Motor de 4 cilindros de combustión interna industrial montado bajo el piso del asiento.',
    functionDesc: 'Genera la energía mecánica para la tracción y mueve la bomba hidráulica de engranajes acoplada directamente al cigüeñal. Sistema de refrigeración líquida forzada con radiador posterior.',
    oshaChecklist: [
      'Revisar el nivel de aceite de motor con la varilla medidora en frío.',
      'Comprobar el nivel de refrigerante en el depósito de expansión transparente.',
      'Inspeccionar la tensión de la banda del alternador y ventilador.',
      'Verificar que el filtro de aire de baño seco no esté saturado de polvo de almacén.',
    ],
    safetyWarnings: [
      'Emitir monóxido de carbono (CO) en áreas cerradas no ventiladas es mortal. Asegúrese de ventilación adecuada en el almacén.',
      'NUNCA abra la tapa del radiador con el motor caliente.',
    ],
    specs: {
      'Motor': '4 Cilindros en línea, 2.4L a 2.5L Gas LP / Diésel',
      'Potencia': '55 HP @ 2,400 RPM',
      'Bomba hidráulica': 'Bomba de engranajes tándem de 65 L/min',
    },
  },
];
