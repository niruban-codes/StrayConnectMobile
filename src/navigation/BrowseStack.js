import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AnimalGalleryScreen from '../screens/AnimalGalleryScreen';
import AnimalDetailScreen from '../screens/AnimalDetailScreen';

const Stack = createStackNavigator();

export default function BrowseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AnimalGallery" component={AnimalGalleryScreen} />
      <Stack.Screen name="AnimalDetail" component={AnimalDetailScreen} />
    </Stack.Navigator>
  );
}