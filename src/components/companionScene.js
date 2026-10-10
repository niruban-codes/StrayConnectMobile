import * as THREE from 'three';

export const COMPANIONS = [
  { id: 'dog', name: 'Biscuit', mood: 'A little hello!', emoji: '🐶', color: '#A6EACB' },
  { id: 'cat', name: 'Mochi', mood: 'Love at first purr', emoji: '😻', color: '#FFC5DC' },
  { id: 'cow', name: 'Clover', mood: 'All smiles today', emoji: '🐮', color: '#C9BEFF' },
  { id: 'bunny', name: 'Coco', mood: 'Hoppy to meet you', emoji: '🐰', color: '#BDE6FF' },
];

// Original, locally generated characters. No model downloads or canvas textures.
export function createCompanionScene() {
  const geometries = new Set();
  const materials = new Set();
  const sphere = new THREE.SphereGeometry(1, 32, 24); geometries.add(sphere);
  const grain = new Uint8Array(64 * 64 * 4);
  let seed = 51;
  for (let i = 0; i < grain.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const value = 236 + (seed % 20);
    grain.set([value, value, value, 255], i);
  }
  const texture = new THREE.DataTexture(grain, 64, 64, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3); texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter; texture.needsUpdate = true;
  const mat = (color, fur = false, gloss = false) => {
    const material = new THREE.MeshStandardMaterial({ color, roughness: gloss ? 0.22 : 0.87,
      metalness: 0, map: fur ? texture : null });
    materials.add(material); return material;
  };
  const coat = mat('#DFA362', true), dark = mat('#945323', true), cream = mat('#FFF1D6', true);
  const white = mat('#FFF9F0', true), cocoa = mat('#4B302C', true), pink = mat('#F6A0AF');
  const blush = mat('#F3B1A2'), ink = mat('#231E23', false, true), shine = mat('#FFFFFF', false, true);
  const red = mat('#F34471'), blue = mat('#467DDB'), lilac = mat('#AE90DD');
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9882a0, 2.2));
  const light = new THREE.DirectionalLight(0xfff4e5, 3.2); light.position.set(-3, 5, 6); scene.add(light);
  const fill = new THREE.DirectionalLight(0xffffff, 1.1); fill.position.set(4, 2, -3); scene.add(fill);
  const camera = new THREE.OrthographicCamera(-1.8, 1.8, 2, -1.6, 0.1, 30);
  camera.position.set(0.2, 1.2, 8); camera.lookAt(0, 0.5, 0);
  const ball = (parent, material, position, scale) => {
    const mesh = new THREE.Mesh(sphere, material); mesh.position.set(...position); mesh.scale.set(...scale);
    parent.add(mesh); return mesh;
  };
  const group = (parent, x = 0, y = 0, z = 0) => {
    const node = new THREE.Group(); node.position.set(x, y, z); parent.add(node); return node;
  };
  const heartShape = new THREE.Shape();
  heartShape.moveTo(0, -0.55);
  heartShape.bezierCurveTo(-0.18, -0.35, -0.65, -0.05, -0.65, 0.3);
  heartShape.bezierCurveTo(-0.65, 0.8, -0.15, 0.9, 0, 0.5);
  heartShape.bezierCurveTo(0.15, 0.9, 0.65, 0.8, 0.65, 0.3);
  heartShape.bezierCurveTo(0.65, -0.05, 0.18, -0.35, 0, -0.55);
  const heartGeometry = new THREE.ExtrudeGeometry(heartShape, { depth: 0.16, bevelEnabled: true,
    bevelSegments: 3, steps: 1, bevelSize: 0.08, bevelThickness: 0.08, curveSegments: 16 });
  geometries.add(heartGeometry);
  const heart = (parent, x, y, z, size) => {
    const mesh = new THREE.Mesh(heartGeometry, red); mesh.position.set(x, y, z); mesh.scale.setScalar(size);
    parent.add(mesh); return mesh;
  };
  const curve = (parent, points, material = ink, radius = 0.022) => {
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), 20, radius, 8, false);
    geometries.add(geo); const mesh = new THREE.Mesh(geo, material); parent.add(mesh); return mesh;
  };
  const models = COMPANIONS.map(({ id }) => {
    const root = group(scene); root.visible = false;
    const bodyColor = id === 'cow' || id === 'bunny' ? white : coat;
    const body = ball(root, bodyColor, [0, -0.18, 0], [0.54, 0.7, 0.43]);
    ball(root, id === 'cow' ? white : cream, [0, -0.21, 0.37], [0.36, 0.46, 0.1]);
    const head = group(root, 0, 0.78, 0.06);
    ball(head, bodyColor, [0, 0, 0], [0.79, 0.68, 0.59]);
    const paws = [-1, 1].map(side => {
      const arm = group(root, side * 0.46, 0.06, 0.06);
      ball(arm, bodyColor, [side * 0.08, -0.22, 0.12], [0.19, 0.38, 0.22]);
      ball(root, id === 'cow' ? cocoa : bodyColor, [side * 0.38, -0.75, 0.25], [0.28, 0.22, 0.36]);
      ball(root, pink, [side * 0.38, -0.7, 0.6], [0.12, 0.1, 0.035]);
      return arm;
    });
    const ears = [-1, 1].map(side => {
      const ear = group(head, side * (id === 'bunny' ? 0.36 : 0.65), 0.35, 0);
      if (id === 'dog') {
        ball(ear, dark, [side * 0.08, -0.18, 0], [0.24, 0.53, 0.2]);
      } else if (id === 'cat') {
        const geo = new THREE.ConeGeometry(0.28, 0.6, 24, 1); geometries.add(geo);
        const outer = new THREE.Mesh(geo, coat); outer.position.y = 0.2; outer.rotation.y = Math.PI / 4; ear.add(outer);
        ball(ear, pink, [0, 0.18, 0.18], [0.13, 0.22, 0.035]);
      } else if (id === 'cow') {
        const leaf = ball(ear, cocoa, [side * 0.18, 0.05, 0], [0.37, 0.18, 0.16]); leaf.rotation.z = side * 0.3;
        ball(ear, pink, [side * 0.2, 0.04, 0.17], [0.22, 0.1, 0.03]);
        ball(head, cream, [side * 0.44, 0.62, -0.1], [0.12, 0.24, 0.12]);
      } else {
        ear.rotation.z = side * -0.13;
        ball(ear, white, [0, 0.46, 0], [0.19, 0.65, 0.15]);
        ball(ear, pink, [0, 0.48, 0.13], [0.1, 0.47, 0.035]);
      }
      return ear;
    });
    if (id === 'cow') {
      ball(head, cocoa, [-0.35, 0.19, 0.49], [0.32, 0.36, 0.095]);
      ball(root, cocoa, [0.43, -0.3, 0.23], [0.17, 0.23, 0.19]);
      ball(head, pink, [0, -0.26, 0.53], [0.49, 0.29, 0.22]);
      [-1, 1].forEach(side => ball(head, cocoa, [side * 0.17, -0.22, 0.735], [0.048, 0.032, 0.019]));
      const bow = group(head, -0.46, 0.59, 0.3);
      ball(bow, red, [-0.14, 0, 0], [0.19, 0.13, 0.08]); ball(bow, red, [0.14, 0, 0], [0.19, 0.13, 0.08]);
      ball(bow, pink, [0, 0, 0.05], [0.08, 0.09, 0.07]);
    } else {
      [-1, 1].forEach(side => ball(head, cream, [side * 0.14, -0.23, 0.51], [0.24, 0.19, 0.15]));
      ball(head, id === 'bunny' ? pink : ink, [0, -0.13, 0.68], [0.105, 0.075, 0.07]);
    }
    const eyes = [-1, 1].map(side => {
      const eye = group(head, side * 0.3, 0.085, 0.55);
      if (id === 'cat') heart(eye, 0, 0, 0, 0.2);
      else {
        ball(eye, ink, [0, 0, 0], [0.092, 0.12, 0.052]);
        ball(eye, shine, [-0.025, 0.043, 0.045], [0.027, 0.033, 0.014]);
      }
      ball(head, blush, [side * 0.5, -0.19, 0.48], [0.14, 0.075, 0.035]);
      return eye;
    });
    const smileZ = id === 'cow' ? 0.78 : 0.67;
    curve(head, [[-0.13, -0.35, smileZ], [0, -0.41, smileZ + 0.03], [0.13, -0.35, smileZ]]);
    const tail = group(root, 0.45, -0.5, -0.19);
    if (id === 'bunny') ball(tail, white, [0.09, 0.02, 0], [0.23, 0.23, 0.23]);
    else curve(tail, [[0, 0, 0], [0.34, 0.1, 0], [0.46, 0.52, 0.02]], id === 'cow' ? cocoa : dark, 0.095);
    if (id === 'dog') {
      ball(root, blue, [0, 0.36, 0], [0.5, 0.11, 0.43]);
      ball(root, cream, [0, 0.32, 0.45], [0.075, 0.09, 0.026]);
    }
    if (id === 'cat') {
      [-1, 1].forEach(side => [0, 1].forEach(row => curve(head,
        [[side * 0.33, -0.23 - row * 0.07, 0.59], [side * 0.75, -0.19 - row * 0.12, 0.56]], cocoa, 0.012)));
      [0, 1, 2].forEach(i => ball(head, dark, [(i - 1) * 0.16, 0.5, 0.37], [0.045, 0.15, 0.033]));
    }
    if (id === 'bunny') ball(root, lilac, [0, 0.25, 0.43], [0.17, 0.11, 0.06]);
    const hearts = [heart(root, -1.05, 0.7, 0.1, 0.18), heart(root, 1.05, 1.13, 0, 0.13)];
    return { id, root, body, head, paws, ears, eyes, tail, hearts };
  });
  function animate(index, time, motion = true) {
    const pet = models[index], t = motion ? time : 0;
    pet.root.position.y = pet.id === 'bunny' ? Math.max(0, Math.sin(t * 3)) * 0.15 : Math.sin(t * 2) * 0.025;
    pet.head.rotation.z = Math.sin(t * 1.5) * (pet.id === 'cow' ? 0.08 : 0.045);
    pet.head.rotation.x = pet.id === 'cow' ? Math.sin(t * 2.6) * 0.07 : 0;
    pet.tail.rotation.y = Math.sin(t * 7) * 0.5;
    pet.paws[1].rotation.z = pet.id === 'dog' ? 0.9 + Math.sin(t * 5) * 0.25 : Math.sin(t * 2) * 0.08;
    pet.paws[0].rotation.z = pet.id === 'cat' ? -0.2 - Math.sin(t * 2) * 0.12 : 0;
    pet.ears.forEach((ear, i) => { ear.rotation.z = (i ? 1 : -1) * (pet.id === 'bunny' ? -0.13 : 0) + Math.sin(t * 3 + i) * 0.055; });
    const blink = motion && (t % 4.8) > 4.6 ? 0.12 : 1;
    pet.eyes.forEach(eye => { eye.scale.y = pet.id === 'cat' ? 1 + Math.sin(t * 3) * 0.08 : blink; });
    pet.hearts.forEach((heart, i) => { heart.position.y = 0.75 + i * 0.4 + Math.sin(t * 2 + i) * 0.1; heart.rotation.z = Math.sin(t + i) * 0.15; });
  }
  return { scene, camera, models, animate, dispose() {
    geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); texture.dispose();
  } };
}
