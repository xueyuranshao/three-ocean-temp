import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const eastChinaCoastImage = new URL('../assets/tt.png', import.meta.url).href;

export type FoldDirection = 'rtl' | 'ltr' | 'ttb';

interface SceneState {
  foldDirection: FoldDirection;
  foldStrength: number;
  currentMonth: number | null;
}

export interface OceanSceneController {
  setFoldDirection(nextDirection: FoldDirection): void;
  setFoldStrength(normalized: number): void;
  setCurrentMonth(nextMonth: number | null): void;
  dispose(): void;
}

export function createOceanScene(container: HTMLElement, initialState: SceneState): OceanSceneController {
  const state: SceneState = { ...initialState };

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa9c4da);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 250);
  camera.position.set(29, 17, 37);
  camera.lookAt(0, -1.2, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0.2, -1.5, 0);
  controls.minDistance = 18;
  controls.maxDistance = 180;
  controls.maxPolarAngle = Math.PI * 0.47;

  scene.add(new THREE.HemisphereLight(0xf1f6fb, 0x5f6f72, 1.45));

  const sunLight = new THREE.DirectionalLight(0xfff4d6, 2.8);
  sunLight.position.set(-9, 15, 7);
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0x97b9de, 0.65);
  fillLight.position.set(10, 8, -10);
  scene.add(fillLight);

  const skyGeometry = new THREE.SphereGeometry(100, 48, 32);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0xa6c0d8) },
      horizonColor: { value: new THREE.Color(0xc8d7df) },
      bottomColor: { value: new THREE.Color(0xe0e5db) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 horizonColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y * 0.5 + 0.5;
        vec3 color = mix(bottomColor, horizonColor, smoothstep(0.0, 0.48, h));
        color = mix(color, topColor, smoothstep(0.45, 1.0, h));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
  scene.add(new THREE.Mesh(skyGeometry, skyMaterial));

  function createLandMaskTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';

    const fillPolygon = (points: Array<[number, number]>): void => {
      ctx.beginPath();
      ctx.moveTo(points[0][0] * canvas.width, points[0][1] * canvas.height);
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i][0] * canvas.width, points[i][1] * canvas.height);
      }
      ctx.closePath();
      ctx.fill();
    };

    fillPolygon([
      [0.02, 0.03], [0.44, 0.02], [0.46, 0.12], [0.45, 0.24], [0.46, 0.36], [0.45, 0.48],
      [0.4, 0.57], [0.35, 0.62], [0.28, 0.67], [0.2, 0.72], [0.11, 0.76], [0.05, 0.82],
      [0.03, 0.96], [0, 0.96], [0, 0.04],
    ]);
    fillPolygon([
      [0, 0.82], [0.03, 0.78], [0.06, 0.8], [0.06, 0.92], [0.03, 0.96], [0, 0.94],
    ]);
    fillPolygon([
      [0.43, 0.49], [0.46, 0.46], [0.48, 0.52], [0.47, 0.6], [0.44, 0.61], [0.42, 0.56],
    ]);
    fillPolygon([
      [0.52, 0.05], [0.57, 0.02], [0.62, 0.04], [0.64, 0.12], [0.61, 0.21], [0.57, 0.25], [0.53, 0.19],
    ]);
    fillPolygon([
      [0.63, 0.03], [0.74, 0.02], [0.81, 0.08], [0.8, 0.16], [0.74, 0.21], [0.69, 0.24], [0.64, 0.18], [0.61, 0.11],
    ]);
    fillPolygon([
      [0.6, 0.17], [0.65, 0.2], [0.66, 0.26], [0.62, 0.29], [0.58, 0.26], [0.57, 0.21],
    ]);
    fillPolygon([
      [0.54, 0.66], [0.58, 0.61], [0.6, 0.7], [0.61, 0.81], [0.57, 0.86], [0.54, 0.79],
    ]);
    fillPolygon([
      [0.53, 0.79], [0.56, 0.8], [0.56, 0.87], [0.52, 0.87],
    ]);
    fillPolygon([
      [0, 0.92], [0.06, 0.9], [0.07, 1], [0, 1],
    ]);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  function fract(value: number): number {
    return value - Math.floor(value);
  }

  function hash2(x: number, y: number): number {
    return fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453123);
  }

  function smoothNoise(x: number, y: number): number {
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    const localX = x - cellX;
    const localY = y - cellY;
    const fadeX = localX * localX * (3 - 2 * localX);
    const fadeY = localY * localY * (3 - 2 * localY);
    const a = hash2(cellX, cellY);
    const b = hash2(cellX + 1, cellY);
    const c = hash2(cellX, cellY + 1);
    const d = hash2(cellX + 1, cellY + 1);
    const ab = THREE.MathUtils.lerp(a, b, fadeX);
    const cd = THREE.MathUtils.lerp(c, d, fadeX);
    return THREE.MathUtils.lerp(ab, cd, fadeY) * 2 - 1;
  }

  function fbm(x: number, y: number, octaves: number): number {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let total = 0;
    for (let i = 0; i < octaves; i += 1) {
      value += smoothNoise(x * frequency, y * frequency) * amplitude;
      total += amplitude;
      amplitude *= 0.5;
      frequency *= 2.04;
    }
    return value / total;
  }

  function ridgeNoise(x: number, y: number): number {
    return 1 - Math.abs(fbm(x, y, 4));
  }

  const seaSurfaceY = 0.12;
  const floorDepth = -6.2;
  const terrainSize = 28.8;
  const terrainGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, 280, 280);
  terrainGeometry.rotateX(-Math.PI / 2);
  const terrainPositions = terrainGeometry.attributes.position;
  const terrainColors = new Float32Array(terrainPositions.count * 3);
  const deepTerrain = new THREE.Color(0x0b1b5a);
  const midTerrain = new THREE.Color(0x1f56b0);
  const ridgeTerrain = new THREE.Color(0x8ec5ff);
  const algaeTerrain = new THREE.Color(0x5ea7e8);

  function terrainHeight(x: number, z: number): number {
    const basin = -5.2 + fbm(x * 0.028, z * 0.028, 4) * 0.18;
    const terraces = ridgeNoise(x * 0.075 - 2.1, z * 0.075 + 1.5) * 0.42;
    const towerFieldA = Math.max(0, ridgeNoise(x * 0.092 + 7.4, z * 0.092 - 4.1) - 0.52);
    const towerFieldB = Math.max(0, ridgeNoise(x * 0.136 - 4.8, z * 0.136 + 5.2) - 0.58);
    const towerFieldC = Math.max(0, ridgeNoise(x * 0.192 + 10.3, z * 0.192 - 7.4) - 0.66);
    const towerFieldD = Math.max(0, ridgeNoise(x * 0.248 - 1.2, z * 0.248 + 3.1) - 0.72);
    const towerFieldE = Math.max(0, ridgeNoise(x * 0.316 + 2.7, z * 0.316 - 9.3) - 0.78);
    const pillarField = Math.max(0, ridgeNoise(x * 0.384 - 11, z * 0.384 + 7.6) - 0.84);
    const needleField = Math.max(0, ridgeNoise(x * 0.47 - 13, z * 0.47 + 8.4) - 0.9);
    const mesaA = Math.pow(towerFieldA, 1) * 1.5;
    const mesaB = Math.pow(towerFieldB, 1) * 1.7;
    const mesaC = Math.pow(towerFieldC, 1) * 1.9;
    const mesaD = Math.pow(towerFieldD, 1.02) * 2.1;
    const mesaE = Math.pow(towerFieldE, 1.04) * 2.2;
    const pillars = Math.pow(pillarField, 1) * 0.55;
    const needles = Math.pow(needleField, 1) * 0;
    const clusteredColumns = Math.max(0, ridgeNoise(x * 0.184 + 4.6, z * 0.184 - 3.8) - 0.62);
    const columnPlateau = Math.pow(clusteredColumns, 1) * 0.85;
    const columnCaps = THREE.MathUtils.lerp(columnPlateau, Math.floor(columnPlateau * 1.1) / 1.1, 0.1);
    const trenchPath = Math.abs(z * 0.19 + Math.sin(x * 0.095) * 0.8 + Math.sin(x * 0.05) * 1.8);
    const trench = -Math.exp(-trenchPath * 1.45) * 0.42;
    const escarpment = Math.max(0, 1 - Math.sqrt((x - 8.8) ** 2 + (z + 1.5) ** 2) * 0.145) * 4.2;
    const scatter = Math.max(0, ridgeNoise(x * 0.27 + 1.8, z * 0.27 - 2.6) - 0.66);
    const scatterSpikes = Math.pow(scatter, 1) * 0;
    const terrainBlend = fbm(x * 0.028 - 3.2, z * 0.028 + 2.4, 4) * 1.16;
    const rawHeight = basin + terraces + mesaA + mesaB + mesaC + mesaD + mesaE + pillars + needles + columnCaps + trench + escarpment + scatterSpikes + terrainBlend;
    return THREE.MathUtils.clamp(rawHeight, floorDepth, 9.4);
  }

  for (let i = 0; i < terrainPositions.count; i += 1) {
    const x = terrainPositions.getX(i);
    const z = terrainPositions.getZ(i);
    const height = terrainHeight(x, z);
    terrainPositions.setY(i, height);
    const normalized = THREE.MathUtils.clamp((height - floorDepth) / (9.4 - floorDepth), 0, 1);
    const color = deepTerrain.clone()
      .lerp(midTerrain, Math.pow(normalized, 0.72))
      .lerp(ridgeTerrain, Math.max(0, normalized - 0.24) * 4);
    if (normalized > 0.58) {
      color.lerp(algaeTerrain, (normalized - 0.58) * 0.9);
    }
    terrainColors[i * 3] = color.r;
    terrainColors[i * 3 + 1] = color.g;
    terrainColors[i * 3 + 2] = color.b;
  }
  terrainGeometry.setAttribute('color', new THREE.BufferAttribute(terrainColors, 3));
  terrainGeometry.computeVertexNormals();
  scene.add(new THREE.Mesh(terrainGeometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0.01 })));

  const volumeWidth = terrainSize;
  const volumeDepth = terrainSize;
  const volumeFloorY = -4.1;
  const volumeHeight = seaSurfaceY - volumeFloorY;
  const volumeCenter = new THREE.Vector3(0, volumeFloorY + volumeHeight * 0.5, 0);
  const minVisibleWidth = 0.18;
  const minVisibleHeight = 0.18;
  const foldCurve = 0.42;
  const halfVolumeHeight = volumeHeight * 0.5;

  const rampStops = [
    { stop: 0, color: new THREE.Color(0x0f47c8) },
    { stop: 0.18, color: new THREE.Color(0x1576de) },
    { stop: 0.38, color: new THREE.Color(0x28c7d9) },
    { stop: 0.62, color: new THREE.Color(0xf7d24e) },
    { stop: 0.82, color: new THREE.Color(0xff9442) },
    { stop: 1, color: new THREE.Color(0xff493a) },
  ];

  function sampleRamp(value: number): THREE.Color {
    const clamped = THREE.MathUtils.clamp(value, 0, 1);
    for (let i = 1; i < rampStops.length; i += 1) {
      const previous = rampStops[i - 1];
      const next = rampStops[i];
      if (clamped <= next.stop) {
        const alpha = (clamped - previous.stop) / (next.stop - previous.stop);
        return previous.color.clone().lerp(next.color, THREE.MathUtils.clamp(alpha, 0, 1));
      }
    }
    return rampStops[rampStops.length - 1].color.clone();
  }

  function temperatureField(x: number, y: number, z: number): number {
    const xNorm = THREE.MathUtils.clamp((x + volumeWidth * 0.5) / volumeWidth, 0, 1);
    const zNorm = THREE.MathUtils.clamp((z + volumeDepth * 0.5) / volumeDepth, 0, 1);
    const depthNorm = THREE.MathUtils.clamp((y + halfVolumeHeight) / volumeHeight, 0, 1);
    const southWarmth = Math.pow(zNorm, 0.78);
    const northCooling = Math.pow(1 - zNorm, 1.12);
    const southChinaWarmPool = Math.exp(-((xNorm - 0.56) ** 2 * 18 + (zNorm - 0.78) ** 2 * 10));
    const eastChinaShelf = Math.exp(-((xNorm - 0.46) ** 2 * 16 + (zNorm - 0.44) ** 2 * 14));
    const yellowSeaCooling = Math.exp(-((xNorm - 0.58) ** 2 * 20 + (zNorm - 0.18) ** 2 * 16));
    const kuroshioEdge = Math.exp(-((xNorm - 0.84) ** 2 * 32 + (zNorm - 0.62) ** 2 * 18));
    const gyre = fbm(x * 0.09 + 5.2, z * 0.08 - 1.7, 5) * 0.05;
    const eddies = fbm(x * 0.2 - 3.8, z * 0.18 + 4.1, 4) * 0.03;
    const thermoDepthCooling = Math.pow(1 - depthNorm, 1.35) * 0.36;
    const seasonPhase = state.currentMonth === null ? 0 : Math.cos(((state.currentMonth - 8) / 12) * Math.PI * 2);
    const winterPhase = -seasonPhase;
    const seasonalAmplitude = THREE.MathUtils.lerp(0.08, 0.24, 1 - zNorm);
    const southChinaPersistence = zNorm * 0.14;
    const eastChinaWinterCooling = eastChinaShelf * winterPhase * 0.2 + yellowSeaCooling * winterPhase * 0.16;
    const southChinaSummerWarm = southChinaWarmPool * Math.max(0, seasonPhase) * 0.14;
    const surfacePattern = southWarmth * 0.74 - northCooling * 0.22 + southChinaWarmPool * 0.24 + kuroshioEdge * 0.08 - eastChinaShelf * 0.08 - yellowSeaCooling * 0.16 + gyre + eddies;
    const monthlyShift = seasonPhase * seasonalAmplitude + southChinaPersistence - eastChinaWinterCooling + southChinaSummerWarm;
    return THREE.MathUtils.clamp(surfacePattern + monthlyShift - thermoDepthCooling, 0, 1);
  }

  function colorFromTemperature(x: number, y: number, z: number): THREE.Color {
    return sampleRamp(temperatureField(x, y, z));
  }

  const volumeGeometry = new THREE.BoxGeometry(volumeWidth, volumeHeight, volumeDepth, 56, 24, 20);
  const basePositions = Float32Array.from(volumeGeometry.attributes.position.array as Iterable<number>);
  const volumeColors = new Float32Array(volumeGeometry.attributes.position.count * 3);
  for (let i = 0; i < volumeGeometry.attributes.position.count; i += 1) {
    const x = volumeGeometry.attributes.position.getX(i);
    const y = volumeGeometry.attributes.position.getY(i);
    const z = volumeGeometry.attributes.position.getZ(i);
    const color = colorFromTemperature(x, y, z);
    volumeColors[i * 3] = color.r;
    volumeColors[i * 3 + 1] = color.g;
    volumeColors[i * 3 + 2] = color.b;
  }
  volumeGeometry.setAttribute('color', new THREE.BufferAttribute(volumeColors, 3));
  let baseVolumeColors = Float32Array.from(volumeColors);
  volumeGeometry.computeVertexNormals();

  function rebuildBaseVolumeColors(): void {
    const colorAttr = volumeGeometry.getAttribute('color') as THREE.BufferAttribute;
    for (let i = 0; i < colorAttr.count; i += 1) {
      const x = basePositions[i * 3];
      const y = basePositions[i * 3 + 1];
      const z = basePositions[i * 3 + 2];
      const color = colorFromTemperature(x, y, z);
      colorAttr.setXYZ(i, color.r, color.g, color.b);
      baseVolumeColors[i * 3] = color.r;
      baseVolumeColors[i * 3 + 1] = color.g;
      baseVolumeColors[i * 3 + 2] = color.b;
    }
    colorAttr.needsUpdate = true;
  }

  const volumeMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.74,
    metalness: 0.02,
    transparent: false,
    side: THREE.FrontSide,
  });

  const temperatureVolume = new THREE.Mesh(volumeGeometry, volumeMaterial);
  temperatureVolume.position.copy(volumeCenter);
  scene.add(temperatureVolume);

  const coastTexture = new THREE.TextureLoader().load(eastChinaCoastImage);
  coastTexture.colorSpace = THREE.SRGBColorSpace;
  coastTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const landMaskTexture = createLandMaskTexture();
  const coastOverlayGeometry = new THREE.PlaneGeometry(volumeWidth, volumeDepth);
  const coastOverlayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      mapTexture: { value: coastTexture },
      maskTexture: { value: landMaskTexture },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D mapTexture;
      uniform sampler2D maskTexture;
      varying vec2 vUv;
      void main() {
        float landMask = texture2D(maskTexture, vUv).r;
        if (landMask < 0.5) {
          discard;
        }
        vec4 tex = texture2D(mapTexture, vUv);
        gl_FragColor = vec4(tex.rgb, 1.0);
      }
    `,
  });
  const coastOverlay = new THREE.Mesh(coastOverlayGeometry, coastOverlayMaterial);
  coastOverlay.rotation.x = -Math.PI / 2;
  coastOverlay.position.set(0, halfVolumeHeight + 0.03, 0);
  coastOverlay.renderOrder = 4;
  coastOverlay.visible = state.currentMonth !== null;
  temperatureVolume.add(coastOverlay);

  const volumeFrameGeometry = new THREE.BoxGeometry(volumeWidth, volumeHeight, volumeDepth);
  const volumeFrameMaterial = new THREE.LineBasicMaterial({ color: 0xe6edf2, transparent: true, opacity: 0.15 });
  const volumeFrame = new THREE.LineSegments(new THREE.EdgesGeometry(volumeFrameGeometry), volumeFrameMaterial);
  volumeFrame.position.copy(volumeCenter);
  scene.add(volumeFrame);

  function resetVolumeGeometry(): void {
    const attr = volumeGeometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < attr.count; i += 1) {
      const idx = i * 3;
      attr.setXYZ(i, basePositions[idx], basePositions[idx + 1], basePositions[idx + 2]);
    }
    attr.needsUpdate = true;
    volumeGeometry.computeVertexNormals();
    volumeGeometry.computeBoundingBox();
    volumeGeometry.computeBoundingSphere();
  }

  function resetVolumeColors(): void {
    const colorAttr = volumeGeometry.getAttribute('color') as THREE.BufferAttribute;
    for (let i = 0; i < colorAttr.count; i += 1) {
      const idx = i * 3;
      colorAttr.setXYZ(i, baseVolumeColors[idx], baseVolumeColors[idx + 1], baseVolumeColors[idx + 2]);
    }
    colorAttr.needsUpdate = true;
  }

  function clipVolumeBelowTerrain(scaleY: number, positionY: number): void {
    const attr = volumeGeometry.attributes.position as THREE.BufferAttribute;
    const safeScaleY = Math.max(scaleY, 1e-4);

    for (let i = 0; i < attr.count; i += 1) {
      const worldX = volumeCenter.x + attr.getX(i);
      const worldZ = volumeCenter.z + attr.getZ(i);
      const terrainY = terrainHeight(worldX, worldZ);
      const clipY = Math.max(terrainY, floorDepth);
      const worldY = positionY + attr.getY(i) * safeScaleY;
      if (worldY >= clipY) {
        continue;
      }
      const clippedLocalY = THREE.MathUtils.clamp((clipY - positionY) / safeScaleY, -halfVolumeHeight, halfVolumeHeight);
      attr.setY(i, clippedLocalY);
    }

    attr.needsUpdate = true;
    volumeGeometry.computeVertexNormals();
    volumeGeometry.computeBoundingBox();
    volumeGeometry.computeBoundingSphere();
  }

  function updateCompressedVolumeColors(heightRatio: number): void {
    const colorAttr = volumeGeometry.getAttribute('color') as THREE.BufferAttribute;
    const clampedRatio = THREE.MathUtils.clamp(heightRatio, minVisibleHeight / volumeHeight, 1);
    const compression = 1 - clampedRatio;
    const warmToBlue = THREE.MathUtils.smoothstep(compression, 0.08, 0.42);
    const blueToSeafloor = THREE.MathUtils.smoothstep(compression, 0.42, 0.92);

    for (let i = 0; i < colorAttr.count; i += 1) {
      const x = basePositions[i * 3];
      const baseY = basePositions[i * 3 + 1];
      const z = basePositions[i * 3 + 2];
      const normalizedY = (baseY + halfVolumeHeight) / volumeHeight;
      const sampledY = -halfVolumeHeight + normalizedY * volumeHeight * clampedRatio;
      const baseColor = colorFromTemperature(x, sampledY, z);
      const depthInfluence = 1 - normalizedY;
      const blueTone = midTerrain.clone().lerp(deepTerrain, 0.22 + depthInfluence * 0.34);
      const seafloorTone = deepTerrain.clone().lerp(midTerrain, normalizedY * 0.06);
      const cooledColor = baseColor.clone().lerp(blueTone, warmToBlue);
      const finalColor = cooledColor.lerp(seafloorTone, blueToSeafloor);
      colorAttr.setXYZ(i, finalColor.r, finalColor.g, finalColor.b);
    }

    colorAttr.needsUpdate = true;
  }

  function applyFold(normalized: number): void {
    const halfWidth = volumeWidth * 0.5;
    state.foldStrength = THREE.MathUtils.clamp(normalized, 0, 1);

    resetVolumeGeometry();
    resetVolumeColors();
    temperatureVolume.scale.set(1, 1, 1);
    temperatureVolume.position.copy(volumeCenter);
    volumeFrame.scale.set(1, 1, 1);
    volumeFrame.position.copy(volumeCenter);

    if (state.foldDirection === 'ttb') {
      const targetHeight = THREE.MathUtils.lerp(volumeHeight, 1.2, state.foldStrength);
      const targetTopY = THREE.MathUtils.lerp(seaSurfaceY, floorDepth - 0.25, state.foldStrength);
      const heightScale = Math.max(targetHeight / volumeHeight, 1e-4);
      const topAlignedCenterY = volumeCenter.y + (targetTopY - seaSurfaceY);
      updateCompressedVolumeColors(targetHeight / volumeHeight);
      temperatureVolume.scale.set(1, heightScale, 1);
      temperatureVolume.position.y = topAlignedCenterY;
      volumeFrame.scale.set(1, heightScale, 1);
      volumeFrame.position.y = temperatureVolume.position.y;
      clipVolumeBelowTerrain(temperatureVolume.scale.y, temperatureVolume.position.y);
      return;
    }

    const attr = volumeGeometry.attributes.position as THREE.BufferAttribute;
    const targetWidth = THREE.MathUtils.lerp(volumeWidth, minVisibleWidth, state.foldStrength);
    const anchorX = state.foldDirection === 'rtl' ? -halfWidth : halfWidth;
    const direction = state.foldDirection === 'rtl' ? 1 : -1;

    for (let i = 0; i < attr.count; i += 1) {
      const idx = i * 3;
      const baseX = basePositions[idx];
      const baseY = basePositions[idx + 1];
      const baseZ = basePositions[idx + 2];
      const signedDistance = Math.max(0, (baseX - anchorX) * direction);
      const normalizedDistance = THREE.MathUtils.clamp(signedDistance / volumeWidth, 0, 1);
      const compressedDistance = Math.pow(normalizedDistance, 1.35) * targetWidth;
      const foldedX = anchorX + direction * compressedDistance;
      const zOffset = -Math.sin(normalizedDistance * Math.PI) * foldCurve * state.foldStrength * (0.35 + Math.abs(baseY / volumeHeight));
      attr.setXYZ(i, foldedX, baseY, baseZ + zOffset);
    }

    attr.needsUpdate = true;
    volumeGeometry.computeVertexNormals();
    volumeGeometry.computeBoundingBox();
    volumeGeometry.computeBoundingSphere();
    clipVolumeBelowTerrain(1, temperatureVolume.position.y);

    volumeFrame.scale.set(targetWidth / volumeWidth, 1, 1);
    volumeFrame.position.x = state.foldDirection === 'rtl'
      ? volumeCenter.x - halfWidth + targetWidth * 0.5
      : volumeCenter.x + halfWidth - targetWidth * 0.5;
  }

  let frameId = 0;
  const animate = (): void => {
    controls.update();
    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(animate);
  };

  const handleResize = (): void => {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };

  window.addEventListener('resize', handleResize);
  handleResize();
  applyFold(state.foldStrength);
  animate();

  return {
    setFoldDirection(nextDirection: FoldDirection) {
      state.foldDirection = nextDirection;
      applyFold(0);
    },
    setFoldStrength(normalized: number) {
      applyFold(normalized);
    },
    setCurrentMonth(nextMonth: number | null) {
      state.currentMonth = nextMonth;
      coastOverlay.visible = nextMonth !== null;
      rebuildBaseVolumeColors();
      applyFold(state.foldStrength);
    },
    dispose() {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      skyGeometry.dispose();
      skyMaterial.dispose();
      terrainGeometry.dispose();
      volumeGeometry.dispose();
      volumeMaterial.dispose();
      volumeFrame.geometry.dispose();
      volumeFrameMaterial.dispose();
      volumeFrameGeometry.dispose();
      coastOverlayGeometry.dispose();
      coastOverlayMaterial.dispose();
      coastTexture.dispose();
      landMaskTexture.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };
}
