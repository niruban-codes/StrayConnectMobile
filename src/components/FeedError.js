import React from 'react';
import { View, Text } from 'react-native';
import { palette, fonts } from '../design/theme';
import ArcadeButton from './ArcadeButton';
export default function FeedError({ message, onRetry }) {
  return <View style={{ flex: 1, justifyContent: 'center', padding: 28, gap: 18, backgroundColor: palette.yellow }}>
    <Text style={{ fontFamily: fonts.title, fontSize: 24 }}>CONNECTION PAUSED</Text>
    <Text accessibilityRole="alert" style={{ color: palette.ink, fontFamily: fonts.body, fontSize: 14 }}>{message}</Text>
    <ArcadeButton color={palette.mint} onPress={onRetry}>TRY AGAIN</ArcadeButton>
  </View>;
}
