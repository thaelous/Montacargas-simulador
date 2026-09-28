import * as THREE from 'three';
import {
  createCardboardTexture,
  createPalletWoodTexture,
  createSafetySignTexture,
  createWarehouseFloorTexture,
  createWarehouseWallTexture,
} from './textures';

export interface CollisionBox {
  min: THREE.Vector3;
  max: THREE.Vector3;
  type: 'wall' | 'rack' | 'column' | 'obstacle';
  id?: string;
}

export interface PalletObject {
  id: string;
  group: THREE.Group;
  initialPosition: THREE.Vector3;
  initialRotation: THREE.Euler;
  originalParent: THREE.Object3D;
  isHeld: boolean;
  boxBounds: { width: number; height: number; depth: number };
}

export interface WarehouseSceneData {
  group: THREE.Group;
  collisionBoxes: CollisionBox[];
  pallets: PalletObject[];
  interactivePallet: PalletObject;
}

export function buildWarehouseScene(): WarehouseSceneData {
  const warehouseGroup = new THREE.Group();
  const collisionBoxes: CollisionBox[] = [];
  const pallets: PalletObject[] = [];

  const WAREHOUSE_WIDTH = 48;
  const WAREHOUSE_LENGTH = 54;
  const WAREHOUSE_HEIGHT = 10;

  // 1. Concrete Floor
  const floorTexture = createWarehouseFloorTexture();
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.65,
    metalness: 0.15,
  });
  const floorGeo = new THREE.PlaneGeometry(WAREHOUSE_WIDTH, WAREHOUSE_LENGTH);
  const floorMesh = new THREE.Mesh(floorGeo, floorMaterial);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  warehouseGroup.add(floorMesh);

  // 2. Safety Walkways and Demarcation Lines (Yellow road tape)
  const yellowLineMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.4,
  });
  const whiteLineMat = new THREE.MeshStandardMaterial({
    color: 0xe4e4e7,
    roughness: 0.5,
  });

  // Central forklift aisle lines
  const aisleLineGeo = new THREE.PlaneGeometry(0.18, 44);
  const aisleLineLeft = new THREE.Mesh(aisleLineGeo, yellowLineMat);
  aisleLineLeft.rotation.x = -Math.PI / 2;
  aisleLineLeft.position.set(-4.5, 0.005, 0);
  warehouseGroup.add(aisleLineLeft);

  const aisleLineRight = new THREE.Mesh(aisleLineGeo, yellowLineMat);
  aisleLineRight.rotation.x = -Math.PI / 2;
  aisleLineRight.position.set(4.5, 0.005, 0);
  warehouseGroup.add(aisleLineRight);

  // Forklift Parking Bay (Yellow hatched box)
  const parkingBoxGeo = new THREE.PlaneGeometry(3.6, 5.2);
  const parkingBorderMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.3,
  });
  const parkingBorder = new THREE.Mesh(parkingBoxGeo, parkingBorderMat);
  parkingBorder.rotation.x = -Math.PI / 2;
  parkingBorder.position.set(0, 0.006, 18);
  warehouseGroup.add(parkingBorder);

  const parkingInnerGeo = new THREE.PlaneGeometry(3.2, 4.8);
  const parkingInnerMat = new THREE.MeshStandardMaterial({
    color: 0x27272a,
    roughness: 0.7,
  });
  const parkingInner = new THREE.Mesh(parkingInnerGeo, parkingInnerMat);
  parkingInner.rotation.x = -Math.PI / 2;
  parkingInner.position.set(0, 0.007, 18);
  warehouseGroup.add(parkingInner);

  // 3. Perimeter Walls
  const wallTexture = createWarehouseWallTexture();
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    roughness: 0.8,
    metalness: 0.3,
  });

  // North Wall
  const wallNorthGeo = new THREE.PlaneGeometry(WAREHOUSE_WIDTH, WAREHOUSE_HEIGHT);
  const wallNorth = new THREE.Mesh(wallNorthGeo, wallMaterial);
  wallNorth.position.set(0, WAREHOUSE_HEIGHT / 2, -WAREHOUSE_LENGTH / 2);
  warehouseGroup.add(wallNorth);
  collisionBoxes.push({
    min: new THREE.Vector3(-WAREHOUSE_WIDTH / 2, 0, -WAREHOUSE_LENGTH / 2 - 1),
    max: new THREE.Vector3(WAREHOUSE_WIDTH / 2, WAREHOUSE_HEIGHT, -WAREHOUSE_LENGTH / 2 + 0.5),
    type: 'wall',
  });

  // South Wall
  const wallSouth = new THREE.Mesh(wallNorthGeo, wallMaterial);
  wallSouth.position.set(0, WAREHOUSE_HEIGHT / 2, WAREHOUSE_LENGTH / 2);
  wallSouth.rotation.y = Math.PI;
  warehouseGroup.add(wallSouth);
  collisionBoxes.push({
    min: new THREE.Vector3(-WAREHOUSE_WIDTH / 2, 0, WAREHOUSE_LENGTH / 2 - 0.5),
    max: new THREE.Vector3(WAREHOUSE_WIDTH / 2, WAREHOUSE_HEIGHT, WAREHOUSE_LENGTH / 2 + 1),
    type: 'wall',
  });

  // West Wall
  const wallSideGeo = new THREE.PlaneGeometry(WAREHOUSE_LENGTH, WAREHOUSE_HEIGHT);
  const wallWest = new THREE.Mesh(wallSideGeo, wallMaterial);
  wallWest.position.set(-WAREHOUSE_WIDTH / 2, WAREHOUSE_HEIGHT / 2, 0);
  wallWest.rotation.y = Math.PI / 2;
  warehouseGroup.add(wallWest);
  collisionBoxes.push({
    min: new THREE.Vector3(-WAREHOUSE_WIDTH / 2 - 1, 0, -WAREHOUSE_LENGTH / 2),
    max: new THREE.Vector3(-WAREHOUSE_WIDTH / 2 + 0.5, WAREHOUSE_HEIGHT, WAREHOUSE_LENGTH / 2),
    type: 'wall',
  });

  // East Wall
  const wallEast = new THREE.Mesh(wallSideGeo, wallMaterial);
  wallEast.position.set(WAREHOUSE_WIDTH / 2, WAREHOUSE_HEIGHT / 2, 0);
  wallEast.rotation.y = -Math.PI / 2;
  warehouseGroup.add(wallEast);
  collisionBoxes.push({
    min: new THREE.Vector3(WAREHOUSE_WIDTH / 2 - 0.5, 0, -WAREHOUSE_LENGTH / 2),
    max: new THREE.Vector3(WAREHOUSE_WIDTH / 2 + 1, WAREHOUSE_HEIGHT, WAREHOUSE_LENGTH / 2),
    type: 'wall',
  });

  // 4. Roof Steel Trusses & Industrial Ceiling
  const trussMat = new THREE.MeshStandardMaterial({
    color: 0x3f3f46,
    metalness: 0.8,
    roughness: 0.3,
  });
  for (let z = -20; z <= 20; z += 10) {
    const trussBeam = new THREE.Mesh(new THREE.BoxGeometry(WAREHOUSE_WIDTH, 0.4, 0.4), trussMat);
    trussBeam.position.set(0, WAREHOUSE_HEIGHT - 0.5, z);
    warehouseGroup.add(trussBeam);

    // Diagonal trusses
    for (let x = -20; x <= 20; x += 8) {
      const diag1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 4.2), trussMat);
      diag1.rotation.z = Math.PI / 4;
      diag1.position.set(x + 2, WAREHOUSE_HEIGHT - 1.2, z);
      warehouseGroup.add(diag1);
    }
  }

  // 5. Overhead High-Bay LED Lights
  const lightHousingMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    metalness: 0.8,
    roughness: 0.2,
  });
  const lightEmissiveMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  for (let z = -18; z <= 18; z += 12) {
    for (let x of [-12, 0, 12]) {
      const lamp = new THREE.Group();
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.8, 0.5, 16, 1, true), lightHousingMat);
      const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.08, 16), lightEmissiveMat);
      bulb.position.y = -0.15;
      lamp.add(shade);
      lamp.add(bulb);
      lamp.position.set(x, WAREHOUSE_HEIGHT - 1.2, z);
      warehouseGroup.add(lamp);

      // Add actual spotlight
      const spot = new THREE.SpotLight(0xfff7ed, 45, 24, Math.PI / 3.5, 0.6, 1.2);
      spot.position.set(x, WAREHOUSE_HEIGHT - 1.4, z);
      spot.target.position.set(x, 0, z);
      warehouseGroup.add(spot);
      warehouseGroup.add(spot.target);
    }
  }

  // 6. Heavy-Duty Pallet Racks (Industrial Orange & Blue Steel)
  const rackUprightMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8, // Classic Blue Uprights
    metalness: 0.6,
    roughness: 0.4,
  });
  const rackBeamMat = new THREE.MeshStandardMaterial({
    color: 0xea580c, // Safety Orange Horizontal Load Beams
    metalness: 0.5,
    roughness: 0.35,
  });

  function createRackAisle(startX: number, startZ: number, numBays: number, isFacingRight: boolean) {
    const bayWidth = 3.2;
    const rackDepth = 1.3;
    const rackHeight = 5.6;

    for (let b = 0; b < numBays; b++) {
      const bZ = startZ + b * bayWidth;

      // Add upright columns (front & back)
      for (let side of [-1, 1]) {
        const colZ = bZ + side * (bayWidth / 2);
        const colFront = new THREE.Mesh(new THREE.BoxGeometry(0.12, rackHeight, 0.12), rackUprightMat);
        colFront.position.set(startX - rackDepth / 2, rackHeight / 2, colZ);
        colFront.castShadow = true;
        warehouseGroup.add(colFront);

        const colBack = new THREE.Mesh(new THREE.BoxGeometry(0.12, rackHeight, 0.12), rackUprightMat);
        colBack.position.set(startX + rackDepth / 2, rackHeight / 2, colZ);
        colBack.castShadow = true;
        warehouseGroup.add(colBack);

        // Cross braces between columns
        for (let h = 1.0; h < rackHeight; h += 1.4) {
          const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, rackDepth), rackUprightMat);
          cross.rotation.z = Math.PI / 2;
          cross.position.set(startX, h, colZ);
          warehouseGroup.add(cross);
        }
      }

      // Horizontal orange shelf load beams (Levels: 1 = ground, 2 = 2.0m, 3 = 3.8m)
      const beamLevels = [2.0, 3.8];
      for (let levelY of beamLevels) {
        // Front beam
        const beamFront = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, bayWidth), rackBeamMat);
        beamFront.position.set(startX - rackDepth / 2, levelY, bZ);
        beamFront.castShadow = true;
        warehouseGroup.add(beamFront);

        // Back beam
        const beamBack = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, bayWidth), rackBeamMat);
        beamBack.position.set(startX + rackDepth / 2, levelY, bZ);
        beamBack.castShadow = true;
        warehouseGroup.add(beamBack);

        // Wire mesh deck or support bars
        for (let dz = -1.2; dz <= 1.2; dz += 0.6) {
          const support = new THREE.Mesh(new THREE.BoxGeometry(rackDepth - 0.1, 0.04, 0.05), rackBeamMat);
          support.position.set(startX, levelY - 0.02, bZ + dz);
          warehouseGroup.add(support);
        }

        // Place static stored pallets on upper racks
        if (Math.random() > 0.15) {
          const upperPallet = createPalletWithCargo(`pallet_rack_${startX}_${bZ}_${levelY}`, false, 'STORAGE');
          upperPallet.group.position.set(startX, levelY + 0.1, bZ + (Math.random() - 0.5) * 0.4);
          warehouseGroup.add(upperPallet.group);
          pallets.push(upperPallet);
        }
      }

      // Register collision bounding box for this bay
      collisionBoxes.push({
        min: new THREE.Vector3(startX - rackDepth / 2 - 0.2, 0, bZ - bayWidth / 2),
        max: new THREE.Vector3(startX + rackDepth / 2 + 0.2, rackHeight, bZ + bayWidth / 2),
        type: 'rack',
        id: `rack_${startX}_${b}`,
      });
    }

    // Safety sign on the end of the rack aisle
    const signTex = isFacingRight ? createSafetySignTexture('capacity') : createSafetySignTexture('caution');
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map: signTex }));
    signMesh.position.set(startX, 2.2, startZ - bayWidth / 2 - 0.08);
    signMesh.rotation.y = Math.PI;
    warehouseGroup.add(signMesh);
  }

  // Left Rack Aisle
  createRackAisle(-10, -14, 8, false);

  // Right Rack Aisle
  createRackAisle(10, -14, 8, true);

  // 7. Wall Safety Signs
  const ppeSignTex = createSafetySignTexture('ppe');
  const ppeSign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: ppeSignTex }));
  ppeSign.position.set(-6, 3.5, -WAREHOUSE_LENGTH / 2 + 0.05);
  warehouseGroup.add(ppeSign);

  const speedSignTex = createSafetySignTexture('speed');
  const speedSign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: speedSignTex }));
  speedSign.position.set(6, 3.5, -WAREHOUSE_LENGTH / 2 + 0.05);
  warehouseGroup.add(speedSign);

  // 8. Interactive Pallets on Ground Level (Target Pallets for Training Missions)
  // Mission/Interactive Pallet #1: Right in front of aisle, ready for pickup!
  const targetPallet = createPalletWithCargo('pallet_training_main', true, 'CARGA M1');
  targetPallet.group.position.set(0, 0, -3.2);
  targetPallet.group.rotation.set(0, 0, 0);
  warehouseGroup.add(targetPallet.group);
  pallets.push(targetPallet);

  // Extra secondary pallet near side aisle
  const extraPallet = createPalletWithCargo('pallet_ground_2', true, 'REF: 902');
  extraPallet.group.position.set(-4.5, 0, 8);
  extraPallet.group.rotation.set(0, 0, 0);
  warehouseGroup.add(extraPallet.group);
  pallets.push(extraPallet);

  // Industrial Drums/Barrels Pallet
  const drumPallet = createPalletWithDrums('pallet_drums');
  drumPallet.group.position.set(4.5, 0, 6);
  drumPallet.group.rotation.set(0, 0, 0);
  warehouseGroup.add(drumPallet.group);
  pallets.push(drumPallet);

  // Clean initialization of exact baseline coordinates, rotations, and parent for every pallet
  pallets.forEach((p) => {
    p.initialPosition.copy(p.group.position);
    p.initialRotation = p.group.rotation.clone();
    p.originalParent = warehouseGroup;
  });

  return {
    group: warehouseGroup,
    collisionBoxes,
    pallets,
    interactivePallet: targetPallet,
  };
}

