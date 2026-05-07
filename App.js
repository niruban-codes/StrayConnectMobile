// App.js
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';

// IMPORT DB AND EXPO TOOLS HERE
import { auth, db } from './firebase'; 
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { doc, setDoc } from 'firebase/firestore';

import HomeScreen from './src/screens/HomeScreen';
import NotificationsScreen from './src/screens/NotificationsScreen'; 
import BrowseStack from './src/navigation/BrowseStack';
import ReportScreen from './src/screens/ReportScreen';
import ProfileStack from './src/navigation/ProfileStack';

import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

// CONFIGURE NOTIFICATIONS HOW TO BEHAVE (Moved to the top!)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Tab = createBottomTabNavigator();
const AuthStack = createStackNavigator();
const HomeStackNav = createStackNavigator(); 

const PRIMARY = '#154212';
const INACTIVE = '#94a3b8';
const TAB_BG = '#ffffff';

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStackNav.Navigator>
  );
}

export default function App() {
  // 1. ALL USESTATE HOOKS
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 2. FIRST USEEFFECT HOOK: Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  // 3. SECOND USEEFFECT HOOK: Push Notifications
  // Notice this is ABOVE the if(isLoading) check!
  useEffect(() => {
    async function registerForPushNotificationsAsync() {
      if (!user) return; 

      try {
        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          
          if (finalStatus !== 'granted') {
            console.log('Permission not granted for Push Notifications');
            return;
          }

          // Safe wrapper to prevent Expo Go from crashing in SDK 53
          try {
            const tokenData = await Notifications.getExpoPushTokenAsync({
              projectId: "YOUR_EXPO_PROJECT_ID_HERE" // <-- Replace later!
            });
            
            await setDoc(doc(db, 'users', user.uid), {
              expoPushToken: tokenData.data,
              email: user.email
            }, { merge: true });
            
          } catch (expoError) {
            console.log("Expo Go Limitation (Safe to ignore in dev): ", expoError.message);
          }

        } else {
          console.log('Must use physical device for Push Notifications');
        }
      } catch (error) {
        console.log("Notification setup error:", error);
      }
    }

    registerForPushNotificationsAsync();
  }, [user]);

  // 4. EARLY RETURN (Must always be after all hooks!)
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faf9f6' }}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    );
  }

  // 5. MAIN RENDER
  return (
    <NavigationContainer>
      {user ? (
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
                Home:    focused ? 'home'              : 'home-outline',
                Browse:  focused ? 'paw'               : 'paw-outline',
                Report:  focused ? 'alert-circle'      : 'alert-circle-outline',
                Profile: focused ? 'account-circle'    : 'account-circle-outline',
              };
              return <MaterialCommunityIcons name={icons[route.name]} size={24} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home"    component={HomeStack} />
          <Tab.Screen name="Browse"  component={BrowseStack} />
          <Tab.Screen name="Report"  component={ReportScreen} />
          <Tab.Screen name="Profile" component={ProfileStack} />
        </Tab.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Signup" component={SignupScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}