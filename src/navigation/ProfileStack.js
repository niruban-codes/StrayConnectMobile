// src/navigation/ProfileStack.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/ProfileScreen';
import RegisterPetScreen from '../screens/RegisterPetScreen'; // Import our new screen!

const Stack = createStackNavigator();

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* The main profile page */}
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      {/* The new registration form */}
      <Stack.Screen name="RegisterPet" component={RegisterPetScreen} />
    </Stack.Navigator>
  );
}