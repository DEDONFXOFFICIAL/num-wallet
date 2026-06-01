import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';

const COUNTRY_CODES = [
  { flag: '🇦🇫', code: '+93', name: 'Afghanistan', digits: 9 },
  { flag: '🇦🇱', code: '+355', name: 'Albania', digits: 9 },
  { flag: '🇩🇿', code: '+213', name: 'Algeria', digits: 9 },
  { flag: '🇦🇩', code: '+376', name: 'Andorra', digits: 6 },
  { flag: '🇦🇴', code: '+244', name: 'Angola', digits: 9 },
  { flag: '🇦🇬', code: '+1', name: 'Antigua and Barbuda', digits: 7 },
  { flag: '🇦🇷', code: '+54', name: 'Argentina', digits: 10 },
  { flag: '🇦🇲', code: '+374', name: 'Armenia', digits: 8 },
  { flag: '🇦🇺', code: '+61', name: 'Australia', digits: 9 },
  { flag: '🇦🇹', code: '+43', name: 'Austria', digits: 10 },
  { flag: '🇦🇿', code: '+994', name: 'Azerbaijan', digits: 9 },
  { flag: '🇧🇸', code: '+1', name: 'Bahamas', digits: 7 },
  { flag: '🇧🇭', code: '+973', name: 'Bahrain', digits: 8 },
  { flag: '🇧🇩', code: '+880', name: 'Bangladesh', digits: 10 },
  { flag: '🇧🇧', code: '+1', name: 'Barbados', digits: 7 },
  { flag: '🇧🇾', code: '+375', name: 'Belarus', digits: 9 },
  { flag: '🇧🇪', code: '+32', name: 'Belgium', digits: 9 },
  { flag: '🇧🇿', code: '+501', name: 'Belize', digits: 7 },
  { flag: '🇧🇯', code: '+229', name: 'Benin', digits: 8 },
  { flag: '🇧🇹', code: '+975', name: 'Bhutan', digits: 8 },
  { flag: '🇧🇴', code: '+591', name: 'Bolivia', digits: 8 },
  { flag: '🇧🇦', code: '+387', name: 'Bosnia and Herzegovina', digits: 8 },
  { flag: '🇧🇼', code: '+267', name: 'Botswana', digits: 8 },
  { flag: '🇧🇷', code: '+55', name: 'Brazil', digits: 11 },
  { flag: '🇧🇳', code: '+673', name: 'Brunei', digits: 7 },
  { flag: '🇧🇬', code: '+359', name: 'Bulgaria', digits: 9 },
  { flag: '🇧🇫', code: '+226', name: 'Burkina Faso', digits: 8 },
  { flag: '🇧🇮', code: '+257', name: 'Burundi', digits: 8 },
  { flag: '🇰🇭', code: '+855', name: 'Cambodia', digits: 9 },
  { flag: '🇨🇲', code: '+237', name: 'Cameroon', digits: 9 },
  { flag: '🇨🇦', code: '+1', name: 'Canada', digits: 10 },
  { flag: '🇨🇻', code: '+238', name: 'Cape Verde', digits: 7 },
  { flag: '🇨🇫', code: '+236', name: 'Central African Republic', digits: 8 },
  { flag: '🇹🇩', code: '+235', name: 'Chad', digits: 8 },
  { flag: '🇨🇱', code: '+56', name: 'Chile', digits: 9 },
  { flag: '🇨🇳', code: '+86', name: 'China', digits: 11 },
  { flag: '🇨🇴', code: '+57', name: 'Colombia', digits: 10 },
  { flag: '🇰🇲', code: '+269', name: 'Comoros', digits: 7 },
  { flag: '🇨🇬', code: '+242', name: 'Congo (Republic)', digits: 9 },
  { flag: '🇨🇩', code: '+243', name: 'Congo (Democratic Republic)', digits: 9 },
  { flag: '🇨🇷', code: '+506', name: 'Costa Rica', digits: 8 },
  { flag: '🇨🇮', code: '+225', name: 'Cote d\'Ivoire', digits: 10 },
  { flag: '🇭🇷', code: '+385', name: 'Croatia', digits: 9 },
  { flag: '🇨🇺', code: '+53', name: 'Cuba', digits: 8 },
  { flag: '🇨🇾', code: '+357', name: 'Cyprus', digits: 8 },
  { flag: '🇨🇿', code: '+420', name: 'Czech Republic', digits: 9 },
  { flag: '🇩🇰', code: '+45', name: 'Denmark', digits: 8 },
  { flag: '🇩🇯', code: '+253', name: 'Djibouti', digits: 8 },
  { flag: '🇩🇲', code: '+1', name: 'Dominica', digits: 7 },
  { flag: '🇩🇴', code: '+1', name: 'Dominican Republic', digits: 7 },
  { flag: '🇪🇨', code: '+593', name: 'Ecuador', digits: 9 },
  { flag: '🇪🇬', code: '+20', name: 'Egypt', digits: 10 },
  { flag: '🇸🇻', code: '+503', name: 'El Salvador', digits: 8 },
  { flag: '🇬🇶', code: '+240', name: 'Equatorial Guinea', digits: 9 },
  { flag: '🇪🇷', code: '+291', name: 'Eritrea', digits: 7 },
  { flag: '🇪🇪', code: '+372', name: 'Estonia', digits: 8 },
  { flag: '🇸🇿', code: '+268', name: 'Eswatini', digits: 8 },
  { flag: '🇪🇹', code: '+251', name: 'Ethiopia', digits: 9 },
  { flag: '🇫🇯', code: '+679', name: 'Fiji', digits: 7 },
  { flag: '🇫🇮', code: '+358', name: 'Finland', digits: 9 },
  { flag: '🇫🇷', code: '+33', name: 'France', digits: 9 },
  { flag: '🇬🇦', code: '+241', name: 'Gabon', digits: 8 },
  { flag: '🇬🇲', code: '+220', name: 'Gambia', digits: 7 },
  { flag: '🇬🇪', code: '+995', name: 'Georgia', digits: 9 },
  { flag: '🇩🇪', code: '+49', name: 'Germany', digits: 10 },
  { flag: '🇬🇭', code: '+233', name: 'Ghana', digits: 9 },
  { flag: '🇬🇷', code: '+30', name: 'Greece', digits: 10 },
  { flag: '🇬🇩', code: '+1', name: 'Grenada', digits: 7 },
  { flag: '🇬🇹', code: '+502', name: 'Guatemala', digits: 8 },
  { flag: '🇬🇳', code: '+224', name: 'Guinea', digits: 9 },
  { flag: '🇬🇼', code: '+245', name: 'Guinea-Bissau', digits: 7 },
  { flag: '🇬🇾', code: '+592', name: 'Guyana', digits: 7 },
  { flag: '🇭🇹', code: '+509', name: 'Haiti', digits: 8 },
  { flag: '🇭🇳', code: '+504', name: 'Honduras', digits: 8 },
  { flag: '🇭🇰', code: '+852', name: 'Hong Kong', digits: 8 },
  { flag: '🇭🇺', code: '+36', name: 'Hungary', digits: 9 },
  { flag: '🇮🇸', code: '+354', name: 'Iceland', digits: 7 },
  { flag: '🇮🇳', code: '+91', name: 'India', digits: 10 },
  { flag: '🇮🇩', code: '+62', name: 'Indonesia', digits: 10 },
  { flag: '🇮🇷', code: '+98', name: 'Iran', digits: 10 },
  { flag: '🇮🇶', code: '+964', name: 'Iraq', digits: 10 },
  { flag: '🇮🇪', code: '+353', name: 'Ireland', digits: 9 },
  { flag: '🇮🇱', code: '+972', name: 'Israel', digits: 9 },
  { flag: '🇮🇹', code: '+39', name: 'Italy', digits: 10 },
  { flag: '🇯🇲', code: '+1', name: 'Jamaica', digits: 7 },
  { flag: '🇯🇵', code: '+81', name: 'Japan', digits: 10 },
  { flag: '🇯🇴', code: '+962', name: 'Jordan', digits: 9 },
  { flag: '🇰🇿', code: '+7', name: 'Kazakhstan', digits: 10 },
  { flag: '🇰🇪', code: '+254', name: 'Kenya', digits: 9 },
  { flag: '🇰🇮', code: '+686', name: 'Kiribati', digits: 8 },
  { flag: '🇰🇵', code: '+850', name: 'Korea (North)', digits: 10 },
  { flag: '🇰🇷', code: '+82', name: 'Korea (South)', digits: 10 },
  { flag: '🇰🇼', code: '+965', name: 'Kuwait', digits: 8 },
  { flag: '🇰🇬', code: '+996', name: 'Kyrgyzstan', digits: 9 },
  { flag: '🇱🇦', code: '+856', name: 'Laos', digits: 9 },
  { flag: '🇱🇻', code: '+371', name: 'Latvia', digits: 8 },
  { flag: '🇱🇧', code: '+961', name: 'Lebanon', digits: 8 },
  { flag: '🇱🇸', code: '+266', name: 'Lesotho', digits: 8 },
  { flag: '🇱🇷', code: '+231', name: 'Liberia', digits: 7 },
  { flag: '🇱🇾', code: '+218', name: 'Libya', digits: 9 },
  { flag: '🇱🇮', code: '+423', name: 'Liechtenstein', digits: 7 },
  { flag: '🇱🇹', code: '+370', name: 'Lithuania', digits: 8 },
  { flag: '🇱🇺', code: '+352', name: 'Luxembourg', digits: 9 },
  { flag: '🇲🇴', code: '+853', name: 'Macau', digits: 8 },
  { flag: '🇲🇬', code: '+261', name: 'Madagascar', digits: 9 },
  { flag: '🇲🇼', code: '+265', name: 'Malawi', digits: 9 },
  { flag: '🇲🇾', code: '+60', name: 'Malaysia', digits: 9 },
  { flag: '🇲🇻', code: '+960', name: 'Maldives', digits: 7 },
  { flag: '🇲🇱', code: '+223', name: 'Mali', digits: 8 },
  { flag: '🇲🇹', code: '+356', name: 'Malta', digits: 8 },
  { flag: '🇲🇭', code: '+692', name: 'Marshall Islands', digits: 7 },
  { flag: '🇲🇷', code: '+222', name: 'Mauritania', digits: 8 },
  { flag: '🇲🇺', code: '+230', name: 'Mauritius', digits: 7 },
  { flag: '🇲🇽', code: '+52', name: 'Mexico', digits: 10 },
  { flag: '🇫🇲', code: '+691', name: 'Micronesia', digits: 7 },
  { flag: '🇲🇩', code: '+373', name: 'Moldova', digits: 8 },
  { flag: '🇲🇨', code: '+377', name: 'Monaco', digits: 8 },
  { flag: '🇲🇳', code: '+976', name: 'Mongolia', digits: 8 },
  { flag: '🇲🇪', code: '+382', name: 'Montenegro', digits: 8 },
  { flag: '🇲🇦', code: '+212', name: 'Morocco', digits: 9 },
  { flag: '🇲🇿', code: '+258', name: 'Mozambique', digits: 9 },
  { flag: '🇲🇲', code: '+95', name: 'Myanmar', digits: 9 },
  { flag: '🇳🇦', code: '+264', name: 'Namibia', digits: 9 },
  { flag: '🇳🇷', code: '+674', name: 'Nauru', digits: 7 },
  { flag: '🇳🇵', code: '+977', name: 'Nepal', digits: 10 },
  { flag: '🇳🇱', code: '+31', name: 'Netherlands', digits: 9 },
  { flag: '🇳🇿', code: '+64', name: 'New Zealand', digits: 9 },
  { flag: '🇳🇮', code: '+505', name: 'Nicaragua', digits: 8 },
  { flag: '🇳🇪', code: '+227', name: 'Niger', digits: 8 },
  { flag: '🇳🇬', code: '+234', name: 'Nigeria', digits: 10 },
  { flag: '🇲🇰', code: '+389', name: 'North Macedonia', digits: 8 },
  { flag: '🇳🇴', code: '+47', name: 'Norway', digits: 8 },
  { flag: '🇴🇲', code: '+968', name: 'Oman', digits: 8 },
  { flag: '🇵🇰', code: '+92', name: 'Pakistan', digits: 10 },
  { flag: '🇵🇼', code: '+680', name: 'Palau', digits: 7 },
  { flag: '🇵🇸', code: '+970', name: 'Palestine', digits: 9 },
  { flag: '🇵🇦', code: '+507', name: 'Panama', digits: 8 },
  { flag: '🇵🇬', code: '+675', name: 'Papua New Guinea', digits: 8 },
  { flag: '🇵🇾', code: '+595', name: 'Paraguay', digits: 9 },
  { flag: '🇵🇪', code: '+51', name: 'Peru', digits: 9 },
  { flag: '🇵🇭', code: '+63', name: 'Philippines', digits: 10 },
  { flag: '🇵🇱', code: '+48', name: 'Poland', digits: 9 },
  { flag: '🇵🇹', code: '+351', name: 'Portugal', digits: 9 },
  { flag: '🇶🇦', code: '+974', name: 'Qatar', digits: 8 },
  { flag: '🇷🇴', code: '+40', name: 'Romania', digits: 9 },
  { flag: '🇷🇺', code: '+7', name: 'Russia', digits: 10 },
  { flag: '🇷🇼', code: '+250', name: 'Rwanda', digits: 9 },
  { flag: '🇰🇳', code: '+1', name: 'Saint Kitts and Nevis', digits: 7 },
  { flag: '🇱🇨', code: '+1', name: 'Saint Lucia', digits: 7 },
  { flag: '🇻🇨', code: '+1', name: 'Saint Vincent', digits: 7 },
  { flag: '🇼🇸', code: '+685', name: 'Samoa', digits: 7 },
  { flag: '🇸🇲', code: '+378', name: 'San Marino', digits: 9 },
  { flag: '🇸🇹', code: '+239', name: 'Sao Tome and Principe', digits: 7 },
  { flag: '🇸🇦', code: '+966', name: 'Saudi Arabia', digits: 9 },
  { flag: '🇸🇳', code: '+221', name: 'Senegal', digits: 9 },
  { flag: '🇷🇸', code: '+381', name: 'Serbia', digits: 9 },
  { flag: '🇸🇨', code: '+248', name: 'Seychelles', digits: 7 },
  { flag: '🇸🇱', code: '+232', name: 'Sierra Leone', digits: 8 },
  { flag: '🇸🇬', code: '+65', name: 'Singapore', digits: 8 },
  { flag: '🇸🇰', code: '+421', name: 'Slovakia', digits: 9 },
  { flag: '🇸🇮', code: '+386', name: 'Slovenia', digits: 8 },
  { flag: '🇸🇧', code: '+677', name: 'Solomon Islands', digits: 7 },
  { flag: '🇸🇴', code: '+252', name: 'Somalia', digits: 9 },
  { flag: '🇿🇦', code: '+27', name: 'South Africa', digits: 9 },
  { flag: '🇸🇸', code: '+211', name: 'South Sudan', digits: 9 },
  { flag: '🇪🇸', code: '+34', name: 'Spain', digits: 9 },
  { flag: '🇱🇰', code: '+94', name: 'Sri Lanka', digits: 9 },
  { flag: '🇸🇩', code: '+249', name: 'Sudan', digits: 9 },
  { flag: '🇸🇷', code: '+597', name: 'Suriname', digits: 7 },
  { flag: '🇸🇪', code: '+46', name: 'Sweden', digits: 9 },
  { flag: '🇨🇭', code: '+41', name: 'Switzerland', digits: 9 },
  { flag: '🇸🇾', code: '+963', name: 'Syria', digits: 9 },
  { flag: '🇹🇼', code: '+886', name: 'Taiwan', digits: 9 },
  { flag: '🇹🇯', code: '+992', name: 'Tajikistan', digits: 9 },
  { flag: '🇹🇿', code: '+255', name: 'Tanzania', digits: 9 },
  { flag: '🇹🇭', code: '+66', name: 'Thailand', digits: 9 },
  { flag: '🇹🇬', code: '+228', name: 'Togo', digits: 8 },
  { flag: '🇹🇴', code: '+676', name: 'Tonga', digits: 7 },
  { flag: '🇹🇹', code: '+1', name: 'Trinidad and Tobago', digits: 7 },
  { flag: '🇹🇳', code: '+216', name: 'Tunisia', digits: 8 },
  { flag: '🇹🇷', code: '+90', name: 'Turkey', digits: 10 },
  { flag: '🇹🇲', code: '+993', name: 'Turkmenistan', digits: 8 },
  { flag: '🇹🇻', code: '+688', name: 'Tuvalu', digits: 7 },
  { flag: '🇺🇬', code: '+256', name: 'Uganda', digits: 9 },
  { flag: '🇺🇦', code: '+380', name: 'Ukraine', digits: 9 },
  { flag: '🇦🇪', code: '+971', name: 'United Arab Emirates', digits: 9 },
  { flag: '🇬🇧', code: '+44', name: 'United Kingdom', digits: 10 },
  { flag: '🇺🇸', code: '+1', name: 'United States', digits: 10 },
  { flag: '🇺🇾', code: '+598', name: 'Uruguay', digits: 8 },
  { flag: '🇺🇿', code: '+998', name: 'Uzbekistan', digits: 9 },
  { flag: '🇻🇺', code: '+678', name: 'Vanuatu', digits: 7 },
  { flag: '🇻🇪', code: '+58', name: 'Venezuela', digits: 10 },
  { flag: '🇻🇳', code: '+84', name: 'Vietnam', digits: 9 },
  { flag: '🇾🇪', code: '+967', name: 'Yemen', digits: 9 },
  { flag: '🇿🇲', code: '+260', name: 'Zambia', digits: 9 },
  { flag: '🇿🇼', code: '+263', name: 'Zimbabwe', digits: 9 },
];

