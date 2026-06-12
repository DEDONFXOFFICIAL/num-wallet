import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch, TextInput,
  Alert, ScrollView, Image, KeyboardAvoidingView, Platform, Modal, Vibration,
  ActivityIndicator, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { WalletEngine } from '../../store/walletEngine';
import { supabase } from '../../store/supabaseClient';
import { SmsService } from '../../store/smsService';
import { Config } from '../../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import * as LocalAuthentication from 'expo-local-authentication';
import * as FileSystem from 'expo-file-system/legacy';
import * as MailComposer from 'expo-mail-composer';
import CryptoJS from 'crypto-js';
import { CRYPTO_JS_SOURCE } from '../../constants/cryptoJsSource';
import NumPad from '../../components/NumPad';



const AVATARS_CONFIG = [
  { id: '1', icon: 'user' as const, color: '#3A8AFF', bg: '#3A8AFF20' },
  { id: '2', icon: 'aperture' as const, color: '#10B981', bg: '#10B98120' },
  { id: '3', icon: 'cpu' as const, color: '#8B5CF6', bg: '#8B5CF620' },
  { id: '4', icon: 'activity' as const, color: '#EC4899', bg: '#EC489920' },
  { id: '5', icon: 'shield' as const, color: '#F59E0B', bg: '#F59E0B20' },
];

const TIMER_OPTIONS = [
  { value: 'none', label: 'Disabled (Never Lock)' },
  { value: 'immediately', label: 'Immediately' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '24h', label: '24 Hours' },
] as const;

/**
 * Generates a self-contained, offline-compatible, password-protected HTML document.
 * The seed phrase is encrypted using AES-256 with the user's Transaction PIN.
 * Opening the HTML file in any browser prompts for the PIN, decrypts, and displays the words.
 */
