import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, Image, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { db } from '../../firebase'; 
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function AdoptionScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'animals'), orderBy('addedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const animalsData = [];
      querySnapshot.forEach((doc) => {
        animalsData.push({ ...doc.data(), id: doc.id });
      });
      setAnimals(animalsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching animals: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderAnimal = ({ item }) => (
    <TouchableOpacity 
      style={styles.animalItem} 
      onPress={() => navigation.navigate('AnimalDetails', { animal: item })}
    >
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
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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