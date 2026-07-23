import * as THREE from "../vendor/three/three.module.min.js";

const stage = document.getElementById("three-stage");
const bridge = window.RoboNaviRenderBridge;
const core = window.RoboNaviCore;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const COLORS = {
  background: "#e7f2f3",
  floor: ["#bdd8e2", "#c5dfe7"],
  floorEdge: "#90adb7",
  wall: "#b6cbb2",
  wallSide: "#789283",
  wallCap: "#d9e5d4",
  wallEdge: "#667f72",
  sand: "#d9bd77",
  sandEdge: "#a7884b",
  ice: "#78cfe3",
  iceEdge: "#5e9faf",
  charger: "#65d4c7",
  pink: "#dfb5cb",
  gold: "#d9bd77",
  mint: "#acd8c2",
  lilac: "#c6bde4",
  orange: "#d97831",
  orangeLight: "#f4a159",
  orangeDark: "#9f421d",
  face: "#132328",
  eye: "#93ffff",
  rubber: "#242829",
  graphite: "#354246",
  steel: "#a8b0b0",
  beacon: "#ffc451",
  beaconHot: "#fff4aa",
  path: "#2fc89c",
  preview: "#45b7ce",
  error: "#ef6477"
};

function seededRandom(seed) {
  let value = seed >>> 0;
  return function () {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeMetalTexture(top, bottom, accent, seed) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 128, 128);
  gradient.addColorStop(0, accent);
  gradient.addColorStop(0.12, top);
  gradient.addColorStop(0.48, top);
  gradient.addColorStop(0.55, accent);
  gradient.addColorStop(0.62, top);
  gradient.addColorStop(1, bottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 128, 128);

  const random = seededRandom(seed);
  context.globalAlpha = 0.1;
  for (let line = 0; line < 130; line += 1) {
    const y = Math.floor(random() * 128);
    const light = random() > 0.48;
    context.strokeStyle = light ? "#ffffff" : "#35505a";
    context.lineWidth = random() > 0.8 ? 1 : 0.5;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(128, y + random() * 2 - 1);
    context.stroke();
  }
  context.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function makeSandTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  context.fillStyle = COLORS.sand;
  context.fillRect(0, 0, 128, 128);
  const random = seededRandom(811);
  for (let grain = 0; grain < 900; grain += 1) {
    const alpha = 0.04 + random() * 0.14;
    context.fillStyle = random() > 0.5
      ? `rgba(255, 244, 193, ${alpha})`
      : `rgba(103, 76, 33, ${alpha})`;
    const radius = 0.3 + random() * 1.1;
    context.beginPath();
    context.arc(random() * 128, random() * 128, radius, 0, Math.PI * 2);
    context.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function physicalMaterial(options) {
  return new THREE.MeshPhysicalMaterial({
    color: options.color || "#ffffff",
    map: options.map || null,
    metalness: options.metalness ?? 0.35,
    roughness: options.roughness ?? 0.38,
    clearcoat: options.clearcoat ?? 0.28,
    clearcoatRoughness: options.clearcoatRoughness ?? 0.32,
    transparent: options.transparent || false,
    opacity: options.opacity ?? 1,
    transmission: options.transmission || 0,
    emissive: options.emissive || "#000000",
    emissiveIntensity: options.emissiveIntensity || 0
  });
}

function createMaterials() {
  const floorTextureA = makeMetalTexture("#a9cedb", "#86adba", "#e7f6fa", 17);
  const floorTextureB = makeMetalTexture("#b5d5df", "#90b5c0", "#edf8fb", 29);
  const wallTexture = makeMetalTexture("#a7bea4", "#7e9782", "#e6f0e2", 43);
  const orangeTexture = makeMetalTexture("#e8873e", "#a94d22", "#ffc07b", 71);

  return {
    floor: [
      physicalMaterial({ map: floorTextureA, metalness: 0.28, roughness: 0.36 }),
      physicalMaterial({ map: floorTextureB, metalness: 0.25, roughness: 0.39 })
    ],
    floorEdge: physicalMaterial({
      color: COLORS.floorEdge,
      metalness: 0.32,
      roughness: 0.42
    }),
    wall: physicalMaterial({
      map: wallTexture,
      metalness: 0.32,
      roughness: 0.4,
      clearcoat: 0.38
    }),
    wallSide: physicalMaterial({
      color: "#8ca692",
      metalness: 0.28,
      roughness: 0.48
    }),
    wallCap: physicalMaterial({
      color: COLORS.wallCap,
      metalness: 0.32,
      roughness: 0.3,
      clearcoat: 0.52
    }),
    wallEdge: physicalMaterial({
      color: COLORS.wallEdge,
      metalness: 0.34,
      roughness: 0.46
    }),
    sand: physicalMaterial({
      map: makeSandTexture(),
      metalness: 0.02,
      roughness: 0.92,
      clearcoat: 0
    }),
    sandEdge: physicalMaterial({
      color: COLORS.sandEdge,
      metalness: 0.14,
      roughness: 0.74
    }),
    ice: physicalMaterial({
      color: COLORS.ice,
      metalness: 0.06,
      roughness: 0.09,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.86,
      transmission: 0.14
    }),
    iceEdge: physicalMaterial({
      color: COLORS.iceEdge,
      metalness: 0.24,
      roughness: 0.3
    }),
    charger: physicalMaterial({
      color: "#92ddd5",
      metalness: 0.28,
      roughness: 0.24,
      clearcoat: 0.65,
      emissive: COLORS.charger,
      emissiveIntensity: 0.3
    }),
    platform: physicalMaterial({
      color: "#9fbbb6",
      metalness: 0.3,
      roughness: 0.35,
      clearcoat: 0.45
    }),
    platformTop: physicalMaterial({
      color: "#c8ddd5",
      metalness: 0.26,
      roughness: 0.3,
      clearcoat: 0.42
    }),
    silver: physicalMaterial({
      color: COLORS.steel,
      metalness: 0.88,
      roughness: 0.25,
      clearcoat: 0.5
    }),
    graphite: physicalMaterial({
      color: COLORS.graphite,
      metalness: 0.7,
      roughness: 0.35
    }),
    rubber: physicalMaterial({
      color: COLORS.rubber,
      metalness: 0.02,
      roughness: 0.92,
      clearcoat: 0
    }),
    orange: physicalMaterial({
      map: orangeTexture,
      metalness: 0.5,
      roughness: 0.3,
      clearcoat: 0.62
    }),
    orangeLight: physicalMaterial({
      color: COLORS.orangeLight,
      metalness: 0.46,
      roughness: 0.26,
      clearcoat: 0.72
    }),
    orangeDark: physicalMaterial({
      color: COLORS.orangeDark,
      metalness: 0.44,
      roughness: 0.42
    }),
    face: physicalMaterial({
      color: COLORS.face,
      metalness: 0.35,
      roughness: 0.2,
      clearcoat: 0.9,
      clearcoatRoughness: 0.08
    }),
    eye: new THREE.MeshStandardMaterial({
      color: COLORS.eye,
      emissive: COLORS.eye,
      emissiveIntensity: 4.2,
      metalness: 0,
      roughness: 0.18
    }),
    goalPads: [COLORS.pink, COLORS.gold, COLORS.mint, COLORS.lilac].map((color) =>
      physicalMaterial({
        color,
        metalness: 0.5,
        roughness: 0.3,
        clearcoat: 0.62
      })
    ),
    pinkAccent: new THREE.MeshStandardMaterial({
      color: "#eb86b4",
      emissive: "#d95b96",
      emissiveIntensity: 0.55,
      metalness: 0.18,
      roughness: 0.32
    }),
    chargerGlow: new THREE.MeshStandardMaterial({
      color: "#42c7b6",
      emissive: "#2ba897",
      emissiveIntensity: 1.25,
      metalness: 0.08,
      roughness: 0.24
    }),
    beaconCore: new THREE.MeshBasicMaterial({
      color: COLORS.beaconHot,
      toneMapped: false
    }),
    iceCrack: new THREE.LineBasicMaterial({
      color: "#efffff",
      transparent: true,
      opacity: 0.92
    }),
    path: new THREE.MeshBasicMaterial({
      color: COLORS.path,
      toneMapped: false
    }),
    preview: new THREE.MeshBasicMaterial({
      color: COLORS.preview,
      transparent: true,
      opacity: 0.84,
      toneMapped: false
    }),
    error: new THREE.MeshStandardMaterial({
      color: COLORS.error,
      emissive: COLORS.error,
      emissiveIntensity: 2.2,
      roughness: 0.28
    })
  };
}

function createGeometries() {
  const iceCracks = new THREE.BufferGeometry();
  iceCracks.setFromPoints([
    new THREE.Vector3(-0.27, 0, -0.08),
    new THREE.Vector3(-0.08, 0, 0.02),
    new THREE.Vector3(-0.08, 0, 0.02),
    new THREE.Vector3(0.13, 0, -0.12),
    new THREE.Vector3(-0.08, 0, 0.02),
    new THREE.Vector3(0.08, 0, 0.2),
    new THREE.Vector3(0.08, 0, 0.2),
    new THREE.Vector3(0.27, 0, 0.1)
  ]);

  return {
    unitBox: new THREE.BoxGeometry(1, 1, 1),
    tileBase: new THREE.BoxGeometry(0.96, 0.1, 0.96),
    tileTop: new THREE.BoxGeometry(0.86, 0.045, 0.86),
    wallBody: new THREE.BoxGeometry(0.96, 0.5, 0.96),
    wallCap: new THREE.BoxGeometry(0.86, 0.075, 0.86),
    rivet: new THREE.SphereGeometry(0.024, 8, 6),
    wallAccent: new THREE.BoxGeometry(0.035, 0.2, 0.018),
    goalPad: new THREE.CylinderGeometry(0.31, 0.35, 0.055, 8),
    goalInset: new THREE.CylinderGeometry(0.24, 0.27, 0.035, 8),
    beaconStem: new THREE.CylinderGeometry(0.075, 0.11, 0.34, 12),
    beaconCollar: new THREE.TorusGeometry(0.12, 0.025, 8, 24),
    beaconBulb: new THREE.SphereGeometry(0.16, 24, 16),
    beaconCore: new THREE.SphereGeometry(0.095, 18, 12),
    beaconRing: new THREE.TorusGeometry(0.22, 0.014, 7, 32, Math.PI * 1.55),
    chargerRing: new THREE.TorusGeometry(0.27, 0.025, 8, 32),
    chargerCore: new THREE.CylinderGeometry(0.13, 0.17, 0.04, 24),
    chargerCrystal: new THREE.OctahedronGeometry(0.12, 1),
    pathSegment: new THREE.CylinderGeometry(0.043, 0.043, 1, 8),
    pathJoint: new THREE.SphereGeometry(0.058, 10, 8),
    errorBar: new THREE.BoxGeometry(0.48, 0.045, 0.07),
    iceCracks
  };
}

function setShadow(mesh, cast, receive) {
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function cellX(level, x) {
  return x - (level.width - 1) / 2;
}

function cellZ(level, y) {
  return y - (level.height - 1) / 2;
}

function addInstancedCells(group, geometry, material, cells, y, castShadow, receiveShadow) {
  if (cells.length === 0) return null;
  const mesh = new THREE.InstancedMesh(geometry, material, cells.length);
  const transform = new THREE.Object3D();
  cells.forEach((cell, index) => {
    transform.position.set(cell.worldX, y, cell.worldZ);
    transform.rotation.set(0, 0, 0);
    transform.scale.set(1, 1, 1);
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  setShadow(mesh, castShadow, receiveShadow);
  group.add(mesh);
  return mesh;
}

function cylinderBetween(geometry, material, start, end) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.scale.y = length;
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );
  return mesh;
}

function createRobot(materials) {
  const root = new THREE.Group();
  root.name = "RoboNavi";
  const model = new THREE.Group();
  root.add(model);

  const wheels = [];
  const armPivots = [];
  const wheelGeometry = new THREE.CylinderGeometry(0.09, 0.09, 0.105, 18);
  const wheelHubGeometry = new THREE.CylinderGeometry(0.035, 0.035, 0.112, 14);
  const trackGeometry = new THREE.BoxGeometry(0.18, 0.2, 0.64);

  [-1, 1].forEach((side) => {
    const track = setShadow(
      new THREE.Mesh(trackGeometry, materials.rubber),
      true,
      true
    );
    track.position.set(side * 0.31, 0.17, 0.02);
    model.add(track);

    [-0.22, 0, 0.22].forEach((z, wheelIndex) => {
      const wheel = setShadow(
        new THREE.Mesh(wheelGeometry, materials.silver),
        true,
        true
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * 0.415, 0.17, z + 0.02);
      wheel.scale.setScalar(wheelIndex === 1 ? 0.86 : 1);
      model.add(wheel);
      wheels.push(wheel);

      const hub = new THREE.Mesh(wheelHubGeometry, materials.graphite);
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(wheel.position);
      hub.position.x += side * 0.006;
      hub.scale.setScalar(wheelIndex === 1 ? 0.82 : 0.92);
      model.add(hub);
    });
  });

  const undercarriage = setShadow(
    new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.16, 0.54), materials.orangeDark),
    true,
    true
  );
  undercarriage.position.y = 0.26;
  model.add(undercarriage);

  const belly = setShadow(
    new THREE.Mesh(new THREE.SphereGeometry(0.31, 24, 16), materials.orange),
    true,
    true
  );
  belly.scale.set(1, 0.86, 0.92);
  belly.position.y = 0.5;
  model.add(belly);

  const chestMaterial = materials.orangeLight.clone();
  const chest = setShadow(
    new THREE.Mesh(new THREE.SphereGeometry(0.255, 22, 14), chestMaterial),
    true,
    true
  );
  chest.scale.set(1, 0.92, 0.8);
  chest.position.set(0, 0.63, -0.02);
  model.add(chest);

  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.13, 0.16, 18),
    materials.orangeDark
  );
  neck.position.y = 0.79;
  model.add(neck);

  const head = new THREE.Group();
  head.position.y = 1.01;
  model.add(head);

  const headShell = setShadow(
    new THREE.Mesh(new THREE.SphereGeometry(0.31, 28, 20), materials.orange),
    true,
    true
  );
  headShell.scale.set(1.02, 0.88, 0.93);
  head.add(headShell);

  const face = new THREE.Mesh(
    new THREE.SphereGeometry(0.235, 24, 16),
    materials.face
  );
  face.scale.set(1, 0.58, 0.16);
  face.position.set(0, 0.01, -0.275);
  head.add(face);

  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 16, 12),
      materials.eye
    );
    eye.scale.set(0.82, 1.18, 0.38);
    eye.position.set(side * 0.084, 0.035, -0.312);
    head.add(eye);
  });

  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.012, 0.014),
    materials.eye
  );
  mouth.position.set(0, -0.073, -0.317);
  head.add(mouth);

  const port = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.025, 18),
    materials.orangeDark
  );
  port.rotation.z = Math.PI / 2;
  port.position.set(0.304, 0.015, 0);
  head.add(port);

  const rearRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.082, 0.014, 8, 24),
    materials.orangeDark
  );
  rearRing.position.set(0, 0.015, 0.276);
  head.add(rearRing);

  const rearPort = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.052, 0.028, 18),
    materials.silver
  );
  rearPort.rotation.x = Math.PI / 2;
  rearPort.position.set(0, 0.015, 0.282);
  head.add(rearPort);

  const servicePanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.115, 0.025),
    materials.graphite
  );
  servicePanel.position.set(0, 0.61, 0.232);
  model.add(servicePanel);

  const serviceLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 10, 8),
    materials.eye
  );
  serviceLight.position.set(0, 0.62, 0.252);
  model.add(serviceLight);

  [-1, 1].forEach((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.31, 0.67, -0.015);
    pivot.rotation.z = side * 0.42;
    model.add(pivot);
    armPivots.push(pivot);

    const shoulder = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 18, 12),
      materials.orangeLight
    );
    pivot.add(shoulder);

    const upper = new THREE.Mesh(
      new THREE.CylinderGeometry(0.046, 0.055, 0.21, 14),
      materials.orange
    );
    upper.position.y = -0.12;
    pivot.add(upper);

    const elbow = new THREE.Mesh(
      new THREE.SphereGeometry(0.064, 16, 10),
      materials.orangeLight
    );
    elbow.position.y = -0.235;
    pivot.add(elbow);

    const lower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.046, 0.17, 14),
      materials.orange
    );
    lower.position.set(-side * 0.035, -0.32, -0.025);
    lower.rotation.z = -side * 0.36;
    pivot.add(lower);

    const hand = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 14, 10),
      materials.silver
    );
    hand.position.set(-side * 0.07, -0.405, -0.05);
    pivot.add(hand);
  });

  const chestLampMaterial = materials.eye.clone();
  const chestLamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 14, 10),
    chestLampMaterial
  );
  chestLamp.position.set(0, 0.66, -0.245);
  model.add(chestLamp);

  const inductLight = new THREE.PointLight(COLORS.charger, 0, 2.2, 2);
  inductLight.position.set(0, 0.7, -0.3);
  model.add(inductLight);

  root.userData = {
    model,
    wheels,
    armPivots,
    head,
    chestMaterial,
    chestLampMaterial,
    inductLight,
    lastPosition: null,
    wheelTravel: 0
  };
  return root;
}

