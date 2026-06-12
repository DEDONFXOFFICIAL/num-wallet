/**
 * Num Wallet - Production Configuration Parameters
 * 
 * Sourced from environment variables to keep secrets out of source control.
 * In development, create an app/.env file with these keys.
 */
export const Config = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://giznbbrfbnsxflfsmefr.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpem5iYnJmYm5zeGZsZnNtZWZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDE3MTcsImV4cCI6MjA5NTk3NzcxN30.4hTLxGLqCYoPElYSv0ewKQx9GW49pgthzKe3Mvcd0qY',

  // --- Privy MPC Config ---
  // Sourced from: Privy Developer Dashboard (embedded wallets enabled)
  PRIVY_APP_ID: process.env.EXPO_PUBLIC_PRIVY_APP_ID || 'cmpwophid000r0djp5d9wqxv5',
  PRIVY_CLIENT_ID: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID || 'client-WY6Zbde9pCMefM8FKcarAgsEfeMtPgHWWdhUk2FXY91Uk',

  // --- Global Twilio SMS Config ---
  // Sourced from: Twilio Console
  TWILIO_ACCOUNT_SID: process.env.EXPO_PUBLIC_TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.EXPO_PUBLIC_TWILIO_AUTH_TOKEN || '',
  TWILIO_MESSAGING_SERVICE_SID: process.env.EXPO_PUBLIC_TWILIO_MESSAGING_SERVICE_SID || '',

  // --- Blockchain RPC Nodes (Mainnet Production) ---
  SOLANA_RPC_URL: process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://mainnet.helius-rpc.com/?api-key=885ec26a-ce0c-4295-be91-d98702b14db5',
  EVM_RPC_URL: process.env.EXPO_PUBLIC_EVM_RPC_URL || 'https://rpc.ankr.com/eth',

  // --- Resend Email Config (Platform Automated Emails) ---
  // Sourced from: resend.com
  RESEND_API_KEY: process.env.EXPO_PUBLIC_RESEND_API_KEY || '',
  EMAIL_FROM_ADDRESS: process.env.EXPO_PUBLIC_EMAIL_FROM_ADDRESS || 'Num Wallet Security <security@numwallet.app>',
};
