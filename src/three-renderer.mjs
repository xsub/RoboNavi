import * as THREE from "../vendor/three/three.module.min.js";

const stage = document.getElementById("three-stage");
const bridge = window.RoboNaviRenderBridge;
const core = window.RoboNaviCore;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const COLORS = {
  background: "#39758d",
  floor: ["#bdd8e2", "#c5dfe7"],
  floorEdge: "#9bb8c2",
  wall: "#b6cbb2",
  wallSide: "#789283",
  wallCap: "#d9e5d4",
  wallEdge: "#667f72",
  sand: "#d9bd77",
  sandEdge: "#b89b5d",
  ice: "#78cfe3",
  iceEdge: "#70abba",
  charger: "#65d4c7",
  pink: "#dfb5cb",
  gold: "#d9bd77",
  mint: "#acd8c2",
  lilac: "#c6bde4",
  orange: "#ff9f2f",
  orangeLight: "#ffd85a",
  orangeDark: "#dc5b13",
  orangeGlow: "#ff7a00",
  face: "#132328",
  eye: "#93ffff",
  rubber: "#242829",
  graphite: "#354246",
  steel: "#a8b0b0",
  beacon: "#b85cff",
  beaconHot: "#f2d5ff",
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

function makeSignalTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(48, 48, 0, 48, 48, 46);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.12, "rgba(199, 255, 245, 1)");
  gradient.addColorStop(0.36, "rgba(92, 242, 222, 0.9)");
  gradient.addColorStop(1, "rgba(72, 210, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 96, 96);
  context.strokeStyle = "rgba(242, 255, 252, 0.95)";
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(18, 48);
  context.lineTo(78, 48);
  context.moveTo(48, 18);
  context.lineTo(48, 78);
  context.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
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
    depthWrite: options.depthWrite ?? true,
    transmission: options.transmission || 0,
    emissive: options.emissive || "#000000",
    emissiveIntensity: options.emissiveIntensity || 0,
    side: options.side || THREE.FrontSide
  });
}

