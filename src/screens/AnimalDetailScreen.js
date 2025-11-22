import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native';

export default function AnimalDetailScreen({ route }) {
  const { animal } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      {animal.imageUrl && (
        <Image source={{ uri: animal.imageUrl }} style={styles.image} />
      )}
      <Text style={styles.title}>{animal.name}</Text>
      <Text style={styles.details}>{animal.species} - Status: {animal.status}</Text>
      
      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>Contact Info:</Text>
        <Text>Shelter Name (coming soon)</Text>
        <Text>Shelter Phone (coming soon)</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 300,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
  },
  details: {
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  contactSection: {
    padding: 20,
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  }
});