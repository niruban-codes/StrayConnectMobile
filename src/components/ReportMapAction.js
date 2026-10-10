import React from 'react';
import { Alert, Linking, Text, TouchableOpacity } from 'react-native';
import { validCoordinate } from '../utils/sighting';
import { palette } from '../design/theme';

export default function ReportMapAction({ report }) {
  const pinned = validCoordinate(report);
  if (!pinned && !report.location?.trim()) return null;
  const open = async () => {
    const query = pinned ? `${report.latitude},${report.longitude}` : report.location;
    try { await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`); }
    catch { Alert.alert('Map unavailable', 'Please try again when a maps app or browser is available.'); }
  };
  return <TouchableOpacity accessibilityRole="button" onPress={open}
    style={{ padding: 12, borderWidth: 3, borderColor: palette.ink, backgroundColor: palette.mint, marginVertical: 10 }}>
    <Text style={{ fontFamily: 'Poppins_700Bold', color: palette.ink }}>{pinned ? 'Open SOS pin on map ↗' : 'Search location on map ↗'}</Text>
  </TouchableOpacity>;
}
