import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';

/**
 * Global SMS OTP Gateway Service (Twilio Production)
 */
export const SmsService = {
  /**
   * Send a 6-digit OTP verification code to any phone number globally using Twilio Verify.
   */
  sendOtp: async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');

    // Validate Twilio credentials setup
    const isNotConfigured = 
      Config.TWILIO_ACCOUNT_SID.includes('your-') || 
      Config.TWILIO_AUTH_TOKEN.includes('your-') || 
      Config.TWILIO_MESSAGING_SERVICE_SID.includes('your-') ||
      Config.TWILIO_ACCOUNT_SID === '' ||
      Config.TWILIO_AUTH_TOKEN === '' ||
      Config.TWILIO_MESSAGING_SERVICE_SID === '';

    if (isNotConfigured) {
      const errorMsg = 'Twilio SMS API is not configured. Please refer to [setup_steps.md](file:///c:/Users/DELL/Desktop/Num%20wallet/setup_guide/setup_steps.md) inside the project and configure your Account SID, Auth Token, and Verify Service SID in constants/config.ts to make real OTP dispatches possible.';
      Alert.alert('Configuration Required', errorMsg);
      return { success: false, error: 'SMS Gateway Credentials Missing.' };
    }

    // Persistent Client-side Rate Limiting (3 attempts, then 4-hour block)
    let attempts = 0;
    let lastSent = 0;
    try {
      const attemptsStr = await AsyncStorage.getItem(`otp_attempts_${cleanPhone}`);
      const lastSentStr = await AsyncStorage.getItem(`last_otp_sent_${cleanPhone}`);
      if (attemptsStr) attempts = parseInt(attemptsStr, 10);
      if (lastSentStr) lastSent = parseInt(lastSentStr, 10);

      const now = Date.now();
      
      // 1. Check for 4-hour block
      if (attempts >= 4 && lastSent > 0) {
        const elapsedHours = (now - lastSent) / (1000 * 60 * 60);
        if (elapsedHours < 4) {
          const timeLeftMs = (4 * 60 * 60 * 1000) - (now - lastSent);
          const hoursLeft = Math.floor(timeLeftMs / (1000 * 60 * 60));
          const minsLeft = Math.ceil((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
          
          let timeText = '';
          if (hoursLeft > 0) {
            timeText = `${hoursLeft} hour${hoursLeft > 1 ? 's' : ''} and ${minsLeft} minute${minsLeft !== 1 ? 's' : ''}`;
          } else {
            timeText = `${minsLeft} minute${minsLeft !== 1 ? 's' : ''}`;
          }
          
          return {
            success: false,
            error: `You have requested too many verification codes. For your security, please try again in ${timeText}.`,
          };
        } else {
          // Block expired, reset attempts
          attempts = 0;
          await AsyncStorage.setItem(`otp_attempts_${cleanPhone}`, '0');
        }
      }

      // 2. Check for 60-second buffer between individual requests
      if (lastSent > 0) {
        const elapsedSeconds = (now - lastSent) / 1000;
        if (elapsedSeconds < 60) {
          const remaining = Math.ceil(60 - elapsedSeconds);
          return {
            success: false,
            error: `Rate limit exceeded. Please wait ${remaining} seconds before requesting a new OTP.`,
          };
        }
      }
    } catch (err) {
      console.log('AsyncStorage rate limit check warning:', err);
    }

    try {
      const url = `https://verify.twilio.com/v2/Services/${Config.TWILIO_MESSAGING_SERVICE_SID}/Verifications`;
      
      const credentials = btoa(`${Config.TWILIO_ACCOUNT_SID}:${Config.TWILIO_AUTH_TOKEN}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: cleanPhone,
          Channel: 'sms',
        }).toString(),
      });

      const data = await response.json();
      if (response.ok) {
        try {
          const newAttempts = attempts + 1;
          await AsyncStorage.setItem(`otp_attempts_${cleanPhone}`, newAttempts.toString());
          await AsyncStorage.setItem(`last_otp_sent_${cleanPhone}`, Date.now().toString());
        } catch (err) {
          console.log('AsyncStorage rate limit save warning:', err);
        }
        return { success: true };
      } else {
        // Intercept Twilio block/fraud/permissions warnings and translate to user-friendly text
        const rawError = data.message || '';
        let userFriendlyError = 'Failed to send verification SMS. Please verify your phone number and try again.';
        
        const isBlocked = 
          rawError.toLowerCase().includes('blocked') || 
          rawError.toLowerCase().includes('fraud') || 
          rawError.toLowerCase().includes('restrict') ||
          rawError.toLowerCase().includes('permission');
          
        if (isBlocked) {
          userFriendlyError = 'SMS verification is temporarily unavailable for this region. Please try again later or contact support.';
        }
        
        return { success: false, error: userFriendlyError };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Network connectivity error.' };
    }
  },

  /**
   * Verify the entered 6-digit OTP code against Twilio Verify servers.
   */
  verifyOtp: async (phoneNumber: string, code: string): Promise<{ success: boolean; error?: string }> => {
    const cleanPhone = phoneNumber.trim().replace(/\s+/g, '');

    // Validate Twilio credentials setup
    const isNotConfigured = 
      Config.TWILIO_ACCOUNT_SID.includes('your-') || 
      Config.TWILIO_AUTH_TOKEN.includes('your-') || 
      Config.TWILIO_MESSAGING_SERVICE_SID.includes('your-') ||
      Config.TWILIO_ACCOUNT_SID === '' ||
      Config.TWILIO_AUTH_TOKEN === '' ||
      Config.TWILIO_MESSAGING_SERVICE_SID === '';

    if (isNotConfigured) {
      return { success: false, error: 'SMS Gateway Credentials Missing. Please check constants/config.ts.' };
    }

    try {
      const url = `https://verify.twilio.com/v2/Services/${Config.TWILIO_MESSAGING_SERVICE_SID}/VerificationCheck`;
      
      const credentials = btoa(`${Config.TWILIO_ACCOUNT_SID}:${Config.TWILIO_AUTH_TOKEN}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: cleanPhone,
          Code: code,
        }).toString(),
      });

      const data = await response.json();
      if (response.ok && data.status === 'approved') {
        try {
          // Clear attempts counter on successful verification
          await AsyncStorage.setItem(`otp_attempts_${cleanPhone}`, '0');
        } catch (e) {}
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Incorrect verification code.' };
      }
    } catch (e: any) {
      return { success: false, error: e.message || 'Network verification error.' };
    }
  }
};
