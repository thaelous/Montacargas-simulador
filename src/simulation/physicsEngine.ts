import * as THREE from 'three';
import { ForkliftControls, ForkliftTelemetry } from '../types/forklift';
import { ForkliftModelData } from './forkliftModel';
import { forkliftAudio } from './sound';
import { CollisionBox, PalletObject } from './warehouse';

export class ForkliftPhysicsEngine {
  // Vehicle Kinematic State
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0); // Starts right at origin in warehouse
  public rotationY: number = 0; // Forklift yaw heading (radians)
  public speed: number = 0; // Linear speed in m/s (positive = forward, negative = reverse)
  public steeringAngle: number = 0; // Steering angle in radians (-0.7 to 0.7)
  public wheelRollAngle: number = 0;

  // Hydraulic Kinematic State
  public forkHeight: number = 0.0; // Altura mínima a ras de piso (0.00m a 3.85m)
  public tiltAngle: number = 0.05; // Mast tilt in radians (-0.08 rad [-4.5°] to +0.17 rad [+10°])
  public sideshift: number = 0; // Lateral shift in meters (-0.16m to +0.16m)

  // Physical specifications
  private readonly MAX_SPEED_FORWARD = 3.6; // ~13 km/h
  private readonly MAX_SPEED_REVERSE = 2.2; // ~8 km/h
  private readonly ACCELERATION = 3.2; // m/s^2
  private readonly BRAKE_FORCE = 8.5; // m/s^2
  private readonly COAST_DECEL = 1.6; // m/s^2
  private readonly STEER_SPEED = 2.4; // rad/s
  private readonly MAX_STEER_ANGLE = 0.72; // ~41° max wheel turn
  private readonly WHEELBASE = 1.5; // Distance between front axle and rear steer axle

  // Mast Hydraulic limits
  private readonly MIN_FORK_HEIGHT = 0.0; // Altura mínima a nivel de suelo del almacén
  private readonly MAX_FORK_HEIGHT = 3.85;
  private readonly LIFT_SPEED = 0.55; // m/s
  private readonly MIN_TILT = -0.075; // ~-4.3° forward
  private readonly MAX_TILT = 0.175; // ~+10° backward
  private readonly TILT_SPEED = 0.16; // rad/s
  private readonly MAX_SIDESHIFT = 0.16;
  private readonly SIDESHIFT_SPEED = 0.12; // m/s

  // State
  public parkingBrakeActive: boolean = false;
  public lightsActive: boolean = true;
  public engineRpm: number = 750;
  public hoursMeter: number = 1248.4;
  public fuelPercent: number = 88.0;

  // Pallet interaction
  public heldPallet: PalletObject | null = null;
  public heldPalletOriginalParent: THREE.Object3D | null = null;
  public withdrawingPalletId: string | null = null;
  private palletPickupCooldown: number = 0;

  // Rollover / Tip-Over Kinematic State
  public isTippedOver: boolean = false;
  public tipReason: string = '';
  public tipRollAngle: number = 0; // Current roll angle in radians (smoothly animates)
  public targetTipRoll: number = 0;
  public tipPitchAngle: number = 0; // Current pitch angle in radians
  public targetTipPitch: number = 0;

  // Collision shapes & AABB Bounding Boxes
  public chassisHalfWidth: number = 0.75;
  public chassisHalfLength: number = 1.35;
  public chassisBox3: THREE.Box3 = new THREE.Box3();
  public forksBox3: THREE.Box3 = new THREE.Box3();

  constructor(initialZ: number = 0) {
    this.position.set(0, 0, initialZ);
  }

  public reset(
    position?: THREE.Vector3,
    pallets?: PalletObject[],
    model?: ForkliftModelData,
  ) {
    if (position) {
      this.position.copy(position);
    } else {
      this.position.set(0, 0, 0);
    }
    this.rotationY = 0;
    this.speed = 0;
    this.steeringAngle = 0;
    this.wheelRollAngle = 0;
    this.forkHeight = 0.0;
    this.tiltAngle = 0.05;
    this.sideshift = 0;
    this.parkingBrakeActive = false;
    this.isTippedOver = false;
    this.tipReason = '';
    this.tipRollAngle = 0;
    this.targetTipRoll = 0;
    this.tipPitchAngle = 0;
    this.targetTipPitch = 0;
    this.engineRpm = 750;
    this.withdrawingPalletId = null;
    this.palletPickupCooldown = 0.5;

    // Reset currently held pallet if any was attached
    if (this.heldPallet) {
      const p = this.heldPallet;
      const targetParent = p.originalParent || this.heldPalletOriginalParent;
      if (targetParent && p.group.parent !== targetParent) {
        targetParent.add(p.group);
      }
      p.group.position.copy(p.initialPosition);
      if (p.initialRotation) {
        p.group.rotation.copy(p.initialRotation);
      } else {
        p.group.rotation.set(0, 0, 0);
      }
      p.group.scale.set(1, 1, 1);
      p.isHeld = false;
      p.group.updateMatrix();
      p.group.updateMatrixWorld(true);
    }
    this.heldPallet = null;
    this.heldPalletOriginalParent = null;

    // Reset ALL pallets cleanly to their exact baseline coordinates, rotations, and parent
    if (pallets && pallets.length > 0) {
      for (const p of pallets) {
        const targetParent = p.originalParent || this.heldPalletOriginalParent;
        if (targetParent && p.group.parent !== targetParent) {
          targetParent.add(p.group);
        }
        p.group.position.copy(p.initialPosition);
        if (p.initialRotation) {
          p.group.rotation.copy(p.initialRotation);
        } else {
          p.group.rotation.set(0, 0, 0);
        }
        p.group.scale.set(1, 1, 1);
        p.isHeld = false;
        p.group.updateMatrix();
        p.group.updateMatrixWorld(true);
      }
    }

    // Immediately snap 3D model transforms upright so there is no residual tilt or roll
    if (model) {
      const defaultControls: ForkliftControls = {
        throttle: 0,
        steering: 0,
        brake: false,
        parkingBrake: false,
        lift: 0,
        tilt: 0,
        sideshift: 0,
        horn: false,
        lights: this.lightsActive,
      };
      this.applyModelTransforms(model, defaultControls);
      model.rootGroup.updateMatrixWorld(true);
    }
  }

  public getTelemetry(): ForkliftTelemetry {
    return this.computeTelemetry();
  }

  public update(
    dt: number,
    controls: ForkliftControls,
    model: ForkliftModelData,
    collisionBoxes: CollisionBox[],
    pallets: PalletObject[],
  ): ForkliftTelemetry {
    // Clamp delta time to avoid large physics steps
    const delta = Math.min(dt, 0.06);

    // If already tipped over, interrupt controls, drop engine, animate tip-over and return
    if (this.isTippedOver) {
      this.speed = 0;
      this.tipRollAngle += (this.targetTipRoll - this.tipRollAngle) * Math.min(1, delta * 4.5);
      this.tipPitchAngle += (this.targetTipPitch - this.tipPitchAngle) * Math.min(1, delta * 4.5);
      this.engineRpm += (0 - this.engineRpm) * Math.min(1, delta * 4);
      forkliftAudio.setHorn(false);
      forkliftAudio.update(this.engineRpm, false, false);
      this.applyModelTransforms(model, controls);
      return this.computeTelemetry();
    }

    // 1. Steering kinematics
    if (controls.steering !== 0) {
      this.steeringAngle += -controls.steering * this.STEER_SPEED * delta;
      this.steeringAngle = THREE.MathUtils.clamp(this.steeringAngle, -this.MAX_STEER_ANGLE, this.MAX_STEER_ANGLE);
    } else {
      // Return to center when not actively steering
      const returnSpeed = 3.2 * delta;
      if (Math.abs(this.steeringAngle) < returnSpeed) {
        this.steeringAngle = 0;
      } else {
        this.steeringAngle -= Math.sign(this.steeringAngle) * returnSpeed;
      }
    }

    // 2. Throttle & Braking
    const isParkingBrake = controls.parkingBrake || this.parkingBrakeActive;
    if (isParkingBrake) {
      // Locked wheels
      if (Math.abs(this.speed) > 0.01) {
        this.speed -= Math.sign(this.speed) * this.BRAKE_FORCE * 2 * delta;
        if (Math.abs(this.speed) < 0.05) this.speed = 0;
      }
    } else if (controls.brake) {
      // Foot brake applied
      if (Math.abs(this.speed) > 0.01) {
        this.speed -= Math.sign(this.speed) * this.BRAKE_FORCE * delta;
        if (Math.abs(this.speed) < 0.05) this.speed = 0;
      }
    } else if (controls.throttle !== 0) {
      // With heavy cargo load, apply realistic weight inertia and slight top-speed governor
      const isLoaded = this.heldPallet !== null;
      const maxForward = isLoaded ? this.MAX_SPEED_FORWARD * 0.90 : this.MAX_SPEED_FORWARD;
      const maxReverse = isLoaded ? this.MAX_SPEED_REVERSE * 0.90 : this.MAX_SPEED_REVERSE;
      const accel = isLoaded ? this.ACCELERATION * 0.88 : this.ACCELERATION;

      if (controls.throttle > 0) {
        // Forward drive (W)
        if (this.speed < maxForward) {
          this.speed += accel * delta;
        }
      } else {
        // Reverse drive (S)
        if (this.speed > -maxReverse) {
          this.speed -= accel * 0.85 * delta;
        }
      }
    } else {
      // Coasting deceleration
      if (Math.abs(this.speed) > 0.01) {
        this.speed -= Math.sign(this.speed) * this.COAST_DECEL * delta;
        if (Math.abs(this.speed) < 0.02) this.speed = 0;
      }
    }

    // 3. Vehicle Kinematics with Rear-Wheel Steering
    // In a forklift, the rear wheels steer, causing yaw rotation around the front axle!
    if (Math.abs(this.speed) > 0.001) {
      const angularVelocity = (this.speed / this.WHEELBASE) * Math.sin(this.steeringAngle);
      const nextYaw = this.rotationY + angularVelocity * delta;

      // Displacement along vehicle heading vector
      const heading = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), nextYaw);
      const moveStep = heading.multiplyScalar(this.speed * delta);

      const nextPos = this.position.clone().add(moveStep);

      // Check collision with warehouse obstacles using AABB Box3
      const collided = this.resolveCollisions(nextPos, nextYaw, collisionBoxes, pallets, controls);
      if (!collided) {
        this.position.copy(nextPos);
        this.rotationY = nextYaw;
      } else {
        // Solid mechanical stop: arrest linear momentum immediately
        if (Math.abs(this.speed) > 0.25) {
          forkliftAudio.playClunk();
        }
        this.speed = 0;

        // If the current position itself is slightly penetrating, separate gently
        if (this.resolveCollisions(this.position, this.rotationY, collisionBoxes, pallets, controls)) {
          const separationStep = heading.clone().multiplyScalar(-Math.sign(this.speed || (controls.throttle > 0 ? 1 : -1)) * 0.02);
          this.position.add(separationStep);
        }
      }

      // Roll wheels
      this.wheelRollAngle += (this.speed * delta) / 0.36;
    }

    // 4. Hydraulic System Kinematics
    let isHydraulicActive = false;

    // Palanca 1: Elevación
    if (controls.lift !== 0) {
      isHydraulicActive = true;
      this.forkHeight += controls.lift * this.LIFT_SPEED * delta;
      this.forkHeight = THREE.MathUtils.clamp(this.forkHeight, this.MIN_FORK_HEIGHT, this.MAX_FORK_HEIGHT);
    }

    // Palanca 2: Inclinación
    // controls.tilt > 0: Inclinación ADELANTE (Tecla I o palanca arriba)
    // controls.tilt < 0: Inclinación ATRÁS (Tecla K o palanca abajo)
    if (controls.tilt !== 0) {
      isHydraulicActive = true;
      this.tiltAngle -= controls.tilt * this.TILT_SPEED * delta;
      this.tiltAngle = THREE.MathUtils.clamp(this.tiltAngle, this.MIN_TILT, this.MAX_TILT);
    }

    // Restricción física geométrica contra el piso (Y = 0)
    // Evita que las puntas de las horquillas penetren o desaparezcan bajo el nivel del piso
    const effectiveMinTilt = Math.asin(
      Math.max(-1, Math.min(1, -(0.010 + this.forkHeight) / 1.25))
    );
    this.tiltAngle = THREE.MathUtils.clamp(this.tiltAngle, Math.max(this.MIN_TILT, effectiveMinTilt), this.MAX_TILT);

    const minHeightForTilt = Math.max(0, -1.25 * Math.sin(this.tiltAngle) - 0.010);
    if (this.forkHeight < minHeightForTilt) {
      this.forkHeight = minHeightForTilt;
    }

    // Palanca 3: Desplazamiento Lateral
    if (controls.sideshift !== 0) {
      isHydraulicActive = true;
      this.sideshift += controls.sideshift * this.SIDESHIFT_SPEED * delta;
      this.sideshift = THREE.MathUtils.clamp(this.sideshift, -this.MAX_SIDESHIFT, this.MAX_SIDESHIFT);
    }

    // Update Horn
    forkliftAudio.setHorn(controls.horn);

    // Update Engine RPM & Audio
    let targetRpm = 750;
    if (Math.abs(controls.throttle) > 0.1) {
      targetRpm += Math.abs(controls.throttle) * 1400;
    }
    if (isHydraulicActive) {
      targetRpm += 500;
    }
    this.engineRpm += (targetRpm - this.engineRpm) * Math.min(1, delta * 6);

    const isReversing = this.speed < -0.1 || (controls.throttle < 0 && Math.abs(this.speed) < 0.2);
    forkliftAudio.update(this.engineRpm, isHydraulicActive, isReversing);

    // 5. Apply Kinematic Transforms to 3D Model Hierarchy & Cylinders FIRST
    this.applyModelTransforms(model, controls);
    model.rootGroup.updateMatrixWorld(true);

    // 6. Pallet Engagement, Solidary Kinematic Carry & Controlled Release
    this.handlePalletPhysics(delta, model, pallets, controls);

    // 7. Stability Triangle Dynamic Assessment & Tip-Over Physics Detection
    const speedKmh = Math.abs(this.speed) * 3.6;
    const baseWeight = 2800; // kg
    const loadWeight = this.heldPallet ? 850 : 0;
    const totalWeight = baseWeight + loadWeight;
    const centrifugal = (this.speed * this.speed * Math.tan(this.steeringAngle)) / (this.WHEELBASE * 9.81);
    const combinedCgX = ((loadWeight * this.sideshift) / totalWeight) + centrifugal * 0.25;

    // Critical rollover triggers:
    // A. Viraje brusco a alta velocidad con mástil elevado
    const isElevatedMastTurn = this.forkHeight > 1.2 && speedKmh > 6.0 && Math.abs(this.steeringAngle) > 0.28;
    // B. Mástil muy elevado (>2.0m) a velocidad moderada en curva
    const isHighMastTurn = this.forkHeight > 2.0 && speedKmh > 3.8 && Math.abs(this.steeringAngle) > 0.18;
    // C. Fuerza centrífuga extrema o carga descentrada fuera de los neumáticos
    const isCriticalLateralCg = Math.abs(combinedCgX) > 0.44;
    // D. Curva a velocidad excesiva sin mástil elevado
    const isOverSpeedCornering = speedKmh > 11.5 && Math.abs(this.steeringAngle) > 0.40;

    if (isElevatedMastTurn || isHighMastTurn || isCriticalLateralCg || isOverSpeedCornering) {
      this.isTippedOver = true;
      const rollDir = Math.sign(combinedCgX) !== 0 ? Math.sign(combinedCgX) : -Math.sign(this.steeringAngle) || 1;
      this.targetTipRoll = rollDir * 1.48; // ~85° de vuelco lateral sobre el chasis y jaula ROPS/FOPS
      this.tipReason = this.forkHeight > 1.2
        ? 'Vuelco lateral por viraje brusco con mástil elevado. El Centro de Gravedad salió del triángulo de estabilidad.'
        : 'Fuerza centrífuga extrema en curva que superó la base de sustentación lateral.';
      if (this.heldPallet) {
        this.spillHeldPallet();
      }
      forkliftAudio.playClunk();
      this.applyModelTransforms(model, controls);
    } else if (this.forkHeight > 1.5 && this.tiltAngle < -0.03 && this.heldPallet && controls.brake && speedKmh > 5.0) {
      // Vuelco frontal por frenada brusca con carga elevada inclinada adelante
      this.isTippedOver = true;
      this.targetTipPitch = -0.62;
      this.tipReason = 'Vuelco frontal por frenada brusca con mástil inclinado hacia adelante y carga en altura.';
      if (this.heldPallet) {
        this.spillHeldPallet();
      }
      forkliftAudio.playClunk();
      this.applyModelTransforms(model, controls);
    }

    // 8. Dynamic Stability Triangle Calculation
    const telemetry = this.computeTelemetry();
    return telemetry;
  }

  /**
   * Applies the exact trigonometric and hydraulic positions to the 3D model
   */
  private applyModelTransforms(model: ForkliftModelData, controls: ForkliftControls) {
    // Root position & orientation (including smooth rollover animation)
    const rollOffset = Math.sin(Math.abs(this.tipRollAngle)) * 0.42;
    model.rootGroup.position.set(this.position.x, this.position.y + rollOffset, this.position.z);
    model.rootGroup.rotation.set(this.tipPitchAngle, this.rotationY, this.tipRollAngle, 'YXZ');

    // Steering wheel and front/rear wheels
    model.frontLeftWheel.rotation.x = this.wheelRollAngle;
    model.frontRightWheel.rotation.x = this.wheelRollAngle;

    // Rear steering knuckles yaw (Ackerman angle) & roll
    model.rearLeftKnuckle.rotation.y = this.steeringAngle;
    model.rearRightKnuckle.rotation.y = this.steeringAngle;
    model.rearLeftWheel.rotation.x = this.wheelRollAngle * (0.36 / 0.28);
    model.rearRightWheel.rotation.x = this.wheelRollAngle * (0.36 / 0.28);

    // Steering wheel rotates with operator steering
    model.steeringWheel.rotation.z = -this.steeringAngle * 3.5;

    // 1. Mast Tilt around pivot base (Inclinación adelante < 0, Inclinación atrás > 0)
    model.mastBaseGroup.rotation.x = this.tiltAngle;

    // Dual Tilt Cylinders trigonometric geometry
    // Calculate distance and angle between chassis bracket (0, 0.45, -0.45) and mast bracket (0, 0.75, -0.9)
    const baseMastP = new THREE.Vector3(0, 0.75, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), this.tiltAngle);
    baseMastP.z -= 0.9;
    baseMastP.y += 0.36;

    const chassisAnchorY = 0.52;
    const chassisAnchorZ = -0.32;
    const cylinderLen = Math.hypot(baseMastP.y - chassisAnchorY, baseMastP.z - chassisAnchorZ);
    const cylinderAngle = Math.atan2(baseMastP.y - chassisAnchorY, -(baseMastP.z - chassisAnchorZ));

    for (let cyl of [model.tiltCylinderLeft, model.tiltCylinderRight]) {
      cyl.body.position.set(cyl.body.position.x, chassisAnchorY, chassisAnchorZ);
      cyl.body.rotation.x = -(Math.PI / 2 - cylinderAngle);
      // Rod extends out of cylinder body
      cyl.rod.position.y = (cylinderLen - 0.48) / 2 + 0.24;
      cyl.rod.scale.set(1, Math.max(0.6, cylinderLen / 0.48), 1);
    }

    // 2. Telescoping Mast & Carriage Height
    // Duplex 2:1 elevation ratio:
    // First 1.4m of lift: carriage moves up inner mast
    // Beyond 1.4m: inner mast extends upward from outer mast
    let innerMastLift = 0;
    let carriageLift = 0;

    if (this.forkHeight <= 1.4) {
      carriageLift = this.forkHeight;
      innerMastLift = 0;
    } else {
      innerMastLift = (this.forkHeight - 1.4) * 0.75;
      carriageLift = 1.4 + (this.forkHeight - 1.4) * 0.25;
    }

    model.innerMastGroup.position.y = innerMastLift;
    model.carriageGroup.position.y = -0.345 + carriageLift;

    // Center Lift Cylinder Rod extends with inner mast
    model.liftCylinderRod.position.y = (innerMastLift + 2.2) / 2;
    model.liftCylinderRod.scale.set(1, 1 + innerMastLift / 2.2, 1);

    // 3. Sideshift of forks
    model.forksGroup.position.x = this.sideshift;

    // 4. Hydraulic levers animated deflection
    model.leverLift.rotation.x = controls.lift * 0.35;
    model.leverTilt.rotation.x = -controls.tilt * 0.35;
    model.leverSideshift.rotation.z = -controls.sideshift * 0.35;

    // 5. Amber Safety Beacon Rotation
    model.beaconMesh.rotation.y += 0.15;
    model.beaconLight.intensity = 2.5 + Math.sin(Date.now() * 0.012) * 2.0;

    // 6. Headlights spotlight toggle
    for (let light of model.headlights) {
      light.intensity = this.lightsActive ? 30 : 0;
    }
  }

  /**
   * Collision resolution against warehouse walls, columns, racks, and ground pallets using THREE.Box3 AABB
   */
  private resolveCollisions(
    candidatePos: THREE.Vector3,
    candidateYaw: number,
    collisionBoxes: CollisionBox[],
    pallets: PalletObject[],
    controls: ForkliftControls,
  ): boolean {
    const cosY = Math.abs(Math.cos(candidateYaw));
    const sinY = Math.abs(Math.sin(candidateYaw));

    // Vehicle forward and right unit vectors
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), candidateYaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), candidateYaw);

    // 1. Forklift Chassis Main Body AABB
    // Chassis spans local Z from -0.90 (front drive axle/fenders) to +1.60 (rear counterweight).
    // Center is at local Z = +0.35, half-length = 1.25m, half-width = 0.72m, height = 2.25m.
    const chassisCenterWorld = candidatePos.clone().add(forward.clone().multiplyScalar(-0.35));
    const chassisHalfW = 0.72;
    const chassisHalfL = 1.25;
    const chassisExtentX = chassisHalfW * cosY + chassisHalfL * sinY;
    const chassisExtentZ = chassisHalfW * sinY + chassisHalfL * cosY;

    this.chassisBox3.min.set(chassisCenterWorld.x - chassisExtentX, candidatePos.y, chassisCenterWorld.z - chassisExtentZ);
    this.chassisBox3.max.set(chassisCenterWorld.x + chassisExtentX, candidatePos.y + 2.25, chassisCenterWorld.z + chassisExtentZ);

    // 2. Fork Blades AABB (for precise cargo & runner tunnel interaction)
    const forksCenterWorld = candidatePos.clone()
      .add(forward.clone().multiplyScalar(1.555))
      .add(right.clone().multiplyScalar(this.sideshift));
    const forkHalfW = 0.45;
    const forkHalfL = 0.58;
    const forkExtentX = forkHalfW * cosY + forkHalfL * sinY;
    const forkExtentZ = forkHalfW * sinY + forkHalfL * cosY;
    const forkMinY = candidatePos.y + this.forkHeight;
    const forkMaxY = forkMinY + 0.08;

    const candidateForksBox3 = new THREE.Box3(
      new THREE.Vector3(forksCenterWorld.x - forkExtentX, forkMinY, forksCenterWorld.z - forkExtentZ),
      new THREE.Vector3(forksCenterWorld.x + forkExtentX, forkMaxY, forksCenterWorld.z + forkExtentZ)
    );

    // 3. Carriage & Mast Load Backrest AABB (the physical vertical barrier at local Z = -0.98)
    const carriageCenterWorld = candidatePos.clone().add(forward.clone().multiplyScalar(0.98));
    const carriageHalfW = 0.525;
    const carriageHalfL = 0.10;
    const carriageExtentX = carriageHalfW * cosY + carriageHalfL * sinY;
    const carriageExtentZ = carriageHalfW * sinY + carriageHalfL * cosY;

    const carriageBox3 = new THREE.Box3(
      new THREE.Vector3(carriageCenterWorld.x - carriageExtentX, candidatePos.y, carriageCenterWorld.z - carriageExtentZ),
      new THREE.Vector3(carriageCenterWorld.x + carriageExtentX, candidatePos.y + 2.6, carriageCenterWorld.z + carriageExtentZ)
    );

    // 4. Test intersection with Warehouse Structure Bounding Boxes (AABB)
    const obstacleBox = new THREE.Box3();
    for (let box of collisionBoxes) {
      obstacleBox.min.copy(box.min);
      obstacleBox.max.copy(box.max);

      if (
        this.chassisBox3.intersectsBox(obstacleBox) ||
        candidateForksBox3.intersectsBox(obstacleBox) ||
        carriageBox3.intersectsBox(obstacleBox)
      ) {
        return true;
      }
    }

    // Carried pallet collision with warehouse walls
    if (this.heldPallet) {
      const heldWorldPos = new THREE.Vector3();
      this.heldPallet.group.getWorldPosition(heldWorldPos);
      const carriedBox = new THREE.Box3(
        new THREE.Vector3(heldWorldPos.x - 0.6, heldWorldPos.y, heldWorldPos.z - 0.5),
        new THREE.Vector3(heldWorldPos.x + 0.6, heldWorldPos.y + 1.15, heldWorldPos.z + 0.5)
      );
      for (let box of collisionBoxes) {
        if (box.type === 'wall') {
          obstacleBox.min.copy(box.min);
          obstacleBox.max.copy(box.max);
          if (carriedBox.intersectsBox(obstacleBox)) {
            return true;
          }
        }
      }
    }

    // 5. Test solid collision against unheld ground pallets and stacked cargo
    const palletBox = new THREE.Box3();
    for (let p of pallets) {
      // If the pallet is currently held by this forklift, it moves with the forks, skip self-collision
      if (p.isHeld || (this.heldPallet && this.heldPallet.id === p.id)) {
        continue;
      }

      const pPos = p.group.position;

      // If the operator just released this pallet and is withdrawing the forks in reverse:
      if (this.withdrawingPalletId === p.id) {
        const dist = candidatePos.distanceTo(pPos);
        if (dist > 2.2) {
          // Fork tips have completely cleared the pallet! Normal collision restored
          this.withdrawingPalletId = null;
        } else if (this.speed <= 0 || controls.throttle < 0) {
          // Reversing away smoothly: skip collision so forks slide out unobstructed!
          continue;
        }
      }

      const bW = p.boxBounds.width / 2;
      const bH = p.boxBounds.height;
      const bD = p.boxBounds.depth / 2;

      // Entire pallet assembly box (including wooden pallet base + cargo boxes on top)
      palletBox.min.set(pPos.x - bW, pPos.y, pPos.z - bD);
      palletBox.max.set(pPos.x + bW, pPos.y + bH, pPos.z + bD);

      // Cargo boxes section (sits above wooden runner pockets: Y > 0.14m)
      const cargoBoxesBox = new THREE.Box3(
        new THREE.Vector3(pPos.x - bW, pPos.y + 0.14, pPos.z - bD),
        new THREE.Vector3(pPos.x + bW, pPos.y + bH, pPos.z + bD)
      );

      // Relative displacement from forklift candidate position to pallet
      const toPallet = new THREE.Vector3().subVectors(pPos, candidatePos);
      const forwardProj = toPallet.dot(forward); // Positive when pallet is in front of forklift
      const lateralDist = Math.abs(toPallet.dot(right));

      // A. Mechanical Stop: Carriage / Mast Backrest Contact
      // When moving forward (speed > 0), carriage stops at the pallet front face
      if (this.speed > 0) {
        if (carriageBox3.intersectsBox(palletBox)) {
          return true;
        }
        if (forwardProj > 0 && forwardProj <= 0.98 + bD + 0.04 && lateralDist < bW + 0.15) {
          return true;
        }
      }

      // B. Forks Hitting Solid Cargo Boxes (elevated forks or above pallet tunnels)
      // When forks are raised above runner slots (forkHeight > 0.13m), they hit the cargo boxes directly!
      if (this.speed > 0 && candidateForksBox3.intersectsBox(cargoBoxesBox)) {
        return true;
      }

      // C. Chassis / Wheels Colliding with Pallet or Cargo
      if (this.chassisBox3.intersectsBox(palletBox)) {
        return true;
      }

      // D. Forks Contacting Wooden Pallet
      if (candidateForksBox3.intersectsBox(palletBox)) {
        // When reversing (speed <= 0 or throttle < 0) with lowered forks, the forks slide OUT freely!
        if (this.speed > 0) {
          const toPalletNorm = toPallet.clone().normalize();
          const angleDot = forward.dot(toPalletNorm);

          const isAlignedForTunnels = angleDot > 0.80 && this.forkHeight <= 0.13;
          if (!isAlignedForTunnels) {
            // Off-angle hit on wooden blocks/runners: solid collision!
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Pallet Picking, Carrying, and Stacking Logic with Solidary Kinematic Attachment
   */
  private handlePalletPhysics(
    dt: number,
    model: ForkliftModelData,
    pallets: PalletObject[],
    controls: ForkliftControls,
  ) {
    if (this.palletPickupCooldown > 0) {
      this.palletPickupCooldown -= dt;
    }

    // World position of the fork blades center
    const forkLocalPos = new THREE.Vector3(0, 0.04, -0.59);
    const forkWorldPos = forkLocalPos.clone();
    model.forksGroup.localToWorld(forkWorldPos);

    // Compute Forks AABB Bounding Box
    this.forksBox3.setFromCenterAndSize(
      forkWorldPos,
      new THREE.Vector3(0.9, 0.2, 1.25)
    );

    if (this.heldPallet) {
      const p = this.heldPallet;

      // Ensure the pallet group is directly parented to forksGroup for 100% solidary kinematic coupling
      if (p.group.parent !== model.forksGroup) {
        if (!this.heldPalletOriginalParent && p.group.parent) {
          this.heldPalletOriginalParent = p.group.parent;
        }
        model.forksGroup.add(p.group);
      }

      // Controlled physical set-down and release to floor:
      // The load is ONLY released when:
      // 1) Operator has lowered forks completely to floor level: forkHeight <= 0.015m (Key J)
      // 2) Operator moves in reverse: controls.throttle < 0 or speed < -0.01m/s (Key S)
      const isAtFloorLevel = this.forkHeight <= 0.015;
      const isReversingAway = controls.throttle < 0 || this.speed < -0.01;

      if (isAtFloorLevel && isReversingAway) {
        this.releaseHeldPallet();
      }
    } else if (this.palletPickupCooldown <= 0) {
      // Forklift forward direction vector in XZ plane
      const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotationY);

      for (let p of pallets) {
        if (p.isHeld) continue;
        if (this.withdrawingPalletId === p.id) continue;

        const palletWorldPos = new THREE.Vector3();
        p.group.getWorldPosition(palletWorldPos);

        const dx = forkWorldPos.x - palletWorldPos.x;
        const dz = forkWorldPos.z - palletWorldPos.z;
        const horizontalDist = Math.hypot(dx, dz);
        const verticalDist = Math.abs(forkWorldPos.y - (palletWorldPos.y + 0.07));

        const toPallet = new THREE.Vector3().subVectors(palletWorldPos, this.position).normalize();
        const forwardAlignment = forward.dot(toPallet);

        // Verification of physical insertion of forks within pallet runner pockets:
        // - Forks are horizontally entered into the pallet: horizontalDist < 0.55
        // - Vertical height matches pallet entry pockets: verticalDist < 0.16
        // - Heading aligned with entry tunnels: forwardAlignment > 0.80
        const isForksPhysicallyInserted = horizontalDist < 0.55 && verticalDist < 0.16 && forwardAlignment > 0.80;

        // REAL CONTACT ENGAGEMENT (NO EFECTO IMÁN):
        // Only engage when forks are physically inserted inside the pallet AND the operator raises the mast (Key U)!
        if (isForksPhysicallyInserted && controls.lift > 0 && this.forkHeight >= 0.035) {
          this.engagePallet(p, model);
          break;
        }
      }
    }
  }

  private engagePallet(p: PalletObject, model: ForkliftModelData) {
    this.heldPallet = p;
    p.isHeld = true;
    this.heldPalletOriginalParent = p.originalParent || p.group.parent;
    this.withdrawingPalletId = null;

    // Convert pallet's current world position into local coordinates of forksGroup
    const worldPos = new THREE.Vector3();
    p.group.getWorldPosition(worldPos);

    // Attach to forksGroup for solidary movement
    model.forksGroup.add(p.group);

    // Convert to forksGroup local coordinates to keep its natural position without jumping/teleporting
    model.forksGroup.worldToLocal(worldPos);
    const smoothZ = THREE.MathUtils.clamp(worldPos.z, -0.68, -0.42);

    p.group.position.set(0, 0.015, smoothZ);
    p.group.rotation.set(0, 0, 0);
    p.group.scale.set(1, 1, 1);
    p.group.updateMatrix();
    p.group.updateMatrixWorld(true);

    this.palletPickupCooldown = 0.6;
    forkliftAudio.playClunk();
  }

  public releaseHeldPallet() {
    if (!this.heldPallet) return;

    const p = this.heldPallet;
    const worldPos = new THREE.Vector3();
    const worldQuat = new THREE.Quaternion();
    p.group.getWorldPosition(worldPos);
    p.group.getWorldQuaternion(worldQuat);

    // Return to original warehouse group/scene
    const targetParent = p.originalParent || this.heldPalletOriginalParent || p.group.parent?.parent;
    if (targetParent) {
      targetParent.add(p.group);
      targetParent.worldToLocal(worldPos);
    }

    // Set level on ground floor at its new deposited position (Y = 0)
    p.group.position.set(worldPos.x, 0, worldPos.z);
    const euler = new THREE.Euler().setFromQuaternion(worldQuat, 'YXZ');
    p.group.rotation.set(0, euler.y, 0);
    p.group.scale.set(1, 1, 1);
    p.group.updateMatrix();
    p.group.updateMatrixWorld(true);

    p.isHeld = false;
    this.withdrawingPalletId = p.id;
    this.heldPallet = null;
    this.heldPalletOriginalParent = null;
    this.palletPickupCooldown = 1.0;
    forkliftAudio.playClunk();
  }

  private spillHeldPallet() {
    if (!this.heldPallet) return;

    const p = this.heldPallet;
    const worldPos = new THREE.Vector3();
    p.group.getWorldPosition(worldPos);

    const targetParent = p.originalParent || this.heldPalletOriginalParent || p.group.parent?.parent;
    if (targetParent) {
      targetParent.add(p.group);
      targetParent.worldToLocal(worldPos);
    }

    p.group.position.set(worldPos.x, 0, worldPos.z);
    p.group.rotation.set(0.25, this.rotationY + 0.25, 0.35);
    p.group.scale.set(1, 1, 1);
    p.group.updateMatrix();
    p.group.updateMatrixWorld(true);

    p.isHeld = false;
    this.withdrawingPalletId = null;
    this.heldPallet = null;
    this.heldPalletOriginalParent = null;
    this.palletPickupCooldown = 1.5;
  }

  /**
   * Computes vehicle telemetry and the Dynamic Stability Triangle
   */
  private computeTelemetry(): ForkliftTelemetry {
    const speedKmh = Math.abs(this.speed) * 3.6;

    let gear: 'F' | 'N' | 'R' = 'N';
    if (this.speed > 0.05) gear = 'F';
    else if (this.speed < -0.05) gear = 'R';

    // Center of Gravity offset calculation:
    // Safe zone is inside the triangle formed by front drive wheels (left/right) and rear steer pivot (center)
    const baseWeight = 2800; // kg (forklift)
    const loadWeight = this.heldPallet ? 850 : 0; // kg (pallet + cargo)
    const totalWeight = baseWeight + loadWeight;

    // Longitudinal CG shift (Z):
    // Forklift CG is normally at z = 0.35m (behind front axle at 0.0m)
    // Pallet load is at z = -1.5m (in front of axle)
    // Raising forks with tilt moves CG forward/backward
    const forkCgZ = -1.45 + this.forkHeight * Math.sin(this.tiltAngle);
    const combinedCgZ = (baseWeight * 0.35 + loadWeight * forkCgZ) / totalWeight;

    // Vertical CG height (Y):
    const forkCgY = this.forkHeight + 0.45;
    const combinedCgY = (baseWeight * 0.65 + loadWeight * forkCgY) / totalWeight;

    // Lateral CG shift (X) from sideshift & centrifugal force in turns:
    const centrifugal = (this.speed * this.speed * Math.tan(this.steeringAngle)) / (this.WHEELBASE * 9.81);
    const combinedCgX = ((loadWeight * this.sideshift) / totalWeight) + centrifugal * 0.25;

    // Stability risk assessment (OSHA guidelines):
    let stabilityRisk: 'safe' | 'warning' | 'danger' = 'safe';
    if (this.forkHeight > 1.8 && speedKmh > 5.0) {
      // DANGER: Driving with mast elevated is a primary cause of industrial tip-over accidents!
      stabilityRisk = 'danger';
    } else if (this.forkHeight > 2.2 || (this.tiltAngle < 0 && this.forkHeight > 1.2 && this.heldPallet)) {
      stabilityRisk = 'warning';
    } else if (Math.abs(combinedCgX) > 0.4) {
      stabilityRisk = 'danger';
    }

    return {
      speedKmh,
      engineRpm: Math.round(this.engineRpm),
      gear,
      forkHeightM: Number(this.forkHeight.toFixed(2)),
      tiltAngleDeg: Number(((this.tiltAngle * 180) / Math.PI).toFixed(1)),
      sideshiftM: Number(this.sideshift.toFixed(2)),
      parkingBrake: this.parkingBrakeActive,
      lightsOn: this.lightsActive,
      fuelPercent: Number(this.fuelPercent.toFixed(1)),
      hours: Number(this.hoursMeter.toFixed(1)),
      isCarryingPallet: this.heldPallet !== null,
      stabilityRisk,
      cgOffset: { x: combinedCgX, y: combinedCgY, z: combinedCgZ },
      isTippedOver: this.isTippedOver,
      tipReason: this.tipReason,
    };
  }
}