const DEFAULT_COUNTRY = COUNTRY_CODES.find((c) => c.name === 'Nigeria') || COUNTRY_CODES[0];

export default function PhoneScreen() {
  const [selected, setSelected] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const { mode } = useLocalSearchParams<{ mode?: string }>();

  const isValid = phone.length >= selected.digits;

  const handleContinue = () => {
    if (!isValid) return;
    const cleanNum = phone.replace(/^0/, '');
    useUserStore.getState().setAccountNumber(cleanNum);
    router.push({
      pathname: '/(auth)/otp',
      params: { phone: selected.code + ' ' + phone, mode }
    });
  };

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, '');
    setPhone(digits);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={Colors.text.primary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Enter your{'\n'}phone number</Text>
            <Text style={styles.subtitle}>
              Your phone number becomes your wallet address. The OTP verifies number ownership, while your Login Passcode secures main access.
            </Text>
          </View>

          {/* Phone input */}
          <View style={styles.inputSection}>
            {/* Country picker */}
            <TouchableOpacity
              style={styles.countryBtn}
              onPress={() => setShowCountryPicker(!showCountryPicker)}
              activeOpacity={0.7}
            >
              <Text style={styles.countryFlag}>{selected.flag}</Text>
              <Text style={styles.countryCode}>{selected.code}</Text>
              <Feather
                name={showCountryPicker ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={Colors.text.muted}
              />
            </TouchableOpacity>

            {/* Number input */}
            <TouchableOpacity
              style={styles.phoneInputWrap}
              onPress={() => inputRef.current?.focus()}
              activeOpacity={1}
            >
              <TextInput
                ref={inputRef}
                style={styles.phoneInput}
                value={phone}
                onChangeText={formatPhone}
                keyboardType="phone-pad"
                placeholder="800 000 0000"
                placeholderTextColor={Colors.text.disabled}
                maxLength={11}
                autoFocus
              />
            </TouchableOpacity>
          </View>

          {/* Country picker dropdown */}
          {showCountryPicker && (
            <View style={styles.dropdown}>
              <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                {COUNTRY_CODES.map((c) => (
                  <TouchableOpacity
                    key={c.name}
                    style={[styles.dropdownItem, c.name === selected.name && styles.dropdownItemActive]}
                    onPress={() => {
                      setSelected(c);
                      setShowCountryPicker(false);
                      setPhone('');
                    }}
                  >
                    <Text style={styles.dropdownFlag}>{c.flag}</Text>
                    <Text style={styles.dropdownName}>{c.name}</Text>
                    <Text style={styles.dropdownCode}>{c.code}</Text>
                    {c.name === selected.name && (
                      <Feather name="check" size={16} color={Colors.brand.bright} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Account number preview */}
          {phone.length >= 4 && (
            <View style={styles.previewCard}>
              <Feather name="hash" size={14} color={Colors.brand.bright} />
              <Text style={styles.previewText}>
                Account number:{' '}
                <Text style={styles.previewNumber}>
                  {phone.replace(/^0/, '')}
                </Text>
              </Text>
            </View>
          )}

          {/* Notice */}
          <View style={styles.notice}>
            <Feather name="lock" size={13} color={Colors.text.muted} />
            <Text style={styles.noticeText}>
              We'll send a one-time OTP to confirm number ownership. Account access is managed by your Login Passcode.
            </Text>
          </View>
        </ScrollView>

        {/* Continue button */}
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
                style={styles.continueBtn}
              >
                <Text style={styles.continueBtnText}>Send OTP</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </LinearGradient>
            ) : (
              <View style={[styles.continueBtn, styles.continueBtnDisabled]}>
                <Text style={[styles.continueBtnText, { color: Colors.text.disabled }]}>
                  Send OTP
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing[5], paddingTop: Spacing[3] },

  back: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.bg.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[6],
  },

  header: { marginBottom: Spacing[8] },
  title: {
    color: Colors.text.primary,
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.black,
    lineHeight: 44,
    letterSpacing: -0.5,
    marginBottom: Spacing[3],
  },
  subtitle: {
    color: Colors.text.secondary,
    fontSize: Typography.size.base,
    lineHeight: 24,
    fontWeight: Typography.weight.regular,
  },

  inputSection: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[4],
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[4],
    height: 58,
  },
  countryFlag: { fontSize: 18 },
  countryCode: {
    color: Colors.text.primary,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  phoneInputWrap: {
    flex: 1,
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.brand.bright + '60',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    height: 58,
    justifyContent: 'center',
  },
  phoneInput: {
    color: Colors.text.primary,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
    letterSpacing: 1,
  },

  dropdown: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.md,
    marginBottom: Spacing[4],
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  dropdownItemActive: { backgroundColor: Colors.brand.deep + '18' },
  dropdownFlag: { fontSize: 20 },
  dropdownName: {
    flex: 1,
    color: Colors.text.primary,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  dropdownCode: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    fontFamily: 'monospace',
  },

  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.brand.deep + '18',
    borderWidth: 1,
    borderColor: Colors.brand.deep + '40',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    marginBottom: Spacing[4],
  },
  previewText: {
    color: Colors.text.secondary,
    fontSize: Typography.size.xs,
  },
  previewNumber: {
    color: Colors.brand.bright,
    fontWeight: Typography.weight.bold,
    fontFamily: 'monospace',
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[2],
  },
  noticeText: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    flex: 1,
  },

  footer: {
    paddingHorizontal: Spacing[5],
    paddingBottom: 32,
    gap: Spacing[3],
  },
  continueBtn: {
    height: 56,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  continueBtnDisabled: {
    backgroundColor: Colors.bg.elevated,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
  },
  continueBtnText: {
    color: Colors.text.primary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  terms: {
    color: Colors.text.muted,
    fontSize: Typography.size.xs,
    textAlign: 'center',
  },
  termsLink: {
    color: Colors.brand.bright,
  },
});