function createTimerSprite() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.15, 0.43, 1);
  sprite.renderOrder = 40;
  sprite.userData = { canvas, texture, seconds: null };
  return sprite;
}

function updateTimerSprite(sprite, seconds, visible) {
  sprite.visible = visible;
  if (!visible || sprite.userData.seconds === seconds) return;
  sprite.userData.seconds = seconds;
  const canvas = sprite.userData.canvas;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "rgba(18, 31, 31, 0.9)";
  context.strokeStyle = seconds <= 10 ? "#ef6477" : "#ffc451";
  context.lineWidth = 6;
  context.beginPath();
  context.roundRect(8, 8, 240, 80, 18);
  context.fill();
  context.stroke();
  context.fillStyle = seconds <= 10 ? "#ffd7dd" : "#fff1ba";
  context.font = "700 48px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(`${seconds} S`, 128, 50);
  sprite.userData.texture.needsUpdate = true;
}

function createStudioEnvironment(renderer, compact) {
  const environment = new THREE.Scene();
  environment.background = new THREE.Color("#b8c6c3");

  const room = new THREE.Mesh(
    new THREE.BoxGeometry(24, 18, 24),
    new THREE.MeshBasicMaterial({
      color: "#aebbb7",
      side: THREE.BackSide
    })
  );
  room.position.y = 4;
  environment.add(room);

  [
    {
      color: "#fff8e9",
      position: [-5, 6.5, -4],
      scale: [5.5, 3.2]
    },
    {
      color: "#d6f5f3",
      position: [6, 4.5, 1],
      scale: [4.5, 3.5]
    },
    {
      color: "#f3dce9",
      position: [-1, 3.5, 7],
      scale: [4.2, 2.6]
    }
  ].forEach((panelData) => {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(panelData.scale[0], panelData.scale[1]),
      new THREE.MeshBasicMaterial({
        color: panelData.color,
        side: THREE.DoubleSide
      })
    );
    panel.position.set(...panelData.position);
    panel.lookAt(0, 0.5, 0);
    environment.add(panel);
  });

  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(environment, compact ? 0.02 : 0.035);
  pmrem.dispose();
  environment.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) object.material.dispose();
  });
  return target.texture;
}

