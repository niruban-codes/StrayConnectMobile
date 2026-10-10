import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { palette, frame, fonts } from '../design/theme';

export default function PassportStatus({ animal }) {
  const records = [
    ['Vaccines', animal.vaccinations?.length || 0, palette.mint],
    ['Medical', animal.medicalHistory?.length || 0, palette.pink],
  ];
  return <View style={styles.panel}>
    <Text style={styles.title}>CARE LOG / RECORDS</Text>
    {records.map(([label, count, color]) => <View key={label} style={styles.row}>
      <View style={styles.labels}><Text style={styles.label}>{label}</Text><Text style={styles.count}>{count} recorded</Text></View>
      <View accessible accessibilityLabel={`${label}: ${count} records. This is a record count, not a health assessment.`} style={styles.bar}>
        {Array.from({ length: 8 }, (_, i) => <View key={i} style={[styles.block, { backgroundColor: i < count ? color : palette.paper }]} />)}
      </View>
    </View>)}
    <Text style={styles.note}>Each block is one record (up to 8). Records do not indicate current health or vaccination coverage.</Text>
  </View>;
}
const styles = StyleSheet.create({
  panel: { ...frame, padding: 14, backgroundColor: palette.paper, marginBottom: 24 },
  title: { fontFamily: fonts.title, fontSize: 13, marginBottom: 14, color: palette.ink },
  row: { marginBottom: 12 }, labels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  label: { fontFamily: fonts.bold, fontSize: 12 }, count: { fontFamily: fonts.body, fontSize: 12 },
  bar: { flexDirection: 'row', gap: 4 }, block: { flex: 1, height: 17, borderWidth: 2, borderColor: palette.ink },
  note: { fontFamily: fonts.body, fontSize: 10, lineHeight: 16, color: '#454545' },
});
