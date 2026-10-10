import React from 'react';
import { View } from 'react-native';
import { palette } from '../design/theme';

const rows = ['01100110', '01100110', '00000000', '11011011', '11011011', '00111100', '01111110', '00111100'];
export default function PixelPaw({ size = 24, color = palette.ink }) {
  const unit = size / 8;
  return <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size }}>
    {rows.flatMap((row, y) => [...row].map((cell, x) => cell === '1' ?
      <View key={`${x}-${y}`} style={{ position: 'absolute', left: x * unit, top: y * unit, width: unit, height: unit, backgroundColor: color }} /> : null))}
  </View>;
}
