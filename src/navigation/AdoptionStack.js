import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import AdoptionScreen from '../screens/AdoptionScreen';
import AnimalDetailScreen from '../screens/AnimalDetailScreen';

const Stack = createStackNavigator();

export default function AdoptionStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AdoptionList" 
        component={AdoptionScreen} 
        options={{ title: 'Animals for Adoption' }} 
      />
      <Stack.Screen 
        name="AnimalDetails" 
        component={AnimalDetailScreen}
        options={({ route }) => ({ title: route.params.animal.name })} 
      />
    </Stack.Navigator>
  );
}