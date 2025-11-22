import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, Button, Image, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

// Your Cloudinary keys
const CLOUDINARY_CLOUD_NAME = "dorhbk11x"; 
const CLOUDINARY_UPLOAD_PRESET = "ml_default"; 
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export default function ReportScreen() {
  const [species, setSpecies] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null); 
  const [isUploading, setIsUploading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri); 
    }
  };

  const handleSubmit = async () => {
    if (!species || !location || !image) {
      Alert.alert("Error", "Please fill in all fields and select an image.");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', {
        uri: image,
        type: 'image/jpeg',
        name: 'upload.jpg',
      });
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const cloudinaryResponse = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = cloudinaryResponse.data.secure_url;

      // 2. Save to Firestore
      await addDoc(collection(db, 'reports'), { 
        species: species,
        location: location,
        description: description,
        imageUrl: imageUrl,
        status: 'new',
        reportedAt: new Date(),
      });

      setIsUploading(false);
      Alert.alert("Success", "Report submitted successfully!");
      
      setSpecies('');
      setLocation('');
      setDescription('');
      setImage(null);

    } catch (error) {
      setIsUploading(false);
      console.error("Error submitting report: ", error);
      Alert.alert("Error", "There was a problem submitting your report.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Report an Animal</Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>Species (e.g., Dog, Cat)</Text>
          <TextInput
            style={styles.input}
            value={species}
            onChangeText={setSpecies}
          />

          <Text style={styles.label}>Location Found</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
          />

          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <Button title="Pick an image from gallery" onPress={pickImage} />
          
          {image && (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          )}

          <Button 
            title={isUploading ? "Submitting..." : "Submit Report"} 
            onPress={handleSubmit} 
            disabled={isUploading} 
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  form: {
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginVertical: 15,
    alignSelf: 'center',
  },
});