const generateEncryptedHtmlDocument = (seedPhrase: string, pin: string, title: string) => {
  const words = seedPhrase.trim().split(/\s+/);
  const wordsHtml = words.map((word, index) => {
    return `<div class="word-badge"><span class="word-num">${index + 1}</span><span class="word-text">${word}</span></div>`;
  }).join('');

  const innerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Master Recovery Phrase</title>
  <style>
    :root {
      --bg-gradient: linear-gradient(135deg, #0A0A18 0%, #05050C 100%);
      --card-bg: rgba(15, 15, 30, 0.7);
      --border-color: rgba(255, 255, 255, 0.08);
      --text-primary: #FFFFFF;
      --text-secondary: #94A3B8;
      --brand-blue: #3A8AFF;
      --brand-royal: #1040D4;
      --success-green: #10B981;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    body {
      background: var(--bg-gradient);
      color: var(--text-primary);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .container {
      width: 100%;
      max-width: 480px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 30px;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      text-align: center;
      position: relative;
      overflow: hidden;
      animation: fadeIn 0.4s ease forwards;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .container::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(58, 138, 255, 0.05) 0%, transparent 60%);
      pointer-events: none;
      z-index: 0;
    }

    .content-box {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .logo {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      background: rgba(58, 138, 255, 0.15);
      border: 1px solid rgba(58, 138, 255, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--brand-blue);
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    h2 {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 0.5px;
      background: linear-gradient(120deg, #FFFFFF, #94A3B8);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    p.description {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .words-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      width: 100%;
      margin: 10px 0;
    }

    .word-badge {
      background: rgba(255, 255, 255, 0.02);
      border: 1.5px solid rgba(255, 255, 255, 0.04);
      border-radius: 8px;
      padding: 8px 6px;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .word-num {
      color: var(--brand-blue);
      font-weight: bold;
      font-size: 9px;
      width: 14px;
      text-align: right;
    }

    .word-text {
      font-family: monospace;
      font-weight: 600;
      color: #FFFFFF;
    }

    .action-btn {
      width: 100%;
      height: 48px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(90deg, var(--brand-blue), var(--brand-royal));
      color: #FFFFFF;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 15px rgba(58, 138, 255, 0.3);
    }

    .action-btn:active {
      transform: scale(0.98);
      box-shadow: 0 2px 8px rgba(58, 138, 255, 0.2);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content-box">
      <div class="logo">🔑</div>
      <h2>Master Recovery Phrase</h2>
      <p class="description">
        Keep these 24 words completely offline. Never share them with anyone. Anyone with access to these words controls all assets in your wallet.
      </p>

      <div class="words-grid">
        ${wordsHtml}
      </div>

      <button class="action-btn" onclick="copySeedPhrase()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        <span id="copyBtnText">Copy Seed Phrase</span>
      </button>
    </div>
  </div>

  <script>
    var seedPhraseText = "${seedPhrase.trim().replace(/"/g, '\\"')}";
    function copySeedPhrase() {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(seedPhraseText).then(function() {
          showCopied();
        }).catch(function() {
          fallbackCopy();
        });
      } else {
        fallbackCopy();
      }

      function fallbackCopy() {
        try {
          var textArea = document.createElement("textarea");
          textArea.value = seedPhraseText;
          textArea.style.position = "fixed";
          textArea.style.top = "0";
          textArea.style.left = "0";
          textArea.style.width = "2em";
          textArea.style.height = "2em";
          textArea.style.padding = "0";
          textArea.style.border = "none";
          textArea.style.outline = "none";
          textArea.style.boxShadow = "none";
          textArea.style.background = "transparent";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          var successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          if (successful) {
            showCopied();
          } else {
            alert("Failed to copy. Please copy the words manually.");
          }
        } catch (err) {
          alert("Error copying: " + err);
        }
      }

      function showCopied() {
        var btnText = document.getElementById("copyBtnText");
        btnText.textContent = "Copied!";
        setTimeout(function() {
          btnText.textContent = "Copy Seed Phrase";
        }, 2000);
      }
    }
  </script>
</body>
</html>`;

  // Key derivation using PBKDF2 (5000 iterations)
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  const key = CryptoJS.PBKDF2(pin, salt, { keySize: 256 / 32, iterations: 5000 });
  const encrypted = CryptoJS.AES.encrypt(innerHtml, key, { iv: iv });

  const saltHex = salt.toString(CryptoJS.enc.Hex);
  const ivHex = iv.toString(CryptoJS.enc.Hex);
  const ciphertext = encrypted.toString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg-gradient: linear-gradient(135deg, #0A0A18 0%, #05050C 100%);
      --card-bg: rgba(15, 15, 30, 0.7);
      --border-color: rgba(255, 255, 255, 0.08);
      --text-primary: #FFFFFF;
      --text-secondary: #94A3B8;
      --brand-blue: #3A8AFF;
      --error-red: #EF4444;
      --success-green: #10B981;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, sans-serif; }
    body { background: var(--bg-gradient); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { width: 100%; max-width: 480px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 20px; padding: 30px; backdrop-filter: blur(20px); text-align: center; }
    .logo { width: 50px; height: 50px; margin: 0 auto 10px; background: rgba(58, 138, 255, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--brand-blue); font-size: 24px; font-weight: bold; }
    h2 { font-size: 20px; color: white; margin-bottom: 10px; }
    p { font-size: 13px; color: var(--text-secondary); margin-bottom: 20px; }
    .pin-dots-container { display: flex; justify-content: center; gap: 15px; margin-bottom: 20px; }
    .pin-dot { width: 15px; height: 15px; border-radius: 50%; border: 1.5px solid rgba(255, 255, 255, 0.2); }
    .pin-dot.filled { background: var(--brand-blue); border-color: var(--brand-blue); }
    .keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; max-width: 280px; margin: 0 auto; }
    .key { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); color: white; height: 50px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .key:active { background: rgba(58, 138, 255, 0.2); }
    .message { font-size: 12px; min-height: 18px; margin-bottom: 10px; font-weight: 600; }
    .message.error { color: var(--error-red); }
    .message.success { color: var(--success-green); }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }

    .shake {
      animation: shake 0.35s ease-in-out;
    }
  </style>
  <script>
    ${CRYPTO_JS_SOURCE}
  </script>
</head>
<body>
  <div class="container" id="cardContainer">
    <div class="content-box" id="authBox">
      <div class="logo">N</div>
      <h2>Secure Recovery Document</h2>
      <p>This document is encrypted. Enter your 4-digit Transaction PIN to decrypt.</p>

      <div class="pin-dots-container">
        <div class="pin-dot" id="dot1"></div>
        <div class="pin-dot" id="dot2"></div>
        <div class="pin-dot" id="dot3"></div>
        <div class="pin-dot" id="dot4"></div>
      </div>

      <div class="message" id="message"></div>

      <div class="keypad">
        <div class="key" onclick="pressKey(1)">1</div>
        <div class="key" onclick="pressKey(2)">2</div>
        <div class="key" onclick="pressKey(3)">3</div>
        <div class="key" onclick="pressKey(4)">4</div>
        <div class="key" onclick="pressKey(5)">5</div>
        <div class="key" onclick="pressKey(6)">6</div>
        <div class="key" onclick="pressKey(7)">7</div>
        <div class="key" onclick="pressKey(8)">8</div>
        <div class="key" onclick="pressKey(9)">9</div>
        <div class="key empty"></div>
        <div class="key" onclick="pressKey(0)">0</div>
        <div class="key backspace" onclick="pressKey('back')">⌫</div>
      </div>
    </div>
  </div>

  <script>
    var salt = CryptoJS.enc.Hex.parse("${saltHex}");
    var iv = CryptoJS.enc.Hex.parse("${ivHex}");
    var ciphertext = "${ciphertext}";
    var currentPin = "";

    function pressKey(key) {
      if (key === 'back') {
        if (currentPin.length > 0) {
          currentPin = currentPin.slice(0, -1);
        }
      } else {
        if (currentPin.length < 4) {
          currentPin += key;
        }
      }

      updateDots();
      
      if (currentPin.length === 4) {
        setTimeout(decryptPayload, 150);
      }
    }

    function updateDots() {
      for (var i = 1; i <= 4; i++) {
        var dot = document.getElementById("dot" + i);
        if (i <= currentPin.length) {
          dot.classList.add("filled");
        } else {
          dot.classList.remove("filled");
        }
      }
      var msg = document.getElementById("message");
      msg.textContent = "";
      msg.className = "message";
    }

    function decryptPayload() {
      var msg = document.getElementById("message");
      var container = document.getElementById("cardContainer");
      msg.textContent = "Decrypting...";
      msg.className = "message";

      setTimeout(function() {
        try {
          var key = CryptoJS.PBKDF2(currentPin, salt, { keySize: 256/32, iterations: 5000 });
          var decrypted = CryptoJS.AES.decrypt(ciphertext, key, { iv: iv });
          var rawHtml = decrypted.toString(CryptoJS.enc.Utf8);
          
          if (!rawHtml || !rawHtml.startsWith("<!DOCTYPE")) {
            throw new Error("Invalid decryption");
          }

          msg.textContent = "Decrypted Successfully!";
          msg.className = "message success";
          
          setTimeout(function() {
            document.open();
            document.write(rawHtml);
            document.close();
          }, 300);
        } catch (e) {
          msg.textContent = "Incorrect Transaction PIN. Try again.";
          msg.className = "message error";
          currentPin = "";
          updateDots();
          
          container.classList.add("shake");
          setTimeout(function() {
            container.classList.remove("shake");
          }, 350);
        }
      }, 50);
    }
  </script>
</body>
</html>`;
};

export default function SettingsScreen() {
  const { name, selectedAvatarId, uploadedPhoto, uploadedPhotoUri, biometricsEnabled, setBiometricsEnabled, biometricLockSetting, setBiometricLockSetting, accountNumber, isDarkMode, setIsDarkMode, showNfts, showStake, setShowNfts, setShowStake, showPerps, showHub, setShowPerps, setShowHub, showMemes, setShowMemes, showDgames, setShowDgames, showDsocials, setShowDsocials, showPrediction, setShowPrediction, showAi, setShowAi, backupEmail, setBackupEmail, hasEmailedSeedPhrase, setHasEmailedSeedPhrase, setAccountNumber, clearPortfolio, loginPasscode, transactionPin, setTransactionPin } = useUserStore();
  const cleanAccountNumber = accountNumber.replace(/^\+\d+/, '').replace(/\s+/g, '');
  
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showLockTimerModal, setShowLockTimerModal] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [uploadedPhotoUri]);

  const handleUpdatePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Media library permission is required to upload a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const localUri = asset.uri;
        const base64Data = asset.base64;

        setIsUploadingPhoto(true);

        // Update local state instantly so the user sees it immediately
        useUserStore.setState({ 
          uploadedPhoto: true, 
          uploadedPhotoUri: localUri,
          selectedAvatarId: null
        });

        let uploadedPublicUrl = null;

        if (base64Data) {
          try {
            const buffer = Buffer.from(base64Data, 'base64');
            let ext = 'jpeg';
            const cleanUri = localUri.split('?')[0];
            const parts = cleanUri.split('.');
            if (parts.length > 1) {
              const possibleExt = parts.pop()?.toLowerCase();
              if (possibleExt && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(possibleExt)) {
                ext = possibleExt;
              }
            }
            const fileName = `${cleanAccountNumber}-${Date.now()}.${ext}`;
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
              uploadedPublicUrl = publicUrlData.publicUrl;
              
              // Update state with permanent URL
              useUserStore.setState({ uploadedPhotoUri: uploadedPublicUrl });
            } else {
              console.warn('Settings Supabase storage upload error:', uploadError.message);
            }
          } catch (storageErr) {
            console.warn('Settings failed to upload custom avatar to Supabase:', storageErr);
          }
        }

        // Save URL in Supabase registries table (using upsert)
        try {
          const finalUrl = uploadedPublicUrl || localUri;

          // First, select the existing record to get Solana and EVM addresses
          const { data: regData } = await supabase
            .from('registries')
            .select('solana_address, evm_address')
            .eq('account_number', cleanAccountNumber)
            .maybeSingle();

          const solanaAddress = regData?.solana_address || '';
          const evmAddress = regData?.evm_address || '';

          const { error } = await supabase
            .from('registries')
            .upsert(
              {
                account_number: cleanAccountNumber,
                name: name.trim(),
                solana_address: solanaAddress,
                evm_address: evmAddress,
                avatar_url: finalUrl,
              },
              { onConflict: 'account_number' }
            );

          if (error) {
            console.warn('Failed to upsert avatar URL to registries table:', error.message);
          }
        } catch (dbErr) {
          console.warn('Database upsert error in settings:', dbErr);
        } finally {
          setIsUploadingPhoto(false);
          Alert.alert('Success', 'Profile photo updated successfully.');
        }
      }
    } catch (error) {
      setIsUploadingPhoto(false);
      console.log('Error updating settings profile photo:', error);
      Alert.alert('Error', 'An error occurred while updating your profile photo.');
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true);
    try {
      // Clear locally
      useUserStore.setState({ 
        uploadedPhoto: false, 
        uploadedPhotoUri: null 
      });

      // Get existing addresses
      const { data: regData } = await supabase
        .from('registries')
        .select('solana_address, evm_address')
        .eq('account_number', cleanAccountNumber)
        .maybeSingle();

      const solanaAddress = regData?.solana_address || '';
      const evmAddress = regData?.evm_address || '';

      // Update in registries table in Supabase
      const { error } = await supabase
        .from('registries')
        .upsert(
          {
            account_number: cleanAccountNumber,
            name: name.trim(),
            solana_address: solanaAddress,
            evm_address: evmAddress,
            avatar_url: null,
          },
          { onConflict: 'account_number' }
        );

      if (error) {
        console.warn('Failed to clear avatar from Supabase registry:', error.message);
      } else {
        Alert.alert('Success', 'Profile photo removed successfully.');
      }
    } catch (e) {
      console.warn('Error removing profile photo:', e);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoPress = () => {
    const buttons = [
      { text: 'Upload New Photo', onPress: handleUpdatePhoto },
    ];
    
    if (uploadedPhotoUri || uploadedPhoto) {
      buttons.push({ text: 'Remove Current Photo', onPress: handleRemovePhoto, style: 'destructive' } as any);
    }
    
    buttons.push({ text: 'Cancel', style: 'cancel' } as any);
    
    Alert.alert(
      'Profile Photo',
      'Choose an action to update your profile photo:',
      buttons
    );
  };

  // Link Gmail state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkStep, setLinkStep] = useState<'email' | 'verify' | 'success'>('email');
  const [gmailInput, setGmailInput] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sentCode, setSentCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  // Export seed states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStep, setExportStep] = useState<'pin' | 'success'>('pin');
  const [pinInput, setPinInput] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportedWords, setExportedWords] = useState<string>('');

  // Regenerate Wallet states
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenStep, setRegenStep] = useState<'warn' | 'otp' | 'pin' | 'success'>('warn');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [regenPath, setRegenPath] = useState<'EXPORT' | 'SAVED'>('EXPORT');
  const [regenOtpCode, setRegenOtpCode] = useState('');
  const [sentRegenOtp, setSentRegenOtp] = useState('');
  const [regenPinInput, setRegenPinInput] = useState('');

  const pinRef = useRef<TextInput>(null);
  const regenPinRef = useRef<TextInput>(null);

  // Change Transaction PIN states
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [changePinStep, setChangePinStep] = useState<'passcode' | 'otp' | 'new' | 'confirm' | 'success'>('passcode');
  const [changePinPasscodeInput, setChangePinPasscodeInput] = useState('');
  const [changePinOtpInput, setChangePinOtpInput] = useState('');
  const [sentChangePinOtp, setSentChangePinOtp] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  // Refs for change pin hidden inputs
  const changePinPasscodeRef = useRef<TextInput>(null);
  const changePinOtpRef = useRef<TextInput>(null);
  const changePinNewRef = useRef<TextInput>(null);
  const changePinConfirmRef = useRef<TextInput>(null);

  const [resendTimer, setResendTimer] = useState(0);
  const [regenAuthMode, setRegenAuthMode] = useState<'BIOMETRICS' | 'PIN'>('BIOMETRICS');
  const [isRegenScanning, setIsRegenScanning] = useState(false);


  // Restore Phone Number states
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreStep, setRestoreStep] = useState<'input' | 'otp' | 'success'>('input');
  const [restorePhoneInput, setRestorePhoneInput] = useState('');
  const [restoreOtpCode, setRestoreOtpCode] = useState('');
  const [sentRestoreOtp, setSentRestoreOtp] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  // Premium Custom Modal Alert state & override
  interface CustomAlertConfig {
    title: string;
    message: string;
    icon: string;
    iconColor: string;
    iconBg: string;
    showCancel: boolean;
    confirmText: string;
    cancelText?: string;
    confirmColors: readonly [string, string, ...string[]];
    onConfirm?: () => void;
  }
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertConfig, setCustomAlertConfig] = useState<CustomAlertConfig | null>(null);

  const Alert = {
    alert: (
      title: string,
      message?: string,
      buttons?: { text?: string; onPress?: () => void; style?: string }[]
    ) => {
      const cancelBtn = buttons?.find(b => b.style === 'cancel');
      const confirmBtn = buttons?.find(b => b.style === 'destructive' || b.style === 'default' || (!b.style && b.text !== 'Cancel'));
      const fallbackBtn = buttons?.[0];
      const showCancel = !!buttons && buttons.length > 1;
      
      let icon = 'info';
      let iconColor: string = Colors.brand.bright;
      let iconBg: string = Colors.brand.bright + '15';
      let confirmColors: readonly [string, string, ...string[]] = [Colors.brand.deep, Colors.brand.bright];

      const lowerTitle = title.toLowerCase();
      if (lowerTitle.includes('success') || lowerTitle.includes('copied') || lowerTitle.includes('updated')) {
        icon = 'check-circle';
        iconColor = '#10B981';
        iconBg = '#10B98120';
        confirmColors = ['#10B981', '#059669'] as const;
      } else if (lowerTitle.includes('error') || lowerTitle.includes('fail') || lowerTitle.includes('compromised') || lowerTitle.includes('incorrect') || lowerTitle.includes('match') || lowerTitle.includes('invalid') || lowerTitle.includes('not found')) {
        icon = 'alert-triangle';
        iconColor = '#EF4444';
        iconBg = '#EF444420';
        confirmColors = ['#EF4444', '#DC2626'] as const;
      } else if (lowerTitle.includes('log out') || lowerTitle.includes('logout') || lowerTitle.includes('delete') || lowerTitle.includes('remove')) {
        icon = 'log-out';
        iconColor = '#EF4444';
        iconBg = '#EF444420';
        confirmColors = ['#EF4444', '#DC2626'] as const;
      }

      setCustomAlertConfig({
        title,
        message: message || '',
        icon,
        iconColor,
        iconBg,
        showCancel,
        confirmText: confirmBtn?.text || fallbackBtn?.text || 'OK',
        cancelText: cancelBtn?.text || 'Cancel',
        confirmColors,
        onConfirm: () => {
          if (confirmBtn?.onPress) {
            confirmBtn.onPress();
          } else if (fallbackBtn?.onPress && !showCancel) {
            fallbackBtn.onPress();
          }
        }
      });
      setShowCustomAlert(true);
    }
  };

  // Resend OTP Countdown Timer
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Auto-focus regenerate PIN when step changes to 'pin'
  useEffect(() => {
    if (regenStep === 'pin' && showRegenModal) {
      setTimeout(() => {
        regenPinRef.current?.focus();
      }, 300);
    }
  }, [regenStep, showRegenModal]);

  // Auto-focus hidden inputs on change pin modal step changes
  useEffect(() => {
    if (showChangePinModal) {
      setTimeout(() => {
        if (changePinStep === 'passcode') {
          changePinPasscodeRef.current?.focus();
        } else if (changePinStep === 'otp') {
          changePinOtpRef.current?.focus();
        } else if (changePinStep === 'new') {
          changePinNewRef.current?.focus();
        } else if (changePinStep === 'confirm') {
          changePinConfirmRef.current?.focus();
        }
      }, 300);
    }
  }, [changePinStep, showChangePinModal]);

  const handleStartChangePin = async () => {
    // Check lock status first
    try {
      const attemptsStr = await AsyncStorage.getItem(`passcode_failed_attempts_${accountNumber}`);
      const lastFailedStr = await AsyncStorage.getItem(`passcode_last_failed_${accountNumber}`);
      if (attemptsStr && lastFailedStr) {
        const attempts = parseInt(attemptsStr, 10);
        const lastFailed = parseInt(lastFailedStr, 10);
        if (attempts >= 4) {
          const elapsedHours = (Date.now() - lastFailed) / (1000 * 60 * 60);
          if (elapsedHours < 4) {
            const timeLeftMs = (4 * 60 * 60 * 1000) - (Date.now() - lastFailed);
            const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
            const minsLeft = Math.ceil((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
            let timeText = hoursLeft > 0 ? `${hoursLeft} hour(s) and ${minsLeft} minute(s)` : `${minsLeft} minute(s)`;
            
            Alert.alert(
              'Security Lock Active',
              `Too many incorrect passcode attempts. Please try again in ${timeText}.`
            );
            return;
          }
        }
      }
    } catch (e) {}

    setChangePinPasscodeInput('');
    setChangePinOtpInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setChangePinStep('passcode');
    setShowChangePinModal(true);
  };

  const handleChangePinPasscodeChange = async (text: string) => {
    setChangePinPasscodeInput(text);
    if (text.length === 6) {
      if (text === loginPasscode) {
        // Success: Reset failed attempts!
        try {
          await AsyncStorage.setItem(`passcode_failed_attempts_${accountNumber}`, '0');
        } catch (e) {}

        const cleanPhone = accountNumber.startsWith('+') ? accountNumber : `+234${accountNumber.trim().replace(/^0/, '').replace(/\s+/g, '')}`;
        
        const isTwilioConfigured = !(
          Config.TWILIO_ACCOUNT_SID.includes('your-') || 
          Config.TWILIO_AUTH_TOKEN.includes('your-') || 
          Config.TWILIO_MESSAGING_SERVICE_SID.includes('your-') ||
          Config.TWILIO_ACCOUNT_SID === '' ||
          Config.TWILIO_AUTH_TOKEN === '' ||
          Config.TWILIO_MESSAGING_SERVICE_SID === ''
        );

        if (isTwilioConfigured) {
          setIsLinking(true);
          const result = await SmsService.sendOtp(cleanPhone);
          setIsLinking(false);
          if (result.success) {
            setSentChangePinOtp('TWILIO_VERIFY');
            setChangePinOtpInput('');
            setChangePinStep('otp');
            setResendTimer(60);
            Alert.alert(
              'Verification OTP Sent',
              `For your security, we have sent a 6-digit transaction confirmation OTP to your registered number: +234 ${accountNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 *** $3')}.`,
              [{ text: 'OK', onPress: () => setTimeout(() => changePinOtpRef.current?.focus(), 300) }]
            );
          } else {
            Alert.alert(
              'SMS Dispatch Failed',
              result.error || 'Failed to send SMS verification code.',
              [{ text: 'OK', onPress: () => setTimeout(() => changePinPasscodeRef.current?.focus(), 300) }]
            );
          }
        } else {
          Alert.alert(
            'Configuration Error',
            'Twilio Verify SMS API is not configured in constants/config.ts. Live OTP dispatch is unavailable.',
            [{ text: 'OK', onPress: () => setTimeout(() => changePinPasscodeRef.current?.focus(), 300) }]
          );
        }
      } else {
        try {
          Vibration.vibrate([100, 100, 100]);
        } catch (e) {}

        let newAttempts = 1;
        try {
          const currentStr = await AsyncStorage.getItem(`passcode_failed_attempts_${accountNumber}`);
          if (currentStr) {
            newAttempts = parseInt(currentStr, 10) + 1;
          }
          await AsyncStorage.setItem(`passcode_failed_attempts_${accountNumber}`, newAttempts.toString());
          await AsyncStorage.setItem(`passcode_last_failed_${accountNumber}`, Date.now().toString());
        } catch (e) {}

        const remaining = 4 - newAttempts;
        if (newAttempts >= 4) {
          Alert.alert(
            'Security Lock Triggered',
            'You have entered an incorrect passcode 4 times. For your security, account logins and modifications are locked for 4 hours.',
            [{ text: 'OK', onPress: () => setShowChangePinModal(false) }]
          );
        } else {
          Alert.alert(
            'Incorrect Passcode',
            `The Login Passcode entered is incorrect. You have ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before account lockout.`,
            [{ text: 'OK', onPress: () => setTimeout(() => changePinPasscodeRef.current?.focus(), 300) }]
          );
        }
        setChangePinPasscodeInput('');
      }
    }
  };

  const handleResendChangePinOtp = async () => {
    if (resendTimer > 0) return;
    const cleanPhone = accountNumber.startsWith('+') ? accountNumber : `+234${accountNumber.trim().replace(/^0/, '').replace(/\s+/g, '')}`;
    
    const isTwilioConfigured = !(
      Config.TWILIO_ACCOUNT_SID.includes('your-') || 
      Config.TWILIO_AUTH_TOKEN.includes('your-') || 
      Config.TWILIO_MESSAGING_SERVICE_SID.includes('your-') ||
      Config.TWILIO_ACCOUNT_SID === '' ||
      Config.TWILIO_AUTH_TOKEN === '' ||
      Config.TWILIO_MESSAGING_SERVICE_SID === ''
    );

    if (isTwilioConfigured) {
      setIsLinking(true);
      const result = await SmsService.sendOtp(cleanPhone);
      setIsLinking(false);
      if (result.success) {
        setSentChangePinOtp('TWILIO_VERIFY');
        setChangePinOtpInput('');
        setResendTimer(60);
        Alert.alert(
          'Verification OTP Resent',
          `A new verification OTP code has been sent to your registered phone number.`,
          [{ text: 'OK', onPress: () => setTimeout(() => changePinOtpRef.current?.focus(), 300) }]
        );
      } else {
        Alert.alert(
          'SMS Dispatch Failed',
          result.error || 'Failed to send SMS verification code.',
          [{ text: 'OK', onPress: () => setTimeout(() => changePinOtpRef.current?.focus(), 300) }]
        );
      }
    } else {
      Alert.alert(
        'Configuration Error',
        'Twilio Verify SMS API is not configured in constants/config.ts.',
        [{ text: 'OK', onPress: () => setTimeout(() => changePinOtpRef.current?.focus(), 300) }]
      );
    }
  };

  const handleChangePinOtpChange = async (text: string) => {
    setChangePinOtpInput(text);
    if (text.length === 6) {
      if (sentChangePinOtp === 'TWILIO_VERIFY') {
        const cleanPhone = accountNumber.startsWith('+') ? accountNumber : `+234${accountNumber.trim().replace(/^0/, '').replace(/\s+/g, '')}`;
        setIsLinking(true);
        const result = await SmsService.verifyOtp(cleanPhone, text);
        setIsLinking(false);
        if (result.success) {
          setNewPinInput('');
          setChangePinStep('new');
        } else {
          try {
            Vibration.vibrate([100, 100, 100]);
          } catch (e) {}
          Alert.alert(
            'Incorrect OTP',
            result.error || 'The verification code entered is incorrect. Please try again.',
            [{ text: 'OK', onPress: () => setTimeout(() => changePinOtpRef.current?.focus(), 300) }]
          );
          setChangePinOtpInput('');
        }
      } else {
        if (text === sentChangePinOtp) {
          setNewPinInput('');
          setChangePinStep('new');
        } else {
          try {
            Vibration.vibrate([100, 100, 100]);
          } catch (e) {}
          Alert.alert(
            'Incorrect OTP',
            'The verification code entered is incorrect. Please try again.',
            [{ text: 'OK', onPress: () => setTimeout(() => changePinOtpRef.current?.focus(), 300) }]
          );
          setChangePinOtpInput('');
        }
      }
    }
  };

  const handleNewPinChange = (text: string) => {
    setNewPinInput(text);
    if (text.length === 4) {
      setConfirmPinInput('');
      setChangePinStep('confirm');
    }
  };

  const handleConfirmPinChange = (text: string) => {
    setConfirmPinInput(text);
    if (text.length === 4) {
      if (text === newPinInput) {
        setTransactionPin(text);
        setChangePinStep('success');
        try {
          Vibration.vibrate(200);
        } catch (e) {}
      } else {
        try {
          Vibration.vibrate([100, 100, 100]);
        } catch (e) {}
        Alert.alert(
          'PINs Do Not Match',
          'The confirmation PIN does not match the new PIN. Please try again.',
          [{ text: 'OK', onPress: () => setTimeout(() => changePinNewRef.current?.focus(), 300) }]
        );
        setNewPinInput('');
        setConfirmPinInput('');
        setChangePinStep('new');
      }
    }
  };

  const selectedAvatar = AVATARS_CONFIG.find((av) => av.id === selectedAvatarId);
  const initials = name.charAt(0).toUpperCase();

  const handleToggleBiometrics = (value: boolean) => {
    setBiometricsEnabled(value);
    Alert.alert(
      value ? 'Fingerprint Enabled' : 'Fingerprint Disabled',
      value 
        ? 'You can now use your fingerprint to quickly unlock your wallet and approve transfers.'
        : 'You will need to manually enter your passcode and PIN for all actions.'
    );
  };

  const handleToggleTheme = (value: boolean) => {
    setIsDarkMode(value);
  };

  const handleStartLinkGmail = () => {
    setGmailInput(backupEmail || '');
    setVerificationCode('');
    setLinkStep('email');
    setShowLinkModal(true);
  };

  const handleSendLinkCode = async () => {
    if (!gmailInput.trim() || !gmailInput.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid Gmail address.');
      return;
    }
    setIsLinking(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: gmailInput.trim(),
      });

      if (error) {
        Alert.alert('Verification Failed', error.message || 'Failed to send verification code.');
        return;
      }

      setLinkStep('verify');
      setResendTimer(60); // Start 60s countdown
      Alert.alert(
        'Verification Code Sent',
        `An authentication code has been sent to ${gmailInput}. Please enter it to authorize and link your Gmail.`
      );
    } catch (e: any) {
      console.warn('Error triggering email OTP:', e);
      Alert.alert('Error', e.message || 'An error occurred while sending the verification code.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleResendLinkCode = async () => {
    if (resendTimer > 0) return;
    setIsLinking(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: gmailInput.trim(),
      });

      if (error) {
        Alert.alert('Resend Failed', error.message || 'Failed to resend verification code.');
        return;
      }

      setResendTimer(60); // Reset 60s countdown
      Alert.alert(
        'Verification Code Resent',
        `A new authentication code has been sent to ${gmailInput}.`
      );
    } catch (e: any) {
      console.warn('Error resending email OTP:', e);
      Alert.alert('Error', e.message || 'An error occurred while resending the code.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleVerifyLinkCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert('Empty Code', 'Please enter the verification code.');
      return;
    }

    setIsLinking(true);
    try {
      // Try verifying with 'email' (login/token type)
      let { error: verifyError } = await supabase.auth.verifyOtp({
        email: gmailInput.trim(),
        token: verificationCode.trim(),
        type: 'email',
      });

      // If 'email' type fails, fall back to 'signup' type (in case it is a new user signup)
      if (verifyError) {
        const { error: signupVerifyError } = await supabase.auth.verifyOtp({
          email: gmailInput.trim(),
          token: verificationCode.trim(),
          type: 'signup',
        });
        verifyError = signupVerifyError;
      }

      if (verifyError) {
        Alert.alert('Incorrect Code', verifyError.message || 'The verification code entered is incorrect. Please try again.');
        return;
      }

      // Successful verification - update the registries table
      const { error: dbError } = await supabase
        .from('registries')
        .update({ backup_email: gmailInput.trim() })
        .eq('account_number', cleanAccountNumber);

      if (dbError) {
        console.warn('Failed to update backup email in Supabase registry:', dbError.message);
      }
      
      setBackupEmail(gmailInput.trim());
      setLinkStep('success');
    } catch (err: any) {
      console.warn('Error during email OTP verification:', err);
      Alert.alert('Verification Error', err.message || 'An error occurred during verification.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleStartExportSeed = () => {
    if (!backupEmail) {
      Alert.alert(
        'Gmail Link Required',
        'Please link your preferred Gmail address first in settings to receive your encrypted seed phrase.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Link Gmail Now', onPress: () => handleStartLinkGmail() }
        ]
      );
      return;
    }
    setPinInput('');
    setExportStep('pin');
    setShowExportModal(true);
  };

  const handleExportPinChange = async (text: string) => {
    setPinInput(text);
    if (text.length === 4) {
      if (!backupEmail) return;
      if (text === transactionPin) {
        setIsExporting(true);
        try {
          const wallet = await WalletEngine.decryptAndLoadWallet(text);
          if (wallet && wallet.words) {
            setExportStep('success');
            setHasEmailedSeedPhrase(true);
            
            // Generate password-locked HTML recovery document
            const htmlContent = generateEncryptedHtmlDocument(wallet.words, text, "Num Wallet Backup: Encrypted Seed Phrase");
            
            let sentSuccessful = false;
            
            if (Config.RESEND_API_KEY) {
              // Option A: Automated background email via Resend API
              try {
                const base64Content = Buffer.from(htmlContent, 'utf-8').toString('base64');
                const response = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${Config.RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    from: Config.EMAIL_FROM_ADDRESS || 'Num Wallet Security <security@numwallet.app>',
                    to: [backupEmail.trim()],
                    subject: "Num Wallet Backup: Encrypted Seed Phrase",
                    html: `<p>Hello,</p>` +
                          `<p>Attached is your secure, PIN-locked recovery document file (<strong>numwallet_backup_${accountNumber}.html</strong>) for Num Wallet.</p>` +
                          `<p>This backup document is encrypted using standard AES-256 and <strong>CAN ONLY</strong> be opened by opening the HTML file in any browser (Safari, Chrome, etc.) and entering your 4-digit Transaction PIN.</p>` +
                          `<p>Account Number: ${accountNumber}<br/>` +
                          `Date: ${new Date().toLocaleDateString()}</p>` +
                          `<p>Best regards,<br/>Num Wallet Security Team</p>`,
                    attachments: [
                      {
                        filename: `numwallet_backup_${accountNumber}.html`,
                        content: base64Content,
                      }
                    ]
                  }),
                });
                
                if (response.ok) {
                  sentSuccessful = true;
                } else {
                  const errorText = await response.text();
                  console.warn(`Resend API Error: ${response.status} - ${errorText}`);
                }
              } catch (resendError) {
                console.warn("Resend delivery failed:", resendError);
              }
            }
            
            if (!sentSuccessful) {
              // Option B: Fallback to local email composer (or clipboard copy) if Resend failed or is not configured
              try {
                const fileUri = FileSystem.cacheDirectory + `numwallet_backup_${accountNumber}.html`;
                await FileSystem.writeAsStringAsync(fileUri, htmlContent, { encoding: FileSystem.EncodingType.UTF8 });

                const isMailAvailable = await MailComposer.isAvailableAsync();
                if (isMailAvailable) {
                  await MailComposer.composeAsync({
                    recipients: [backupEmail.trim()],
                    subject: "Num Wallet Backup: Encrypted Seed Phrase",
                    body: `Hello,\n\nAttached is your secure, PIN-locked recovery document file (numwallet_backup_${accountNumber}.html) for Num Wallet.\n\n` +
                          `This backup document is encrypted using standard AES-256 and CAN ONLY be opened by opening the HTML file in any browser (Safari, Chrome, etc.) and entering your 4-digit Transaction PIN.\n\n` +
                          `Account Number: ${accountNumber}\n` +
                          `Date: ${new Date().toLocaleDateString()}\n\n` +
                          `Best regards,\nNum Wallet Security Team`,
                    attachments: [fileUri],
                  });
                } else {
                  // Fallback: Copy the encrypted HTML document to clipboard and open mail client with instructions
                  await Clipboard.setStringAsync(htmlContent);
                  const subject = encodeURIComponent("Num Wallet Backup: Encrypted Seed Phrase (Clipboard Fallback)");
                  const body = encodeURIComponent(
                    `Hello,\n\nWe detected that your device does not support attachments via the automatic mail composer.\n\n` +
                    `For your security, we have COPIED the secure, PIN-locked recovery HTML document content to your clipboard.\n\n` +
                    `You can paste it into a file named 'numwallet_backup.html' on your device, or paste it directly in this email to send to yourself. To decrypt it, open that HTML file in any browser and enter your 4-digit Transaction PIN.\n\n` +
                    `Account Number: ${accountNumber}\nDate: ${new Date().toLocaleDateString()}\n\n` +
                    `Best regards,\nNum Wallet Security Team`
                  );
                  const mailtoUrl = `mailto:${backupEmail}?subject=${subject}&body=${body}`;
                  await Linking.openURL(mailtoUrl).catch((err) => {
                    console.warn("Failed to open mail client:", err);
                  });
                  Alert.alert(
                    'Attachment Unavailable',
                    'Your device does not support attachments. We have copied the secure, encrypted HTML document code to your clipboard. You can paste it into a file or email body to save it.',
                    [{ text: 'OK' }]
                  );
                }
              } catch (e) {
                console.error(e);
                Alert.alert('Backup Error', 'An error occurred while generating your recovery document.');
              }
            }
          } else {
            Alert.alert('Decryption Error', 'Could not locate secure keys on this device.');
            setPinInput('');
          }
        } catch (e) {
          console.error(e);
          Alert.alert('Decryption Error', 'An error occurred during key reconstruction.');
          setPinInput('');
        } finally {
          setIsExporting(false);
        }
      } else {
        try {
          Vibration.vibrate([100, 100, 100]);
        } catch (e) {}
        Alert.alert('Incorrect PIN', 'The Transaction PIN entered is incorrect. Please try again.');
        setPinInput('');
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Num Wallet? Make sure you have backed up your credentials.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => router.push('/(auth)/welcome') }
      ]
    );
  };

  const handleStartRegenerate = () => {
    setRegenStep('warn');
    setRegenOtpCode('');
    setRegenPinInput('');
    setShowRegenModal(true);
  };

  const handleSelectRegenPath = async (path: 'EXPORT' | 'SAVED') => {
    if (!backupEmail) {
      Alert.alert(
        'Gmail Link Required',
        'A linked backup Gmail is required first to receive critical transaction keys and authorize account changes.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Link Gmail Now',
            onPress: () => {
              setShowRegenModal(false);
              handleStartLinkGmail();
            }
          }
        ]
      );
      return;
    }

    if (path === 'SAVED' && !hasEmailedSeedPhrase) {
      Alert.alert(
        'Safety Check Failed',
        'For your protection, you must first export and send your encrypted seed phrase backup to your linked Gmail at least once before you can proceed.',
        [
          { text: 'OK', style: 'default' }
        ]
      );
      return;
    }

    setIsLinking(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: backupEmail.trim(),
      });

      if (error) {
        Alert.alert('Verification Failed', error.message || 'Failed to send confirmation code.');
        return;
      }

      setRegenPath(path);
      setRegenStep('otp');
      setResendTimer(60); // Start 60s countdown
      Alert.alert(
        'Transaction Code Sent',
        `A transaction confirmation OTP code has been sent to your connected backup email ${backupEmail}. Please enter it to authorize account changes.`
      );
    } catch (e: any) {
      console.warn('Error triggering OTP for regeneration:', e);
      Alert.alert('Error', e.message || 'An error occurred while sending the code.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleResendRegenOtp = async () => {
    if (resendTimer > 0 || !backupEmail) return;
    setIsLinking(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: backupEmail.trim(),
      });

      if (error) {
        Alert.alert('Resend Failed', error.message || 'Failed to resend confirmation code.');
        return;
      }

      setResendTimer(60); // Reset 60s countdown
      Alert.alert(
        'Transaction Code Resent',
        `A new transaction confirmation OTP code has been sent to your connected backup email ${backupEmail}.`
      );
    } catch (e: any) {
      console.warn('Error resending OTP for regeneration:', e);
      Alert.alert('Error', e.message || 'An error occurred while resending the code.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleVerifyRegenOtp = async () => {
    if (!backupEmail) return;
    if (!regenOtpCode.trim()) {
      Alert.alert('Empty Code', 'Please enter the verification code.');
      return;
    }

    setIsLinking(true);
    try {
      let { error: verifyError } = await supabase.auth.verifyOtp({
        email: backupEmail.trim(),
        token: regenOtpCode.trim(),
        type: 'email',
      });

      if (verifyError) {
        const { error: signupVerifyError } = await supabase.auth.verifyOtp({
          email: backupEmail.trim(),
          token: regenOtpCode.trim(),
          type: 'signup',
        });
        if (signupVerifyError) {
          Alert.alert('Verification Failed', signupVerifyError.message || 'The verification code entered is incorrect.');
          return;
        }
      }

      setRegenAuthMode(biometricsEnabled ? 'BIOMETRICS' : 'PIN');
      setRegenPinInput('');
      setRegenStep('pin');
    } catch (err: any) {
      console.warn('Error during OTP verification for regeneration:', err);
      Alert.alert('Verification Error', err.message || 'An error occurred during verification.');
    } finally {
      setIsLinking(false);
    }
  };

  const executeWalletRegeneration = async () => {
    setIsLinking(true);
    try {
      const prevEmail = backupEmail;
      
      // 1. If path is EXPORT, send the current PIN-locked seed phrase document via email
      if (regenPath === 'EXPORT' && prevEmail) {
        try {
          const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
          if (wallet && wallet.words) {
            // Generate password-locked HTML recovery document
            const htmlContent = generateEncryptedHtmlDocument(wallet.words, transactionPin, "Num Wallet Backup: Recovery Document");
            
            let sentSuccessful = false;
            
            if (Config.RESEND_API_KEY) {
              // Option A: Automated background email via Resend API
              try {
                const base64Content = Buffer.from(htmlContent, 'utf-8').toString('base64');
                const response = await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${Config.RESEND_API_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    from: Config.EMAIL_FROM_ADDRESS || 'Num Wallet Security <security@numwallet.app>',
                    to: [prevEmail.trim()],
                    subject: "Num Wallet Backup: Locked Recovery Document",
                    html: `<p>Hello,</p>` +
                          `<p>Attached is your secure, PIN-locked recovery document file (<strong>numwallet_backup_${accountNumber}.html</strong>) for Num Wallet prior to wallet regeneration.</p>` +
                          `<p>This backup document is encrypted using AES-256 and <strong>CAN ONLY</strong> be opened by opening the HTML file in any browser (Safari, Chrome, etc.) and entering your 4-digit Transaction PIN.</p>` +
                          `<p>Account Number: ${accountNumber}<br/>` +
                          `Date: ${new Date().toLocaleDateString()}</p>` +
                          `<p>Best regards,<br/>Num Wallet Security Team</p>`,
                    attachments: [
                      {
                        filename: `numwallet_backup_${accountNumber}.html`,
                        content: base64Content,
                      }
                    ]
                  }),
                });
                
                if (response.ok) {
                  sentSuccessful = true;
                } else {
                  const errorText = await response.text();
                  console.warn(`Resend API Error during regeneration: ${response.status} - ${errorText}`);
                }
              } catch (resendError) {
                console.warn("Resend delivery during regeneration failed:", resendError);
              }
            }
            
            if (!sentSuccessful) {
              // Option B: Fallback to local email composer (or clipboard copy) if Resend failed or is not configured
              try {
                const fileUri = FileSystem.cacheDirectory + `numwallet_backup_${accountNumber}.html`;
                await FileSystem.writeAsStringAsync(fileUri, htmlContent, { encoding: FileSystem.EncodingType.UTF8 });

                // Compose using Expo MailComposer
                const isMailAvailable = await MailComposer.isAvailableAsync();
                if (isMailAvailable) {
                  await MailComposer.composeAsync({
                    recipients: [prevEmail.trim()],
                    subject: "Num Wallet Backup: Locked Recovery Document",
                    body: `Hello,\n\nAttached is your secure, PIN-locked recovery document file (numwallet_backup_${accountNumber}.html) for Num Wallet prior to wallet regeneration.\n\n` +
                          `This backup document is encrypted using AES-256 and CAN ONLY be opened by opening the HTML file in any browser (Safari, Chrome, etc.) and entering your 4-digit Transaction PIN.\n\n` +
                          `Account Number: ${accountNumber}\n` +
                          `Date: ${new Date().toLocaleDateString()}\n\n` +
                          `Best regards,\nNum Wallet Security Team`,
                    attachments: [fileUri],
                  });
                } else {
                  // Fallback: Copy the encrypted HTML document of old keys to clipboard and open mail client with instructions
                  await Clipboard.setStringAsync(htmlContent);
                  const subject = encodeURIComponent("Num Wallet Backup: Locked Recovery Document (Clipboard Fallback)");
                  const body = encodeURIComponent(
                    `Hello,\n\nWe detected that your device does not support attachments via the automatic mail composer.\n\n` +
                    `For your security, we have COPIED the secure, PIN-locked recovery HTML document of your old keys to your clipboard.\n\n` +
                    `You can paste it into a file named 'numwallet_backup_old.html' on your device, or paste it directly in this email to send to yourself. To decrypt it, open that HTML file in any browser and enter your 4-digit Transaction PIN.\n\n` +
                    `Account Number: ${accountNumber}\nDate: ${new Date().toLocaleDateString()}\n\n` +
                    `Best regards,\nNum Wallet Security Team`
                  );
                  const mailtoUrl = `mailto:${prevEmail}?subject=${subject}&body=${body}`;
                  await Linking.openURL(mailtoUrl).catch((err) => {
                    console.warn("Failed to open mail client for fallback:", err);
                  });
                  Alert.alert(
                    'Attachment Unavailable',
                    'Your device does not support attachments. We have copied the secure, encrypted HTML document code of your old keys to your clipboard. You can paste it into a file or email body to save it.',
                    [{ text: 'OK' }]
                  );
                }
              } catch (e) {
                console.error(e);
              }
            }
          }
        } catch (exportErr) {
          console.warn('Failed to auto-export locked document via mail client:', exportErr);
        }
      }

      // 2. Generate a BRAND NEW 24-word seed phrase
      const seedPhrase = WalletEngine.generate24Words();
      const derived = WalletEngine.deriveAllAddresses(seedPhrase);

      // 3. Encrypt and store the new seed phrase in native secure storage under the same Transaction PIN
      const storedSuccessfully = await WalletEngine.encryptAndStoreWallet(seedPhrase, transactionPin);
      if (!storedSuccessfully) {
        throw new Error('Key storage enclave execution rejected.');
      }

      // 4. Register the new derived Solana/EVM addresses on Supabase for the EXISTING account number
      const { error: dbError } = await supabase
        .from('registries')
        .upsert(
          {
            account_number: accountNumber, // Number remains unchangeable
            name: name.trim(),
            solana_address: derived.solanaAddress,
            evm_address: derived.evmAddress,
            avatar_url: uploadedPhotoUri || null,
            backup_email: backupEmail, // Preserve backup email in the database
          },
          { onConflict: 'account_number' }
        );

      if (dbError) {
        console.warn('Supabase profile registry update during regeneration error:', dbError.message);
      }

      // 5. Update local state preferences (keeping the same account number and backup email)
      setNewAccountNumber(accountNumber);
      clearPortfolio();
      setHasEmailedSeedPhrase(false);

      try {
        Vibration.vibrate(500);
      } catch (e) {}

      if (regenPath === 'EXPORT') {
        Alert.alert(
          'Keys Exported Successfully',
          `Your encrypted seed phrase recovery document has been sent to your mail app! Decrypt it using your Transaction PIN.`
        );
      }
      
      setRegenStep('success');
    } catch (err: any) {
      console.warn('Error executing wallet regeneration:', err);
      Alert.alert('Regeneration Error', err.message || 'An error occurred during wallet regeneration.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleRegenScanFingerprint = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        Alert.alert(
          'Biometrics Unavailable',
          'Biometrics is not available or not enrolled on this device. Please use your Transaction PIN instead.',
          [{ text: 'Use PIN', onPress: () => setRegenAuthMode('PIN') }]
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authorize Wallet Regeneration',
        fallbackLabel: 'Use PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsRegenScanning(true);
        // Brief loading indicator to show enclave key processing
        setTimeout(() => {
          setIsRegenScanning(false);
          executeWalletRegeneration();
        }, 1200);
      } else {
        // Fallback or cancel state
        setIsRegenScanning(false);
      }
    } catch (err) {
      console.warn('Error during biometrics verification:', err);
      Alert.alert(
        'Authentication Error',
        'An error occurred during biometric authentication. Please use your Transaction PIN.'
      );
    }
  };

  const handleRegenPinChange = (text: string) => {
    setRegenPinInput(text);
    if (text.length === 4) {
      if (text === transactionPin) {
        executeWalletRegeneration();
      } else {
        try {
          Vibration.vibrate([100, 100, 100]);
        } catch (e) {}
        Alert.alert('Incorrect PIN', 'The Transaction PIN entered is incorrect. Please try again.');
        setRegenPinInput('');
      }
    }
  };

  const handleRestorePhoneNumber = async () => {
    if (!restorePhoneInput) {
      Alert.alert('Phone Number Required', 'Please enter your original registered phone number.');
      return;
    }
    
    const cleanPhone = restorePhoneInput.startsWith('+') ? restorePhoneInput : `+234${restorePhoneInput.trim().replace(/^0/, '').replace(/\s+/g, '')}`;

    setIsRestoring(true);
    try {
      const isTwilioConfigured = !(
        Config.TWILIO_ACCOUNT_SID.includes('your-') || 
        Config.TWILIO_AUTH_TOKEN.includes('your-') || 
        Config.TWILIO_MESSAGING_SERVICE_SID.includes('your-') ||
        Config.TWILIO_ACCOUNT_SID === '' ||
        Config.TWILIO_AUTH_TOKEN === '' ||
        Config.TWILIO_MESSAGING_SERVICE_SID === ''
      );

      if (isTwilioConfigured) {
        const result = await SmsService.sendOtp(cleanPhone);
        if (result.success) {
          setSentRestoreOtp('TWILIO_VERIFY');
          setResendTimer(60);
          setRestoreStep('otp');
        } else {
          Alert.alert('SMS Dispatch Failed', result.error || 'Failed to send SMS verification code.');
        }
      } else {
        // Fallback for simulation
        const mockCode = '123456';
        setSentRestoreOtp(mockCode);
        setResendTimer(60);
        setRestoreStep('otp');
        Alert.alert('Simulation Mode', `OTP verification code sent: ${mockCode}`);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'An error occurred.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleVerifyRestoreOtp = async () => {
    if (!restoreOtpCode || restoreOtpCode.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit verification code.');
      return;
    }

    setIsRestoring(true);
    try {
      let otpVerified = false;
      const cleanPhone = restorePhoneInput.startsWith('+') ? restorePhoneInput : `+234${restorePhoneInput.trim().replace(/^0/, '').replace(/\s+/g, '')}`;

      if (sentRestoreOtp === 'TWILIO_VERIFY') {
        const result = await SmsService.verifyOtp(cleanPhone, restoreOtpCode);
        if (result.success) {
          otpVerified = true;
        } else {
          Alert.alert('Verification Failed', result.error || 'Incorrect OTP code. Please try again.');
        }
      } else {
        if (restoreOtpCode === sentRestoreOtp) {
          otpVerified = true;
        } else {
          Alert.alert('Verification Failed', 'Incorrect OTP code. Please try again.');
        }
      }

      if (otpVerified) {
        // 1. Decrypt current wallet keys
        const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
        if (!wallet) {
          throw new Error('Could not decrypt secure keys with current Transaction PIN.');
        }

        // 2. Prepare the restored 10-digit number
        const originalNumberDisplay = restorePhoneInput.trim().replace(/^\+234/, '').replace(/^0/, '').replace(/\s+/g, '');

        // 3. Delete the corrupted random account number registry from Supabase
        const corruptedNumber = cleanAccountNumber;
        if (corruptedNumber && corruptedNumber !== originalNumberDisplay) {
          const { error: deleteError } = await supabase
            .from('registries')
            .delete()
            .eq('account_number', corruptedNumber);
          if (deleteError) {
            console.warn('Failed to delete corrupted random registry row:', deleteError.message);
          }
        }

        // 4. Update the original phone number row in Supabase with the current derived wallet addresses
        const { error: dbError } = await supabase
          .from('registries')
          .upsert(
            {
              account_number: originalNumberDisplay,
              name: name.trim(),
              solana_address: wallet.solanaAddress,
              evm_address: wallet.evmAddress,
              avatar_url: uploadedPhotoUri || null,
            },
            { onConflict: 'account_number' }
          );

        if (dbError) {
          throw new Error(`Failed to update database registry: ${dbError.message}`);
        }

        // 5. Update local state preferences
        setAccountNumber(originalNumberDisplay);

        // 6. Complete flow
        setRestoreStep('success');
      }
    } catch (e: any) {
      Alert.alert('Restore Error', e.message || 'An error occurred during account restoration.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, !isDarkMode && styles.containerLight]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, !isDarkMode && styles.borderLight]}>
        <TouchableOpacity 
          style={[
            styles.backBtn, 
            !isDarkMode && { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }
          ]} 
          onPress={() => router.replace('/(tabs)/home')}
        >
          <Feather name="arrow-left" size={20} color={isDarkMode ? Colors.text.primary : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, !isDarkMode && styles.textLightPrimary]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, !isDarkMode && styles.cardLight]}>
          <TouchableOpacity 
            onPress={handlePhotoPress} 
            activeOpacity={0.8}
            style={{ position: 'relative' }}
          >
            {uploadedPhotoUri && !imageError ? (
              <Image 
                source={{ uri: uploadedPhotoUri }} 
                style={styles.profileImage} 
                onError={() => setImageError(true)} 
              />
            ) : uploadedPhoto ? (
              <View style={[styles.avatar, { backgroundColor: '#0F0F1E', borderWidth: 1, borderColor: Colors.brand.bright }]}>
                <Feather name="image" size={22} color={Colors.brand.bright} />
              </View>
            ) : selectedAvatar ? (
              <View style={[styles.avatar, { backgroundColor: selectedAvatar.bg }]}>
                <Feather name={selectedAvatar.icon} size={24} color={selectedAvatar.color} />
              </View>
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            
            {/* Edit overlay icon */}
            <View style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              backgroundColor: Colors.brand.bright,
              width: 18,
              height: 18,
              borderRadius: 9,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: isDarkMode ? '#1E1E2F' : '#FFFFFF',
            }}>
              <Feather name="edit-2" size={9} color="#FFFFFF" />
            </View>

            {/* Spinner Overlay */}
            {isUploadingPhoto && (
              <View style={[StyleSheet.absoluteFill, {
                backgroundColor: 'rgba(0,0,0,0.5)',
                borderRadius: Radius.full,
                alignItems: 'center',
                justifyContent: 'center',
              }]}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.profileDetails}>
            <Text style={[styles.profileName, !isDarkMode && styles.textLightPrimary]}>{name}</Text>
            <Text style={styles.profileNum}>{cleanAccountNumber}</Text>
          </View>
        </View>

        {/* Security Section */}
        <Text style={styles.sectionTitle}>Security & Keys</Text>
        <View style={[styles.sectionCard, !isDarkMode && styles.cardLight]}>
          <TouchableOpacity style={styles.settingsRow} onPress={handleStartLinkGmail} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#F59E0B15' }]}>
                <Feather name="mail" size={16} color="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Link Backup Gmail</Text>
                <Text style={styles.rowSub}>{backupEmail ? backupEmail : 'Not Attached (Tap to link account)'}</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingsRow} onPress={handleStartExportSeed} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#F59E0B15' }]}>
                <Feather name="shield" size={16} color="#F59E0B" />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Receive / Check Seed Phrase</Text>
                <Text style={styles.rowSub}>Send encrypted seed phrase document to Gmail</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingsRow} onPress={handleStartChangePin} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="edit" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Change Transaction PIN</Text>
                <Text style={styles.rowSub}>Modify your 4-digit payment and key PIN</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.text.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#3A8AFF15' }]}>
                <Feather name="lock" size={16} color="#3A8AFF" />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Fingerprint Unlock</Text>
                <Text style={styles.rowSub}>Use fingerprint for quick authorizations</Text>
              </View>
            </View>
            <Switch
              value={biometricsEnabled}
              onValueChange={handleToggleBiometrics}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={biometricsEnabled ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>

          {biometricsEnabled && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity 
                style={styles.settingsRow} 
                onPress={() => setShowLockTimerModal(true)} 
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconBox, { backgroundColor: '#8B5CF615' }]}>
                    <Feather name="clock" size={16} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Auto-Lock Timer</Text>
                    <Text style={styles.rowSub}>
                      {biometricLockSetting === 'none' ? 'Disabled (Never Lock)' : 
                       biometricLockSetting === 'immediately' ? 'Immediately after closing' :
                       biometricLockSetting === '5m' ? '5 minutes after closing' :
                       biometricLockSetting === '15m' ? '15 minutes after closing' :
                       biometricLockSetting === '30m' ? '30 minutes after closing' :
                       biometricLockSetting === '1h' ? '1 hour after closing' :
                       biometricLockSetting === '6h' ? '6 hours after closing' :
                       '24 hours after closing'}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: Colors.brand.bright, fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold }}>
                    {biometricLockSetting === 'none' ? 'Disabled' : 
                     biometricLockSetting === 'immediately' ? 'Immediate' : 
                     biometricLockSetting}
                  </Text>
                  <Feather name="chevron-right" size={16} color={Colors.text.muted} />
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={[styles.sectionCard, !isDarkMode && styles.cardLight]}>
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="eye" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Dark Theme</Text>
                <Text style={styles.rowSub}>Toggle between dark and light modes</Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleTheme}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={isDarkMode ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Dashboard & Menu Customization Section */}
        <Text style={styles.sectionTitle}>Dashboard & Menu Customization</Text>
        <View style={[styles.sectionCard, !isDarkMode && styles.cardLight]}>
          {/* NFT Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="image" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>NFT Gallery</Text>
                <Text style={styles.rowSub}>Toggle NFT visibility on dashboard</Text>
              </View>
            </View>
            <Switch
              value={showNfts}
              onValueChange={setShowNfts}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showNfts ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, !isDarkMode && { backgroundColor: '#E5E7EB' }]} />

          {/* Staking Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="layers" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Staking Actions</Text>
                <Text style={styles.rowSub}>Toggle Staking visibility on dashboard</Text>
              </View>
            </View>
            <Switch
              value={showStake}
              onValueChange={setShowStake}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showStake ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, !isDarkMode && { backgroundColor: '#E5E7EB' }]} />

          {/* AI Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="cpu" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>AI Assistant</Text>
                <Text style={styles.rowSub}>Toggle AI Assistant visibility on dashboard</Text>
              </View>
            </View>
            <Switch
              value={showAi}
              onValueChange={setShowAi}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showAi ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, !isDarkMode && { backgroundColor: '#E5E7EB' }]} />

          {/* Perpetual Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="trending-up" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Perpetual Trading (Perps)</Text>
                <Text style={styles.rowSub}>Toggle Perps visibility on menu & dashboard</Text>
              </View>
            </View>
            <Switch
              value={showPerps}
              onValueChange={setShowPerps}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showPerps ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, !isDarkMode && { backgroundColor: '#E5E7EB' }]} />

          {/* Decentralized Hub Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="grid" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Decentralized Hub</Text>
                <Text style={styles.rowSub}>Toggle Hub visibility on menu & dashboard</Text>
              </View>
            </View>
            <Switch
              value={showHub}
              onValueChange={setShowHub}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showHub ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, !isDarkMode && { backgroundColor: '#E5E7EB' }]} />

          {/* Memes Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="zap" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Memes Terminal</Text>
                <Text style={styles.rowSub}>Toggle Memes visibility on dashboard</Text>
              </View>
            </View>
            <Switch
              value={showMemes}
              onValueChange={setShowMemes}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showMemes ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, !isDarkMode && { backgroundColor: '#E5E7EB' }]} />

          {/* Dsocials Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="message-square" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Decentralized Socials (Dsocials)</Text>
                <Text style={styles.rowSub}>Toggle Dsocials visibility on dashboard</Text>
              </View>
            </View>
            <Switch
              value={showDsocials}
              onValueChange={setShowDsocials}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showDsocials ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, !isDarkMode && { backgroundColor: '#E5E7EB' }]} />

          {/* Dgames Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="play-circle" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Decentralized Games (Dgames)</Text>
                <Text style={styles.rowSub}>Toggle Dgames visibility on dashboard</Text>
              </View>
            </View>
            <Switch
              value={showDgames}
              onValueChange={setShowDgames}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showDgames ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, !isDarkMode && { backgroundColor: '#E5E7EB' }]} />

          {/* Prediction Switch */}
          <View style={styles.settingsRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, isDarkMode ? { backgroundColor: '#9B9B9B15' } : { backgroundColor: '#E5E7EB' }]}>
                <Feather name="bar-chart-2" size={16} color={isDarkMode ? '#9B9B9B' : '#6B7280'} />
              </View>
              <View>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary]}>Prediction Markets</Text>
                <Text style={styles.rowSub}>Toggle Prediction visibility on dashboard</Text>
              </View>
            </View>
            <Switch
              value={showPrediction}
              onValueChange={setShowPrediction}
              trackColor={{ false: '#767577', true: Colors.brand.bright + '80' }}
              thumbColor={showPrediction ? Colors.brand.bright : '#f4f3f4'}
            />
          </View>
        </View>

        {/* ACCOUNT RECOVERY - RESTORE ORIGINAL PHONE NUMBER (HIDDEN FOR NOW)
        <Text style={styles.sectionTitle}>Account Recovery</Text>
        <View style={[styles.sectionCard, !isDarkMode && styles.cardLight, { borderColor: Colors.brand.bright + '30', borderWidth: 1, marginBottom: Spacing[2] }]}>
          <TouchableOpacity style={styles.settingsRow} onPress={() => { setShowRestoreModal(true); setRestoreStep('input'); setRestorePhoneInput(''); setRestoreOtpCode(''); }} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: Colors.brand.bright + '15' }]}>
                <Feather name="phone" size={16} color={Colors.brand.bright} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary, { color: Colors.brand.bright }]}>Restore Original Phone Number</Text>
                <Text style={styles.rowSub}>Correct and link wallet keys back to your true phone number</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.text.muted} />
          </TouchableOpacity>
        </View>
        */}

        {/* APP SECURITY CONTROLS - REGENERATE WALLET SEPARATED */}
        <Text style={styles.sectionTitle}>Dangerous Area</Text>
        <View style={[styles.sectionCard, !isDarkMode && styles.cardLight, { borderColor: '#EF444430', borderWidth: 1 }]}>
          <TouchableOpacity style={styles.settingsRow} onPress={handleStartRegenerate} activeOpacity={0.7}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#EF444415' }]}>
                <Feather name="refresh-cw" size={16} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, !isDarkMode && styles.textLightPrimary, { color: '#EF4444' }]}>Regenerate Wallet</Text>
                <Text style={styles.rowSub}>Reset wallet keys & generate a brand new account</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={Colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <Text style={styles.sectionTitle}>About App</Text>
        <View style={[styles.sectionCard, !isDarkMode && styles.cardLight]}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={[styles.infoValue, !isDarkMode && styles.textLightSecondary]}>v1.0.0 (Beta)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Blockchain backing</Text>
            <Text style={[styles.infoValue, { color: '#14F195', fontWeight: 'bold' }]}>Solana Mainnet</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={16} color={Colors.error} />
          <Text style={styles.logoutBtnText}>Log Out Wallet</Text>
        </TouchableOpacity>
        
        <View style={{ height: Spacing[8] }} />
      </ScrollView>

      {/* ── Link Gmail Modal ────────────────────────────────────────────────── */}
      <Modal
        visible={showLinkModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLinkModal(false)}
      >
        <SafeAreaView style={styles.modalBg} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Link Backup Gmail</Text>
              <TouchableOpacity onPress={() => setShowLinkModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Step 1: Input Gmail */}
            {linkStep === 'email' && (
              <View style={styles.modalBody}>
                <View style={[styles.secureBadge, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B25' }]}>
                  <Ionicons name="mail-outline" size={18} color="#F59E0B" />
                  <Text style={styles.secureText}>Preferred Gmail Link</Text>
                </View>
                <Text style={styles.modalTitle}>Link Gmail Account</Text>
                <Text style={styles.modalSubtitle}>
                  Please enter your preferred Gmail address where the encrypted recovery keys will be sent.
                </Text>

                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. lawrence@gmail.com"
                  placeholderTextColor={Colors.text.disabled}
                  keyboardType="email-address"
                  value={gmailInput}
                  onChangeText={setGmailInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleSendLinkCode}
                  disabled={isLinking}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Text style={styles.btnText}>
                      {isLinking ? 'Sending Authentication...' : 'Send Authentication Code'}
                    </Text>
                    <Feather name="send" size={14} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: Verify Gmail OTP */}
            {linkStep === 'verify' && (
              <View style={styles.modalBody}>
                <View style={[styles.secureBadge, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B25' }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#F59E0B" />
                  <Text style={styles.secureText}>Verify Authentication</Text>
                </View>
                <Text style={styles.modalTitle}>Confirm OTP Code</Text>
                <Text style={styles.modalSubtitle}>
                  Enter the 6-digit confirmation code sent to <Text style={{ fontWeight: 'bold', color: '#F59E0B' }}>{gmailInput}</Text>.
                </Text>

                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={Colors.text.disabled}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  autoFocus
                />

                {/* Resend Timer section */}
                <View style={{ marginVertical: Spacing[2], alignItems: 'center' }}>
                  {resendTimer > 0 ? (
                    <Text style={{ color: Colors.text.muted, fontSize: Typography.size.xs }}>
                      Resend code in {resendTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendLinkCode} activeOpacity={0.7}>
                      <Text style={{ color: '#F59E0B', fontSize: Typography.size.xs, fontWeight: 'bold', textDecorationLine: 'underline' }}>
                        Resend Verification Code
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleVerifyLinkCode}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Text style={styles.btnText}>Link Gmail Account</Text>
                    <Feather name="check-circle" size={14} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Success Screen */}
            {linkStep === 'success' && (
              <View style={[styles.modalBody, { gap: Spacing[5] }]}>
                <View style={[styles.iconWrapSuccess, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
                  <Feather name="check" size={36} color="#10B981" />
                </View>
                <Text style={styles.modalTitle}>Gmail Linked!</Text>
                <Text style={styles.modalSubtitle}>
                  Your preferred email <Text style={{ fontWeight: 'bold', color: Colors.brand.bright }}>{gmailInput}</Text> has been successfully verified and attached to your backup settings.
                </Text>

                <TouchableOpacity style={styles.doneBtn} onPress={() => setShowLinkModal(false)}>
                  <Text style={styles.doneBtnText}>Got it, thanks!</Text>
                </TouchableOpacity>
              </View>
            )}

          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── Receive Seed Phrase Modal ────────────────────────────────────────── */}
      <Modal
        visible={showExportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowExportModal(false)}
        onShow={() => {
          setTimeout(() => pinRef.current?.focus(), 300);
        }}
      >
        <SafeAreaView style={styles.modalBg} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Receive Seed Phrase</Text>
              <TouchableOpacity onPress={() => setShowExportModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Step 1: Secure PIN Authorization */}
            {exportStep === 'pin' && (
              <View style={styles.modalBody}>
                <View style={[styles.secureBadge, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B25' }]}>
                  <Ionicons name="lock-closed" size={18} color="#F59E0B" />
                  <Text style={styles.secureText}>Authentication Required</Text>
                </View>
                <Text style={styles.modalTitle}>Enter Transaction PIN</Text>
                <Text style={styles.modalSubtitle}>
                  Please enter your 4-digit Transaction PIN to confirm exporting key document.
                </Text>

                {/* Dots row container with overlay TextInput */}
                <View style={{ position: 'relative', width: '100%', height: 60, justifyContent: 'center', alignItems: 'center', marginVertical: 15 }}>
                  <View style={styles.dotsRow}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          i < pinInput.length && styles.dotFilled,
                        ]}
                      />
                    ))}
                  </View>

                  <TextInput
                    ref={pinRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'transparent',
                      color: 'transparent',
                      fontSize: 24,
                    }}
                    keyboardType="number-pad"
                    maxLength={4}
                    value={pinInput}
                    onChangeText={handleExportPinChange}
                    autoFocus
                    secureTextEntry
                    caretHidden
                  />
                </View>
              </View>
            )}


            {/* Step 2: Encrypted Backup Sent Confirmation */}
            {exportStep === 'success' && (
              <View style={[styles.modalBody, { gap: Spacing[4], alignItems: 'center', paddingVertical: Spacing[4] }]}>
                <View style={[styles.iconWrapSuccess, { backgroundColor: '#10B98115', borderColor: '#10B98130', alignSelf: 'center' }]}>
                  <Feather name="mail" size={32} color="#10B981" />
                </View>
                <Text style={styles.modalTitle}>Encrypted Backup Sent</Text>
                <Text style={[styles.modalSubtitle, { textAlign: 'center', color: '#94A3B8' }]}>
                  A secure, PIN-locked backup of your seed phrase has been generated and sent to your registered Gmail address:
                </Text>

                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 8, padding: 12, width: '100%', alignItems: 'center', marginVertical: 4 }}>
                  <Text style={{ color: '#04D9C4', fontWeight: 'bold', fontSize: 15 }}>{backupEmail}</Text>
                </View>

                <Text style={{ color: '#64748B', fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 10 }}>
                  Please check your inbox (including your spam and promotions folders). To view or recover your wallet, download the attached HTML file and open it in any web browser. You will need to enter your 4-digit Transaction PIN to decrypt it.
                </Text>

                <TouchableOpacity style={[styles.doneBtn, { width: '100%', marginTop: 10 }]} onPress={() => { setShowExportModal(false); setPinInput(''); setExportedWords(''); }}>
                  <Text style={styles.doneBtnText}>Got It</Text>
                </TouchableOpacity>
              </View>
            )}

          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* ── Regenerate Wallet Modal ────────────────────────────────────────── */}
      <Modal
        visible={showRegenModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRegenModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.modalContainerBox, !isDarkMode && styles.modalContainerBoxLight]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, !isDarkMode && styles.borderLight, { borderBottomWidth: 1, paddingBottom: Spacing[3], marginBottom: Spacing[4] }]}>
              <Text style={[styles.modalHeaderTitle, !isDarkMode && styles.textLightPrimary]}>Regenerate Wallet</Text>
              <TouchableOpacity onPress={() => setShowRegenModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={20} color={isDarkMode ? "#FFFFFF" : "#111827"} />
              </TouchableOpacity>
            </View>

            {/* Step 1: Warning and Export Prompt */}
            {regenStep === 'warn' && (
              <View style={{ gap: Spacing[4], alignItems: 'center' }}>
                <View style={[styles.secureBadge, { backgroundColor: '#EF444412', borderColor: '#EF444425' }]}>
                  <Feather name="alert-triangle" size={18} color="#EF4444" />
                  <Text style={[styles.secureText, { color: '#EF4444' }]}>Critical Security Reset</Text>
                </View>
                <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { fontSize: Typography.size.lg }]}>Wallet Compromised?</Text>
                <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                  This action will completely delete your current wallet from this device and permanently deregister it from your account number, generating a brand new secure address instead.
                </Text>

                <View style={[styles.recoveryAlertBox, !isDarkMode && { backgroundColor: '#F59E0B08', borderColor: '#F59E0B20' }]}>
                  <Feather name="info" size={18} color="#F59E0B" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.alertBoxTitle}>Important Warning:</Text>
                    <Text style={[styles.alertBoxText, { color: isDarkMode ? '#C4D4E8' : '#374151' }]}>
                      Since the wallet is being deleted from your account, any funds currently held will be completely lost if you do not keep the seed phrase. Please make sure you have exported and safely stored your current seed phrase before proceeding.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { width: '100%' }]}
                  onPress={() => handleSelectRegenPath('EXPORT')}
                >
                  <LinearGradient
                    colors={['#3A8AFF', '#1040D4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Feather name="shield" size={14} color="#FFFFFF" />
                    <Text style={styles.btnText}>Export Current Seed Phrase</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { width: '100%', marginTop: -Spacing[2] }]}
                  onPress={() => handleSelectRegenPath('SAVED')}
                >
                  <View style={[styles.btnGradient, { backgroundColor: isDarkMode ? '#1A1A2E' : '#F3F4F6', borderWidth: 1, borderColor: isDarkMode ? '#C4D4E810' : '#E5E7EB' }]}>
                    <Text style={[styles.btnText, { color: '#EF4444' }]}>I have saved it already, proceed</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2A: Email OTP Code Validation */}
            {regenStep === 'otp' && (
              <View style={{ gap: Spacing[4], alignItems: 'center', width: '100%' }}>
                <View style={[styles.secureBadge, { backgroundColor: '#3A8AFF12', borderColor: '#3A8AFF25' }]}>
                  <Feather name="mail" size={18} color="#3A8AFF" />
                  <Text style={[styles.secureText, { color: '#3A8AFF' }]}>Account Security Check</Text>
                </View>
                <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { fontSize: Typography.size.lg }]}>Confirm Transaction OTP</Text>
                <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                  Enter the 6-digit transaction confirmation code sent to your connected backup email: <Text style={{ fontWeight: 'bold', color: '#3A8AFF' }}>{backupEmail}</Text>
                </Text>

                <TextInput
                  style={[styles.modalInput, !isDarkMode && { backgroundColor: '#F3F4F6', color: '#111827', borderColor: '#E5E7EB' }]}
                  placeholder="Enter 6-digit code"
                  placeholderTextColor={isDarkMode ? Colors.text.disabled : '#9CA3AF'}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={regenOtpCode}
                  onChangeText={setRegenOtpCode}
                  autoFocus
                />

                {/* Resend Timer section */}
                <View style={{ marginVertical: Spacing[2], alignItems: 'center' }}>
                  {resendTimer > 0 ? (
                    <Text style={{ color: isDarkMode ? '#94A3B8' : '#6B7280', fontSize: Typography.size.xs }}>
                      Resend code in {resendTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendRegenOtp} activeOpacity={0.7}>
                      <Text style={{ color: '#3A8AFF', fontSize: Typography.size.xs, fontWeight: 'bold', textDecorationLine: 'underline' }}>
                        Resend OTP Code
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { width: '100%' }]}
                  onPress={handleVerifyRegenOtp}
                >
                  <LinearGradient
                    colors={['#3A8AFF', '#1040D4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    <Feather name="lock" size={14} color="#FFFFFF" />
                    <Text style={styles.btnText}>Verify Security Code</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setRegenStep('warn')}
                >
                  <Text style={[styles.modalCancelBtnText, { color: isDarkMode ? '#94A3B8' : '#6B7280' }]}>Back</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2B: Transaction PIN / Biometrics Input */}
            {regenStep === 'pin' && (
              isRegenScanning ? (
                <View style={{ gap: Spacing[4], alignItems: 'center', width: '100%', paddingVertical: Spacing[4] }}>
                  <View style={styles.scanningIconContainer}>
                    <Ionicons name="finger-print" size={64} color="#10B981" />
                    <ActivityIndicator size="large" color="#10B981" style={StyleSheet.absoluteFill} />
                  </View>
                  <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { color: '#10B981', fontSize: Typography.size.lg }]}>
                    Scanning Fingerprint...
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                    Verifying secure hardware enclave keys & signature permissions on local module...
                  </Text>
                </View>
              ) : regenAuthMode === 'BIOMETRICS' ? (
                <View style={{ gap: Spacing[4], alignItems: 'center', width: '100%' }}>
                  <Ionicons name="finger-print" size={64} color="#3A8AFF" style={{ alignSelf: 'center', marginBottom: Spacing[2] }} />
                  <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { fontSize: Typography.size.lg }]}>Biometric Verification</Text>
                  <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                    Place your fingerprint on the scanner or align your face to authorize wallet regeneration.
                  </Text>

                  <TouchableOpacity
                    style={styles.scanTouchBtn}
                    activeOpacity={0.8}
                    onPress={handleRegenScanFingerprint}
                  >
                    <LinearGradient
                      colors={['#3A8AFF15', '#1040D425']}
                      style={styles.scanTouchGradient}
                    >
                      <Ionicons name="scan-outline" size={20} color="#3A8AFF" />
                      <Text style={styles.scanTouchText}>Tap to Scan Fingerprint</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.switchAuthBtn}
                    onPress={() => setRegenAuthMode('PIN')}
                  >
                    <Text style={styles.switchAuthBtnText}>Use Transaction PIN instead</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setRegenStep('otp')}
                  >
                    <Text style={[styles.modalCancelBtnText, { color: isDarkMode ? '#94A3B8' : '#6B7280' }]}>Back</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ gap: Spacing[4], alignItems: 'center', width: '100%' }}>
                  <View style={[styles.secureBadge, { backgroundColor: '#EF444412', borderColor: '#EF444425' }]}>
                    <Feather name="lock" size={18} color="#EF4444" />
                    <Text style={[styles.secureText, { color: '#EF4444' }]}>Authorization Required</Text>
                  </View>
                  <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { fontSize: Typography.size.lg }]}>Enter Transaction PIN</Text>
                  <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                    Enter your 4-digit Transaction PIN to complete the reset authorization.
                  </Text>

                  {/* Dots row container with overlay TextInput */}
                  <View style={{ position: 'relative', width: '100%', height: 60, justifyContent: 'center', alignItems: 'center', marginVertical: 15 }}>
                    <View style={styles.dotsRow}>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <View
                          key={i}
                          style={[
                            styles.dot,
                            i < regenPinInput.length && styles.dotFilled,
                          ]}
                        />
                      ))}
                    </View>

                    <TextInput
                      ref={regenPinRef}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'transparent',
                        color: 'transparent',
                        fontSize: 24,
                      }}
                      keyboardType="number-pad"
                      maxLength={4}
                      value={regenPinInput}
                      onChangeText={handleRegenPinChange}
                      autoFocus
                      secureTextEntry
                      caretHidden
                    />
                  </View>

                  {biometricsEnabled && (
                    <TouchableOpacity
                      style={styles.switchAuthBtn}
                      onPress={() => setRegenAuthMode('BIOMETRICS')}
                    >
                      <Text style={styles.switchAuthBtnText}>Use Biometrics instead</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setRegenStep('otp')}
                  >
                    <Text style={[styles.modalCancelBtnText, { color: isDarkMode ? '#94A3B8' : '#6B7280' }]}>Back</Text>
                  </TouchableOpacity>
                </View>
              )
            )}

            {/* Step 3: Success Screen */}
            {regenStep === 'success' && (
              <View style={{ gap: Spacing[5], alignItems: 'center' }}>
                <View style={[styles.iconWrapSuccess, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
                  <Feather name="check-circle" size={36} color="#10B981" />
                </View>
                <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { fontSize: Typography.size.lg }]}>Wallet Regenerated!</Text>
                <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                  A new secure wallet has been successfully generated and attached to your phone number.
                </Text>

                <View style={[styles.recoveryAlertBox, { backgroundColor: '#10B98110', borderColor: '#10B98125' }]}>
                  <Feather name="shield" size={18} color="#10B981" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.alertBoxTitle, { color: '#10B981' }]}>Your Account Number:</Text>
                    <Text style={[styles.alertBoxText, { color: isDarkMode ? '#FFFFFF' : '#111827', fontSize: Typography.size.sm, fontFamily: 'monospace', fontWeight: 'bold' }]}>
                      {newAccountNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}
                    </Text>
                  </View>
                </View>

                {/* Back up warning */}
                <View style={[styles.recoveryAlertBox, { backgroundColor: '#EF444408', borderColor: '#EF444420' }]}>
                  <Feather name="alert-triangle" size={18} color="#EF4444" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.alertBoxTitle, { color: '#EF4444' }]}>Action Required:</Text>
                    <Text style={[styles.alertBoxText, { color: isDarkMode ? '#C4D4E8' : '#374151' }]}>
                      Your old keys have been deleted. You must immediately export and backup your new 24-word recovery phrase to prevent losing access to your funds!
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={[styles.doneBtn, { width: '100%' }]} onPress={() => setShowRegenModal(false)}>
                  <Text style={styles.doneBtnText}>Start Using New Wallet</Text>
                </TouchableOpacity>
              </View>
            )}

          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Restore Phone Number Modal ────────────────────────────────────────── */}
      <Modal
        visible={showRestoreModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRestoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.modalContainerBox, !isDarkMode && styles.modalContainerBoxLight]}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, !isDarkMode && styles.borderLight, { borderBottomWidth: 1, paddingBottom: Spacing[3], marginBottom: Spacing[4] }]}>
              <Text style={[styles.modalHeaderTitle, !isDarkMode && styles.textLightPrimary]}>Restore Phone Number</Text>
              <TouchableOpacity onPress={() => setShowRestoreModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={20} color={isDarkMode ? "#FFFFFF" : "#111827"} />
              </TouchableOpacity>
            </View>

            {/* Step 1: Input Original Number */}
            {restoreStep === 'input' && (
              <View style={{ gap: Spacing[4], alignItems: 'center', width: '100%' }}>
                <View style={[styles.secureBadge, { backgroundColor: Colors.brand.bright + '12', borderColor: Colors.brand.bright + '25' }]}>
                  <Feather name="phone" size={18} color={Colors.brand.bright} />
                  <Text style={[styles.secureText, { color: Colors.brand.bright }]}>Account Correction</Text>
                </View>
                <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { fontSize: Typography.size.lg, textAlign: 'center' }]}>Link back to true number</Text>
                <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                  Enter your original phone number to verify ownership and bind your current wallet keys back to it.
                </Text>

                <TextInput
                  style={[styles.modalInput, !isDarkMode && { backgroundColor: '#F3F4F6', color: '#111827', borderColor: '#E5E7EB' }]}
                  placeholder="e.g. 08033600717"
                  placeholderTextColor={isDarkMode ? Colors.text.disabled : '#9CA3AF'}
                  keyboardType="phone-pad"
                  value={restorePhoneInput}
                  onChangeText={setRestorePhoneInput}
                  autoFocus
                />

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { width: '100%' }]}
                  onPress={handleRestorePhoneNumber}
                  disabled={isRestoring}
                >
                  <LinearGradient
                    colors={['#3A8AFF', '#1040D4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    {isRestoring ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="send" size={14} color="#FFFFFF" />
                        <Text style={styles.btnText}>Send Verification OTP</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 2: Verify OTP */}
            {restoreStep === 'otp' && (
              <View style={{ gap: Spacing[4], alignItems: 'center', width: '100%' }}>
                <View style={[styles.secureBadge, { backgroundColor: '#3A8AFF12', borderColor: '#3A8AFF25' }]}>
                  <Feather name="lock" size={18} color="#3A8AFF" />
                  <Text style={[styles.secureText, { color: '#3A8AFF' }]}>Ownership Verification</Text>
                </View>
                <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { fontSize: Typography.size.lg }]}>Verify Phone Number</Text>
                <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                  Enter the 6-digit code sent to <Text style={{ fontWeight: 'bold', color: '#3A8AFF' }}>{restorePhoneInput}</Text>
                </Text>

                <TextInput
                  style={[styles.modalInput, !isDarkMode && { backgroundColor: '#F3F4F6', color: '#111827', borderColor: '#E5E7EB' }]}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={isDarkMode ? Colors.text.disabled : '#9CA3AF'}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={restoreOtpCode}
                  onChangeText={setRestoreOtpCode}
                  autoFocus
                />

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, { width: '100%' }]}
                  onPress={handleVerifyRestoreOtp}
                  disabled={isRestoring}
                >
                  <LinearGradient
                    colors={['#3A8AFF', '#1040D4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    {isRestoring ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Feather name="check-circle" size={14} color="#FFFFFF" />
                        <Text style={styles.btnText}>Verify and Link Keys</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setRestoreStep('input')}
                >
                  <Text style={[styles.modalCancelBtnText, { color: isDarkMode ? '#94A3B8' : '#6B7280' }]}>Back</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Step 3: Success */}
            {restoreStep === 'success' && (
              <View style={{ gap: Spacing[5], alignItems: 'center', width: '100%' }}>
                <View style={[styles.iconWrapSuccess, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
                  <Feather name="check-circle" size={36} color="#10B981" />
                </View>
                <Text style={[styles.modalTitle, !isDarkMode && styles.textLightPrimary, { fontSize: Typography.size.lg }]}>Phone Number Restored!</Text>
                <Text style={[styles.modalSubtitle, { color: isDarkMode ? '#94A3B8' : '#4B5563', textAlign: 'center' }]}>
                  Your wallet keys have been successfully mapped back to your original unchangeable phone number.
                </Text>

                <View style={[styles.recoveryAlertBox, { backgroundColor: '#10B98110', borderColor: '#10B98125' }]}>
                  <Feather name="phone" size={18} color="#10B981" style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.alertBoxTitle, { color: '#10B981' }]}>Restored Account Number:</Text>
                    <Text style={[styles.alertBoxText, { color: isDarkMode ? '#FFFFFF' : '#111827', fontSize: Typography.size.sm, fontFamily: 'monospace', fontWeight: 'bold' }]}>
                      {accountNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={[styles.doneBtn, { width: '100%' }]} onPress={() => setShowRestoreModal(false)}>
                  <Text style={styles.doneBtnText}>Back to Settings</Text>
                </TouchableOpacity>
              </View>
            )}

          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Change Transaction PIN Modal ─────────────────────────────────────── */}
      <Modal
        visible={showChangePinModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChangePinModal(false)}
      >
        <SafeAreaView style={styles.modalBg} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Change Transaction PIN</Text>
              <TouchableOpacity onPress={() => setShowChangePinModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Step 1: Passcode Verification */}
            {changePinStep === 'passcode' && (
              <View style={styles.modalBody}>
                <View style={[styles.secureBadge, { backgroundColor: '#3A8AFF12', borderColor: '#3A8AFF25' }]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#3A8AFF" />
                  <Text style={[styles.secureText, { color: '#3A8AFF' }]}>Authentication Required</Text>
                </View>
                <Text style={styles.modalTitle}>Enter Login Passcode</Text>
                <Text style={styles.modalSubtitle}>
                  Please enter your 6-digit Login Passcode to verify identity before modifying payment settings.
                </Text>

                {/* Dots row container with overlay TextInput */}
                <View style={{ position: 'relative', width: '100%', height: 60, justifyContent: 'center', alignItems: 'center', marginVertical: 15 }}>
                  <View style={styles.dotsRow}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          i < changePinPasscodeInput.length && [styles.dotFilled, { backgroundColor: '#3A8AFF', borderColor: '#3A8AFF' }],
                        ]}
                      />
                    ))}
                  </View>

                  <TextInput
                    ref={changePinPasscodeRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'transparent',
                      color: 'transparent',
                      fontSize: 24,
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={changePinPasscodeInput}
                    onChangeText={handleChangePinPasscodeChange}
                    autoFocus
                    secureTextEntry
                    caretHidden
                  />
                </View>
              </View>
            )}

            {/* Step 2: OTP Verification */}
            {changePinStep === 'otp' && (
              <View style={styles.modalBody}>
                <View style={[styles.secureBadge, { backgroundColor: '#3A8AFF12', borderColor: '#3A8AFF25' }]}>
                  <Ionicons name="mail-outline" size={18} color="#3A8AFF" />
                  <Text style={[styles.secureText, { color: '#3A8AFF' }]}>Verify Phone Number</Text>
                </View>
                <Text style={styles.modalTitle}>Enter Verification OTP</Text>
                <Text style={styles.modalSubtitle}>
                  Enter the 6-digit confirmation code sent to your registered number: <Text style={{ fontWeight: 'bold', color: '#3A8AFF' }}>+234 {accountNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 *** $3')}</Text>
                </Text>

                {/* Dots row container with overlay TextInput */}
                <View style={{ position: 'relative', width: '100%', height: 60, justifyContent: 'center', alignItems: 'center', marginVertical: 15 }}>
                  <View style={styles.dotsRow}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          i < changePinOtpInput.length && [styles.dotFilled, { backgroundColor: '#3A8AFF', borderColor: '#3A8AFF' }],
                        ]}
                      />
                    ))}
                  </View>

                  <TextInput
                    ref={changePinOtpRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'transparent',
                      color: 'transparent',
                      fontSize: 24,
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={changePinOtpInput}
                    onChangeText={handleChangePinOtpChange}
                    autoFocus
                    caretHidden
                  />
                </View>

                {/* Resend Timer section */}
                <View style={{ marginVertical: Spacing[2], alignItems: 'center' }}>
                  {resendTimer > 0 ? (
                    <Text style={{ color: Colors.text.muted, fontSize: Typography.size.xs }}>
                      Resend code in {resendTimer}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendChangePinOtp} activeOpacity={0.7}>
                      <Text style={{ color: '#3A8AFF', fontSize: Typography.size.xs, fontWeight: 'bold', textDecorationLine: 'underline' }}>
                        Resend Verification Code
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Step 3: New Transaction PIN */}
            {changePinStep === 'new' && (
              <View style={styles.modalBody}>
                <View style={[styles.secureBadge, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B25' }]}>
                  <Ionicons name="key-outline" size={18} color="#F59E0B" />
                  <Text style={styles.secureText}>New PIN Creation</Text>
                </View>
                <Text style={styles.modalTitle}>Set New PIN</Text>
                <Text style={styles.modalSubtitle}>
                  Create a new 4-digit Transaction PIN to authorize every payment and key document change.
                </Text>

                {/* Dots row container with overlay TextInput */}
                <View style={{ position: 'relative', width: '100%', height: 60, justifyContent: 'center', alignItems: 'center', marginVertical: 15 }}>
                  <View style={styles.dotsRow}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          i < newPinInput.length && styles.dotFilled,
                        ]}
                      />
                    ))}
                  </View>

                  <TextInput
                    ref={changePinNewRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'transparent',
                      color: 'transparent',
                      fontSize: 24,
                    }}
                    keyboardType="number-pad"
                    maxLength={4}
                    value={newPinInput}
                    onChangeText={handleNewPinChange}
                    autoFocus
                    secureTextEntry
                    caretHidden
                  />
                </View>
              </View>
            )}

            {/* Step 4: Confirm Transaction PIN */}
            {changePinStep === 'confirm' && (
              <View style={styles.modalBody}>
                <View style={[styles.secureBadge, { backgroundColor: '#F59E0B12', borderColor: '#F59E0B25' }]}>
                  <Ionicons name="key-outline" size={18} color="#F59E0B" />
                  <Text style={styles.secureText}>New PIN Confirmation</Text>
                </View>
                <Text style={styles.modalTitle}>Confirm New PIN</Text>
                <Text style={styles.modalSubtitle}>
                  Please re-enter your 4-digit Transaction PIN to confirm.
                </Text>

                {/* Dots row container with overlay TextInput */}
                <View style={{ position: 'relative', width: '100%', height: 60, justifyContent: 'center', alignItems: 'center', marginVertical: 15 }}>
                  <View style={styles.dotsRow}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          i < confirmPinInput.length && styles.dotFilled,
                        ]}
                      />
                    ))}
                  </View>

                  <TextInput
                    ref={changePinConfirmRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'transparent',
                      color: 'transparent',
                      fontSize: 24,
                    }}
                    keyboardType="number-pad"
                    maxLength={4}
                    value={confirmPinInput}
                    onChangeText={handleConfirmPinChange}
                    autoFocus
                    secureTextEntry
                    caretHidden
                  />
                </View>
              </View>
            )}

            {/* Step 5: Success Screen */}
            {changePinStep === 'success' && (
              <View style={[styles.modalBody, { gap: Spacing[5] }]}>
                <View style={[styles.iconWrapSuccess, { backgroundColor: '#10B98115', borderColor: '#10B98130' }]}>
                  <Feather name="check" size={36} color="#10B981" />
                </View>
                <Text style={styles.modalTitle}>PIN Updated Successfully!</Text>
                <Text style={styles.modalSubtitle}>
                  Your 4-digit Transaction PIN has been securely updated. Use this new PIN to authorize all future send actions and security changes.
                </Text>

                <TouchableOpacity style={styles.doneBtn} onPress={() => setShowChangePinModal(false)}>
                  <Text style={styles.doneBtnText}>Return to Settings</Text>
                </TouchableOpacity>
              </View>
            )}

          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* Premium Custom Alert Modal */}
      <Modal
        visible={showCustomAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomAlert(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={[styles.alertContainer, !isDarkMode && styles.alertContainerLight]}>
            <View style={styles.alertHeader}>
              <View style={[styles.alertIconWrap, { backgroundColor: customAlertConfig?.iconBg || Colors.brand.bright + '15' }]}>
                <Feather 
                  name={customAlertConfig?.icon as any || 'info'} 
                  size={22} 
                  color={customAlertConfig?.iconColor || Colors.brand.bright} 
                />
              </View>
              <Text style={[styles.alertTitle, !isDarkMode && styles.textLightPrimary]}>
                {customAlertConfig?.title || 'Notification'}
              </Text>
            </View>
            
            <Text style={[styles.alertMessage, { color: isDarkMode ? '#94A3B8' : '#4B5563' }]}>
              {customAlertConfig?.message || ''}
            </Text>
            
            <View style={styles.alertActions}>
              {customAlertConfig?.showCancel && (
                <TouchableOpacity 
                  style={[styles.alertCancelBtn, !isDarkMode && styles.alertCancelBtnLight]} 
                  onPress={() => setShowCustomAlert(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.alertCancelBtnText, { color: isDarkMode ? '#94A3B8' : '#4B5563' }]}>
                    {customAlertConfig?.cancelText || 'Cancel'}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.alertConfirmBtn} 
                onPress={() => {
                  setShowCustomAlert(false);
                  if (customAlertConfig?.onConfirm) {
                    customAlertConfig.onConfirm();
                  }
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={customAlertConfig?.confirmColors || [Colors.brand.deep, Colors.brand.bright]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.alertConfirmGradient}
                >
                  <Text style={styles.alertConfirmBtnText}>
                    {customAlertConfig?.confirmText || 'Confirm'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Auto-Lock Timer Modal ────────────────────────────────────────── */}
      <Modal
        visible={showLockTimerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLockTimerModal(false)}
      >
        <SafeAreaView style={styles.modalBg} edges={['top', 'bottom']}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>Auto-Lock Preference</Text>
              <TouchableOpacity onPress={() => setShowLockTimerModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={[styles.secureBadge, { backgroundColor: '#8B5CF612', borderColor: '#8B5CF625' }]}>
                <Feather name="clock" size={18} color="#8B5CF6" />
                <Text style={styles.secureText}>Lock Preferences</Text>
              </View>
              <Text style={styles.modalTitle}>Set Auto-Lock Timer</Text>
              <Text style={styles.modalSubtitle}>
                Choose how long the app can remain closed in the background before requiring biometric fingerprint to reopen.
              </Text>

              <ScrollView style={{ width: '100%', maxHeight: 320, marginTop: Spacing[2] }} showsVerticalScrollIndicator={false}>
                {TIMER_OPTIONS.map((opt) => {
                  const isSelected = biometricLockSetting === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingVertical: Spacing[4],
                        paddingHorizontal: Spacing[4],
                        borderRadius: Radius.lg,
                        backgroundColor: isSelected ? Colors.brand.bright + '10' : 'transparent',
                        borderWidth: 1,
                        borderColor: isSelected ? Colors.brand.bright + '30' : 'transparent',
                        marginBottom: Spacing[2],
                      }}
                      activeOpacity={0.7}
                      onPress={() => {
                        setBiometricLockSetting(opt.value);
                        setShowLockTimerModal(false);
                      }}
                    >
                      <Text style={{
                        color: isSelected ? Colors.text.primary : Colors.text.secondary,
                        fontWeight: isSelected ? Typography.weight.bold : Typography.weight.regular,
                        fontSize: Typography.size.md,
                      }}>
                        {opt.label}
                      </Text>
                      {isSelected && (
                        <Feather name="check" size={18} color={Colors.brand.bright} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  containerLight: { backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E810',
  },
  borderLight: { borderBottomColor: '#E5E7EB' },
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
  textLightPrimary: { color: '#111827' },
  textLightSecondary: { color: '#4B5563' },
  scroll: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[4] },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.xl,
    padding: Spacing[4],
    gap: Spacing[4],
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  profileImage: { width: 54, height: 54, borderRadius: Radius.full },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.text.primary, fontSize: Typography.size.lg, fontWeight: '700' },
  profileDetails: { gap: 2 },
  profileName: { color: Colors.text.primary, fontSize: Typography.size.base, fontWeight: '700' },
  profileNum: { color: Colors.text.muted, fontSize: Typography.size.xs },

  // Sections
  sectionTitle: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing[2],
  },
  sectionCard: {
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[4],
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], flex: 1 },
  iconBox: { width: 34, height: 34, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { color: Colors.text.primary, fontSize: Typography.size.sm, fontWeight: '700' },
  rowSub: { color: Colors.text.muted, fontSize: 10, marginTop: 1 },
  divider: { height: 1, backgroundColor: '#C4D4E808' },
  
  // App Info
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing[4] },
  infoLabel: { color: Colors.text.muted, fontSize: Typography.size.xs },
  infoValue: { color: Colors.text.secondary, fontSize: Typography.size.xs, fontWeight: '600' },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    backgroundColor: Colors.error + '10',
    borderWidth: 1,
    borderColor: Colors.error + '25',
    borderRadius: Radius.xl,
    paddingVertical: Spacing[4],
    marginTop: Spacing[4],
  },
  logoutBtnText: { color: Colors.error, fontSize: Typography.size.sm, fontWeight: '700' },

  // ── Modal Styles ───────────────────────────────────────────────────────────
  modalBg: { flex: 1, backgroundColor: '#000000F0' },
  modalContent: { flex: 1, paddingHorizontal: Spacing[5] },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E810',
  },
  modalHeaderTitle: { color: '#FFFFFF', fontSize: Typography.size.base, fontWeight: '700' },
  modalCloseBtn: { padding: 4 },
  modalBody: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing[2], gap: Spacing[4] },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F59E0B12',
    borderWidth: 1,
    borderColor: '#F59E0B25',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
  },
  secureText: { color: '#F59E0B', fontSize: 10, fontWeight: '700' },
  modalTitle: { color: '#FFFFFF', fontSize: Typography.size.xl, fontWeight: '900', textAlign: 'center' },
  modalSubtitle: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing[2] },
  
  // Modal PIN Dots
  dotsRow: { flexDirection: 'row', gap: Spacing[6], marginVertical: Spacing[4] },
  dot: { width: 16, height: 16, borderRadius: Radius.full, borderWidth: 1.5, borderColor: '#C4D4E830', backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },

  // Pin Pad Grid
  padWrap: { width: '100%', paddingHorizontal: Spacing[2], marginTop: Spacing[2] },
  padGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing[4] },
  padKey: {
    width: '28%',
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: '#C4D4E808',
    alignItems: 'center',
    justifyContent: 'center',
  },
  padKeyText: { color: '#FFFFFF', fontSize: Typography.size.lg, fontWeight: '700' },

  // Modal Email Input
  modalInput: {
    width: '100%',
    backgroundColor: '#0F0F1E',
    borderWidth: 1.5,
    borderColor: Colors.brand.bright + '40',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    color: '#FFFFFF',
    fontSize: Typography.size.md,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing[3],
  },
  modalSubmitBtn: { width: '100%', marginTop: Spacing[3] },
  btnGradient: { height: 56, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2] },
  btnText: { color: '#FFFFFF', fontSize: Typography.size.sm, fontWeight: 'bold' },

  // Modal Success Icons
  iconWrapSuccess: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  recoveryAlertBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    backgroundColor: '#F59E0B10',
    borderWidth: 1,
    borderColor: '#F59E0B25',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    marginTop: Spacing[2],
  },
  alertBoxTitle: { color: '#F59E0B', fontSize: 11, fontWeight: 'bold' },
  alertBoxText: { color: Colors.text.muted, fontSize: 10, lineHeight: 15 },
  doneBtn: {
    width: '100%',
    height: 52,
    borderRadius: Radius.xl,
    backgroundColor: Colors.brand.bright,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing[4],
  },
  doneBtnText: { color: '#FFFFFF', fontSize: Typography.size.sm, fontWeight: '700' },
  modalCancelBtn: {
    marginTop: Spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2],
  },
  modalCancelBtnText: {
    color: Colors.text.muted,
    fontSize: Typography.size.sm,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainerBox: {
    backgroundColor: '#08080F',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#C4D4E812',
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[8],
    maxHeight: '90%',
  },
  modalContainerBoxLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  scanTouchBtn: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing[4],
    width: '100%',
  },
  scanTouchGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  scanTouchText: {
    color: '#3A8AFF',
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  switchAuthBtn: {
    alignItems: 'center',
    paddingVertical: Spacing[3],
    marginBottom: Spacing[2],
    width: '100%',
  },
  switchAuthBtnText: {
    color: '#3A8AFF',
    fontSize: Typography.size.xs,
    fontWeight: '700',
  },
  scanningIconContainer: {
    position: 'relative',
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[4],
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginVertical: Spacing[4],
    width: '100%',
  },
  wordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F1E',
    borderWidth: 1,
    borderColor: '#C4D4E810',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[2],
    paddingVertical: 6,
    width: '30.5%',
    gap: 4,
  },
  wordIndex: {
    color: '#3A8AFF',
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    width: 14,
    textAlign: 'right',
  },
  wordText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  copyWordsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[2],
    marginBottom: Spacing[2],
  },
  copyWordsText: {
    color: Colors.brand.bright,
    fontSize: Typography.size.xs,
    fontWeight: '700',
  },

  // Custom Alert Modal Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 5, 10, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[5],
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#0F0F1E',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.xl,
    padding: Spacing[5],
    gap: Spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  alertContainerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[1],
  },
  alertIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    color: '#FFFFFF',
    fontSize: Typography.size.lg,
    fontWeight: '900',
    flex: 1,
  },
  alertMessage: {
    fontSize: Typography.size.sm,
    lineHeight: 22,
  },
  alertActions: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  alertCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCancelBtnLight: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  alertCancelBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
  alertConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  alertConfirmGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.size.sm,
    fontWeight: '700',
  },
});