function createMaterials() {
  const floorTextureA = makeMetalTexture("#b9c3c6", "#929fa3", "#d2dadd", 17);
  const floorTextureB = makeMetalTexture("#c2cbcd", "#9ca8ab", "#dbe1e3", 29);
  const wallTexture = makeMetalTexture("#a7bea4", "#7e9782", "#e6f0e2", 43);
  const orangeTexture = makeMetalTexture("#e5e8e7", "#aeb7b8", "#ffffff", 71);

  return {
    floor: [
      physicalMaterial({
        color: COLORS.floor[0],
        map: floorTextureA,
        metalness: 0.1,
        roughness: 0.76,
        clearcoat: 0.04,
        clearcoatRoughness: 0.8
      }),
      physicalMaterial({
        color: COLORS.floor[1],
        map: floorTextureB,
        metalness: 0.08,
        roughness: 0.8,
        clearcoat: 0.03,
        clearcoatRoughness: 0.84
      })
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
      clearcoat: 0.38,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      side: THREE.DoubleSide
    }),
    wallSide: physicalMaterial({
      color: "#8ca692",
      metalness: 0.28,
      roughness: 0.48,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
    }),
    wallCap: physicalMaterial({
      color: COLORS.wallCap,
      metalness: 0.32,
      roughness: 0.3,
      clearcoat: 0.52,
      transparent: true,
      opacity: 0.5,
      depthWrite: false
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
      color: COLORS.orange,
      map: orangeTexture,
      metalness: 0.44,
      roughness: 0.28,
      clearcoat: 0.68,
      emissive: "#d94800",
      emissiveIntensity: 0.52
    }),
    orangeLight: physicalMaterial({
      color: COLORS.orangeLight,
      metalness: 0.46,
      roughness: 0.26,
      clearcoat: 0.72,
      emissive: COLORS.orangeGlow,
      emissiveIntensity: 0.38
    }),
    orangeDark: physicalMaterial({
      color: COLORS.orangeDark,
      metalness: 0.44,
      roughness: 0.42,
      emissive: "#8a2200",
      emissiveIntensity: 0.2
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
    beaconLens: new THREE.MeshStandardMaterial({
      color: "#493653",
      emissive: COLORS.beacon,
      emissiveIntensity: 0.22,
      metalness: 0.12,
      roughness: 0.18
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
    tileBase: new THREE.BoxGeometry(0.985, 0.1, 0.985),
    tileTop: new THREE.BoxGeometry(0.945, 0.03, 0.945),
    wallBody: new THREE.PlaneGeometry(0.94, 0.46),
    wallCap: new THREE.BoxGeometry(0.98, 0.045, 0.09),
    rivet: new THREE.SphereGeometry(0.024, 8, 6),
    wallAccent: new THREE.BoxGeometry(0.035, 0.2, 0.018),
    goalPad: new THREE.CylinderGeometry(0.31, 0.35, 0.055, 8),
    goalInset: new THREE.CylinderGeometry(0.24, 0.27, 0.035, 8),
    beaconProjector: new THREE.CylinderGeometry(0.35, 0.37, 0.025, 32),
    beaconRim: new THREE.TorusGeometry(0.29, 0.025, 8, 32),
    beaconLens: new THREE.CylinderGeometry(0.19, 0.21, 0.02, 32),
    beaconHatch: new THREE.BoxGeometry(0.24, 0.025, 0.15),
    beaconBeam: new THREE.CylinderGeometry(0.48, 0.12, 3.4, 32, 1, true),
    beaconBeamCore: new THREE.CylinderGeometry(0.2, 0.045, 2.9, 24, 1, true),
    beaconRing: new THREE.TorusGeometry(0.3, 0.012, 6, 36),
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

function createRoundedBoxGeometry(width, height, depth, radius, bevelSize) {
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const corner = Math.min(radius, halfWidth, halfHeight);
  const shape = new THREE.Shape();
  shape.moveTo(-halfWidth + corner, -halfHeight);
  shape.lineTo(halfWidth - corner, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + corner);
  shape.lineTo(halfWidth, halfHeight - corner);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - corner, halfHeight);
  shape.lineTo(-halfWidth + corner, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - corner);
  shape.lineTo(-halfWidth, -halfHeight + corner);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + corner, -halfHeight);

  const bevel = Math.min(bevelSize, depth * 0.2, corner * 0.45);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.01, depth - bevel * 2),
    steps: 1,
    curveSegments: 6,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: bevel,
    bevelThickness: bevel
  });
  geometry.center();
  return geometry;
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
  const trackLinks = [];
  const armPivots = [];
  const eyes = [];
  const wheelGeometry = new THREE.CylinderGeometry(0.096, 0.096, 0.105, 20);
  const wheelHubGeometry = new THREE.CylinderGeometry(0.038, 0.038, 0.118, 16);
  const trackHousingGeometry = createRoundedBoxGeometry(
    0.61,
    0.19,
    0.12,
    0.075,
    0.014
  );
  trackHousingGeometry.rotateY(Math.PI / 2);
  const trackLinkGeometry = new THREE.BoxGeometry(0.088, 0.052, 0.074);
  const trackHousingX = 0.29;
  const wheelX = 0.345;
  const trackX = 0.385;
  const trackMaterials = [
    materials.rubber,
    physicalMaterial({
      color: "#526b74",
      metalness: 0.62,
      roughness: 0.46,
      clearcoat: 0.18
    }),
    physicalMaterial({
      color: "#d86b2f",
      metalness: 0.46,
      roughness: 0.38,
      clearcoat: 0.42
    })
  ];

  function positionTrackLink(link, travel) {
    const progress = THREE.MathUtils.euclideanModulo(
      link.offset + travel * 0.055,
      1
    );
    const point = link.curve.getPointAt(progress);
    const tangent = link.curve.getTangentAt(progress).normalize();
    link.mesh.position.copy(point);
    link.mesh.rotation.x = Math.atan2(-tangent.y, tangent.z);
  }

  [-1, 1].forEach((side) => {
    const trackHousing = setShadow(
      new THREE.Mesh(trackHousingGeometry, materials.rubber),
      true,
      true
    );
    trackHousing.position.set(side * trackHousingX, 0.17, 0.02);
    model.add(trackHousing);

    [-0.22, 0, 0.22].forEach((z, wheelIndex) => {
      const wheel = setShadow(
        new THREE.Mesh(wheelGeometry, materials.silver),
        true,
        true
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(side * wheelX, 0.17, z + 0.02);
      wheel.scale.setScalar(wheelIndex === 1 ? 0.86 : 1);
      wheel.userData.trackSide = side;
      model.add(wheel);
      wheels.push(wheel);

      const hub = new THREE.Mesh(wheelHubGeometry, materials.graphite);
      hub.rotation.z = Math.PI / 2;
      hub.position.copy(wheel.position);
      hub.position.x += side * 0.006;
      hub.scale.setScalar(wheelIndex === 1 ? 0.82 : 0.92);
      model.add(hub);
    });

    const trackCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(side * trackX, 0.286, -0.2),
        new THREE.Vector3(side * trackX, 0.286, 0.24),
        new THREE.Vector3(side * trackX, 0.25, 0.3),
        new THREE.Vector3(side * trackX, 0.17, 0.335),
        new THREE.Vector3(side * trackX, 0.09, 0.3),
        new THREE.Vector3(side * trackX, 0.054, 0.24),
        new THREE.Vector3(side * trackX, 0.054, -0.2),
        new THREE.Vector3(side * trackX, 0.09, -0.26),
        new THREE.Vector3(side * trackX, 0.17, -0.295),
        new THREE.Vector3(side * trackX, 0.25, -0.26)
      ],
      true,
      "centripetal",
      0.45
    );

    for (let linkIndex = 0; linkIndex < 24; linkIndex += 1) {
      const materialIndex =
        linkIndex % 6 === 0 ? 2 : linkIndex % 2 === 0 ? 1 : 0;
      const linkMesh = setShadow(
        new THREE.Mesh(trackLinkGeometry, trackMaterials[materialIndex]),
        true,
        true
      );
      const link = {
        mesh: linkMesh,
        curve: trackCurve,
        side,
        offset: linkIndex / 24
      };
      positionTrackLink(link, 0);
      model.add(linkMesh);
      trackLinks.push(link);
    }
  });

  const undercarriage = setShadow(
    new THREE.Mesh(
      createRoundedBoxGeometry(0.57, 0.16, 0.46, 0.065, 0.018),
      materials.orangeDark
    ),
    true,
    true
  );
  undercarriage.position.y = 0.285;
  model.add(undercarriage);

  const undercarriageDeck = setShadow(
    new THREE.Mesh(
      createRoundedBoxGeometry(0.62, 0.075, 0.49, 0.055, 0.014),
      materials.orange
    ),
    true,
    true
  );
  undercarriageDeck.position.y = 0.37;
  model.add(undercarriageDeck);

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
    new THREE.Mesh(new THREE.SphereGeometry(0.31, 28, 20), materials.orangeLight),
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
    eyes.push(eye);
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

  const antennaBase = setShadow(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.064, 0.052, 18),
      materials.orangeDark
    ),
    true,
    true
  );
  antennaBase.position.set(0, 0.265, 0.015);
  head.add(antennaBase);

  const antenna = new THREE.Group();
  antenna.position.set(0, 0.29, 0.015);
  head.add(antenna);

  const antennaMast = setShadow(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.018, 0.22, 12),
      materials.silver
    ),
    true,
    true
  );
  antenna.add(antennaMast);

  const antennaTipMaterial = materials.pinkAccent.clone();
  antennaTipMaterial.emissiveIntensity = 1.1;
  const antennaTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.038, 16, 12),
    antennaTipMaterial
  );
  antenna.add(antennaTip);

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

  const shoulderRingGeometry = new THREE.CylinderGeometry(
    0.073,
    0.073,
    0.045,
    20
  );
  const shoulderGeometry = new THREE.SphereGeometry(0.058, 18, 12);
  const upperArmGeometry = new THREE.CylinderGeometry(
    0.04,
    0.048,
    0.135,
    14
  );
  const elbowHousingGeometry = new THREE.CylinderGeometry(
    0.052,
    0.052,
    0.052,
    18
  );
  const elbowAxleGeometry = new THREE.CylinderGeometry(
    0.025,
    0.025,
    0.061,
    14
  );
  const elbowCapGeometry = new THREE.CylinderGeometry(
    0.033,
    0.033,
    0.012,
    16
  );
  const lowerArmGeometry = new THREE.CylinderGeometry(
    0.033,
    0.04,
    0.11,
    14
  );
  const wristGeometry = new THREE.CylinderGeometry(
    0.033,
    0.038,
    0.038,
    16
  );
  const handGeometry = new THREE.TorusGeometry(
    0.045,
    0.013,
    10,
    28,
    Math.PI * 1.5
  );
  handGeometry.rotateZ(Math.PI * 0.25);
  handGeometry.rotateY(Math.PI / 2);
  const handTipGeometry = new THREE.SphereGeometry(0.0135, 12, 8);
  const handTipY = Math.sin(Math.PI * 0.25) * 0.045;
  const handTipZ = -Math.cos(Math.PI * 0.25) * 0.045;

  [-1, 1].forEach((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(side * 0.305, 0.68, -0.015);
    pivot.rotation.z = side * 0.34;
    model.add(pivot);
    armPivots.push(pivot);

    const shoulderRing = new THREE.Mesh(
      shoulderRingGeometry,
      materials.silver
    );
    shoulderRing.rotation.z = Math.PI / 2;
    pivot.add(shoulderRing);

    const shoulder = new THREE.Mesh(shoulderGeometry, materials.orangeLight);
    pivot.add(shoulder);

    const upper = new THREE.Mesh(upperArmGeometry, materials.orange);
    upper.position.y = -0.09;
    pivot.add(upper);

    const elbowHousing = new THREE.Mesh(
      elbowHousingGeometry,
      materials.silver
    );
    elbowHousing.rotation.z = Math.PI / 2;
    elbowHousing.position.y = -0.165;
    pivot.add(elbowHousing);

    const elbowAxle = new THREE.Mesh(
      elbowAxleGeometry,
      materials.graphite
    );
    elbowAxle.rotation.z = Math.PI / 2;
    elbowAxle.position.y = -0.165;
    pivot.add(elbowAxle);

    const elbowCap = new THREE.Mesh(elbowCapGeometry, materials.orangeDark);
    elbowCap.rotation.z = Math.PI / 2;
    elbowCap.position.set(side * 0.032, -0.165, 0);
    pivot.add(elbowCap);

    const lower = new THREE.Mesh(lowerArmGeometry, materials.orange);
    lower.position.set(-side * 0.016, -0.218, -0.018);
    lower.rotation.z = -side * 0.28;
    pivot.add(lower);

    const wrist = new THREE.Mesh(wristGeometry, materials.silver);
    wrist.rotation.z = Math.PI / 2;
    wrist.position.set(-side * 0.03, -0.268, -0.035);
    pivot.add(wrist);

    const hand = new THREE.Group();
    hand.position.set(-side * 0.04, -0.3, -0.05);
    pivot.add(hand);

    const claw = setShadow(
      new THREE.Mesh(handGeometry, materials.orangeLight),
      true,
      true
    );
    hand.add(claw);

    [-1, 1].forEach((tipSide) => {
      const tip = setShadow(
        new THREE.Mesh(handTipGeometry, materials.orangeLight),
        true,
        true
      );
      tip.position.set(0, tipSide * handTipY, handTipZ);
      hand.add(tip);
    });
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
    trackLinks,
    positionTrackLink,
    wheelTravelBySide: { "-1": 0, "1": 0 },
    robotColorMaterials: {
      base: materials.orange,
      light: materials.orangeLight,
      dark: materials.orangeDark,
      chest: chestMaterial,
      trackAccent: trackMaterials[2]
    },
    armPivots,
    eyes,
    head,
    antennaMast,
    antennaTip,
    antennaTipMaterial,
    antennaExtension: 1,
    chestMaterial,
    chestLampMaterial,
    inductLight,
    lastPosition: null,
    lastAngle: null,
    lastLevel: null,
    lastAnimationTime: null,
    blinkStartedAt: null,
    nextBlinkAt: null,
    blinkDuration: 0.18
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
  environment.background = new THREE.Color("#101819");

  const room = new THREE.Mesh(
    new THREE.BoxGeometry(24, 18, 24),
    new THREE.MeshBasicMaterial({
      color: "#111a1a",
      side: THREE.BackSide
    })
  );
  room.position.y = 4;
  environment.add(room);

  [
    {
      color: "#806849",
      position: [-5, 6.5, -4],
      scale: [5.5, 3.2]
    },
    {
      color: "#497b78",
      position: [6, 4.5, 1],
      scale: [4.5, 3.5]
    },
    {
      color: "#765267",
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
    this.cameraQuarterTurns = 0;
    this.cameraSnapKey = -1;
    this.cameraAngle = Math.PI / 4;
    this.cameraLift = 0;
    this.cameraOrbit = null;
    this.cameraZoom = 1;
    this.cameraPan = new THREE.Vector3();
    this.dragState = null;
    this.raycaster = new THREE.Raycaster();
    this.boardPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.floorHue = -1;
    this.backgroundHue = -1;
    this.robotHue = -1;
    this.signalCurve = null;
    this.signalSprites = [];
    this.signalLight = null;
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
    this.renderer.toneMappingExposure = 0.74;
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
    this.scene.environmentIntensity = 0.35;
    this.camera = new THREE.OrthographicCamera(-8, 8, 6, -6, 0.1, 100);
    this.camera.position.set(12, 13, 12);
    this.camera.lookAt(0, 0.2, 0);
    this.installCameraInteractions();

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
    this.hemisphereLight = hemisphere;

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
    this.fillLight = fill;

    const rim = new THREE.DirectionalLight("#f3cce1", 0.38);
    rim.position.set(-9, 5, 10);
    this.scene.add(rim);
    this.rimLight = rim;

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 70),
      new THREE.MeshStandardMaterial({
        color: "#3c7080",
        metalness: 0.08,
        roughness: 0.9
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.315;
    ground.receiveShadow = true;
    this.scene.add(ground);
    this.ground = ground;

    const grid = new THREE.GridHelper(70, 70, "#e0f8fb", "#9ec8d1");
    grid.position.y = -0.305;
    grid.material.transparent = true;
    grid.material.opacity = 0.34;
    grid.material.depthWrite = false;
    this.scene.add(grid);
    this.grid = grid;
    this.createSignalPulse();
  }

  createSignalPulse() {
    const texture = makeSignalTexture();
    const colors = ["#efffff", "#8affdf", "#65ddef", "#74bfff", "#b68cff"];
    this.signalSprites = colors.map((color, index) => {
      const material = new THREE.SpriteMaterial({
        map: texture,
        color,
        transparent: true,
        opacity: 1 - index * 0.16,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        toneMapped: false
      });
      const sprite = new THREE.Sprite(material);
      const size = 0.24 - index * 0.027;
      sprite.scale.set(size, size, 1);
      sprite.renderOrder = 8;
      this.scene.add(sprite);
      return sprite;
    });
    this.signalLight = new THREE.PointLight("#8affdf", 0.9, 2.1, 2);
    this.scene.add(this.signalLight);
  }

  updateSignalRoute(level) {
    const halfX = level.width / 2 + 1.25;
    const halfZ = level.height / 2 + 1.25;
    const y = -0.27;
    const points = [
      new THREE.Vector3(-halfX, y, -halfZ),
      new THREE.Vector3(0, y, -halfZ),
      new THREE.Vector3(0, y, -halfZ - 1),
      new THREE.Vector3(halfX, y, -halfZ - 1),
      new THREE.Vector3(halfX, y, 0),
      new THREE.Vector3(halfX + 1, y, 0),
      new THREE.Vector3(halfX + 1, y, halfZ),
      new THREE.Vector3(0, y, halfZ),
      new THREE.Vector3(0, y, halfZ + 1),
      new THREE.Vector3(-halfX, y, halfZ + 1),
      new THREE.Vector3(-halfX, y, 0),
      new THREE.Vector3(-halfX - 1, y, 0)
    ];
    const route = new THREE.CurvePath();
    points.forEach((point, index) => {
      route.add(
        new THREE.LineCurve3(point, points[(index + 1) % points.length])
      );
    });
    route.autoClose = true;
    this.signalCurve = route;
  }

  animateSignal(time) {
    if (!this.signalCurve) return;
    const progress = THREE.MathUtils.euclideanModulo(
      time * 0.047 + Math.sin(time * 0.37) * 0.012,
      1
    );
    this.signalSprites.forEach((sprite, index) => {
      const trailProgress = THREE.MathUtils.euclideanModulo(
        progress - index * 0.0055,
        1
      );
      sprite.position.copy(this.signalCurve.getPointAt(trailProgress));
      sprite.position.y += index === 0 ? 0.018 : 0.009;
      sprite.material.opacity =
        (1 - index * 0.16) * (0.8 + Math.sin(time * 7.4 - index) * 0.2);
      sprite.visible = !reducedMotion.matches || index === 0;
    });
    this.signalLight.position.copy(this.signalSprites[0].position);
    this.signalLight.position.y += 0.11;
    this.signalLight.intensity =
      reducedMotion.matches ? 0.45 : 0.75 + Math.sin(time * 8.2) * 0.25;
  }

  levelSignature(level) {
    return [
      level.id,
      level.width,
      level.height,
      level.grid.join(""),
      core.wallSegments(level)
        .map((wall) => `${wall.axis}:${wall.x}:${wall.y}`)
        .join("|"),
      level.goals.map((goal) => `${goal.x}:${goal.y}`).join("|")
    ].join("/");
  }

  clearLevel() {
    this.beacons.forEach((beacon) => {
      beacon.lensMaterial.dispose();
      beacon.beamMaterials.forEach((material) => material.dispose());
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
    this.updateSignalRoute(level);
    const floorGroups = {
      floor0: [],
      floor1: [],
      sand: [],
      ice: [],
      charger: []
    };
    const wallSegments = core.wallSegments(level);

    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        const terrain = core.terrainAt(level, x, y);
        const cell = {
          x,
          y,
          worldX: cellX(level, x),
          worldZ: cellZ(level, y)
        };
        if (terrain === "sand") {
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
        0.078,
        false,
        true
      );
    });

    this.addWallSegments(level, wallSegments);
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

  wallTransform(level, segment) {
    if (segment.axis === "horizontal") {
      return {
        x: cellX(level, segment.x),
        z: segment.y - level.height / 2,
        rotation: 0
      };
    }
    return {
      x: segment.x - level.width / 2,
      z: cellZ(level, segment.y),
      rotation: Math.PI / 2
    };
  }

  addWallSegments(level, wallSegments) {
    if (wallSegments.length === 0) return;
    const body = new THREE.InstancedMesh(
      this.geometries.wallBody,
      this.materials.wall,
      wallSegments.length
    );
    const transform = new THREE.Object3D();

    wallSegments.forEach((segment, index) => {
      const placement = this.wallTransform(level, segment);
      transform.position.set(placement.x, 0.34, placement.z);
      transform.rotation.set(0, placement.rotation, 0);
      transform.scale.set(1, 1, 1);
      transform.updateMatrix();
      body.setMatrixAt(index, transform.matrix);
    });
    body.castShadow = false;
    body.receiveShadow = true;
    this.boardGroup.add(body);

    this.addWallHardware(level, wallSegments);
  }

  addWallHardware(level, wallSegments) {
    if (wallSegments.length === 0) return;
    const rivets = new THREE.InstancedMesh(
      this.geometries.rivet,
      this.materials.silver,
      wallSegments.length * 4
    );
    const transform = new THREE.Object3D();
    const yAxis = new THREE.Vector3(0, 1, 0);
    let rivetIndex = 0;
    wallSegments.forEach((segment) => {
      const placement = this.wallTransform(level, segment);
      [
        [-0.28, 0.29, -0.032],
        [0.28, 0.29, -0.032],
        [-0.28, 0.29, 0.032],
        [0.28, 0.29, 0.032]
      ].forEach(([dx, y, dz]) => {
        const offset = new THREE.Vector3(dx, 0, dz).applyAxisAngle(
          yAxis,
          placement.rotation
        );
        transform.position.set(
          placement.x + offset.x,
          y,
          placement.z + offset.z
        );
        transform.scale.set(1, 1, 1);
        transform.rotation.set(0, placement.rotation, 0);
        transform.updateMatrix();
        rivets.setMatrixAt(rivetIndex, transform.matrix);
        rivetIndex += 1;
      });
    });
    rivets.castShadow = false;
    this.boardGroup.add(rivets);

    const accentWalls = wallSegments.filter(
      (segment) =>
        (segment.x + segment.y + (segment.axis === "vertical" ? 1 : 0)) % 3 === 0
    );
    const accents = new THREE.InstancedMesh(
      this.geometries.wallAccent,
      this.materials.pinkAccent,
      accentWalls.length
    );
    accentWalls.forEach((segment, index) => {
      const placement = this.wallTransform(level, segment);
      transform.position.set(placement.x, 0.34, placement.z);
      transform.rotation.set(0, placement.rotation, 0);
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
      cellX(level, goal.x),
      0.105,
      cellZ(level, goal.y)
    );
    const padMaterial = this.materials.goalPads[index % this.materials.goalPads.length];
    const projector = setShadow(
      new THREE.Mesh(this.geometries.beaconProjector, this.materials.graphite),
      false,
      true
    );
    projector.position.y = 0.012;
    group.add(projector);

    const rim = new THREE.Mesh(
      this.geometries.beaconRim,
      padMaterial
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.033;
    group.add(rim);

    const lensMaterial = this.materials.beaconLens.clone();
    const lens = new THREE.Mesh(this.geometries.beaconLens, lensMaterial);
    lens.position.y = 0.029;
    group.add(lens);

    const shutters = [0, 1, 2, 3].map((shutterIndex) => {
      const pivot = new THREE.Group();
      pivot.rotation.y = shutterIndex * Math.PI / 2;
      pivot.position.y = 0.05;
      const panel = new THREE.Mesh(this.geometries.beaconHatch, padMaterial);
      panel.position.z = -0.145;
      pivot.add(panel);
      group.add(pivot);
      return { pivot, panel };
    });

    const beamMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.beacon,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const beam = new THREE.Mesh(this.geometries.beaconBeam, beamMaterial);
    beam.position.y = 1.75;
    beam.visible = false;
    beam.renderOrder = 3;
    group.add(beam);

    const beamCoreMaterial = beamMaterial.clone();
    beamCoreMaterial.opacity = 0.1;
    const beamCore = new THREE.Mesh(
      this.geometries.beaconBeamCore,
      beamCoreMaterial
    );
    beamCore.position.y = 1.5;
    beamCore.visible = false;
    beamCore.renderOrder = 3;
    group.add(beamCore);

    const rings = [0.62, 1.28, 2.02].map((height, ringIndex) => {
      const ring = new THREE.Mesh(
        this.geometries.beaconRing,
        this.materials.chargerGlow
      );
      ring.material = this.materials.chargerGlow.clone();
      ring.material.color.set(COLORS.beacon);
      ring.material.emissive.set(COLORS.beacon);
      ring.material.emissiveIntensity = 2.4;
      ring.material.transparent = true;
      ring.material.opacity = 0.7;
      ring.material.depthWrite = false;
      ring.position.y = height;
      ring.rotation.x = Math.PI / 2 + (ringIndex - 1) * 0.08;
      ring.scale.setScalar(0.48 + ringIndex * 0.38);
      ring.visible = false;
      group.add(ring);
      return ring;
    });

    const pointLight = new THREE.PointLight(COLORS.beacon, 0.25, 3.8, 1.7);
    pointLight.position.y = 0.28;
    group.add(pointLight);

    const beamLight = new THREE.PointLight(COLORS.beaconHot, 0, 3.4, 2);
    beamLight.position.y = 0.92;
    group.add(beamLight);

    const timer = createTimerSprite();
    timer.position.y = 2.55;
    timer.visible = false;
    group.add(timer);

    this.actorGroup.add(group);
    this.beacons.push({
      group,
      lens,
      lensMaterial,
      shutters,
      beam,
      beamCore,
      beamMaterials: [beamMaterial, beamCoreMaterial],
      rings,
      pointLight,
      beamLight,
      timer,
      index,
      active: false,
      openProgress: 0,
      phase: index * 1.35
    });
  }

  fitCamera(level, angle = this.cameraAngle, lift = this.cameraLift) {
    const span = Math.max(level.width, level.height);
    const distance = span * 1.7 + 6;
    const orbitRadius = distance * Math.SQRT2;
    this.camera.position.set(
      Math.cos(angle) * orbitRadius,
      distance * 1.05 + lift,
      Math.sin(angle) * orbitRadius
    );
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
    this.camera.zoom = 1.2 * this.cameraZoom;
    this.camera.near = 0.1;
    this.camera.far = distance * 4;
    this.camera.updateProjectionMatrix();

    this.camera.position.x += this.cameraPan.x;
    this.camera.position.z += this.cameraPan.z;
    this.camera.lookAt(this.cameraPan.x, 0.2, this.cameraPan.z);
    this.camera.updateMatrixWorld(true);
  }

  zoomBy(steps) {
    if (!this.snapshot) return;
    const amount = THREE.MathUtils.clamp(Number(steps) || 0, -2, 2);
    this.cameraZoom = THREE.MathUtils.clamp(
      this.cameraZoom * Math.pow(1.18, amount),
      0.65,
      2.6
    );
    this.fitCamera(this.snapshot.level, this.cameraAngle, this.cameraLift);
  }

  pointerBoardPoint(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const pointer = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(pointer, this.camera);
    return this.raycaster.ray.intersectPlane(
      this.boardPlane,
      new THREE.Vector3()
    );
  }

  panToPointer(event) {
    if (
      !this.dragState ||
      event.pointerId !== this.dragState.pointerId ||
      !this.snapshot
    ) {
      return;
    }
    const point = this.pointerBoardPoint(event);
    if (!point) return;
    const delta = this.dragState.anchor.clone().sub(point);
    const maxPan = Math.max(
      this.snapshot.level.width,
      this.snapshot.level.height
    ) * 0.8;
    this.cameraPan.x = THREE.MathUtils.clamp(
      this.cameraPan.x + delta.x,
      -maxPan,
      maxPan
    );
    this.cameraPan.z = THREE.MathUtils.clamp(
      this.cameraPan.z + delta.z,
      -maxPan,
      maxPan
    );
    this.fitCamera(this.snapshot.level, this.cameraAngle, this.cameraLift);
  }

  endPointerPan(event) {
    if (!this.dragState || event.pointerId !== this.dragState.pointerId) return;
    if (this.renderer.domElement.hasPointerCapture(event.pointerId)) {
      this.renderer.domElement.releasePointerCapture(event.pointerId);
    }
    this.dragState = null;
    this.container.classList.remove("is-panning");
  }

  installCameraInteractions() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      const wheelSteps = THREE.MathUtils.clamp(
        -event.deltaY * 0.012,
        -0.45,
        0.45
      );
      this.zoomBy(wheelSteps);
    }, { passive: false });

    canvas.addEventListener("pointerdown", (event) => {
      if (
        (event.pointerType === "mouse" || event.pointerType === "pen") &&
        event.button !== 0
      ) {
        return;
      }
      const anchor = this.pointerBoardPoint(event);
      if (!anchor) return;
      this.dragState = { pointerId: event.pointerId, anchor };
      canvas.setPointerCapture(event.pointerId);
      this.container.classList.add("is-panning");
      event.preventDefault();
    });
    canvas.addEventListener("pointermove", (event) => this.panToPointer(event));
    canvas.addEventListener("pointerup", (event) => this.endPointerPan(event));
    canvas.addEventListener("pointercancel", (event) => this.endPointerPan(event));
    canvas.addEventListener("lostpointercapture", (event) => {
      if (this.dragState && event.pointerId === this.dragState.pointerId) {
        this.dragState = null;
        this.container.classList.remove("is-panning");
      }
    });
  }

  startCameraOrbit(quarterTurns) {
    const endAngle = Math.PI / 4 + quarterTurns * (Math.PI / 2);
    const angleDistance = Math.abs(endAngle - this.cameraAngle);
    const quarterDistance = angleDistance / (Math.PI / 2);
    this.cameraOrbit = {
      startAngle: this.cameraAngle,
      endAngle,
      startTime: performance.now(),
      duration: reducedMotion.matches
        ? 0
        : 760 * Math.max(0.65, Math.min(1.6, quarterDistance))
    };
  }

  updateCameraOrbit(timeMs) {
    if (!this.cameraOrbit || !this.snapshot) return;
    const orbit = this.cameraOrbit;
    const progress = orbit.duration === 0
      ? 1
      : THREE.MathUtils.clamp((timeMs - orbit.startTime) / orbit.duration, 0, 1);
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    this.cameraAngle = THREE.MathUtils.lerp(
      orbit.startAngle,
      orbit.endAngle,
      eased
    );
    const span = Math.max(
      this.snapshot.level.width,
      this.snapshot.level.height
    );
    this.cameraLift = Math.sin(progress * Math.PI) *
      Math.min(1.4, 0.24 + span * 0.075);
    this.fitCamera(this.snapshot.level, this.cameraAngle, this.cameraLift);
    if (progress >= 1) {
      this.cameraAngle = orbit.endAngle;
      this.cameraLift = 0;
      this.cameraOrbit = null;
      this.fitCamera(this.snapshot.level, this.cameraAngle, 0);
    }
  }

  resize() {
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    if (this.snapshot) {
      this.fitCamera(this.snapshot.level, this.cameraAngle, this.cameraLift);
    }
  }

  update(snapshot) {
    this.snapshot = snapshot;
    const requestedTurns = Number(snapshot.cameraQuarterTurns) || 0;
    const requestedSnapKey = Number(snapshot.cameraSnapKey) || 0;
    if (requestedSnapKey !== this.cameraSnapKey) {
      this.cameraSnapKey = requestedSnapKey;
      this.cameraQuarterTurns = requestedTurns;
      this.cameraAngle = Math.PI / 4 + requestedTurns * (Math.PI / 2);
      this.cameraLift = 0;
      this.cameraOrbit = null;
      this.cameraZoom = 1;
      this.cameraPan.set(0, 0, 0);
      this.dragState = null;
      this.container.classList.remove("is-panning");
      this.fitCamera(snapshot.level, this.cameraAngle, 0);
    } else if (requestedTurns !== this.cameraQuarterTurns) {
      this.cameraQuarterTurns = requestedTurns;
      this.startCameraOrbit(requestedTurns);
    }
    this.updateLighting(snapshot.globalLight);
    this.updateFloorHue(snapshot.floorHue);
    this.updateBackgroundHue(snapshot.backgroundHue);
    this.updateRobotHue(snapshot.robotHue);
    const signature = this.levelSignature(snapshot.level);
    if (signature !== this.levelKey) {
      this.levelKey = signature;
      this.buildBoard(snapshot.level);
    }
    this.updateRobot(snapshot);
    this.updateBeacons(snapshot);
    this.updatePath(snapshot.path, snapshot.level);
  }

  updateLighting(value) {
    const amount = Math.max(0, Math.min(200, Number(value) || 0)) / 100;
    const balancedAmount =
      amount <= 1 ? amount : 1 + (amount - 1) * 0.35;
    this.hemisphereLight.intensity = 0.08 + balancedAmount * 0.95;
    this.keyLight.intensity = 0.18 + balancedAmount * 1.75;
    this.fillLight.intensity = 0.05 + balancedAmount * 0.65;
    this.rimLight.intensity = 0.03 + balancedAmount * 0.4;
    this.scene.environmentIntensity = 0.08 + balancedAmount * 0.55;
    this.renderer.toneMappingExposure = 0.72 + balancedAmount * 0.62;
  }

  updateFloorHue(value) {
    const hue = THREE.MathUtils.clamp(Number(value) || 0, 0, 360);
    if (hue === this.floorHue) return;
    this.floorHue = hue;
    const normalized = hue / 360;
    this.materials.floor[0].color.setHSL(normalized, 0.5, 0.57);
    this.materials.floor[1].color.setHSL(normalized, 0.44, 0.62);
    this.materials.floorEdge.color.setHSL(normalized, 0.3, 0.42);
  }

  updateBackgroundHue(value) {
    const hue = THREE.MathUtils.clamp(Number(value) || 0, 0, 360);
    if (hue === this.backgroundHue) return;
    this.backgroundHue = hue;
    const normalized = hue / 360;
    this.scene.background.setHSL(normalized, 0.42, 0.24);
    this.ground.material.color.setHSL(normalized, 0.38, 0.39);
    this.grid.material.color.setHSL(normalized, 0.28, 0.78);
  }

  updateRobotHue(value) {
    const hue = THREE.MathUtils.clamp(Number(value) || 0, 0, 360);
    if (hue === this.robotHue) return;
    this.robotHue = hue;
    const normalized = hue / 360;
    const colors = this.robot.userData.robotColorMaterials;
    colors.base.color.setHSL(normalized, 0.88, 0.56);
    colors.base.emissive.setHSL(normalized, 0.9, 0.22);
    colors.light.color.setHSL(normalized, 0.82, 0.68);
    colors.light.emissive.setHSL(normalized, 0.95, 0.26);
    colors.dark.color.setHSL(normalized, 0.76, 0.42);
    colors.dark.emissive.setHSL(normalized, 0.9, 0.16);
    colors.chest.color.copy(colors.light.color);
    colors.chest.emissive.copy(colors.light.emissive);
    colors.trackAccent.color.setHSL(normalized, 0.68, 0.46);
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
    if (data.lastLevel !== snapshot.level) {
      data.lastLevel = snapshot.level;
      data.lastPosition = null;
      data.lastAngle = pose.angle;
    }
    let distance = 0;
    if (data.lastPosition) {
      distance = Math.hypot(
        next.x - data.lastPosition.x,
        next.z - data.lastPosition.z
      );
    }
    const angleDelta =
      data.lastAngle === null
        ? 0
        : Math.atan2(
            Math.sin(pose.angle - data.lastAngle),
            Math.cos(pose.angle - data.lastAngle)
          );
    const driveTravel = distance * 4.8;
    const turnTravel = angleDelta * 2.1;
    data.wheelTravelBySide["-1"] += driveTravel - turnTravel;
    data.wheelTravelBySide["1"] += driveTravel + turnTravel;
    data.lastPosition = next.clone();
    data.lastAngle = pose.angle;
    this.robot.position.copy(next);
    this.robot.rotation.y = -pose.angle - Math.PI / 2;
    data.wheels.forEach((wheel) => {
      wheel.rotation.x = data.wheelTravelBySide[String(wheel.userData.trackSide)];
    });
    data.trackLinks.forEach((link) => {
      data.positionTrackLink(
        link,
        data.wheelTravelBySide[String(link.side)]
      );
    });
  }

  updateBeacons(snapshot) {
    this.beacons.forEach((beacon) => {
      const active = (snapshot.robot.collected & (1 << beacon.index)) !== 0;
      const failed = snapshot.gameOver && !active;
      const signalColor = failed ? COLORS.error : COLORS.beacon;
      beacon.active = active;
      beacon.lensMaterial.color.set(active ? COLORS.beaconHot : "#493653");
      beacon.lensMaterial.emissive.set(signalColor);
      beacon.lensMaterial.emissiveIntensity = active ? 5.2 : failed ? 1.3 : 0.22;
      beacon.beam.visible = active;
      beacon.beamCore.visible = active;
      beacon.beamMaterials.forEach((material) => {
        material.color.set(signalColor);
      });
      beacon.rings.forEach((ring) => {
        ring.visible = active;
        ring.material.color.set(signalColor);
        ring.material.emissive.set(signalColor);
      });
      beacon.pointLight.color.set(signalColor);
      beacon.beamLight.color.set(failed ? COLORS.error : COLORS.beaconHot);
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
    this.updateCameraOrbit(timeMs);
    const time = timeMs * 0.001;
    this.animateSignal(time);
    const motion = reducedMotion.matches ? 0 : 1;
    const robotData = this.robot.userData;
    robotData.head.rotation.y = Math.sin(time * 1.45) * 0.045 * motion;
    const antennaTarget =
      this.snapshot && this.snapshot.programRunning ? 0 : 1;
    const frameDelta =
      robotData.lastAnimationTime === null
        ? 1 / 60
        : Math.min(0.05, Math.max(0, time - robotData.lastAnimationTime));
    robotData.lastAnimationTime = time;
    if (motion === 0) {
      robotData.antennaExtension = antennaTarget;
    } else {
      const antennaBlend = 1 - Math.exp(-frameDelta * 13);
      robotData.antennaExtension = THREE.MathUtils.lerp(
        robotData.antennaExtension,
        antennaTarget,
        antennaBlend
      );
    }
    const antennaExtension = robotData.antennaExtension;
    robotData.antennaMast.scale.y = Math.max(0.02, antennaExtension);
    robotData.antennaMast.position.y = antennaExtension * 0.11;
    robotData.antennaTip.position.y = 0.012 + antennaExtension * 0.218;
    const antennaPulse =
      1 + Math.sin(time * 3.4) * 0.08 * motion * antennaExtension;
    robotData.antennaTip.scale.setScalar(
      (0.18 + antennaExtension * 0.82) * antennaPulse
    );
    robotData.antennaTipMaterial.emissiveIntensity =
      0.35 + antennaExtension * (0.78 + Math.sin(time * 3.4) * 0.18 * motion);
    if (motion === 0) {
      robotData.eyes.forEach((eye) => {
        eye.scale.y = 1.18;
      });
    } else {
      if (robotData.nextBlinkAt === null) {
        robotData.nextBlinkAt = time + 2.4 + Math.random() * 2.4;
      }
      if (
        robotData.blinkStartedAt === null &&
        time >= robotData.nextBlinkAt
      ) {
        robotData.blinkStartedAt = time;
        robotData.blinkDuration = 0.16 + Math.random() * 0.06;
      }

      let blinkAmount = 0;
      if (robotData.blinkStartedAt !== null) {
        const blinkProgress = THREE.MathUtils.clamp(
          (time - robotData.blinkStartedAt) / robotData.blinkDuration,
          0,
          1
        );
        const blinkPhase = blinkProgress < 0.46
          ? blinkProgress / 0.46
          : (1 - blinkProgress) / 0.54;
        blinkAmount = THREE.MathUtils.smoothstep(blinkPhase, 0, 1);
        if (blinkProgress >= 1) {
          robotData.blinkStartedAt = null;
          robotData.nextBlinkAt = time + 2.8 + Math.random() * 4.2;
          blinkAmount = 0;
        }
      }
      robotData.eyes.forEach((eye) => {
        eye.scale.y = 1.18 * (1 - blinkAmount * 0.92);
      });
    }

    const activeStep = this.snapshot ? this.snapshot.activeStep : null;
    const actionProgress = activeStep ? activeStep.progress : 0;
    const actionWave = Math.sin(actionProgress * Math.PI);
    const driveAction = activeStep && activeStep.type === "move";
    const drivePulse = Math.sin(actionProgress * Math.PI * 2);
    const batteryAction = activeStep && activeStep.command === "battery";
    const inductAction = activeStep && activeStep.command === "induct";
    robotData.model.rotation.x = driveAction ? -actionWave * 0.018 * motion : 0;
    robotData.model.position.y =
      Math.sin(time * 2.1) * 0.009 * motion +
      (driveAction ? Math.abs(drivePulse) * 0.004 * motion : 0);
    robotData.armPivots.forEach((arm, index) => {
      arm.rotation.x = batteryAction
        ? -actionWave * 0.9
        : driveAction
          ? drivePulse * (index === 0 ? 0.055 : -0.055) * motion
          : 0;
      arm.rotation.y = batteryAction ? (index === 0 ? -1 : 1) * actionWave * 0.24 : 0;
    });
    robotData.chestMaterial.emissive.set(
      inductAction ? COLORS.charger : COLORS.orangeGlow
    );
    robotData.chestMaterial.emissiveIntensity = inductAction
      ? actionWave * 1.8
      : 0.38;
    robotData.chestLampMaterial.emissiveIntensity = inductAction
      ? 6 + actionWave * 5
      : 3.5;
    robotData.inductLight.intensity = inductAction ? actionWave * 14 : 0;

    this.beacons.forEach((beacon) => {
      const openTarget = beacon.active ? 1 : 0;
      beacon.openProgress += (openTarget - beacon.openProgress) *
        (reducedMotion.matches ? 1 : 0.12);
      const open = beacon.openProgress;
      beacon.shutters.forEach(({ panel }, index) => {
        panel.position.z = -THREE.MathUtils.lerp(0.145, 0.34, open);
        panel.position.y = Math.sin(open * Math.PI) * 0.035;
        panel.rotation.x = (index % 2 === 0 ? -1 : 1) * open * 0.32;
      });

      const pulse = 1 + Math.sin(time * 3.2 + beacon.phase) * 0.055 * motion;
      beacon.rings.forEach((ring, index) => {
        ring.rotation.y = time * (index % 2 === 0 ? 0.7 : -0.55) * motion;
        ring.rotation.z = time * (index % 2 === 0 ? 0.2 : -0.25) * motion;
        ring.scale.setScalar((0.48 + index * 0.38) * pulse);
      });
      beacon.beam.scale.set(pulse, 1, pulse);
      beacon.beamCore.scale.set(0.96 + (pulse - 1) * 1.8, 1, 0.96 + (pulse - 1) * 1.8);
      beacon.beamMaterials[0].opacity = beacon.active
        ? 0.15 + Math.sin(time * 2.6 + beacon.phase) * 0.025 * motion
        : 0;
      beacon.beamMaterials[1].opacity = beacon.active
        ? 0.08 + Math.sin(time * 3.4 + beacon.phase) * 0.018 * motion
        : 0;
      beacon.pointLight.intensity = beacon.active
        ? 14 + Math.sin(time * 2.8 + beacon.phase) * 2.2 * motion
        : 0.18;
      beacon.beamLight.intensity = beacon.active
        ? 5.5 + Math.sin(time * 2.4 + beacon.phase) * 1.2 * motion
        : 0;
      beacon.lens.scale.setScalar(beacon.active ? pulse : 1);
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
    stage.dataset.renderer = "failed";
    console.error("RoboNavi Three.js renderer failed to initialize.", error);
  }
}
