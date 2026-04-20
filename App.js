// App.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import HomeScreen from './src/screens/HomeScreen';
import BrowseStack from './src/navigation/BrowseStack';
import ReportScreen from './src/screens/ReportScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Auth Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

const Tab = createBottomTabNavigator();
const AuthStack = createStackNavigator();

const PRIMARY = '#154212';
const INACTIVE = '#94a3b8';
const TAB_BG = '#ffffff';

export default function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for Firebase Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faf9f6' }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? (
        // User is Logged In -> Show Main App
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
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
            tabBarIcon: ({ focused, color }) => {
              const icons = {
                Home:    focused ? 'home'               : 'home-outline',
                Browse:  focused ? 'paw'                : 'paw-outline',
                Report:  focused ? 'alert-circle'       : 'alert-circle-outline',
                Profile: focused ? 'account-circle'     : 'account-circle-outline',
              };
              return <MaterialCommunityIcons name={icons[route.name]} size={24} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home"    component={HomeScreen} />
          <Tab.Screen name="Browse"  component={BrowseStack} />
          <Tab.Screen name="Report"  component={ReportScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      ) : (
        // User is Not Logged In -> Show Auth Flow
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}