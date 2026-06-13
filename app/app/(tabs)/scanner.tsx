import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Alert, Vibration, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { CameraView, useCameraPermissions } from 'expo-camera';
import CustomAlert from '../../components/CustomAlert';
import { LinearGradient } from 'expo-linear-gradient';

export default function ScannerScreen() {
  const { isDarkMode } = useUserStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [localPermissionGranted, setLocalPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    if (permission) {
      setLocalPermissionGranted(permission.granted);
    }
  }, [permission]);

  const handleRequestPermission = async () => {
    if (!permission) return;
    
    if (permission.status === 'denied' && !permission.canAskAgain) {
      Alert.alert(
        'Permission Denied',
        'Camera access was denied. Please go to system settings and enable camera access for Expo Go / Num Wallet.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return;
    }

    try {
      const res = await requestPermission();
      if (res && res.granted) {
        setLocalPermissionGranted(true);
      } else {
        Vibration.vibrate(100);
      }
    } catch (e) {
      console.warn('Error requesting camera permission:', e);
    }
  };

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    icon: any;
    iconColor: string;
    showConfirm: boolean;
    confirmText: string;
    onConfirm: (() => void) | undefined;
    onClose: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    icon: 'info',
    iconColor: Colors.brand.bright,
    showConfirm: false,
    confirmText: 'Confirm',
    onConfirm: undefined,
    onClose: () => {},
  });

  const Alert = {
    alert: (title: string, message?: string, buttons?: any[]) => {
      let icon = 'info';
      let iconColor: string = Colors.brand.bright;
      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('successful') || lowerTitle.includes('success')) {
        icon = 'check-circle';
        iconColor = '#10B981';
      } else if (lowerTitle.includes('error') || lowerTitle.includes('fail') || lowerTitle.includes('invalid')) {
        icon = 'alert-triangle';
        iconColor = '#EF4444';
      }

      const hasButtons = !!(buttons && buttons.length > 0);
      const cancelBtn = buttons?.find(b => b.style === 'cancel' || b.text?.toLowerCase() === 'cancel' || b.text?.toLowerCase() === 'scan again');
      const confirmBtn = buttons?.find(b => b.style !== 'cancel' && b.text?.toLowerCase() !== 'cancel' && b.text?.toLowerCase() !== 'scan again');

      setAlertConfig({
        visible: true,
        title,
        message: message || '',
        icon,
        iconColor,
        showConfirm: hasButtons,
        confirmText: confirmBtn?.text || buttons?.[0]?.text || 'Confirm',
        onConfirm: confirmBtn?.onPress || buttons?.[0]?.onPress || undefined,
        onClose: cancelBtn?.onPress || (() => {})
      });
    }
  };
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

  const isPermissionGranted = localPermissionGranted !== null ? localPermissionGranted : (permission && permission.granted);

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

  if (!isPermissionGranted) {
    // Camera permissions are not granted yet
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

        <View style={styles.permissionBody}>
          <View style={isDarkMode ? styles.permissionCard : styles.permissionCardLight}>
            <View style={styles.permissionIconCircle}>
              <Feather name="camera" size={38} color={Colors.brand.bright} />
            </View>
            
            <Text style={isDarkMode ? styles.permissionTitle : styles.permissionTitleLight}>
              Camera Access Required
            </Text>
            
            <Text style={isDarkMode ? styles.permissionDescription : styles.permissionDescriptionLight}>
              To scan QR codes and process instant, contact-free crypto payments, Num Wallet requires permission to use the camera.
            </Text>

            <TouchableOpacity style={styles.grantBtnWrap} onPress={handleRequestPermission} activeOpacity={0.85}>
              <LinearGradient
                colors={[Colors.brand.deep, Colors.brand.bright]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.grantBtnGradient}
              >
                <Feather name="shield" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.grantBtnText}>Allow Camera Access</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => router.push('/(tabs)/home')}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Not Now</Text>
            </TouchableOpacity>
          </View>
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
          
          <View style={[styles.overlayBottom, { backgroundColor: overlayBg }]} />
        </View>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={() => {
          alertConfig.onClose();
          setAlertConfig(prev => ({ ...prev, visible: false }));
        }}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        showConfirm={alertConfig.showConfirm}
        confirmText={alertConfig.confirmText}
        onConfirm={alertConfig.onConfirm}
      />
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

  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Colors.brand.bright + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.brand.bright + '30',
  },
  permissionBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
  },
  permissionCard: {
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: '#C4D4E818',
    borderRadius: Radius['2xl'],
    padding: Spacing[6],
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  permissionCardLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: Radius['2xl'],
    padding: Spacing[6],
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  permissionTitle: {
    color: Colors.text.primary,
    fontSize: Typography.size.lg,
    fontWeight: '800',
    marginTop: Spacing[5],
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  permissionTitleLight: {
    color: '#111827',
    fontSize: Typography.size.lg,
    fontWeight: '800',
    marginTop: Spacing[5],
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  permissionDescription: {
    color: Colors.text.secondary,
    fontSize: Typography.size.sm,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing[6],
  },
  permissionDescriptionLight: {
    color: '#4B5563',
    fontSize: Typography.size.sm,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing[6],
  },
  grantBtnWrap: {
    width: '100%',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing[3],
  },
  grantBtnGradient: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[5],
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: Spacing[2],
  },
  cancelBtnText: {
    color: Colors.text.muted,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  containerLight: { backgroundColor: '#F3F4F6' },
  headerLight: { borderBottomColor: '#E5E7EB' },
  backBtnLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  textLightPrimary: { color: '#111827' },
  textLightSecondary: { color: '#4B5563' },
});

