// src/screens/AdoptionScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, Text, View, FlatList, Image, ActivityIndicator, 
  TouchableOpacity, StatusBar, Animated 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../../firebase'; 
import { collection, onSnapshot, query, where } from 'firebase/firestore';

// 🎨 "MONITO" COLOR PALETTE
const COLORS = {
  primary: '#003459',       // Dark Blue
  secondary: '#F7DBA7',     // Mon Yellow
  background: '#F7DBA7',    // Match to Mon Yellow for the safe area
  surface: '#FFFFFF',       // Pure White
  border: '#EBEEEF',        // Neutral 10
  textDark: '#00171F',      // Neutral 100
  textMuted: '#667479',     // Neutral 60
  
  pinkRed: '#FF564F',
  greenLight: '#34C759',
  orangeShine: '#FF912C',
  blueSea: '#00A7E7',
};

const statusStyle = (status) => {
  switch (status) {
    case 'adopted':   return { bg: '#E8F5E9', text: COLORS.greenLight, label: 'Adopted' };
    case 'sheltered': return { bg: '#E1F5FE', text: COLORS.blueSea, label: 'Sheltered' };
    case 'lost':      return { bg: '#FFEBEE', text: COLORS.pinkRed, label: 'Missing SOS' };
    default:          return { bg: '#FFF3E0', text: COLORS.orangeShine, label: 'Stray' };
  }
};

export default function AdoptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState([]);

  // 🚀 ANIMATION VALUES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Trigger Entrance Animation
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true })
    ]).start();

    const q = query(
      collection(db, 'animals'), 
      where('status', 'in', ['stray', 'sheltered'])
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const animalsData = [];
      querySnapshot.forEach((doc) => {
        animalsData.push({ ...doc.data(), id: doc.id });
      });
      setAnimals(animalsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const renderAnimal = ({ item }) => {
    const sc = statusStyle(item.status);
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('AnimalDetails', { animal: item })}
      >
        <View style={styles.imageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.animalImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="paw" size={32} color={COLORS.border} />
            </View>
          )}
        </View>

        <View style={styles.animalInfo}>
          <Text style={styles.animalName} numberOfLines={1}>{item.name || 'Unnamed Pet'}</Text>
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="tag-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.animalSpecies}>{item.species}</Text>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
          </View>
        </View>

        <View style={styles.actionArrow}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    // 🚀 INJECT INSETS HERE TO FIX THE WHITE BAR GLITCH
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* 🚀 CUSTOM TOPOGRAPHIC BACKGROUND */}
      <Image 
        source={require('../../assets/images/app-bg.png')} 
        style={styles.bgPattern} 
      />
      
      {/* 🌟 PREMIUM HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adoptions</Text>
        <View style={{ width: 40 }} /> {/* Spacer for centering */}
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>Meet Our Pets</Text>
          <Text style={styles.pageSubtitle}>Ready for a forever home. <Text style={{color: COLORS.orangeShine}}>✦</Text></Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : animals.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="paw-outline" size={48} color={COLORS.border} />
            <Text style={styles.emptyTitle}>No pets available right now</Text>
            <Text style={styles.emptySubtitle}>Check back later for new friends to adopt.</Text>
          </View>
        ) : (
          <FlatList
            data={animals}
            renderItem={renderAnimal}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Applies yellow to the safe area!
  },
  
  // 🚀 Background Pattern
  bgPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.15,
    resizeMode: 'cover',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.6)', // Slight transparency for the textured bg
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontFamily: 'Poppins_900Black', // 🚀 Font Update
    fontSize: 18,
    color: COLORS.primary,
    letterSpacing: -0.5,
  },

  // Page Titles
  pageTitleContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  pageTitle: {
    fontFamily: 'Poppins_900Black', // 🚀 Font Update
    fontSize: 32,
    color: COLORS.primary,
    letterSpacing: -1,
  },
  pageSubtitle: {
    fontFamily: 'Urbanist_600SemiBold', // 🚀 Font Update
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // List content
  listContent: {
    paddingHorizontal: 20,
    gap: 16,
  },

  // Monito Style Row Card
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
  },
  animalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Card Text
  animalInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  animalName: {
    fontFamily: 'Urbanist_800ExtraBold', // 🚀 Font Update
    fontSize: 17,
    color: COLORS.primary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  animalSpecies: {
    fontFamily: 'Urbanist_600SemiBold', // 🚀 Font Update
    fontSize: 13,
    color: COLORS.textMuted,
    textTransform: 'capitalize',
  },
  
  // Badges
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontFamily: 'Urbanist_800ExtraBold', // 🚀 Font Update
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  actionArrow: {
    padding: 8,
  },

  // States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.4)', // Slightly transparent to show bg texture
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  emptyTitle: {
    fontFamily: 'Poppins_900Black', // 🚀 Font Update
    fontSize: 18,
    color: COLORS.primary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: 'Urbanist_600SemiBold', // 🚀 Font Update
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
});