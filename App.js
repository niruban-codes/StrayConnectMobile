import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import BrowseStack from './src/navigation/BrowseStack';
import ReportScreen from './src/screens/ReportScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const PRIMARY = '#154212';
const INACTIVE = '#94a3b8';
const TAB_BG = '#ffffff';

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: PRIMARY,
          tabBarInactiveTintColor: INACTIVE,
          tabBarStyle: {
            backgroundColor: TAB_BG,
            borderTopWidth: 0,
            elevation: 20,
            shadowColor: '#154212',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            height: 64,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarIcon: ({ focused, color }) => {
            const icons = {
              Home:    focused ? 'home'              : 'home-outline',
              Browse:  focused ? 'paw'               : 'paw-outline',
              Report:  focused ? 'alert-circle'      : 'alert-circle-outline',
              Profile: focused ? 'account-circle'    : 'account-circle-outline',
            };
            return (
              <MaterialCommunityIcons
                name={icons[route.name]}
                size={24}
                color={color}
              />
            );
          },
        })}
      >
        <Tab.Screen name="Home"    component={HomeScreen} />
        <Tab.Screen name="Browse"  component={BrowseStack} />
        <Tab.Screen name="Report"  component={ReportScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}