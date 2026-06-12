import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { WalletEngine } from '../../store/walletEngine';
import { supabase } from '../../store/supabaseClient';
import CustomAlert from '../../components/CustomAlert';
import { Buffer } from 'buffer';

const AVATARS = [
  { id: '1', icon: 'user' as const, color: '#3A8AFF', bg: '#3A8AFF20' },
  { id: '2', icon: 'aperture' as const, color: '#10B981', bg: '#10B98120' },
  { id: '3', icon: 'cpu' as const, color: '#8B5CF6', bg: '#8B5CF620' },
  { id: '4', icon: 'activity' as const, color: '#EC4899', bg: '#EC489920' },
  { id: '5', icon: 'shield' as const, color: '#F59E0B', bg: '#F59E0B20' },
];

export default function ProfileScreen() {
  const userStore = useUserStore();
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<typeof AVATARS[0] | null>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState(false);
  const [uploadedPhotoUri, setUploadedPhotoUri] = useState<string | null>(null);
  const [uploadedPhotoBase64, setUploadedPhotoBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isValid = name.trim().length >= 2;

  useEffect(() => {
    setImageError(false);
  }, [uploadedPhotoUri]);

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
      if (lowerTitle.includes('success') || lowerTitle.includes('copied') || lowerTitle.includes('updated')) {
        icon = 'check-circle';
        iconColor = '#10B981';
      } else if (lowerTitle.includes('failed') || lowerTitle.includes('error') || lowerTitle.includes('incorrect') || lowerTitle.includes('invalid') || lowerTitle.includes('required')) {
        icon = 'alert-triangle';
        iconColor = '#EF4444';
      }

      const hasButtons = !!(buttons && buttons.length > 0);
      const cancelBtn = buttons?.find(b => b.style === 'cancel' || b.text?.toLowerCase() === 'cancel');
      const confirmBtn = buttons?.find(b => b.style !== 'cancel' && b.text?.toLowerCase() !== 'cancel');

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

  const handleUploadPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true, // Request base64 representation for direct storage upload
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploadedPhotoUri(asset.uri);
        setUploadedPhotoBase64(asset.base64 || null);
        setUploadedPhoto(true);
        setSelectedAvatar(null);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      // Fallback/Simulated upload for simulator environments
      setUploadedPhoto(true);
      setUploadedPhotoUri('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80');
      setUploadedPhotoBase64(null);
      setSelectedAvatar(null);
    }
  };

  const handleContinue = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      let finalAvatarUrl = null;

      // 1. If a custom profile photo was selected locally, upload it to live Supabase Storage bucket!
      if (uploadedPhotoUri && (uploadedPhotoBase64 || uploadedPhotoUri.startsWith('http'))) {
        try {
          if (uploadedPhotoBase64) {
            const buffer = Buffer.from(uploadedPhotoBase64, 'base64');
            let ext = 'jpeg';
            const cleanUri = uploadedPhotoUri.split('?')[0];
            const parts = cleanUri.split('.');
            if (parts.length > 1) {
              const possibleExt = parts.pop()?.toLowerCase();
              if (possibleExt && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(possibleExt)) {
                ext = possibleExt;
              }
            }
            const fileName = `${userStore.accountNumber}-${Date.now()}.${ext}`;
            const filePath = `profiles/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, buffer, {
                contentType: `image/${ext}`,
                upsert: true
              });

            if (!uploadError) {
              const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
              finalAvatarUrl = publicUrlData.publicUrl;
            } else {
              console.warn('Supabase storage upload error:', uploadError.message);
            }
          } else {
            // Already a remote URL (fallback/simulation)
            finalAvatarUrl = uploadedPhotoUri;
          }
        } catch (storageErr) {
          console.warn('Failed to upload custom avatar to Supabase:', storageErr);
        }
      }

      // 2. Generate secure 24-word master recovery seed phrase and multi-chain keys
      const seedPhrase = WalletEngine.generate24Words();
      const derived = WalletEngine.deriveAllAddresses(seedPhrase);

      // 3. Encrypt and store seed phrase securely in device's native keychain
      const pin = userStore.transactionPin || '1234';
      const storedSuccessfully = await WalletEngine.encryptAndStoreWallet(seedPhrase, pin);
      if (!storedSuccessfully) {
        throw new Error('Key storage enclave execution rejected.');
      }

      // 4. Register user profile in live Supabase registries database mapping using upsert to support existing users
      const { error } = await supabase
        .from('registries')
        .upsert(
          {
            account_number: userStore.accountNumber,
            name: name.trim(),
            solana_address: derived.solanaAddress,
            evm_address: derived.evmAddress,
            avatar_url: finalAvatarUrl || userStore.uploadedPhotoUri || null,
          },
          { onConflict: 'account_number' }
        );

      if (error) {
        console.warn('Supabase profile registry insert error:', error.message);
      }

      // 5. Save user profile preferences in local store state
      userStore.setName(name.trim());
      userStore.setSelectedAvatarId(selectedAvatar?.id || null);
      userStore.setUploadedPhoto(uploadedPhoto);
      userStore.setUploadedPhotoUri(finalAvatarUrl || uploadedPhotoUri);

      // 6. Navigate successfully to the success screen
      router.push('/(auth)/success');
    } catch (e: any) {
      console.error('Failed to finalize user onboarding registration:', e);
      Alert.alert(
        'Onboarding Error',
        e.message || 'An error occurred while generating secure keys or storing them locally. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress */}
          <View style={styles.progress}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.progressLabel}>Step 3 of 3 — Almost done!</Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarContainer}>
                {uploadedPhotoUri && !imageError ? (
                  <Image 
                    source={{ uri: uploadedPhotoUri }} 
                    style={styles.avatarImage} 
                    onError={() => setImageError(true)} 
                  />
                ) : uploadedPhoto ? (
                  <View style={[styles.avatarGradient, { backgroundColor: '#0F0F1E', borderWidth: 1, borderColor: Colors.brand.bright }]}>
                    <Feather name="image" size={32} color={Colors.brand.bright} />
                  </View>
                ) : selectedAvatar ? (
                  <View style={[styles.avatarGradient, { backgroundColor: selectedAvatar.bg }]}>
                    <Feather name={selectedAvatar.icon} size={36} color={selectedAvatar.color} />
                  </View>
                ) : (
                  <LinearGradient
                    colors={[Colors.brand.deep, Colors.brand.bright]}
                    style={styles.avatarGradient}
                  >
                    <Text style={styles.avatarLetter}>
                      {name.trim() ? name.trim()[0].toUpperCase() : 'N'}
                    </Text>
                  </LinearGradient>
                )}

                {/* Upload camera badge */}
                <TouchableOpacity style={styles.uploadBadge} onPress={handleUploadPhoto} activeOpacity={0.85}>
                  <Feather name="camera" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
            <Text
              style={styles.title}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              What's your name?
            </Text>
            <Text style={styles.subtitle}>
              This is how other Num Wallet users will see you.
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputWrap}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Lawrence Obi"
              placeholderTextColor={Colors.text.disabled}
              autoCapitalize="words"
              autoFocus
              returnKeyType="done"
            />
          </View>

          {/* Info */}
          <View style={styles.infoRow}>
            <Feather name="info" size={13} color={Colors.text.muted} />
            <Text style={styles.infoText}>
              Your name is visible to contacts you send to or receive from.
            </Text>
          </View>

          {/* Avatar selector section */}
          <View style={styles.pickerSection}>
            <Text style={styles.pickerTitle}>Choose an avatar or upload photo</Text>
            <View style={styles.avatarsRow}>
              {AVATARS.map((av) => (
                <TouchableOpacity
                  key={av.id}
                  style={[
                    styles.avatarOption,
                    selectedAvatar?.id === av.id && styles.avatarOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedAvatar(av);
                    setUploadedPhoto(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatarOptionInner, { backgroundColor: av.bg }]}>
                    <Feather name={av.icon} size={20} color={av.color} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* CTA */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {isValid ? (
              <LinearGradient
                colors={[Colors.brand.deep, Colors.brand.bright]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.btnText}>Create My Wallet</Text>
                    <Feather name="arrow-right" size={18} color="#fff" />
                  </>
                )}
              </LinearGradient>
            ) : (
              <View style={[styles.btn, styles.btnDisabled]}>
                <Text style={[styles.btnText, { color: Colors.text.disabled }]}>Create My Wallet</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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
  container: { flex: 1, backgroundColor: Colors.bg.base },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing[5], paddingBottom: Spacing[5] },
  progress: { paddingTop: Spacing[6], gap: Spacing[1], marginBottom: Spacing[8] },
  progressBar: {
    height: 3, backgroundColor: Colors.bg.elevated,
    borderRadius: Radius.full, overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: Radius.full,
  },
  progressLabel: {
    color: '#10B981',
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  header: { alignItems: 'center', gap: Spacing[4], marginBottom: Spacing[8] },
  avatarWrap: { marginBottom: Spacing[2] },
  avatarGradient: {
    width: 80, height: 80, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: {
    width: 80, height: 80, borderRadius: Radius.full,
  },
  avatarContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  uploadBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.brand.bright,
    borderWidth: 2,
    borderColor: Colors.bg.base,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickerSection: {
    alignItems: 'center',
    marginTop: Spacing[6],
    marginBottom: Spacing[2],
    gap: Spacing[3],
  },
  pickerTitle: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  avatarsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOptionSelected: {
    borderColor: Colors.brand.bright,
  },
  avatarLetter: {
    color: '#fff',
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.black,
  },
  title: {
    color: Colors.text.primary,
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.black,
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: Typography.size.base,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing[4],
  },
  inputWrap: { marginBottom: Spacing[4] },
  inputLabel: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  input: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1.5,
    borderColor: Colors.brand.bright + '60',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    color: Colors.text.primary,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[2],
  },
  infoText: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    flex: 1,
    lineHeight: 18,
  },
  footer: { paddingHorizontal: Spacing[5], paddingBottom: 32 },
  btn: {
    height: 56, borderRadius: Radius.xl,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing[2],
  },
  btnDisabled: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1, borderColor: Colors.border.DEFAULT,
  },
  btnText: {
    color: Colors.text.primary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
});
