import React from 'react';
import { View } from 'react-native';

// An original code-native sprite: also the accessible fallback for the 3D mascot.
const pixels = [
  '            KK      ', '           KTTK     ', '          KTTTK     ',
  '         KTTTTKKKK  ', '         KTTTKTTTTK ', ' K       KTTTKWKT TK',
  'KTK      KTTTTTTTTKK', 'KTTKKKKKKKTTTTTTKKKK', ' KTTTTTTTTTTTTTTTK  ',
  '  KTTTTTTTTTTTBBK   ', '  KTTTTTTTTTTTTK    ', '  KTTTTTTTTTTTTK    ',
  '  KTTTKKKKKTTTTK    ', '  KTTK    KTTTK     ', '  KTTK    KTTK      ',
  '  KKKKK   KKKKK     ',
];
const colors = { K: '#111111', T: '#C99156', W: '#FFFDF4', B: '#2455FF' };
export default function PixelPet({ size = 160 }) {
  const unit = Math.floor(size / 20);
  return <View accessible accessibilityLabel="Pixel dog mascot" style={{ width: 20 * unit, height: 16 * unit }}>
    {pixels.flatMap((row, y) => [...row].map((pixel, x) => colors[pixel] ?
      <View key={`${x}-${y}`} style={{ position: 'absolute', left: x * unit, top: y * unit, width: unit, height: unit, backgroundColor: colors[pixel] }} /> : null))}
  </View>;
}
