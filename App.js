import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image, SafeAreaView, ActivityIndicator } from 'react-native';
import { db } from './firebase'; // Import your database config
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState([]); // State to hold the animal list

  // This useEffect runs once to fetch the data
  useEffect(() => {
    // Create a query to get animals, ordered by when they were added
    const q = query(collection(db, 'animals'), orderBy('addedAt', 'desc'));

    // onSnapshot is a real-time listener
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const animalsData = [];
      querySnapshot.forEach((doc) => {
        // Get the data and add the document ID
        animalsData.push({ ...doc.data(), id: doc.id });
      });
      setAnimals(animalsData); // Update our state
      setLoading(false);
    }, (error) => {
      console.error("Error fetching animals: ", error);
      setLoading(false);
    });

    // Cleanup: stop listening when the component unmounts
    return () => unsubscribe();
  }, []); // The empty [] means this runs only once

  // A simple component to render each animal
  const renderAnimal = ({ item }) => (
    <View style={styles.animalItem}>
      {item.imageUrl && (
        <Image 
          source={{ uri: item.imageUrl }} 
          style={styles.animalImage} 
        />
      )}
      <View style={styles.animalInfo}>
        <Text style={styles.animalName}>{item.name}</Text>
        <Text>{item.species} - Status: {item.status}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Animals for Adoption</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={animals}
          renderItem={renderAnimal}
          keyExtractor={(item) => item.id}
        />
      )}
    </SafeAreaView>
  );
}

// This is the CSS for React Native
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50, // Add margin for the top status bar
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  animalItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    alignItems: 'center',
  },
  animalImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  animalInfo: {
    flex: 1,
  },
  animalName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});