/**
 * Creates an authentic EUR/ISO wooden pallet with cardboard cargo boxes
 */
export function createPalletWithCargo(id: string, isInteractive: boolean, label: string = 'FRÁGIL'): PalletObject {
  const palletGroup = new THREE.Group();

  const woodTex = createPalletWoodTexture();
  const woodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    roughness: 0.85,
    metalness: 0.05,
  });

  // Pallet Dimensions: 1.20m width (front face), 0.80m depth, 0.15m height
  const palletWidth = 1.2;
  const palletDepth = 0.8;
  const palletHeight = 0.144;

  // Bottom 3 skids/runners
  for (let x of [-0.5, 0, 0.5]) {
    const bottomBoard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.022, palletDepth), woodMat);
    bottomBoard.position.set(x, 0.011, 0);
    bottomBoard.castShadow = true;
    bottomBoard.receiveShadow = true;
    palletGroup.add(bottomBoard);

    // 3 Solid spacer blocks per runner
    for (let z of [-0.32, 0, 0.32]) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.12), woodMat);
      block.position.set(x, 0.022 + 0.04, z);
      block.castShadow = true;
      palletGroup.add(block);
    }

    // Stringer board
    const stringer = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.022, palletDepth), woodMat);
    stringer.position.set(x, 0.022 + 0.08 + 0.011, 0);
    stringer.castShadow = true;
    palletGroup.add(stringer);
  }

  // Top deck boards (5 cross boards)
  for (let z of [-0.34, -0.17, 0, 0.17, 0.34]) {
    const topBoard = new THREE.Mesh(new THREE.BoxGeometry(palletWidth, 0.022, 0.14), woodMat);
    topBoard.position.set(0, palletHeight - 0.011, z);
    topBoard.castShadow = true;
    topBoard.receiveShadow = true;
    palletGroup.add(topBoard);
  }

  // Cargo boxes stacked on pallet
  const boxTex = createCardboardTexture(label);
  const boxMat = new THREE.MeshStandardMaterial({
    map: boxTex,
    roughness: 0.8,
    metalness: 0.1,
  });

  // 4 Boxes on bottom tier
  const boxW = 0.54;
  const boxH = 0.48;
  const boxD = 0.36;

  for (let bx of [-0.28, 0.28]) {
    for (let bz of [-0.19, 0.19]) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH, boxD), boxMat);
      box.position.set(bx, palletHeight + boxH / 2, bz);
      box.castShadow = true;
      box.receiveShadow = true;
      palletGroup.add(box);
    }
  }

  // 2 Boxes on top tier (interlocked)
  for (let bx of [-0.28, 0.28]) {
    const topBox = new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH, boxD * 1.8), boxMat);
    topBox.position.set(bx, palletHeight + boxH + boxH / 2, 0);
    topBox.castShadow = true;
    topBox.receiveShadow = true;
    palletGroup.add(topBox);
  }

  // Black strapping bands (heavy duty plastic straps)
  const strapMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
  for (let sx of [-0.3, 0.3]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.02, 1.15, 0.82), strapMat);
    strap.position.set(sx, palletHeight + 0.55, 0);
    palletGroup.add(strap);
  }

  return {
    id,
    group: palletGroup,
    initialPosition: palletGroup.position.clone(),
    initialRotation: new THREE.Euler(0, 0, 0),
    originalParent: palletGroup.parent || (palletGroup as unknown as THREE.Object3D),
    isHeld: false,
    boxBounds: { width: palletWidth, height: palletHeight + boxH * 2, depth: palletDepth },
  };
}

