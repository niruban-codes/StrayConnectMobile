import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
export default function FeedError({ message, onRetry }) {
  return <View style={{ flex: 1, justifyContent: 'center', padding: 28, gap: 18, backgroundColor: '#F7DBA7' }}>
    <Text accessibilityRole="alert" style={{ color: '#003459', fontSize: 16 }}>{message}</Text>
    <TouchableOpacity accessibilityRole="button" onPress={onRetry} style={{ padding: 16, borderRadius: 16, backgroundColor: '#003459' }}>
      <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '700' }}>Retry</Text>
    </TouchableOpacity>
  </View>;
}
