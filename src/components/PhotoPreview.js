import React, { useState } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Thumbnails stay compact; the viewer always fits the complete original image.
export default function PhotoPreview({ uri, photos = [uri], initialIndex = 0, style }) {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(initialIndex);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const insets = useSafeAreaInsets();
  const items = photos.filter(Boolean);
  const change = next => { setLoading(true); setFailed(false); setIndex(next); };
  return <>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open full photo" style={style}
      onPress={() => { change(Math.min(initialIndex, items.length - 1)); setVisible(true); }}>
      <Image source={{ uri }} style={StyleSheet.absoluteFillObject} resizeMode="contain" />
      <View pointerEvents="none" style={{ position: 'absolute', right: 4, bottom: 4, backgroundColor: '#111', paddingHorizontal: 5, paddingVertical: 2 }}><Text style={{ color: '#fff', fontSize: 11 }}>⤢</Text></View>
    </TouchableOpacity>
    <Modal visible={visible} animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={[styles.viewer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.bar}><Text style={styles.text}>PHOTO {index + 1} / {items.length}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => setVisible(false)} style={styles.button}><Text style={styles.text}>Close ✕</Text></TouchableOpacity></View>
        <View style={{ flex: 1 }}>
          <Image key={items[index]} source={{ uri: items[index] }} style={StyleSheet.absoluteFillObject} resizeMode="contain"
            onLoadEnd={() => setLoading(false)} onError={() => { setFailed(true); setLoading(false); }} />
          {loading && <ActivityIndicator style={StyleSheet.absoluteFillObject} color="#fff" />}
          {failed && <Text style={styles.error}>Could not load this photo. Close and reopen to retry.</Text>}
        </View>
        {items.length > 1 && <View style={styles.bar}>
          <TouchableOpacity accessibilityRole="button" disabled={index === 0} style={[styles.button, index === 0 && styles.disabled]} onPress={() => change(index - 1)}><Text style={styles.text}>← Previous</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" disabled={index === items.length - 1} style={[styles.button, index === items.length - 1 && styles.disabled]} onPress={() => change(index + 1)}><Text style={styles.text}>Next →</Text></TouchableOpacity>
        </View>}
      </View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  viewer: { flex: 1, backgroundColor: '#111' },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  button: { padding: 12, borderWidth: 2, borderColor: '#fff' },
  text: { color: '#fff', fontFamily: 'Poppins_700Bold' },
  error: { color: '#fff', padding: 24, textAlign: 'center' },
  disabled: { opacity: 0.35 },
});
