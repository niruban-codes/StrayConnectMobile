import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons'; 

// IMPORTANT: Import the STACK, not the Screen
import AdoptionStack from './src/navigation/AdoptionStack'; 
import ReportScreen from './src/screens/ReportScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Adopt') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Report') {
              iconName = focused ? 'alert-circle' : 'alert-circle-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
          headerShown: false, 
        })}
      >
        {/* IMPORTANT: The component here MUST be AdoptionStack */}
        <Tab.Screen name="Adopt" component={AdoptionStack} />
        <Tab.Screen name="Report" component={ReportScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}