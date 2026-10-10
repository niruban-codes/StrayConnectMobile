import React from 'react';
import { View, Text } from 'react-native';
import { palette } from '../design/theme';

export const USER_AVATARS = [
  { id: 'initial', label: 'Initial', bg: palette.ink },
  { id: 'dog', label: 'Dog', bg: palette.yellow, fur: '#CA8C50', accent: '#78482E' },
  { id: 'cat', label: 'Cat', bg: palette.pink, fur: '#8D8BAD', accent: '#D6D3EA' },
  { id: 'bunny', label: 'Bunny', bg: palette.blue, fur: '#FFFDF4', accent: '#FF82BF' },
  { id: 'cow', label: 'Cow', bg: palette.mint, fur: '#FFFDF4', accent: '#594136' },
  { id: 'fox', label: 'Fox', bg: palette.purple, fur: '#EE8034', accent: '#FFFDF4' },
];
const faces = {
  dog: ['            ','  KK    KK  ',' KAAK  KAAK ',' KAFKKKKFAK ',' KFFFFFFFFK ',' KAFFFFFFAK ',' KAFKFFKFAK ','  KFFNNFFK  ','  KFFWWFFK  ','   KFKKFK   ','    KKKK    ','            '],
  cat: ['            ',' KK      KK ',' KFK    KFK ',' KFFKKKKFFK ',' KFFFFFFFFK ',' KFFFFFFFFK ',' KFKFFFFKFK ',' KFFANNAFFK ','  KFFWWFFK  ','   KFFFFK   ','    KKKK    ','            '],
  bunny: ['  KK    KK  ',' KFAK  KAFK ',' KFAK  KAFK ',' KFFK  KFFK ','  KFKKKKFK  ',' KFFFFFFFFK ',' KFKFFFFKFK ',' KFFFFFFFFK ','  KFANNAFK   ','  KFFWWFFK  ','   KFFFFK   ','    KKKK    '],
  cow: ['            ','  KK    KK  ',' KFFK  KFFK ','KAAAKKKKAAAK',' KAAAFFFFFK ',' KAAFFFFFFK ',' KFKFFFFKFK ',' KFFFFFFFFK ','  KPPPPPPK  ','  KPNPPNPK  ','   KPPPPK   ','    KKKK    '],
  fox: [' KK      KK ',' KFK    KFK ',' KFFK  KFFK ',' KFFFKKFFFK ',' KFFFFFFFFK ',' KFFFFFFFFK ',' KAKFFFFKAK ',' KAAANNAAAK ','  KAAAAAAK  ','   KAAAAK   ','    KKKK    ','            '],
};
export default function UserAvatar({ avatarId = 'initial', name = '', size = 88 }) {
  const avatar = USER_AVATARS.find(item => item.id === avatarId) || USER_AVATARS[0];
  const colors = { K: palette.ink, F: avatar.fur, A: avatar.accent, N: palette.ink, W: palette.paper, P: palette.pink };
  const unit = size / 14;
  return <View accessible accessibilityLabel={`${avatar.label} avatar`} style={{ width: size, height: size, backgroundColor: avatar.bg, alignItems: 'center', justifyContent: 'center' }}>
    {avatar.id === 'initial' ? <Text style={{ color: palette.paper, fontFamily: 'Silkscreen_700Bold', fontSize: size * 0.4 }}>{name.trim().charAt(0).toUpperCase() || 'U'}</Text> :
      <View style={{ width: 12 * unit, height: 12 * unit }}>{faces[avatar.id].flatMap((row, y) => [...row].map((pixel, x) => colors[pixel] ?
        <View key={`${x}-${y}`} style={{ position: 'absolute', left: x * unit, top: y * unit, width: unit, height: unit, backgroundColor: colors[pixel] }} /> : null))}</View>}
  </View>;
}