class RoboNaviThreeView {
  constructor(container) {
    this.container = container;
    this.snapshot = null;
    this.levelKey = "";
    this.pathKey = "";
    this.beacons = [];
    this.chargers = [];
    this.failed = false;
    this.compact = window.innerHeight < 560 || window.innerWidth < 640;
    this.materials = createMaterials();
    this.geometries = createGeometries();

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, this.compact ? 1.1 : 1.65)
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.78;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.renderer.domElement.addEventListener(
      "webglcontextlost",
      () => {
        this.disable();
        bridge.detach(this);
      },
      { once: true }
    );
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.background);
    this.scene.environment = createStudioEnvironment(this.renderer, this.compact);
    this.scene.environmentIntensity = 0.72;
    this.camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 100);
    this.camera.position.set(12, 13, 12);
    this.camera.lookAt(0, 0.2, 0);

    this.boardGroup = new THREE.Group();
    this.actorGroup = new THREE.Group();
    this.pathGroup = new THREE.Group();
    this.scene.add(this.boardGroup, this.pathGroup, this.actorGroup);

    this.robot = createRobot(this.materials);
    this.actorGroup.add(this.robot);
    this.addStudio();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.renderer.setAnimationLoop((time) => this.animate(time));
  }

  addStudio() {
    const hemisphere = new THREE.HemisphereLight("#f5ffff", "#c7b5c5", 1.05);
    this.scene.add(hemisphere);

    const key = new THREE.DirectionalLight("#fff4df", 1.85);
    key.position.set(-7, 13, -5);
    key.castShadow = true;
    const shadowSize = this.compact ? 512 : window.innerWidth < 920 ? 1024 : 2048;
    key.shadow.mapSize.set(shadowSize, shadowSize);
    key.shadow.radius = 3;
    key.shadow.bias = -0.00035;
    key.shadow.normalBias = 0.025;
    this.scene.add(key);
    this.keyLight = key;

    const fill = new THREE.DirectionalLight("#bdeeff", 0.72);
    fill.position.set(10, 7, 9);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight("#f3cce1", 0.38);
    rim.position.set(-9, 5, 10);
    this.scene.add(rim);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 70),
      new THREE.MeshStandardMaterial({
        color: "#edf3f2",
        metalness: 0.02,
        roughness: 0.94
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.315;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const grid = new THREE.GridHelper(70, 70, "#aac5c8", "#cbdcdd");
    grid.position.y = -0.305;
    grid.material.transparent = true;
    grid.material.opacity = 0.2;
    grid.material.depthWrite = false;
    this.scene.add(grid);
  }

  levelSignature(level) {
    return [
      level.id,
      level.width,
      level.height,
      level.grid.join(""),
      level.goals.map((goal) => `${goal.x}:${goal.y}`).join("|")
    ].join("/");
  }

  clearLevel() {
    this.beacons.forEach((beacon) => {
      beacon.bulbMaterial.dispose();
      beacon.rings.forEach((ring) => ring.material.dispose());
      beacon.timer.material.map.dispose();
      beacon.timer.material.dispose();
    });
    this.beacons = [];
    this.chargers = [];
    this.boardGroup.clear();
    this.actorGroup.children
      .filter((child) => child !== this.robot)
      .forEach((child) => this.actorGroup.remove(child));
    this.pathGroup.clear();
    this.pathKey = "";
  }

  buildBoard(level) {
    this.clearLevel();
    const floorGroups = {
      floor0: [],
      floor1: [],
      sand: [],
      ice: [],
      charger: []
    };
    const wallCells = [];

    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        const terrain = core.terrainAt(level, x, y);
        const cell = {
          x,
          y,
          worldX: cellX(level, x),
          worldZ: cellZ(level, y)
        };
        if (terrain === "wall") {
          wallCells.push(cell);
        } else if (terrain === "sand") {
          floorGroups.sand.push(cell);
        } else if (terrain === "ice") {
          floorGroups.ice.push(cell);
        } else if (terrain === "charger") {
          floorGroups.charger.push(cell);
        } else {
          floorGroups[(x + y * 2) % 2 === 0 ? "floor0" : "floor1"].push(cell);
        }
      }
    }

    const platform = setShadow(
      new THREE.Mesh(this.geometries.unitBox, this.materials.platform),
      true,
      true
    );
    platform.scale.set(level.width + 0.42, 0.26, level.height + 0.42);
    platform.position.y = -0.17;
    this.boardGroup.add(platform);

    const platformTop = new THREE.Mesh(
      this.geometries.unitBox,
      this.materials.platformTop
    );
    platformTop.scale.set(level.width + 0.22, 0.055, level.height + 0.22);
    platformTop.position.y = -0.015;
    platformTop.receiveShadow = true;
    this.boardGroup.add(platformTop);

    const terrainSets = [
      [floorGroups.floor0, this.materials.floorEdge, this.materials.floor[0]],
      [floorGroups.floor1, this.materials.floorEdge, this.materials.floor[1]],
      [floorGroups.sand, this.materials.sandEdge, this.materials.sand],
      [floorGroups.ice, this.materials.iceEdge, this.materials.ice],
      [floorGroups.charger, this.materials.floorEdge, this.materials.charger]
    ];
    terrainSets.forEach(([cells, edgeMaterial, topMaterial]) => {
      addInstancedCells(
        this.boardGroup,
        this.geometries.tileBase,
        edgeMaterial,
        cells,
        0.01,
        false,
        true
      );
      addInstancedCells(
        this.boardGroup,
        this.geometries.tileTop,
        topMaterial,
        cells,
        0.082,
        false,
        true
      );
    });

    addInstancedCells(
      this.boardGroup,
      this.geometries.wallBody,
      this.materials.wallSide,
      wallCells,
      0.21,
      false,
      true
    );
    addInstancedCells(
      this.boardGroup,
      this.geometries.wallCap,
      this.materials.wall,
      wallCells,
      0.498,
      false,
      true
    );

    this.addWallHardware(wallCells);
    this.addIceCracks(floorGroups.ice);
    floorGroups.charger.forEach((cell) => this.addCharger(cell));
    level.goals.forEach((goal, index) => this.addBeacon(level, goal, index));

    const boardSpan = Math.max(level.width, level.height);
    this.keyLight.shadow.camera.left = -boardSpan;
    this.keyLight.shadow.camera.right = boardSpan;
    this.keyLight.shadow.camera.top = boardSpan;
    this.keyLight.shadow.camera.bottom = -boardSpan;
    this.keyLight.shadow.camera.far = 45;
    this.keyLight.shadow.camera.updateProjectionMatrix();
    this.fitCamera(level);
  }

  addWallHardware(wallCells) {
    if (wallCells.length === 0) return;
    const rivets = new THREE.InstancedMesh(
      this.geometries.rivet,
      this.materials.silver,
      wallCells.length * 4
    );
    const transform = new THREE.Object3D();
    let rivetIndex = 0;
    wallCells.forEach((cell) => {
      [
        [-0.28, 0.23, 0.486],
        [0.28, 0.23, 0.486],
        [0.486, 0.23, -0.28],
        [0.486, 0.23, 0.28]
      ].forEach(([dx, y, dz]) => {
        transform.position.set(cell.worldX + dx, y, cell.worldZ + dz);
        transform.scale.set(1, 1, 1);
        transform.rotation.set(0, 0, 0);
        transform.updateMatrix();
        rivets.setMatrixAt(rivetIndex, transform.matrix);
        rivetIndex += 1;
      });
    });
    rivets.castShadow = false;
    this.boardGroup.add(rivets);

    const accentCells = wallCells.filter((cell) => (cell.x + cell.y) % 3 === 0);
    const accents = new THREE.InstancedMesh(
      this.geometries.wallAccent,
      this.materials.pinkAccent,
      accentCells.length
    );
    accentCells.forEach((cell, index) => {
      transform.position.set(cell.worldX, 0.23, cell.worldZ + 0.49);
      transform.scale.set(1, 1, 1);
      transform.updateMatrix();
      accents.setMatrixAt(index, transform.matrix);
    });
    this.boardGroup.add(accents);
  }

  addIceCracks(cells) {
    cells.forEach((cell, index) => {
      const cracks = new THREE.LineSegments(
        this.geometries.iceCracks,
        this.materials.iceCrack
      );
      cracks.position.set(cell.worldX, 0.128, cell.worldZ);
      cracks.rotation.y = (index % 4) * Math.PI / 2;
      this.boardGroup.add(cracks);
    });
  }

  addCharger(cell) {
    const group = new THREE.Group();
    group.position.set(cell.worldX, 0.13, cell.worldZ);

    const base = new THREE.Mesh(this.geometries.goalPad, this.materials.graphite);
    base.scale.setScalar(0.92);
    group.add(base);
    const inset = new THREE.Mesh(
      this.geometries.goalInset,
      this.materials.goalPads[0]
    );
    inset.position.y = 0.037;
    inset.scale.setScalar(0.9);
    group.add(inset);

    const device = new THREE.Group();
    device.position.set(0.21, 0, 0.21);
    group.add(device);

    const coreMesh = new THREE.Mesh(
      this.geometries.chargerCore,
      this.materials.chargerGlow
    );
    coreMesh.position.y = 0.08;
    device.add(coreMesh);
    const crystal = new THREE.Mesh(
      this.geometries.chargerCrystal,
      this.materials.chargerGlow
    );
    crystal.position.y = 0.27;
    device.add(crystal);

    const rings = [0.62, 0.82, 1].map((scale, index) => {
      const ring = new THREE.Mesh(
        this.geometries.chargerRing,
        this.materials.chargerGlow
      );
      ring.rotation.x = Math.PI / 2;
      ring.scale.setScalar(scale);
      ring.position.y = 0.12 + index * 0.08;
      device.add(ring);
      return ring;
    });
    const light = new THREE.PointLight(COLORS.charger, 8, 2.8, 2);
    light.position.y = 0.38;
    device.add(light);
    this.actorGroup.add(group);
    this.chargers.push({
      group,
      device,
      rings,
      crystal,
      light,
      phase: this.chargers.length * 1.7
    });
  }

  addBeacon(level, goal, index) {
    const group = new THREE.Group();
    group.position.set(
      cellX(level, goal.x) + 0.26,
      0.13,
      cellZ(level, goal.y) + 0.26
    );
    group.scale.setScalar(0.72);
    const padMaterial = this.materials.goalPads[index % this.materials.goalPads.length];
    const pad = setShadow(
      new THREE.Mesh(this.geometries.goalPad, this.materials.graphite),
      true,
      true
    );
    group.add(pad);
    const inset = new THREE.Mesh(this.geometries.goalInset, padMaterial);
    inset.position.y = 0.038;
    group.add(inset);

    const stem = setShadow(
      new THREE.Mesh(this.geometries.beaconStem, this.materials.graphite),
      true,
      true
    );
    stem.position.y = 0.23;
    group.add(stem);

    const collar = new THREE.Mesh(
      this.geometries.beaconCollar,
      this.materials.silver
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.41;
    group.add(collar);

    const bulbMaterial = physicalMaterial({
      color: "#d49a3e",
      metalness: 0.08,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.96,
      emissive: COLORS.beacon,
      emissiveIntensity: 0.38
    });
    const bulb = setShadow(
      new THREE.Mesh(this.geometries.beaconBulb, bulbMaterial),
      true,
      false
    );
    bulb.position.y = 0.59;
    group.add(bulb);

    const inner = new THREE.Mesh(
      this.geometries.beaconCore,
      this.materials.beaconCore
    );
    inner.position.copy(bulb.position);
    group.add(inner);

    const rings = [0, 1].map((ringIndex) => {
      const ring = new THREE.Mesh(
        this.geometries.beaconRing,
        this.materials.chargerGlow
      );
      ring.material = this.materials.chargerGlow.clone();
      ring.material.color.set(COLORS.beacon);
      ring.material.emissive.set(COLORS.beacon);
      ring.material.emissiveIntensity = 0.55;
      ring.material.transparent = true;
      ring.material.opacity = 0.34;
      ring.position.y = 0.59 + ringIndex * 0.075;
      ring.rotation.set(0.1 + ringIndex * 0.45, Math.PI / 4, 0);
      ring.scale.setScalar(0.82 + ringIndex * 0.16);
      group.add(ring);
      return ring;
    });

    const pointLight = new THREE.PointLight(COLORS.beacon, 1, 4.2, 2);
    pointLight.position.y = 0.62;
    group.add(pointLight);

    const timer = createTimerSprite();
    timer.position.y = 1.18;
    timer.visible = false;
    group.add(timer);

    this.actorGroup.add(group);
    this.beacons.push({
      group,
      bulb,
      bulbMaterial,
      inner,
      rings,
      pointLight,
      timer,
      index,
      active: false,
      phase: index * 1.35
    });
  }

  fitCamera(level) {
    const span = Math.max(level.width, level.height);
    const distance = span * 1.7 + 6;
    this.camera.position.set(distance, distance * 1.05, distance);
    this.camera.lookAt(0, 0.2, 0);
    this.camera.updateMatrixWorld(true);

    const halfW = level.width / 2 + 0.65;
    const halfH = level.height / 2 + 0.65;
    const corners = [];
    [-halfW, halfW].forEach((x) => {
      [-halfH, halfH].forEach((z) => {
        [0, 1.45].forEach((y) => corners.push(new THREE.Vector3(x, y, z)));
      });
    });
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    corners.forEach((corner) => {
      corner.applyMatrix4(this.camera.matrixWorldInverse);
      minX = Math.min(minX, corner.x);
      maxX = Math.max(maxX, corner.x);
      minY = Math.min(minY, corner.y);
      maxY = Math.max(maxY, corner.y);
    });

    const aspect = Math.max(0.1, this.container.clientWidth / this.container.clientHeight);
    const requiredWidth = maxX - minX + 1.6;
    const requiredHeight = maxY - minY + 1.8;
    const viewHeight = Math.max(requiredHeight, requiredWidth / aspect);
    const centerY = (maxY + minY) / 2 - 0.12;
    this.camera.left = (-viewHeight * aspect) / 2;
    this.camera.right = (viewHeight * aspect) / 2;
    this.camera.top = centerY + viewHeight / 2;
    this.camera.bottom = centerY - viewHeight / 2;
    this.camera.zoom = 1.2;
    this.camera.near = 0.1;
    this.camera.far = distance * 4;
    this.camera.updateProjectionMatrix();
  }

  resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    if (this.snapshot) this.fitCamera(this.snapshot.level);
  }

  update(snapshot) {
    this.snapshot = snapshot;
    const signature = this.levelSignature(snapshot.level);
    if (signature !== this.levelKey) {
      this.levelKey = signature;
      this.buildBoard(snapshot.level);
    }
    this.updateRobot(snapshot);
    this.updateBeacons(snapshot);
    this.updatePath(snapshot.path, snapshot.level);
  }

  disable() {
    this.failed = true;
    this.renderer.setAnimationLoop(null);
  }

  updateRobot(snapshot) {
    const pose = snapshot.displayPose;
    const next = new THREE.Vector3(
      cellX(snapshot.level, pose.x),
      0.06,
      cellZ(snapshot.level, pose.y)
    );
    const data = this.robot.userData;
    if (data.lastPosition) {
      const distance = Math.hypot(
        next.x - data.lastPosition.x,
        next.z - data.lastPosition.z
      );
      data.wheelTravel += distance * 4.8;
    }
    data.lastPosition = next.clone();
    this.robot.position.copy(next);
    this.robot.rotation.y = -pose.angle - Math.PI / 2;
    data.wheels.forEach((wheel) => {
      wheel.rotation.x = data.wheelTravel;
    });
  }

  updateBeacons(snapshot) {
    this.beacons.forEach((beacon) => {
      const active = (snapshot.robot.collected & (1 << beacon.index)) !== 0;
      beacon.active = active;
      beacon.bulbMaterial.color.set(active ? COLORS.beaconHot : "#d49a3e");
      beacon.bulbMaterial.emissive.set(
        snapshot.gameOver && !active ? COLORS.error : COLORS.beacon
      );
      beacon.bulbMaterial.emissiveIntensity = active ? 4.4 : 0.38;
      beacon.inner.visible = active;
      beacon.rings.forEach((ring) => {
        ring.visible = true;
        ring.material.opacity = active || snapshot.gameOver ? 1 : 0.34;
        ring.material.emissiveIntensity = active || snapshot.gameOver ? 2.1 : 0.55;
        if (snapshot.gameOver && !active) {
          ring.material.color.set(COLORS.error);
          ring.material.emissive.set(COLORS.error);
        } else {
          ring.material.color.set(COLORS.beacon);
          ring.material.emissive.set(COLORS.beacon);
        }
      });
      const showTimer =
        snapshot.batterySecondsRemaining !== null && !active && !snapshot.complete;
      updateTimerSprite(
        beacon.timer,
        snapshot.batterySecondsRemaining,
        showTimer
      );
    });
  }

  updatePath(path, level) {
    const key = path
      ? `${path.mode}:${path.points.map((point) => `${point.x},${point.y}`).join(";")}:${
          path.collision ? `${path.collision.x},${path.collision.y}` : ""
        }`
      : "";
    if (key === this.pathKey) return;
    this.pathKey = key;
    this.pathGroup.clear();
    if (!path || path.points.length === 0) return;

    const material = path.mode === "execute"
      ? this.materials.path
      : this.materials.preview;
    const points = path.points.map(
      (point) =>
        new THREE.Vector3(cellX(level, point.x), 0.18, cellZ(level, point.y))
    );
    points.forEach((point) => {
      const joint = new THREE.Mesh(this.geometries.pathJoint, material);
      joint.position.copy(point);
      this.pathGroup.add(joint);
    });
    for (let index = 1; index < points.length; index += 1) {
      if (points[index].distanceTo(points[index - 1]) < 0.001) continue;
      const segment = cylinderBetween(
        this.geometries.pathSegment,
        material,
        points[index - 1],
        points[index]
      );
      this.pathGroup.add(segment);
    }
    if (path.collision) {
      const marker = new THREE.Group();
      marker.position.set(
        cellX(level, path.collision.x),
        0.2,
        cellZ(level, path.collision.y)
      );
      [Math.PI / 4, -Math.PI / 4].forEach((rotation) => {
        const bar = new THREE.Mesh(
          this.geometries.errorBar,
          this.materials.error
        );
        bar.rotation.y = rotation;
        marker.add(bar);
      });
      this.pathGroup.add(marker);
    }
  }

  animate(timeMs) {
    if (this.failed) return;
    const time = timeMs * 0.001;
    const motion = reducedMotion.matches ? 0 : 1;
    const robotData = this.robot.userData;
    robotData.model.position.y = Math.sin(time * 2.1) * 0.009 * motion;
    robotData.head.rotation.y = Math.sin(time * 1.45) * 0.045 * motion;

    const activeStep = this.snapshot ? this.snapshot.activeStep : null;
    const actionProgress = activeStep ? activeStep.progress : 0;
    const actionWave = Math.sin(actionProgress * Math.PI);
    const batteryAction = activeStep && activeStep.command === "battery";
    const inductAction = activeStep && activeStep.command === "induct";
    robotData.armPivots.forEach((arm, index) => {
      arm.rotation.x = batteryAction ? -actionWave * 0.9 : 0;
      arm.rotation.y = batteryAction ? (index === 0 ? -1 : 1) * actionWave * 0.24 : 0;
    });
    robotData.chestMaterial.emissive.set(inductAction ? COLORS.charger : "#000000");
    robotData.chestMaterial.emissiveIntensity = inductAction ? actionWave * 1.8 : 0;
    robotData.chestLampMaterial.emissiveIntensity = inductAction
      ? 6 + actionWave * 5
      : 3.5;
    robotData.inductLight.intensity = inductAction ? actionWave * 14 : 0;

    this.beacons.forEach((beacon) => {
      const pulse = 1 + Math.sin(time * 3.2 + beacon.phase) * 0.07 * motion;
      beacon.rings.forEach((ring, index) => {
        ring.rotation.z = time * (index === 0 ? 0.7 : -0.55) * motion + index;
        ring.scale.setScalar((0.82 + index * 0.16) * pulse);
      });
      beacon.pointLight.intensity = beacon.active
        ? 15 + Math.sin(time * 2.8 + beacon.phase) * 2 * motion
        : 0.7;
      beacon.bulb.scale.setScalar(beacon.active ? pulse : 1);
    });

    this.chargers.forEach((charger) => {
      charger.crystal.rotation.y = time * 1.15 * motion + charger.phase;
      charger.crystal.position.y =
        0.27 + Math.sin(time * 2.3 + charger.phase) * 0.025 * motion;
      charger.rings.forEach((ring, index) => {
        ring.rotation.z = time * (index === 0 ? 0.8 : -0.65) * motion + charger.phase;
        const scale = (0.72 + index * 0.28) *
          (1 + Math.sin(time * 2.4 + charger.phase + index) * 0.06 * motion);
        ring.scale.setScalar(scale);
      });
      charger.light.intensity =
        8 + Math.sin(time * 2.5 + charger.phase) * 1.4 * motion;
    });

    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      this.disable();
      bridge.detach(this);
      console.warn("RoboNavi Three.js renderer disabled.", error);
    }
  }
}

if (stage && bridge && core) {
  try {
    const view = new RoboNaviThreeView(stage);
    bridge.attach(view);
  } catch (error) {
    stage.dataset.renderer = "fallback";
    console.warn("RoboNavi is using the Canvas renderer.", error);
  }
}
