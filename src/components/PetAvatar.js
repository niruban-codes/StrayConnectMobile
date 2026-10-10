import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { useIsFocused } from '@react-navigation/native';
import PixelPet from './PixelPet';

// Older development clients do not contain Expo GL yet. Keep the app usable.
let GLView;
try { GLView = require('expo-gl').GLView; } catch { GLView = null; }

class AvatarBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

// No downloaded models, lighting gradients, or textures: a flat-shaded voxel dog.
export default function PetAvatar({ size = 210 }) {
  const focused = useIsFocused();
  const [reducedMotion, setReducedMotion] = useState(true);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const active = useRef(false);
  const lifecycle = useRef(null);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReducedMotion(value); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { mounted = false; sub.remove(); };
  }, []);
  useEffect(() => {
    const update = state => {
      active.current = focused && state === 'active';
      if (active.current) lifecycle.current?.start();
      else lifecycle.current?.stop();
    };
    update(AppState.currentState);
    const sub = AppState.addEventListener('change', update);
    return () => { sub.remove(); active.current = false; lifecycle.current?.stop(); };
  }, [focused]);
  useEffect(() => () => lifecycle.current?.dispose(), []);
  useEffect(() => {
    if (reducedMotion) { lifecycle.current?.dispose(); lifecycle.current = null; setReady(false); }
  }, [reducedMotion]);

  const onContextCreate = useCallback(gl => {
    lifecycle.current?.dispose();
    let renderer;
    let frameId;
    let disposed = false;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = ['#C99156', '#89552E', '#111111', '#FFFDF4', '#2455FF'].map(color => new THREE.MeshBasicMaterial({ color }));
    const stop = () => { if (frameId != null) cancelAnimationFrame(frameId); frameId = null; };
    const dispose = () => {
      if (disposed) return;
      disposed = true; stop(); geometry.dispose(); materials.forEach(material => material.dispose());
      // GL can already have been released by the native view during unmount.
      try { renderer?.dispose(); } catch { /* Native context is already gone. */ }
    };
    try {
      const canvas = { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight, style: {},
        addEventListener() {}, removeEventListener() {}, setAttribute() {}, getContext: () => gl };
      if (!gl.canvas) gl.canvas = canvas;
      renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: false });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
      renderer.setClearColor(0x000000, 0);
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-2.5, 2.5, 2.5, -2.5, 0.1, 100);
      camera.position.set(5, 3, 7); camera.lookAt(0, 0.4, 0);
      const dog = new THREE.Group(); scene.add(dog);
      const box = (x, y, z, w, h, d, color, parent = dog) => {
        const mesh = new THREE.Mesh(geometry, materials[color]);
        mesh.position.set(x, y, z); mesh.scale.set(w, h, d); parent.add(mesh); return mesh;
      };
      box(0, 0.35, 0, 1.7, 0.9, 0.8, 0);
      box(0, 0.84, 0, 1.65, 0.12, 0.82, 1);
      [-0.58, 0.58].forEach(x => [-0.27, 0.27].forEach(z => {
        box(x, -0.35, z, 0.32, 0.7, 0.3, 0); box(x + 0.06, -0.7, z, 0.44, 0.14, 0.34, 2);
      }));
      box(0.85, 1.02, 0, 0.85, 1, 0.9, 0);
      box(1.37, 0.86, 0, 0.45, 0.4, 0.65, 0);
      box(1.63, 0.95, 0, 0.14, 0.23, 0.55, 2);
      [-0.47, 0.47].forEach(z => {
        box(0.65, 1.43, z, 0.3, 0.65, 0.2, 1);
        box(1.04, 1.23, z, 0.21, 0.23, 0.04, 3);
        box(1.09, 1.22, z * 1.06, 0.11, 0.16, 0.04, 2);
      });
      box(0.64, 0.68, 0, 0.22, 0.2, 1, 4);
      const tail = new THREE.Group(); tail.position.set(-0.85, 0.6, 0); dog.add(tail);
      box(-0.25, 0.2, 0, 0.65, 0.22, 0.24, 0, tail);
      box(-0.55, 0.45, 0, 0.22, 0.45, 0.24, 1, tail);
      let elapsed = 0;
      let firstFrame = true;
      let lastTime = performance.now();
      const render = () => {
        frameId = null;
        if (disposed) return;
        try {
          const now = performance.now();
          elapsed += Math.min((now - lastTime) / 1000, 0.05) * 2.1;
          lastTime = now;
          dog.position.y = Math.sin(elapsed) * 0.045;
          dog.rotation.y = Math.sin(elapsed * 0.35) * 0.16;
          tail.rotation.x = Math.sin(elapsed * 3) * 0.4;
          renderer.render(scene, camera); gl.endFrameEXP();
          if (firstFrame) { firstFrame = false; setReady(true); }
          if (active.current) frameId = requestAnimationFrame(render);
        } catch { dispose(); setFailed(true); }
      };
      lifecycle.current = { stop, dispose, start: () => { if (!disposed && frameId == null) render(); } };
      lifecycle.current.start();
    } catch { dispose(); setFailed(true); }
  }, []);

  return <View accessible accessibilityLabel="Blocky 3D rescue dog mascot" style={{ width: size, height: size }}>
    {(!ready || failed || reducedMotion) && <View style={styles.fallback}><PixelPet size={size * 0.8} /></View>}
    {GLView && !reducedMotion && !failed && <AvatarBoundary onFailure={() => { lifecycle.current?.dispose(); setFailed(true); }}><GLView msaaSamples={0} style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} /></AvatarBoundary>}
  </View>;
}
const styles = StyleSheet.create({ fallback: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' } });
