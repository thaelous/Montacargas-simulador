import * as THREE from 'three';

/**
 * Creates high quality procedural textures using HTML5 Canvas.
 * Generates realistic industrial textures without external assets.
 */

// 1. Polished Concrete Warehouse Floor with Grid and Skid Marks
export function createWarehouseFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Base concrete color
  ctx.fillStyle = '#3a3d40';
  ctx.fillRect(0, 0, 1024, 1024);

  // Concrete noise and speckles
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // Expansion joints grid (slabs)
  ctx.strokeStyle = '#222527';
  ctx.lineWidth = 4;
  const slabSize = 256;
  for (let x = 0; x <= 1024; x += slabSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1024);
    ctx.stroke();
  }
  for (let y = 0; y <= 1024; y += slabSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  // Expansion joint sealant highlights
  ctx.strokeStyle = '#4a4e52';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1024; x += slabSize) {
    ctx.beginPath();
    ctx.moveTo(x + 2, 0);
    ctx.lineTo(x + 2, 1024);
    ctx.stroke();
  }

  // Faint forklift tire skid marks
  ctx.strokeStyle = 'rgba(20, 22, 24, 0.4)';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(380, 420, 180, 0.3, 1.8);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(420, 420, 180, 0.3, 1.8);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  return texture;
}

// 2. Industrial Yellow Safety Hazard Striping (OSHA / ISO)
export function createSafetyStripeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f59e0b'; // OSHA Safety Amber
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#18181b'; // Black stripes
  ctx.beginPath();
  for (let i = -256; i < 512; i += 64) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 32, 0);
    ctx.lineTo(i + 32 + 256, 256);
    ctx.lineTo(i + 256, 256);
    ctx.closePath();
  }
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 3. Cardboard Shipping Box Texture with Labels & Warning Icons
export function createCardboardTexture(label: string = 'FRÁGIL'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Kraft cardboard base
  ctx.fillStyle = '#c29b68';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle fiber texture
  ctx.fillStyle = 'rgba(120, 90, 50, 0.08)';
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillRect(x, y, Math.random() * 20 + 5, 1.5);
  }

  // Brown packing tape across top
  ctx.fillStyle = '#9e7340';
  ctx.fillRect(0, 230, 512, 52);

  // White shipping label sticker
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(40, 40, 220, 150);
  ctx.strokeStyle = '#d4d4d8';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, 220, 150);

  // Barcode
  ctx.fillStyle = '#18181b';
  for (let bx = 60; bx < 240; bx += Math.floor(Math.random() * 6) + 3) {
    ctx.fillRect(bx, 130, Math.random() > 0.5 ? 2 : 4, 40);
  }

  // Label text
  ctx.fillStyle = '#09090b';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('REF: ' + Math.floor(100000 + Math.random() * 900000), 55, 65);
  ctx.font = '12px sans-serif';
  ctx.fillText('DEST: ALMACÉN CENTRAL B-4', 55, 85);
  ctx.fillText('PESO NETO: 420 KG', 55, 105);

  // Red Fragile Stamp
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.strokeRect(300, 50, 160, 60);
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(label, 320, 90);

  // Keep Dry Umbrella / Up Arrows Icon
  ctx.fillStyle = '#18181b';
  // Up arrows
  ctx.fillRect(340, 140, 10, 35);
  ctx.beginPath();
  ctx.moveTo(330, 140);
  ctx.lineTo(345, 120);
  ctx.lineTo(360, 140);
  ctx.fill();

  ctx.fillRect(400, 140, 10, 35);
  ctx.beginPath();
  ctx.moveTo(390, 140);
  ctx.lineTo(405, 120);
  ctx.lineTo(420, 140);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 4. Wooden Pallet Texture (Pine Wood Planks)
export function createPalletWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Pine wood tone
  ctx.fillStyle = '#bda077';
  ctx.fillRect(0, 0, 512, 512);

  // Wood grain lines
  ctx.strokeStyle = 'rgba(130, 95, 55, 0.25)';
  ctx.lineWidth = 2;
  for (let y = 0; y < 512; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(150, y + (Math.random() - 0.5) * 8, 350, y + (Math.random() - 0.5) * 8, 512, y);
    ctx.stroke();
  }

  // EPAL / EUR heat-treatment branding stamp
  ctx.strokeStyle = '#5a3d1c';
  ctx.lineWidth = 3;
  ctx.strokeRect(180, 200, 150, 75);
  ctx.fillStyle = '#5a3d1c';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('EUR / EPAL', 195, 245);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 5. Industrial Safety Signboard Plaque
export function createSafetySignTexture(type: 'caution' | 'speed' | 'ppe' | 'capacity'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // White metal background with rounded edge border
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 244);

  if (type === 'caution') {
    // Top Caution Bar
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(10, 10, 492, 70);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('¡ PRECAUCIÓN !', 256, 58);

    ctx.fillStyle = '#18181b';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('TRÁNSITO FRECUENTE', 256, 130);
    ctx.fillText('DE MONTACARGAS', 256, 168);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.fillText('PASO PREFERENCIAL AL VEHÍCULO', 256, 210);
  } else if (type === 'speed') {
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(10, 10, 492, 70);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LÍMITE DE VELOCIDAD', 256, 58);

    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(256, 165, 55, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#18181b';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('10', 256, 175);
    ctx.font = '16px sans-serif';
    ctx.fillText('KM/H MÁXIMO', 256, 205);
  } else if (type === 'ppe') {
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(10, 10, 492, 70);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SEGURIDAD INDUSTRIAL', 256, 56);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('USO OBLIGATORIO DE EPP', 256, 125);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('• CASCO DE SEGURIDAD', 256, 158);
    ctx.fillText('• CALZADO CON PUNTERA DE ACERO', 256, 186);
    ctx.fillText('• CHALECO REFLEJANTE', 256, 214);
  } else {
    ctx.fillStyle = '#15803d';
    ctx.fillRect(10, 10, 492, 70);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAPACIDAD DE CARGA', 256, 58);

    ctx.fillStyle = '#18181b';
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText('MÁX. 3,500 KG', 256, 140);
    ctx.font = '18px sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.fillText('POR NIVEL DE ESTANTERÍA', 256, 180);
    ctx.fillText('NO SOBRECARGAR', 256, 210);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 6. Corrugated Warehouse Wall Texture
export function createWarehouseWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4b5563'; // Industrial cool grey
  ctx.fillRect(0, 0, 512, 512);

  // Vertical corrugated panels
  const panelWidth = 32;
  for (let x = 0; x < 512; x += panelWidth) {
    const grad = ctx.createLinearGradient(x, 0, x + panelWidth, 0);
    grad.addColorStop(0, '#374151');
    grad.addColorStop(0.3, '#6b7280');
    grad.addColorStop(0.7, '#4b5563');
    grad.addColorStop(1, '#1f2937');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, panelWidth, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 2);
  return texture;
}
