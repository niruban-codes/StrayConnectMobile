// App.js
import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'; 

// FONT & SPLASH SCREEN IMPORTS
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { 
  Poppins_400Regular, 
  Poppins_700Bold, 
  Poppins_900Black 
} from '@expo-google-fonts/poppins';
import { 
  Urbanist_400Regular, 
  Urbanist_500Medium,
  Urbanist_600SemiBold, 
  Urbanist_800ExtraBold 
} from '@expo-google-fonts/urbanist';

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
import ProposeEventScreen from './src/screens/ProposeEventScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import LocalAlertsScreen from './src/screens/LocalAlertsScreen';
import AlertDetailScreen from './src/screens/AlertDetailScreen';

import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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
const SOSStackNav = createStackNavigator();

const COLORS = {
  primary: '#003459',       
  background: '#F7DBA7',    
  surface: '#FFFFFF',       
  inactive: '#667479',      
};

function HomeStack() {
  return (
    <HomeStackNav.Navigator screenOptions={{ headerShown: false }}>
      <HomeStackNav.Screen name="HomeMain" component={HomeScreen} />
      <HomeStackNav.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStackNav.Screen name="ProposeEvent" component={ProposeEventScreen} />
      <HomeStackNav.Screen name="EventDetail" component={EventDetailScreen} />
    </HomeStackNav.Navigator>
  );
}

function SOSStack() {
  return (
    <SOSStackNav.Navigator screenOptions={{ headerShown: false }}>
      <SOSStackNav.Screen name="LocalAlerts" component={LocalAlertsScreen} />
      <SOSStackNav.Screen name="AlertDetail" component={AlertDetailScreen} />
    </SOSStackNav.Navigator>
  );
}

function RootNavigator({ user }) {
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer>
      {user ? (
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarShowLabel: true,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.inactive,
            tabBarStyle: {
              backgroundColor: COLORS.surface,
              borderTopWidth: 0,
              elevation: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -6 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              height: 65 + insets.bottom, 
              paddingBottom: insets.bottom || 10, 
              paddingTop: 12,
            },
            tabBarLabelStyle: { 
              fontSize: 11, 
              marginTop: 4, 
              letterSpacing: -0.2,
              fontFamily: 'Urbanist_800ExtraBold' // 🚀 Using Urbanist for tabs!
            },
            tabBarIcon: ({ focused, color }) => {
              const icons = {
                Home:      focused ? 'home'              : 'home-outline',
                Browse:    focused ? 'paw'               : 'paw-outline',
                Report:    focused ? 'plus-circle'       : 'plus-circle-outline',
                'SOS Feed': focused ? 'radar'            : 'radar',
                Profile:   focused ? 'account-circle'    : 'account-circle-outline',
              };
              return <MaterialCommunityIcons name={icons[route.name]} size={28} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home"    component={HomeStack} />
          <Tab.Screen name="Browse"  component={BrowseStack} />
          <Tab.Screen name="Report"  component={ReportScreen} />
          <Tab.Screen name="SOS Feed" component={SOSStack} options={{ unmountOnBlur: true }} />
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

export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // 🚀 Load the Fonts
  let [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_700Bold,
    Poppins_900Black,
    Urbanist_400Regular,
    Urbanist_500Medium,
    Urbanist_600SemiBold,
    Urbanist_800ExtraBold,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

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
          if (finalStatus !== 'granted') return;

          try {
            const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: "YOUR_EXPO_PROJECT_ID_HERE" });
            await setDoc(doc(db, 'users', user.uid), { expoPushToken: tokenData.data, email: user.email }, { merge: true });
          } catch (expoError) {
            console.log("Expo Go Limitation: ", expoError.message);
          }
        }
      } catch (error) {
        console.log("Notification setup error:", error);
      }
    }
    registerForPushNotificationsAsync();
  }, [user]);

  // 🚀 Callback to hide splash screen once everything is loaded
  const onLayoutRootView = useCallback(async () => {
    if (!isAuthLoading && (fontsLoaded || fontError)) {
      await SplashScreen.hideAsync();
    }
  }, [isAuthLoading, fontsLoaded, fontError]);

  // Prevent rendering anything until Auth and Fonts are resolved
  if (isAuthLoading || (!fontsLoaded && !fontError)) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <RootNavigator user={user} />
      </View>
    </SafeAreaProvider>
  );
}