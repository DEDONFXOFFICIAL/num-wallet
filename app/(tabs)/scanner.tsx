import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, Vibration, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function ScannerScreen() {
  const { isDarkMode } = useUserStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous scanner laser line animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 210,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleSimulateScan = () => {
    Vibration.vibrate(100);
    Alert.alert(
      'Scan Successful!',
      'Scanned Address: +234 803 360 0717 (Lawrence Obi)',
      [
        {
          text: 'Send Funds',
          onPress: () => {
            router.push({
              pathname: '/(tabs)/send',
              params: { recipient: '+234 803 360 0717' }
            });
          },
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    Vibration.vibrate(100);

    Alert.alert(
      'Scan Successful!',
      `Scanned Address:\n${data}`,
      [
        {
          text: 'Send Funds',
          onPress: () => {
            setScanned(false);
            router.push({
              pathname: '/(tabs)/send',
              params: { recipient: data }
            });
          },
        },
        {
          text: 'Scan Again',
          style: 'cancel',
          onPress: () => setScanned(false)
        }
      ]
    );
  };

  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];
  const headerStyle = isDarkMode ? styles.header : [styles.header, styles.headerLight];
  const backBtnStyle = isDarkMode ? styles.backBtn : [styles.backBtn, styles.backBtnLight];
  const headerTitleStyle = isDarkMode ? styles.headerTitle : [styles.headerTitle, styles.textLightPrimary];
  const arrowColor = isDarkMode ? Colors.text.primary : '#111827';
  const textStyle = isDarkMode ? styles.instructions : [styles.instructions, styles.textLightSecondary];
  const overlayBg = isDarkMode ? 'rgba(0, 0, 0, 0.65)' : 'rgba(243, 244, 246, 0.65)';

  if (!permission) {
    // Camera permissions are still loading
    return (
      <SafeAreaView style={bgStyle} edges={['top']}>
        <View style={headerStyle}>
          <TouchableOpacity style={backBtnStyle} onPress={() => router.push('/(tabs)/home')}>
            <Feather name="arrow-left" size={20} color={arrowColor} />
          </TouchableOpacity>
          <Text style={headerTitleStyle}>Scan QR Code</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.body, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.brand.bright} />
          <Text style={[styles.instructions, { marginTop: Spacing[4] }]}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView style={bgStyle} edges={['top']}>
        <View style={headerStyle}>
          <TouchableOpacity style={backBtnStyle} onPress={() => router.push('/(tabs)/home')}>
            <Feather name="arrow-left" size={20} color={arrowColor} />
          </TouchableOpacity>
          <Text style={headerTitleStyle}>Scan QR Code</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[styles.body, { justifyContent: 'center', gap: Spacing[5] }]}>
          <View style={styles.permissionIconCircle}>
            <Ionicons name="camera-outline" size={48} color={Colors.brand.bright} />
          </View>
          <Text style={[styles.headerTitle, !isDarkMode && styles.textLightPrimary, { textAlign: 'center' }]}>
            Camera Permission Required
          </Text>
          <Text style={[styles.instructions, { paddingHorizontal: Spacing[6], textAlign: 'center' }]}>
            We need camera access to scan QR codes and process instant secure payments.
          </Text>
          <TouchableOpacity style={styles.grantBtn} onPress={requestPermission} activeOpacity={0.8}>
            <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={bgStyle} edges={['top']}>
      {/* Header */}
      <View style={headerStyle}>
        <TouchableOpacity style={backBtnStyle} onPress={() => router.push('/(tabs)/home')}>
          <Feather name="arrow-left" size={20} color={arrowColor} />
        </TouchableOpacity>
        <Text style={headerTitleStyle}>Scan QR Code</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />
        
        {/* Overlay Dark Mask */}
        <View style={StyleSheet.absoluteFill}>
          <View style={[styles.overlayTop, { backgroundColor: overlayBg }]}>
            <Text style={[textStyle, { paddingHorizontal: Spacing[6] }]}>
              Position the QR code inside the frame to scan and pay instantly.
            </Text>
          </View>
          
          <View style={styles.overlayMiddleRow}>
            <View style={[styles.overlaySide, { backgroundColor: overlayBg }]} />
            
            {/* Cutout Viewfinder */}
            <View style={styles.viewfinderContainer}>
              {/* 4 Corner Markers */}
              <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 }]} />
              <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 }]} />
              <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 }]} />
              <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 }]} />

              {/* Animated Laser Scanning Line */}
              <Animated.View style={[styles.laser, { transform: [{ translateY: laserAnim }] }]} />
            </View>
            
            <View style={[styles.overlaySide, { backgroundColor: overlayBg }]} />
          </View>
          
          <View style={[styles.overlayBottom, { backgroundColor: overlayBg }]}>
            {/* Simulating Helper */}
            <TouchableOpacity style={styles.simulateBtn} onPress={handleSimulateScan} activeOpacity={0.8}>
              <Ionicons name="flash-outline" size={18} color={Colors.brand.bright} />
              <Text style={styles.simulateText}>Simulate Successful Scan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E810',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: '#0F0F1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C4D4E810',
  },
  headerTitle: { color: Colors.text.primary, fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[6], gap: Spacing[6] },
  instructions: {
    color: Colors.text.secondary,
    fontSize: Typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  overlayTop: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Spacing[6],
  },
  overlayMiddleRow: {
    flexDirection: 'row',
    height: 240,
    alignItems: 'center',
  },
  overlaySide: {
    flex: 1,
    height: '100%',
  },
  overlayBottom: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Spacing[6],
  },
  viewfinderContainer: {
    width: 240,
    height: 240,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.brand.bright,
  },
  laser: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    height: 3,
    backgroundColor: Colors.brand.bright,
    shadowColor: Colors.brand.bright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.brand.bright + '15',
    borderWidth: 1,
    borderColor: Colors.brand.bright + '30',
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    marginTop: Spacing[4],
  },
  simulateText: {
    color: Colors.brand.bright,
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  permissionIconCircle: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.bright + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.brand.bright + '30',
  },
  grantBtn: {
    backgroundColor: Colors.brand.bright,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    shadowColor: Colors.brand.bright,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  containerLight: { backgroundColor: '#F3F4F6' },
  headerLight: { borderBottomColor: '#E5E7EB' },
  backBtnLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  textLightPrimary: { color: '#111827' },
  textLightSecondary: { color: '#4B5563' },
});

