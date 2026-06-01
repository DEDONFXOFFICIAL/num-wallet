import { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

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
  const isValid = name.trim().length >= 2;

  const handleUploadPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Permission to access camera roll is required!');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setUploadedPhotoUri(uri);
        setUploadedPhoto(true);
        setSelectedAvatar(null);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      // Fallback/Simulated upload for simulator environments
      setUploadedPhoto(true);
      setUploadedPhotoUri('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80');
      setSelectedAvatar(null);
    }
  };

  const handleContinue = () => {
    if (!isValid) return;
    userStore.setName(name);
    userStore.setSelectedAvatarId(selectedAvatar?.id || null);
    userStore.setUploadedPhoto(uploadedPhoto);
    userStore.setUploadedPhotoUri(uploadedPhotoUri);
    router.push('/(auth)/success');
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
                {uploadedPhotoUri ? (
                  <Image source={{ uri: uploadedPhotoUri }} style={styles.avatarImage} />
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
            disabled={!isValid}
            activeOpacity={0.85}
          >
            {isValid ? (
              <LinearGradient
                colors={[Colors.brand.deep, Colors.brand.bright]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                <Text style={styles.btnText}>Create My Wallet</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </LinearGradient>
            ) : (
              <View style={[styles.btn, styles.btnDisabled]}>
                <Text style={[styles.btnText, { color: Colors.text.disabled }]}>Create My Wallet</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
