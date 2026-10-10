import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import * as THREE from 'three';
import { COMPANIONS, createCompanionScene } from './companionScene';
import { configureDataTextureUnpack } from '../utils/expoTextureUnpack';

let GLView;
try { GLView = require('expo-gl').GLView; } catch { GLView = null; }

class SceneBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function CompanionAvatar({ selected = 0, size = 230 }) {
  const focused = useIsFocused();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const target = useRef(selected);
  const reduce = useRef(true);
  const active = useRef(false);
  const lifecycle = useRef(null);
  useEffect(() => {
    target.current = selected;
    if (active.current) lifecycle.current?.start();
  }, [selected]);
  useEffect(() => {
    let mounted = true;
    const update = value => {
      if (!mounted) return;
      reduce.current = value;
      if (active.current) lifecycle.current?.start();
    };
    AccessibilityInfo.isReduceMotionEnabled().then(update).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
    return () => { mounted = false; sub.remove(); };
  }, []);
  useEffect(() => {
    const update = state => {
      active.current = focused && state === 'active';
      if (active.current) lifecycle.current?.start(); else lifecycle.current?.stop();
    };
    update(AppState.currentState);
    const sub = AppState.addEventListener('change', update);
    return () => { sub.remove(); active.current = false; lifecycle.current?.stop(); };
  }, [focused]);
  useEffect(() => () => lifecycle.current?.dispose(), []);

  const onContextCreate = useCallback(gl => {
    lifecycle.current?.dispose();
    let renderer, world, request, restoreUnpack, disposed = false;
    const stop = () => { if (request != null) cancelAnimationFrame(request); request = null; };
    const dispose = () => {
      if (disposed) return;
      disposed = true; stop(); world?.dispose();
      try { renderer?.dispose(); } catch { /* The native context may already be released. */ }
      restoreUnpack?.();
    };
    try {
      if (Platform.OS !== 'web') restoreUnpack = configureDataTextureUnpack(gl);
      const canvas = { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight, style: {},
        addEventListener() {}, removeEventListener() {}, setAttribute() {}, getContext: () => gl };
      if (!gl.canvas) gl.canvas = canvas;
      renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      world = createCompanionScene();
      let current = target.current, phase = 'idle', phaseTime = 0, time = 0;
      let last = performance.now(), first = true;
      world.models[current].root.visible = true;
      const render = () => {
        request = null;
        if (disposed) return;
        try {
          const now = performance.now(), dt = Math.min((now - last) / 1000, 0.05); last = now;
          if (!reduce.current) time += dt;
          if (reduce.current) {
            world.models[current].root.visible = false;
            current = target.current; phase = 'idle';
            world.models[current].root.visible = true;
            world.models[current].root.scale.setScalar(1);
          } else {
            if (phase === 'idle' && current !== target.current) { phase = 'out'; phaseTime = 0; }
            phaseTime += dt;
            if (phase === 'out') {
              world.models[current].root.scale.setScalar(Math.max(0.02, 1 - phaseTime / 0.16));
              if (phaseTime >= 0.16) {
                world.models[current].root.visible = false;
                current = target.current; world.models[current].root.visible = true;
                phase = 'in'; phaseTime = 0;
              }
            }
            if (phase === 'in') {
              const p = Math.min(1, phaseTime / 0.38);
              const back = 1 + 2.4 * Math.pow(p - 1, 3) + 1.4 * Math.pow(p - 1, 2);
              world.models[current].root.scale.setScalar(Math.max(0.02, back));
              if (p === 1) phase = 'idle';
            }
          }
          world.animate(current, time, !reduce.current);
          renderer.render(world.scene, world.camera); gl.endFrameEXP();
          if (first) { first = false; setReady(true); }
          if (active.current && !reduce.current) request = requestAnimationFrame(render);
        } catch { dispose(); setFailed(true); }
      };
      lifecycle.current = { stop, dispose, start() { if (!disposed && request == null) { last = performance.now(); render(); } } };
      lifecycle.current.start();
    } catch { dispose(); setFailed(true); }
  }, []);
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
    {(!ready || failed) && <View style={styles.fallback}><Text style={styles.emoji}>{COMPANIONS[selected].emoji}</Text></View>}
    {GLView && !failed && <SceneBoundary onFailure={() => { lifecycle.current?.dispose(); setFailed(true); }}>
      <GLView msaaSamples={4} style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
    </SceneBoundary>}
  </View>;
}
const styles = StyleSheet.create({
  fallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 105 },
});