/**
 * Creates pallet with 4 industrial steel drums (hazardous/chemical/oil)
 */
export function createPalletWithDrums(id: string): PalletObject {
  const palletGroup = new THREE.Group();

  const woodTex = createPalletWoodTexture();
  const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 });

  const palletWidth = 1.2;
  const palletDepth = 0.8;
  const palletHeight = 0.144;

  // Deck
  const deck = new THREE.Mesh(new THREE.BoxGeometry(palletWidth, palletHeight, palletDepth), woodMat);
  deck.position.set(0, palletHeight / 2, 0);
  palletGroup.add(deck);

  // 4 Blue Steel Drums
  const drumMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.35,
    metalness: 0.7,
  });
  const drumRimMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.2,
    metalness: 0.9,
  });

  const drumPositions = [
    [-0.3, -0.2],
    [0.3, -0.2],
    [-0.3, 0.2],
    [0.3, 0.2],
  ];

  for (let [dx, dz] of drumPositions) {
    const drumBody = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.9, 20), drumMat);
    drumBody.position.set(dx, palletHeight + 0.45, dz);
    drumBody.castShadow = true;
    palletGroup.add(drumBody);

    // Rim rings
    for (let ry of [0.15, 0.45, 0.75]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.242, 0.012, 8, 20), drumRimMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(dx, palletHeight + ry, dz);
      palletGroup.add(ring);
    }
  }

  return {
    id,
    group: palletGroup,
    initialPosition: palletGroup.position.clone(),
    initialRotation: new THREE.Euler(0, 0, 0),
    originalParent: palletGroup.parent || (palletGroup as unknown as THREE.Object3D),
    isHeld: false,
    boxBounds: { width: palletWidth, height: palletHeight + 0.9, depth: palletDepth },
  };
}
