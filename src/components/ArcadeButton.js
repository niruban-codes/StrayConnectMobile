import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { palette, frame, hardShadow, fonts } from '../design/theme';

export default function ArcadeButton({ children, onPress, color = palette.yellow, style, disabled, accessibilityLabel }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel}
    accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, { backgroundColor: color }, style,
      disabled && { opacity: 0.5 }, pressed && styles.pressed]}>
    <Text style={styles.label}>{children}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { ...frame, ...hardShadow, minHeight: 56, paddingHorizontal: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  pressed: { transform: [{ translateX: 4 }, { translateY: 4 }], boxShadow: '0px 0px 0px 0px #111111' },
  label: { fontFamily: fonts.title, fontSize: 15, color: palette.ink, textAlign: 'center' },
});
