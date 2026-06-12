import { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, Modal, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useUserStore, getLogoSource, MinimizedTabType } from '../../store/userStore';
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from '../../components/CustomAlert';
import ImageWithFallback from '../../components/ImageWithFallback';
import { WebView } from 'react-native-webview';
import TransactionConfirmModal, { SecuritySummaryType } from '../../components/TransactionConfirmModal';
import { WalletEngine, MultiChainWallet } from '../../store/walletEngine';
import { ethers, HDNodeWallet, Mnemonic } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import { WebacyService } from '../../store/webacyService';

const chainIdMap: Record<string, number> = {
  ethereum: 1,
  smartchain: 56,
  base: 8453,
  arbitrum: 42161,
  polygon: 137,
  optimism: 10,
  avalanchec: 43114,
  fantom: 250,
  cronos: 25
};

interface ActiveRequest {
  id: number;
  provider: 'ethereum' | 'solana';
  method: string;
  params: any;
}

function checkDomainTypoAndSuggest(url: string): string | null {
  try {
    let domain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
    const lastDotIndex = domain.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      const ext = domain.substring(lastDotIndex + 1);
      const mainPart = domain.substring(0, lastDotIndex);
      const extReplacements: Record<string, string> = {
        'fum': 'fun',
        'con': 'com',
        'col': 'com',
        'cmo': 'com',
        'comm': 'com',
        'orgg': 'org',
        'ne': 'net',
        'nett': 'net',
        'webs': 'website'
      };
      if (extReplacements[ext]) {
        return `https://${mainPart}.${extReplacements[ext]}`;
      }
    }
    const popularDapps = [
      { name: 'pump.fun', pattern: /pump\.(fum|con|com|xyz|net)/ },
      { name: 'jup.ag', pattern: /jup\.(ag|co|com|net|xyz|fum)/ },
      { name: 'raydium.io', pattern: /raydium\.(io|co|com|net|xyz)/ },
      { name: 'uniswap.org', pattern: /uniswap\.(org|co|com|net|xyz)/ },
      { name: 'magiceden.io', pattern: /magiceden\.(io|co|com|net|xyz)/ },
      { name: 'opensea.io', pattern: /opensea\.(io|co|com|net)/ }
    ];
    for (const d of popularDapps) {
      if (d.pattern.test(domain) && domain !== d.name) {
        return `https://${d.name}`;
      }
    }
  } catch (e) {
    console.log('Error checking typo:', e);
  }
  return null;
}

function getDomainFromUrl(url: string): string {
  try {
    let domain = url.toLowerCase();
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    domain = domain.split('/')[0];
    return domain;
  } catch (e) {
    return '';
  }
}

const getWeb3InjectionScript = (evmAddress: string, solanaAddress: string, chainIdHex: string, walletConnected: boolean) => `
(function() {
  if (window.__numWalletInjected) return;
  window.__numWalletInjected = true;

  // Safe Console Forwarding to React Native
  function safeStringify(val) {
    try {
      return JSON.stringify(val);
    } catch (e) {
      return String(val);
    }
  }
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  console.log = function(...args) {
    originalLog.apply(console, args);
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        provider: 'console',
        method: 'log',
        params: args.map(arg => typeof arg === 'object' ? safeStringify(arg) : String(arg))
      }));
    } catch(e) {}
  };
  console.error = function(...args) {
    originalError.apply(console, args);
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        provider: 'console',
        method: 'error',
        params: args.map(arg => typeof arg === 'object' ? safeStringify(arg) : String(arg))
      }));
    } catch(e) {}
  };
  console.warn = function(...args) {
    originalWarn.apply(console, args);
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        provider: 'console',
        method: 'warn',
        params: args.map(arg => typeof arg === 'object' ? safeStringify(arg) : String(arg))
      }));
    } catch(e) {}
  };

  const callbacks = {};
  let msgId = 0;

  window.__numWalletCallbacks = callbacks;
  window.__numWalletReceiveResponse = function(id, result, error) {
    if (callbacks[id]) {
      const { resolve, reject } = callbacks[id];
      delete callbacks[id];
      if (error) {
        let parsedError = error;
        if (typeof error === 'string') {
          try {
            parsedError = JSON.parse(error);
          } catch(e) {}
        }
        reject(parsedError);
      } else {
        resolve(result);
      }
    }
  };

  function sendRequest(provider, method, params) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      callbacks[id] = { resolve, reject };
      window.ReactNativeWebView.postMessage(JSON.stringify({
        provider,
        method,
        params,
        id
      }));
    });
  }

  function decodeBase58(str) {
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const ALPHABET_MAP = {};
    for (let i = 0; i < ALPHABET.length; i++) {
      ALPHABET_MAP[ALPHABET[i]] = i;
    }
    const bytes = [0];
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (!(c in ALPHABET_MAP)) throw new Error('Non-base58 character');
      let carry = ALPHABET_MAP[c];
      for (let j = 0; j < bytes.length; j++) {
        carry += bytes[j] * 58;
        bytes[j] = carry & 0xff;
        carry >>= 8;
      }
      while (carry > 0) {
        bytes.push(carry & 0xff);
        carry >>= 8;
      }
    }
    for (let i = 0; str[i] === '1' && i < str.length - 1; i++) {
      bytes.push(0);
    }
    return new Uint8Array(bytes.reverse());
  }

  function createPublicKey(pkStr) {
    if (!pkStr) return null;
    try {
      const bytes = decodeBase58(pkStr);
      const mockBn = new Proxy({}, {
        get: (target, prop) => {
          if (prop === 'toArrayLike') {
            return (type, endian, length) => {
              if (type) {
                if (typeof type.from === 'function') {
                  return type.from(bytes);
                }
                try {
                  return new type(bytes);
                } catch (e) {
                  return bytes;
                }
              }
              return bytes;
            };
          }
          if (prop === 'toArray') {
            return (endian, length) => Array.from(bytes);
          }
          if (prop === 'toString') {
            return (radix) => {
              if (radix === 'hex' || radix === 16) {
                return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
              }
              return pkStr;
            };
          }
          if (prop === 'eq' || prop === 'equals') {
            return (other) => {
              if (!other) return false;
              return other.toString() === pkStr || (other._bn && other._bn.toString() === pkStr);
            };
          }
          return () => {};
        }
      });
      return {
        _bn: mockBn,
        toString: () => pkStr,
        toBase58: () => pkStr,
        toBytes: () => bytes,
        toBuffer: () => bytes,
        equals: (other) => other && other.toString() === pkStr
      };
    } catch (e) {
      console.error('Failed to create mock Solana PublicKey', e);
      return null;
    }
  }

  window.createPublicKey = createPublicKey;

  const ethListeners = {};
  const ethereum = {
    isMetaMask: true,
    isNumWallet: true,
    isConnected: function() { return !!this.selectedAddress; },
    chainId: "${chainIdHex}",
    selectedAddress: ${walletConnected ? `"${evmAddress}"` : 'null'},
    networkVersion: "${parseInt(chainIdHex, 16)}",
    request: function(args) {
      if (!args || typeof args !== 'object') {
        return Promise.reject(new Error('Invalid arguments'));
      }
      const method = args.method;
      const params = args.params;

      if (method === 'eth_accounts') {
        return Promise.resolve(this.selectedAddress ? [this.selectedAddress] : []);
      }
      if (method === 'eth_chainId') {
        return Promise.resolve("${chainIdHex}");
      }
      if (method === 'net_version') {
        return Promise.resolve("${parseInt(chainIdHex, 16)}");
      }

      return sendRequest('ethereum', method, params);
    },
    sendAsync: function(payload, callback) {
      if (!payload || !callback) return;
      this.request({ method: payload.method, params: payload.params })
        .then(result => callback(null, { id: payload.id, jsonrpc: '2.0', result }))
        .catch(error => callback(error));
    },
    send: function(payload, callbackOrBundle) {
      if (typeof callbackOrBundle === 'function') {
        return this.sendAsync(payload, callbackOrBundle);
      }
      if (payload && typeof payload === 'object') {
        const method = payload.method || payload;
        if (method === 'eth_accounts') {
          return ${walletConnected ? `["${evmAddress}"]` : '[]'};
        }
        if (method === 'eth_chainId') {
          return "${chainIdHex}";
        }
      }
      return this.request(payload);
    },
    enable: function() {
      return this.request({ method: 'eth_requestAccounts' });
    },
    on: function(event, callback) {
      if (!ethListeners[event]) ethListeners[event] = [];
      ethListeners[event].push(callback);
      return this;
    },
    removeListener: function(event, callback) {
      if (!ethListeners[event]) return this;
      ethListeners[event] = ethListeners[event].filter(cb => cb !== callback);
      return this;
    },
    addListener: function(event, callback) {
      return this.on(event, callback);
    },
    off: function(event, callback) {
      return this.removeListener(event, callback);
    },
    emit: function(event, ...args) {
      if (!ethListeners[event]) return;
      ethListeners[event].forEach(cb => {
        try { cb(...args); } catch (e) { console.error('Error in ethereum event callback', e); }
      });
    }
  };

  const solListeners = {};
  const solana = {
    isPhantom: true,
    isNumWallet: true,
    isConnected: ${walletConnected},
    publicKey: ${walletConnected ? `createPublicKey("${solanaAddress}")` : 'null'},
    connect: function(options) {
      if (options && options.onlyIfTrusted && !${walletConnected}) {
        return Promise.reject(new Error('Connection rejected'));
      }
      if (${walletConnected} && this.publicKey) {
        return Promise.resolve({ publicKey: this.publicKey });
      }
      return sendRequest('solana', 'connect', null)
        .then(res => {
          this.isConnected = true;
          const pkStr = res.publicKey;
          const pk = createPublicKey(pkStr);
          this.publicKey = pk;
          this.emit('connect', pk);
          return { publicKey: pk };
        });
    },
    disconnect: function() {
      this.isConnected = false;
      this.publicKey = null;
      this.emit('disconnect');
      return Promise.resolve();
    },
    request: function(args) {
      if (!args || typeof args !== 'object') {
        return Promise.reject(new Error('Invalid arguments'));
      }
      const { method, params } = args;
      if (method === 'connect') {
        return this.connect(params);
      }
      if (method === 'disconnect') {
        return this.disconnect();
      }
      if (method === 'signTransaction') {
        const tx = params && params.transaction ? params.transaction : params;
        return this.signTransaction(tx);
      }
      if (method === 'signAllTransactions') {
        const txs = params && params.transactions ? params.transactions : params;
        return this.signAllTransactions(txs);
      }
      if (method === 'signAndSendTransaction') {
        const tx = params && params.transaction ? params.transaction : params;
        const opts = params && params.options ? params.options : undefined;
        return this.signAndSendTransaction(tx, opts);
      }
      if (method === 'signMessage') {
        const msg = params && params.message ? params.message : params;
        return this.signMessage(msg);
      }
      return Promise.reject(new Error('Unsupported method: ' + method));
    },
    signTransaction: function(transaction) {
      let serialized;
      try {
        if (typeof transaction.serialize === 'function') {
          serialized = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
        } else {
          serialized = transaction.serializeMessage();
        }
      } catch (e) {
        try {
          serialized = transaction.serializeMessage();
        } catch (err) {
          serialized = transaction;
        }
      }
      const hex = Array.from(serialized).map(b => b.toString(16).padStart(2, '0')).join('');
      return sendRequest('solana', 'signTransaction', { transaction: hex })
        .then(res => {
          const signedBytes = new Uint8Array(res.signedTx.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
          transaction.serialize = function() {
            return signedBytes;
          };
          const numSignatures = signedBytes[0];
          if (numSignatures > 0) {
            const signature = signedBytes.slice(1, 1 + 64 * numSignatures);
            const sigs = [];
            for (let i = 0; i < numSignatures; i++) {
              sigs.push(signature.slice(i * 64, (i + 1) * 64));
            }
            if (transaction.signatures) {
              for (let i = 0; i < Math.min(transaction.signatures.length, sigs.length); i++) {
                if (transaction.signatures[i] && typeof transaction.signatures[i].signature !== 'undefined') {
                  transaction.signatures[i].signature = sigs[i];
                } else {
                  transaction.signatures[i] = sigs[i];
                }
              }
            }
            if (typeof transaction.addSignature === 'function') {
              try {
                transaction.addSignature(this.publicKey, sigs[0]);
              } catch (e) {}
            }
          }
          return transaction;
        });
    },
    signAllTransactions: function(transactions) {
      return Promise.all(transactions.map(tx => this.signTransaction(tx)));
    },
    signAndSendTransaction: function(transaction, options) {
      return this.signTransaction(transaction)
        .then(signedTx => {
          const serialized = signedTx.serialize();
          const hex = Array.from(serialized).map(b => b.toString(16).padStart(2, '0')).join('');
          return sendRequest('solana', 'sendTransaction', { transaction: hex });
        })
        .then(res => {
          return { signature: res.signature };
        });
    },
    signMessage: function(message) {
      let bytes;
      if (message && typeof message === 'object' && (message.constructor?.name === 'Uint8Array' || message instanceof Uint8Array || Array.isArray(message) || typeof message.length === 'number')) {
        bytes = new Uint8Array(message);
      } else if (typeof message === 'string') {
        const encoder = new TextEncoder();
        bytes = encoder.encode(message);
      } else {
        bytes = new Uint8Array(0);
      }
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      return sendRequest('solana', 'signMessage', { message: hex })
        .then(res => {
          const sigBytes = new Uint8Array(res.signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
          return {
            signature: sigBytes,
            publicKey: this.publicKey
          };
        });
    },
    on: function(event, callback) {
      if (!solListeners[event]) solListeners[event] = [];
      solListeners[event].push(callback);
      return this;
    },
    removeListener: function(event, callback) {
      if (!solListeners[event]) return this;
      solListeners[event] = solListeners[event].filter(cb => cb !== callback);
      return this;
    },
    addListener: function(event, callback) {
      return this.on(event, callback);
    },
    off: function(event, callback) {
      return this.removeListener(event, callback);
    },
    emit: function(event, ...args) {
      if (!solListeners[event]) return;
      solListeners[event].forEach(cb => {
        try { cb(...args); } catch (e) { console.error('Error in solana event callback', e); }
      });
    }
  };

  window.ethereum = ethereum;
  window.solana = solana;
  window.phantom = { solana: solana };

  // Announce EIP-6963 multi-injected provider for modern EVM dApps
  try {
    const info = {
      uuid: 'cb9b8e8f-7f89-4d6b-9c23-d9ea3d72b22f',
      name: 'Num Wallet',
      icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><circle cx="50" cy="50" r="45" fill="%233A8AFF"/><text x="50" y="62" font-family="sans-serif" font-size="34" font-weight="bold" fill="white" text-anchor="middle">N</text></svg>',
      rdns: 'io.numwallet.app'
    };
    const announce = () => {
      window.dispatchEvent(new CustomEvent('eip6963:announceProvider', {
        detail: Object.freeze({ info, provider: ethereum })
      }));
    };
    window.addEventListener('eip6963:requestProvider', announce);
    announce();
  } catch (e) {
    console.error('EIP-6963 announcement error:', e);
  }

  setTimeout(() => {
    window.dispatchEvent(new Event('ethereum#initialized'));
    window.dispatchEvent(new Event('solana#initialized'));
  }, 100);
})();
`;

const metadataMap: Record<string, { color: string; icon: string; pack: 'Feather' | 'Ionicons'; letter: string }> = {
  solana: { color: '#14F195', icon: 'sun', pack: 'Feather', letter: 'S' },
  ethereum: { color: '#627EEA', icon: 'zap', pack: 'Feather', letter: 'E' },
  smartchain: { color: '#F3BA2F', icon: 'layers', pack: 'Feather', letter: 'B' },
  bnb: { color: '#F3BA2F', icon: 'layers', pack: 'Feather', letter: 'B' },
  polygon: { color: '#8247E5', icon: 'hexagon', pack: 'Feather', letter: 'P' },
  arbitrum: { color: '#28A0F0', icon: 'activity', pack: 'Feather', letter: 'A' },
  optimism: { color: '#FF0420', icon: 'zap', pack: 'Feather', letter: 'O' },
  base: { color: '#0052FF', icon: 'link', pack: 'Feather', letter: 'Ba' },
  avalanche: { color: '#E84142', icon: 'activity', pack: 'Feather', letter: 'Av' },
  avalanchec: { color: '#E84142', icon: 'activity', pack: 'Feather', letter: 'Av' },
  fantom: { color: '#1969FF', icon: 'database', pack: 'Feather', letter: 'F' },
  ton: { color: '#0098EA', icon: 'zap', pack: 'Feather', letter: 'To' },
  theopennetwork: { color: '#0098EA', icon: 'zap', pack: 'Feather', letter: 'To' },
  bitcoin: { color: '#F7931A', icon: 'shield', pack: 'Feather', letter: 'Bi' },
  cardano: { color: '#0033AD', icon: 'disc', pack: 'Feather', letter: 'C' },
  ripple: { color: '#23292F', icon: 'anchor', pack: 'Feather', letter: 'X' },
  xrp: { color: '#23292F', icon: 'anchor', pack: 'Feather', letter: 'X' },
  sui: { color: '#6FB1E4', icon: 'droplet', pack: 'Feather', letter: 'Su' },
  aptos: { color: '#2DD4BF', icon: 'cpu', pack: 'Feather', letter: 'Ap' },
  tron: { color: '#EC0623', icon: 'triangle', pack: 'Feather', letter: 'T' },
  near: { color: '#000000', icon: 'globe', pack: 'Feather', letter: 'N' },
  polkadot: { color: '#E6007A', icon: 'disc', pack: 'Feather', letter: 'Po' },
  cronos: { color: '#002D74', icon: 'shield', pack: 'Feather', letter: 'Cr' },
  stellar: { color: '#000000', icon: 'globe', pack: 'Feather', letter: 'St' },
  cosmos: { color: '#2E3192', icon: 'globe', pack: 'Feather', letter: 'Co' },
  hyperliquid: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'Hy' },
  hpl: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'Hy' },
  hyperevm: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'HE' },
  hyp: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'HE' },
  hype: { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'HE' },
  '1337': { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'Hy' },
  '999': { color: '#04D9C4', icon: 'zap', pack: 'Feather', letter: 'HE' },
};

const renderDomainPreview = (tabUrl: string, isDark: boolean) => {
  const lowerUrl = tabUrl.toLowerCase();
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const labelColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const mutedBg = isDark ? '#16162a' : '#E5E7EB';
  const inputBg = isDark ? '#08080F' : '#FFFFFF';
  
  if (lowerUrl.includes('google.com') || lowerUrl.includes('google') || lowerUrl.includes('search')) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%' }}>
        <View style={{ flexDirection: 'row', gap: 1 }}>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#4285F4' }}>G</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#EA4335' }}>o</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#FBBC05' }}>o</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#4285F4' }}>g</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#34A853' }}>l</Text>
          <Text style={{ fontSize: 9, fontWeight: 'bold', color: '#EA4335' }}>e</Text>
        </View>
        <View style={{
          width: '90%',
          height: 10,
          borderRadius: 5,
          backgroundColor: inputBg,
          borderWidth: 0.5,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#D1D5DB',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 4,
          gap: 2
        }}>
          <Feather name="search" size={4} color={labelColor} />
          <View style={{ height: 1.5, width: '60%', backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#9CA3AF', borderRadius: 0.5 }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 3, marginTop: 1 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: mutedBg }} />
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: mutedBg }} />
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: mutedBg }} />
        </View>
      </View>
    );
  }

  if (lowerUrl.includes('uniswap') || lowerUrl.includes('uniswap.org')) {
    return (
      <View style={{ flex: 1, width: '100%', padding: 2, justifyContent: 'center', gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF007A' }} />
          <View style={{ width: 12, height: 4, borderRadius: 1, backgroundColor: '#FF007A30' }} />
        </View>
        <View style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          borderWidth: 0.5,
          borderColor: '#FF007A20',
          borderRadius: 4,
          padding: 3,
          gap: 3
        }}>
          <View style={{ height: 10, backgroundColor: inputBg, borderRadius: 2, paddingHorizontal: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ height: 1.5, width: '40%', backgroundColor: labelColor, borderRadius: 0.5 }} />
            <View style={{ width: 10, height: 6, borderRadius: 1, backgroundColor: mutedBg }} />
          </View>
          <View style={{ height: 10, backgroundColor: inputBg, borderRadius: 2, paddingHorizontal: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ height: 1.5, width: '30%', backgroundColor: labelColor, borderRadius: 0.5 }} />
            <View style={{ width: 10, height: 6, borderRadius: 1, backgroundColor: '#FF007A40' }} />
          </View>
          <View style={{ height: 8, borderRadius: 2, backgroundColor: '#FF007A', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ height: 1.5, width: '30%', backgroundColor: '#FFFFFF', borderRadius: 0.5 }} />
          </View>
        </View>
      </View>
    );
  }

  if (lowerUrl.includes('jup.ag') || lowerUrl.includes('jupiter') || lowerUrl.includes('raydium') || lowerUrl.includes('orca') || lowerUrl.includes('pancakeswap')) {
    const primaryColor = lowerUrl.includes('pancakeswap') ? '#D1884F' : '#19FB9B';
    return (
      <View style={{ flex: 1, width: '100%', padding: 2, justifyContent: 'center', gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: primaryColor }} />
          <View style={{ width: 18, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 8, height: 1.5, backgroundColor: primaryColor, borderRadius: 0.5 }} />
          </View>
        </View>
        <View style={{
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
          borderWidth: 0.5,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB',
          borderRadius: 4,
          padding: 3,
          gap: 2
        }}>
          <View style={{ height: 8, backgroundColor: inputBg, borderRadius: 2, justifyContent: 'center', paddingLeft: 2 }}>
            <View style={{ height: 1.5, width: '50%', backgroundColor: labelColor }} />
          </View>
          <View style={{ height: 8, backgroundColor: inputBg, borderRadius: 2, justifyContent: 'center', paddingLeft: 2 }}>
            <View style={{ height: 1.5, width: '35%', backgroundColor: labelColor }} />
          </View>
          <View style={{ height: 8, borderRadius: 2, backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ height: 1.5, width: '40%', backgroundColor: '#000000', borderRadius: 0.5 }} />
          </View>
        </View>
      </View>
    );
  }

  if (lowerUrl.includes('x.com') || lowerUrl.includes('twitter.com') || lowerUrl.includes('twitter')) {
    return (
      <View style={{ flex: 1, width: '100%', padding: 2, justifyContent: 'flex-start', gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB', paddingBottom: 2 }}>
          <Feather name="twitter" size={6} color={isDark ? '#FFFFFF' : '#1DA1F2'} />
          <View style={{ width: 10, height: 4, borderRadius: 2, backgroundColor: mutedBg }} />
        </View>
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: mutedBg }} />
            <View style={{ flex: 1, gap: 1 }}>
              <View style={{ height: 2, width: '40%', backgroundColor: textColor, borderRadius: 0.5 }} />
              <View style={{ height: 1.5, width: '90%', backgroundColor: labelColor, borderRadius: 0.5 }} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: mutedBg }} />
            <View style={{ flex: 1, gap: 1 }}>
              <View style={{ height: 2, width: '30%', backgroundColor: textColor, borderRadius: 0.5 }} />
              <View style={{ height: 1.5, width: '80%', backgroundColor: labelColor, borderRadius: 0.5 }} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (lowerUrl.includes('facebook.com') || lowerUrl.includes('facebook')) {
    return (
      <View style={{ flex: 1, width: '100%', padding: 0, justifyContent: 'flex-start' }}>
        <View style={{ height: 10, backgroundColor: '#1877F2', width: '100%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3, justifyContent: 'space-between' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 5, fontWeight: 'bold' }}>facebook</Text>
          <View style={{ flexDirection: 'row', gap: 1 }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </View>
        </View>
        <View style={{ padding: 3, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: mutedBg }} />
            <View style={{ gap: 0.5 }}>
              <View style={{ height: 2, width: 20, backgroundColor: textColor }} />
              <View style={{ height: 1, width: 10, backgroundColor: labelColor }} />
            </View>
          </View>
          <View style={{ height: 1.5, width: '90%', backgroundColor: textColor }} />
          <View style={{ height: 16, width: '100%', borderRadius: 2, backgroundColor: mutedBg }} />
        </View>
      </View>
    );
  }

  if (lowerUrl.includes('dexscreener') || lowerUrl.includes('coingecko') || lowerUrl.includes('etherscan') || lowerUrl.includes('solscan')) {
    return (
      <View style={{ flex: 1, width: '100%', padding: 2, justifyContent: 'center', gap: 3 }}>
        <View style={{ height: 20, width: '100%', backgroundColor: inputBg, borderRadius: 3, padding: 2, gap: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: '100%', gap: 0.7, justifyContent: 'center' }}>
            <View style={{ height: '30%', width: 2, backgroundColor: '#EF4444', borderRadius: 0.3 }} />
            <View style={{ height: '45%', width: 2, backgroundColor: '#EF4444', borderRadius: 0.3 }} />
            <View style={{ height: '25%', width: 2, backgroundColor: '#10B981', borderRadius: 0.3 }} />
            <View style={{ height: '55%', width: 2, backgroundColor: '#10B981', borderRadius: 0.3 }} />
            <View style={{ height: '40%', width: 2, backgroundColor: '#EF4444', borderRadius: 0.3 }} />
            <View style={{ height: '70%', width: 2, backgroundColor: '#10B981', borderRadius: 0.3 }} />
            <View style={{ height: '90%', width: 2, backgroundColor: '#10B981', borderRadius: 0.3 }} />
            <View style={{ height: '75%', width: 2, backgroundColor: '#10B981', borderRadius: 0.3 }} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 1 }}>
          <View style={{ gap: 1 }}>
            <View style={{ height: 2, width: 16, backgroundColor: textColor }} />
            <View style={{ height: 1.5, width: 10, backgroundColor: labelColor }} />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 1 }}>
            <View style={{ height: 2, width: 12, backgroundColor: textColor }} />
            <View style={{ height: 1.5, width: 8, backgroundColor: '#10B981' }} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, width: '100%', padding: 2, justifyContent: 'center', gap: 4 }}>
      <LinearGradient
        colors={isDark ? ['#3A8AFF20', '#00000000'] : ['#3A8AFF10', '#FFFFFF00']}
        style={{ height: 20, width: '100%', borderRadius: 3, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }}
      >
        <View style={{ height: 2, width: '80%', backgroundColor: textColor, borderRadius: 1, marginBottom: 1 }} />
        <View style={{ height: 1.5, width: '50%', backgroundColor: labelColor, borderRadius: 0.5 }} />
      </LinearGradient>
      <View style={{ flexDirection: 'row', gap: 3, justifyContent: 'center' }}>
        <View style={{ width: '45%', height: 14, backgroundColor: mutedBg, borderRadius: 2, padding: 1.5, gap: 1.5 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
          <View style={{ height: 1.5, width: '80%', backgroundColor: labelColor }} />
        </View>
        <View style={{ width: '45%', height: 14, backgroundColor: mutedBg, borderRadius: 2, padding: 1.5, gap: 1.5 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)' }} />
          <View style={{ height: 1.5, width: '80%', backgroundColor: labelColor }} />
        </View>
      </View>
    </View>
  );
};

const getWebacySecurityAnalysis = (url: string): SecuritySummaryType => {
  const domain = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].toLowerCase();
  
  const verifiedDomains = [
    'jup.ag', 'raydium.io', 'orca.so', 'uniswap.org', 'pancakeswap.finance', 
    'magiceden.io', 'opensea.io', 'blur.io', 'coingecko.com', 'dexscreener.com',
    'etherscan.io', 'solscan.io', 'google.com'
  ];
  
  const isVerified = verifiedDomains.some(d => domain.includes(d) || d.includes(domain));
  
  const isSuspicious = domain.includes('claim') || domain.includes('free-nfts') || 
                       domain.includes('airdrop') || domain.includes('reward') || 
                       domain.includes('gift') || domain.includes('.xyz') && !isVerified;

  if (isSuspicious) {
    return {
      status: 'DANGER',
      statusText: 'Malicious / Phishing Site Flagged',
      rating: '1.2 / 10 (Danger)',
      statusColor: '#EF4444',
      isVerified: false,
      phishingReported: true,
      permissions: 'Read address, request message signatures, request transaction approvals.',
      risks: [
        'Domain flagged for phishing and automated wallet draining actions.',
        'High probability of requesting transaction signatures that transfer token approvals.',
        'Name uses bait words like "claim" or "free" typical of malicious smart contracts.'
      ],
      recommendation: 'We strongly advise AGAINST connecting. Phishing sites can drain your assets instantly.'
    };
  }
  
  if (isVerified) {
    return {
      status: 'SECURE',
      statusText: 'Safe & Verified dApp',
      rating: '9.8 / 10 (Excellent)',
      statusColor: '#10B981',
      isVerified: true,
      phishingReported: false,
      permissions: 'Read address, request message signatures, request transaction approvals.',
      risks: [
        'Standard interactive risks. Always review the exact swap parameters on the sign confirmation screen.'
      ],
      recommendation: 'Safe to connect. This is a verified official decentralized application.'
    };
  }

  return {
    status: 'WARNING',
    statusText: 'Unverified / Unknown Platform',
    rating: '6.5 / 10 (Neutral)',
    statusColor: '#F59E0B',
    isVerified: false,
    phishingReported: false,
    permissions: 'Read address, request message signatures, request transaction approvals.',
    risks: [
      'This domain is not on our verified list. Exercise caution.',
      'Phishing domains often copy layout of verified sites. Check address spelling.'
    ],
    recommendation: 'Proceed with caution. Ensure this URL matches official links from project developers.'
  };
};

const getNetworkSecurityAnalysis = (chainName: string, chainIdHex: string, rpcUrls: string[]) => {
  const chainId = parseInt(chainIdHex, 16);
  const rpcUrl = rpcUrls?.[0] || '';
  const rpcLower = rpcUrl.toLowerCase();
  const nameLower = chainName.toLowerCase();
  
  const isTestnet = nameLower.includes('test') || 
                    nameLower.includes('sepolia') || 
                    nameLower.includes('goerli') || 
                    nameLower.includes('holesky') || 
                    nameLower.includes('devnet') || 
                    nameLower.includes('amoy') || 
                    nameLower.includes('mumbai') ||
                    [11155111, 5, 17000, 421614, 84532, 999, 80002].includes(chainId);

  const risks: string[] = [];
  let rating = '9.5 / 10 (Safe)';
  let statusColor = '#10B981';
  let status = 'SECURE';
  let recommendation = 'Safe to import. This network details look standard.';

  if (chainId === 1 && rpcLower && !rpcLower.includes('etherscan') && !rpcLower.includes('infura') && !rpcLower.includes('alchemy') && !rpcLower.includes('llama') && !rpcLower.includes('ankr')) {
    risks.push('Chain ID conflicts with Ethereum Mainnet but uses an unrecognized RPC. This could lead to transaction routing manipulation (RPC hijacking).');
    rating = '2.0 / 10 (Danger)';
    statusColor = '#EF4444';
    status = 'DANGER';
    recommendation = 'We advise caution. Using a non-standard RPC for mainnet chain ID 1 can expose your transaction details or simulate fake balances.';
  }

  if (rpcLower.includes('claim') || rpcLower.includes('airdrop') || rpcLower.includes('free-nfts')) {
    risks.push('RPC URL uses terms typically associated with phishing websites.');
    rating = '1.5 / 10 (Danger)';
    statusColor = '#EF4444';
    status = 'DANGER';
    recommendation = 'DO NOT import. The RPC provider endpoint appears to be malicious.';
  }

  return {
    isTestnet,
    rating,
    statusColor,
    status,
    risks: risks.length > 0 ? risks : ['Standard EVM integration. Ensure you trust the dApp introducing this chain.'],
    recommendation
  };
};

export default function HubScreen() {
  const { isDarkMode, accountNumber, minimizedTabs, setMinimizedTabs, portfolioAssets, transactionPin, bookmarkedDapps, addBookmark, removeBookmark, addTransaction } = useUserStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [customChains, setCustomChains] = useState<any[]>([]);
  const [webViewError, setWebViewError] = useState<{ code: number; description: string; url: string } | null>(null);
  const [showAddChainModal, setShowAddChainModal] = useState(false);
  const [addChainRequest, setAddChainRequest] = useState<{ id: number; params: any } | null>(null);
  const [urlSecuritySummary, setUrlSecuritySummary] = useState<SecuritySummaryType | null>(null);
  const [signingSecuritySummary, setSigningSecuritySummary] = useState<SecuritySummaryType | null>(null);

  useEffect(() => {
    const loadCustomChains = async () => {
      try {
        const stored = await AsyncStorage.getItem('num-wallet-custom-chains');
        if (stored) {
          const parsed = JSON.parse(stored);
          setCustomChains(parsed);
          parsed.forEach((c: any) => {
            if (c.chainId && c.rpcUrl) {
              WalletEngine.registerCustomRpc(c.chainId, c.rpcUrl);
            }
          });
        }
      } catch (e) {
        console.log('Failed to load custom chains:', e);
      }
    };
    loadCustomChains();
  }, []);

  const saveCustomChains = async (chains: any[]) => {
    try {
      await AsyncStorage.setItem('num-wallet-custom-chains', JSON.stringify(chains));
    } catch (e) {
      console.log('Failed to save custom chains:', e);
    }
  };



  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    icon: 'info' as any,
    iconColor: Colors.brand.bright as string,
    showConfirm: false,
    confirmText: 'Confirm',
    onConfirm: undefined as (() => void) | undefined,
  });

  const dynamicChains = useMemo(() => {
    const stdChains = portfolioAssets.map(asset => {
      const firstTokenSymbol = asset.tokens?.[0]?.symbol || 'ETH';
      return {
        id: asset.id,
        name: asset.chain,
        logo: asset.logo,
        symbol: firstTokenSymbol,
        chainId: chainIdMap[asset.id] || 1
      };
    });

    const custChainsMapped = customChains.map(c => ({
      id: c.id,
      name: c.name,
      logo: null,
      symbol: c.currencySymbol,
      chainId: c.chainId
    }));

    return [...stdChains, ...custChainsMapped];
  }, [portfolioAssets, customChains]);

  const dynamicSupportedNetworks = useMemo(() => {
    const standardNets = portfolioAssets.map(asset => {
      const meta = metadataMap[asset.id] || { color: '#3A8AFF', icon: 'zap', pack: 'Feather', letter: asset.chain.substring(0, 2) };
      return {
        id: asset.id,
        name: asset.chain,
        color: meta.color,
        icon: meta.icon as any,
        pack: meta.pack,
        letter: meta.letter,
        logo: asset.logo
      };
    });

    const customNets = customChains
      .filter(c => !c.isTestnet)
      .map(c => ({
        id: c.id,
        name: c.name,
        color: '#8A3AFF',
        icon: 'link' as const,
        pack: 'Feather' as const,
        letter: c.currencySymbol.substring(0, 2),
        logo: null
      }));

    return [
      { id: null, name: 'All', color: Colors.brand.bright, icon: 'apps-sharp' as const, pack: 'Ionicons' as const, letter: '*', logo: null },
      ...standardNets,
      ...customNets
    ];
  }, [portfolioAssets, customChains]);

  const [searchUrl, setSearchUrl] = useState('');
  const [browserUrl, setBrowserUrl] = useState<string | null>(null);
  const [approvedOrigins, setApprovedOrigins] = useState<string[]>([]);
  const [showTabsModal, setShowTabsModal] = useState(false);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [activeNetworkIndex, setActiveNetworkIndex] = useState(0);
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<string | null>(null);

  const activeNetwork = dynamicChains[activeNetworkIndex] || dynamicChains[0];
  const evmChainId = activeNetwork.chainId || chainIdMap[activeNetwork.id] || 1;

  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(browserUrl || '');

  const currentDomain = useMemo(() => getDomainFromUrl(currentUrl), [currentUrl]);
  const isCurrentDomainConnected = useMemo(() => {
    return approvedOrigins.includes(currentDomain);
  }, [approvedOrigins, currentDomain]);

  useEffect(() => {
    const loadApprovedOrigins = async () => {
      try {
        const stored = await AsyncStorage.getItem('num-wallet-approved-origins');
        if (stored) {
          setApprovedOrigins(JSON.parse(stored));
        }
      } catch (e) {
        console.log('Failed to load approved origins:', e);
      }
    };
    loadApprovedOrigins();
  }, []);

  const saveApprovedOrigins = async (origins: string[]) => {
    try {
      await AsyncStorage.setItem('num-wallet-approved-origins', JSON.stringify(origins));
    } catch (e) {
      console.log('Failed to save approved origins:', e);
    }
  };

  const [walletAddresses, setWalletAddresses] = useState<MultiChainWallet | null>(null);
  const [activeConnectionRequest, setActiveConnectionRequest] = useState<{ provider: string; id: number } | null>(null);
  const [activeRequest, setActiveRequest] = useState<ActiveRequest | null>(null);
  const [showSigningModal, setShowSigningModal] = useState(false);

  useEffect(() => {
    const loadAddresses = async () => {
      if (transactionPin) {
        const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
        setWalletAddresses(wallet);
      }
    };
    loadAddresses();
  }, [transactionPin]);

  useEffect(() => {
    const fetchUrlAnalysis = async () => {
      if (!currentUrl) {
        setUrlSecuritySummary(null);
        return;
      }
      try {
        const res = await WebacyService.screenUrl(currentUrl);
        let status: 'SECURE' | 'WARNING' | 'DANGER' = 'SECURE';
        let statusColor = '#10B981';
        let statusText = 'Safe & Verified dApp';
        let rating = '9.8 / 10 (Excellent)';
        let recommendation = 'Safe to connect. This is a verified official decentralized application.';
        
        if (res.riskLevel === 'high') {
          status = 'DANGER';
          statusColor = '#EF4444';
          statusText = 'Malicious / Phishing Site Flagged';
          rating = '1.2 / 10 (Danger)';
          recommendation = 'We strongly advise AGAINST connecting. Phishing sites can drain your assets instantly.';
        } else if (res.riskLevel === 'medium') {
          status = 'WARNING';
          statusColor = '#F59E0B';
          statusText = 'Unverified / Unknown Platform';
          rating = '6.5 / 10 (Neutral)';
          recommendation = 'Proceed with caution. Ensure this URL matches official links from project developers.';
        }

        setUrlSecuritySummary({
          status,
          statusText,
          rating,
          statusColor,
          isVerified: status === 'SECURE',
          phishingReported: status === 'DANGER',
          permissions: 'Read address, request message signatures, request transaction approvals.',
          risks: [
            res.description || 'URL checked against Webacy threat database.',
            ...(res.riskLevel === 'high' ? ['Domain flagged for phishing and automated wallet draining actions.', 'High probability of requesting transaction signatures that transfer token approvals.'] : [])
          ],
          recommendation
        });
      } catch (e) {
        console.log('Error screening URL via Webacy:', e);
      }
    };
    fetchUrlAnalysis();
  }, [currentUrl]);

  useEffect(() => {
    const fetchSigningRisk = async () => {
      if (!activeRequest) {
        setSigningSecuritySummary(null);
        return;
      }
      
      setSigningSecuritySummary(urlSecuritySummary);

      try {
        if (activeRequest.provider === 'ethereum') {
          const tx = activeRequest.params?.[0];
          if (tx) {
            const fromAddr = walletAddresses?.evmAddress || '0x0000000000000000000000000000000000000000';
            const res = await WebacyService.screenTransaction(
              fromAddr,
              tx.to || '0x0000000000000000000000000000000000000000',
              tx.data || '0x',
              tx.value || '0',
              activeNetwork.chainId?.toString() || 'ethereum'
            );

            setSigningSecuritySummary({
              status: res.status,
              statusText: res.statusText,
              rating: `${(100 - res.overallRisk).toFixed(0)}/100 (Risk: ${res.overallRisk}%)`,
              statusColor: res.status === 'DANGER' ? '#EF4444' : res.status === 'WARNING' ? '#F59E0B' : '#10B981',
              isVerified: res.status === 'SECURE',
              phishingReported: res.status === 'DANGER',
              permissions: 'Sign & execute raw EVM transaction on-chain.',
              risks: res.risks.length > 0 ? res.risks : ['Transaction audited by Webacy Risk Engine.'],
              recommendation: res.recommendation
            });
          }
        } else if (activeRequest.provider === 'solana') {
          // Solana recipient screening
          const txData = activeRequest.params?.transaction || '';
        }
      } catch (e) {
        console.log('Error analyzing transaction risk:', e);
      }
    };
    fetchSigningRisk();
  }, [activeRequest, urlSecuritySummary, walletAddresses, activeNetwork]);

  const web3BridgeScript = useMemo(() => {
    if (!walletAddresses) return '';
    const evmAddress = walletAddresses.evmAddress || '0x0000000000000000000000000000000000000000';
    const solanaAddress = walletAddresses.solanaAddress || '';
    const evmChainIdHex = '0x' + evmChainId.toString(16);
    return getWeb3InjectionScript(evmAddress, solanaAddress, evmChainIdHex, isCurrentDomainConnected);
  }, [walletAddresses, activeNetwork, isCurrentDomainConnected]);

  useEffect(() => {
    if (webViewRef.current && walletAddresses) {
      const evmChainIdHex = '0x' + evmChainId.toString(16);
      const updateCode = `
        if (window.ethereum) {
          window.ethereum.chainId = "${evmChainIdHex}";
          window.ethereum.networkVersion = "${evmChainId}";
          window.ethereum.selectedAddress = ${isCurrentDomainConnected ? `"${walletAddresses.evmAddress}"` : 'null'};
          window.ethereum.isConnected = () => ${isCurrentDomainConnected};
          if (window.ethereum.emit) {
            window.ethereum.emit('chainChanged', "${evmChainIdHex}");
            window.ethereum.emit('accountsChanged', ${isCurrentDomainConnected ? `["${walletAddresses.evmAddress}"]` : '[]'});
          }
        }
        if (window.solana) {
          window.solana.isConnected = ${isCurrentDomainConnected};
          window.solana.publicKey = ${isCurrentDomainConnected ? `window.createPublicKey("${walletAddresses.solanaAddress}")` : 'null'};
          if (${isCurrentDomainConnected} && window.solana.emit && window.createPublicKey) {
            window.solana.emit('connect', window.createPublicKey("${walletAddresses.solanaAddress}"));
          }
        }
      `;
      webViewRef.current.injectJavaScript(updateCode);
    }
  }, [activeNetwork, isCurrentDomainConnected, walletAddresses]);

  useEffect(() => {
    if (browserUrl) {
      setCurrentUrl(browserUrl);
    } else {
      setCurrentUrl('');
    }
  }, [browserUrl]);

  const isDapp = useMemo(() => {
    if (!currentUrl) return false;
    const lower = currentUrl.toLowerCase();
    const dappKeywords = [
      'jup.ag', 'raydium.io', 'orca.so', 'uniswap', 'pancakeswap', 
      'quickswap', 'magiceden', 'blur.io', 'opensea', 'dapp', 'web3', 
      'phantom', 'metamask', 'dexscreener', 'coingecko', 'etherscan', 'solscan',
      'trading-lite'
    ];
    return dappKeywords.some(keyword => lower.includes(keyword));
  }, [currentUrl]);

  const handleBackPress = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      handleCloseBrowser();
    }
  };

  const handleReload = () => {
    webViewRef.current?.reload();
  };

  const handleNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    const prevUrl = currentUrl;
    setCurrentUrl(navState.url);

    if (prevUrl) {
      setMinimizedTabs(minimizedTabs.map(t => {
        if (t.url.toLowerCase() === prevUrl.toLowerCase()) {
          const cleanTabDomain = navState.url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
          return {
            ...t,
            url: navState.url,
            title: navState.title || t.title || cleanTabDomain,
            favicon: `https://www.google.com/s2/favicons?domain=${cleanTabDomain}&sz=64`
          };
        }
        return t;
      }));
      if (browserUrl === prevUrl) {
        setBrowserUrl(navState.url);
      }
    }
  };

  const handleMessage = async (event: any) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      const { provider, method, params, id } = payload;
      if (!provider || !method) return;

      if (provider === 'console') {
        console.log(`[WebView Console ${method}]`, params.join(' '));
        return;
      }

      if (method === 'eth_requestAccounts' || method === 'eth_accounts' || (provider === 'solana' && method === 'connect')) {
        if (isCurrentDomainConnected && walletAddresses) {
          let result: any = null;
          if (provider === 'ethereum') {
            result = [walletAddresses.evmAddress];
          } else {
            result = { publicKey: walletAddresses.solanaAddress };
          }
          const responseCode = `window.__numWalletReceiveResponse(${id}, ${JSON.stringify(result)}, null);`;
          webViewRef.current?.injectJavaScript(responseCode);
        } else {
          setActiveConnectionRequest({ provider, id });
          setShowAuthModal(true);
        }
      } else if (method === 'eth_sendTransaction' || (provider === 'solana' && (method === 'signTransaction' || method === 'signAndSendTransaction' || method === 'sendTransaction'))) {
        setActiveRequest({ id, provider, method, params });
        setShowSigningModal(true);
      } else if (method === 'personal_sign' || method === 'eth_signTypedData' || method === 'eth_signTypedData_v4' || (provider === 'solana' && method === 'signMessage')) {
        setActiveRequest({ id, provider, method, params });
        setShowSigningModal(true);
      } else if (method === 'wallet_switchEthereumChain') {
        const targetHex = params?.[0]?.chainId;
        const targetId = parseInt(targetHex, 16);
        const matchedIndex = dynamicChains.findIndex(c => c.chainId === targetId);
        if (matchedIndex !== -1) {
          setActiveNetworkIndex(matchedIndex);
          const responseCode = `window.__numWalletReceiveResponse(${id}, null, null);`;
          webViewRef.current?.injectJavaScript(responseCode);
        } else {
          const responseCode = `window.__numWalletReceiveResponse(${id}, null, JSON.stringify({ code: 4902, message: "Unrecognized chain ID: " + targetHex }));`;
          webViewRef.current?.injectJavaScript(responseCode);
        }
      } else if (method === 'wallet_addEthereumChain') {
        const addParams = params?.[0];
        const targetHex = addParams?.chainId;
        const targetId = parseInt(targetHex, 16);
        const matchedIndex = dynamicChains.findIndex(c => c.chainId === targetId);
        if (matchedIndex !== -1) {
          setActiveNetworkIndex(matchedIndex);
          const responseCode = `window.__numWalletReceiveResponse(${id}, null, null);`;
          webViewRef.current?.injectJavaScript(responseCode);
        } else {
          setAddChainRequest({ id, params });
          setShowAddChainModal(true);
        }
      } else {
        const responseCode = `window.__numWalletReceiveResponse(${id}, null, "Unsupported method: " + method);`;
        webViewRef.current?.injectJavaScript(responseCode);
      }
    } catch (e) {
      console.error('Error handling Web3 RPC message:', e);
    }
  };

  const handleCycleNetwork = () => {
    setActiveNetworkIndex((prev) => (prev + 1) % dynamicChains.length);
  };

  const handleConnectionPress = () => {
    if (isCurrentDomainConnected) {
      const updated = approvedOrigins.filter(o => o !== currentDomain);
      setApprovedOrigins(updated);
      saveApprovedOrigins(updated);
      addTransaction({
        type: 'dApp Disconnect',
        fromSymbol: '',
        toSymbol: '',
        fromAmount: '',
        toAmount: '',
        chain: 'Browser',
        status: 'Success',
        txHash: currentDomain
      });
    } else {
      setShowAuthModal(true);
    }
  };

  const confirmConnection = () => {
    const updated = [...approvedOrigins.filter(o => o !== currentDomain), currentDomain];
    setApprovedOrigins(updated);
    saveApprovedOrigins(updated);
    addTransaction({
      type: 'dApp Connect',
      fromSymbol: '',
      toSymbol: '',
      fromAmount: '',
      toAmount: '',
      chain: 'Browser',
      status: 'Success',
      txHash: currentDomain
    });

    if (activeConnectionRequest) {
      const { provider, id } = activeConnectionRequest;
      const responseCode = `
        (function() {
          const result = ${provider === 'ethereum'} ? ["${walletAddresses?.evmAddress || '0x0000000000000000000000000000000000000000'}"] : { publicKey: "${walletAddresses?.solanaAddress || ''}" };
          window.__numWalletReceiveResponse(${id}, result, null);
        })();
      `;
      webViewRef.current?.injectJavaScript(responseCode);
      setActiveConnectionRequest(null);
    }
    setShowAuthModal(false);
  };

  const confirmAddChain = () => {
    if (addChainRequest) {
      const { id, params } = addChainRequest;
      const addParams = params?.[0];
      const chainIdHex = addParams?.chainId;
      const chainId = parseInt(chainIdHex, 16);
      const chainName = addParams?.chainName || `Custom Chain ${chainId}`;
      const rpcUrls = addParams?.rpcUrls || [];
      const blockExplorerUrls = addParams?.blockExplorerUrls || [];
      const nativeCurrency = addParams?.nativeCurrency;
      
      const analysis = getNetworkSecurityAnalysis(chainName, chainIdHex, rpcUrls);
      
      const newChain = {
        id: `custom_${chainId}`,
        name: chainName,
        chainId: chainId,
        rpcUrl: rpcUrls[0] || '',
        blockExplorerUrl: blockExplorerUrls[0] || '',
        currencySymbol: nativeCurrency?.symbol || 'ETH',
        isTestnet: analysis.isTestnet,
        logo: null
      };

      WalletEngine.registerCustomRpc(chainId, rpcUrls[0] || '');

      setCustomChains(prev => {
        const filtered = prev.filter(c => c.chainId !== chainId);
        const updated = [...filtered, newChain];
        saveCustomChains(updated);
        return updated;
      });

      const responseCode = `window.__numWalletReceiveResponse(${id}, null, null);`;
      webViewRef.current?.injectJavaScript(responseCode);

      setAddChainRequest(null);
    }
    setShowAddChainModal(false);
  };

  const cancelAddChain = () => {
    if (addChainRequest) {
      const { id } = addChainRequest;
      const responseCode = `window.__numWalletReceiveResponse(${id}, null, JSON.stringify({ code: 4001, message: "User rejected network addition" }));`;
      webViewRef.current?.injectJavaScript(responseCode);
      setAddChainRequest(null);
    }
    setShowAddChainModal(false);
  };

  useEffect(() => {
    if (customChains.length > 0) {
      const lastChain = customChains[customChains.length - 1];
      const matchedIdx = dynamicChains.findIndex(c => c.id === lastChain.id);
      if (matchedIdx !== -1) {
        setActiveNetworkIndex(matchedIdx);
      }
    }
  }, [customChains, dynamicChains]);

  const cancelConnection = () => {
    if (activeConnectionRequest) {
      const { id } = activeConnectionRequest;
      const responseCode = `window.__numWalletReceiveResponse(${id}, null, "User rejected connection request");`;
      webViewRef.current?.injectJavaScript(responseCode);
      setActiveConnectionRequest(null);
    }
    setShowAuthModal(false);
  };

  const getShortAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getActiveConnectedAddressText = () => {
    if (!walletAddresses) return 'Not Decrypted';
    if (activeNetwork.id === 'solana') {
      return getShortAddress(walletAddresses.solanaAddress);
    }
    if (activeNetwork.id === 'ton') {
      return getShortAddress(walletAddresses.tonAddress);
    }
    if (activeNetwork.id === 'ripple' || activeNetwork.id === 'xrp') {
      return getShortAddress(walletAddresses.xrpAddress);
    }
    return getShortAddress(walletAddresses.evmAddress);
  };

  const getTransactionDetails = () => {
    if (!activeRequest) return [];
    const details = [
      { label: 'dApp URL', value: currentUrl },
      { label: 'Network', value: activeNetwork.name },
    ];
    if (activeRequest.provider === 'ethereum') {
      const tx = activeRequest.params?.[0];
      if (tx) {
        if (tx.to) details.push({ label: 'Contract Address', value: tx.to });
        if (tx.value) {
          try {
            const valWei = BigInt(tx.value).toString();
            const valEth = parseFloat(ethers.formatEther(valWei)).toFixed(6);
            details.push({ label: 'Value to Spend', value: `${valEth} ETH` });
          } catch (e) {
            details.push({ label: 'Value (Hex)', value: tx.value });
          }
        }
        
        // Add estimated gas fee
        const gasLimit = tx.gas || tx.gasLimit || '0x15f90'; 
        const gasPrice = tx.gasPrice || '0x4a817c800'; 
        try {
          const estGasVal = BigInt(gasLimit) * BigInt(gasPrice);
          const estGasEth = parseFloat(ethers.formatEther(estGasVal)).toFixed(6);
          details.push({ label: 'Estimated Gas Fee', value: `${estGasEth} ETH` });
        } catch (e) {}

        if (tx.data && tx.data !== '0x') {
          const dataStr = tx.data.toLowerCase();
          if (dataStr.startsWith('0x095ea7b3')) {
            try {
              const spender = '0x' + dataStr.substring(34, 74);
              const amountHex = '0x' + dataStr.substring(74);
              const amountVal = BigInt(amountHex);
              let amountText = '';
              if (amountVal > BigInt('1000000000000000000000000000')) {
                amountText = 'Unlimited Approval';
              } else {
                amountText = (parseFloat(amountVal.toString()) / 1e18).toFixed(4);
              }
              details.push({ label: 'Action', value: 'ERC20 Token Approval' });
              details.push({ label: 'Spender Spaced', value: spender.substring(0, 10) + '...' });
              details.push({ label: 'Allowance Limit', value: amountText });
            } catch (e) {
              details.push({ label: 'Action', value: 'Smart Contract Call' });
            }
          } else if (dataStr.startsWith('0xa9059cbb')) {
            try {
              const toAddr = '0x' + dataStr.substring(34, 74);
              const transferValHex = '0x' + dataStr.substring(74);
              const transferVal = BigInt(transferValHex);
              const amountText = (parseFloat(transferVal.toString()) / 1e18).toFixed(4);
              details.push({ label: 'Action', value: 'Token Transfer' });
              details.push({ label: 'Recipient', value: toAddr.substring(0, 10) + '...' });
              details.push({ label: 'Amount', value: amountText });
            } catch (e) {
              details.push({ label: 'Action', value: 'Smart Contract Call' });
            }
          } else {
            details.push({ label: 'Action', value: 'Smart Contract Execution' });
          }
        } else {
          details.push({ label: 'Action', value: 'Native Token Transfer' });
        }
      }
    } else if (activeRequest.provider === 'solana') {
      if (activeRequest.method === 'signMessage') {
        details.push({ label: 'Action', value: 'Sign Message (Auth / Ownership)' });
        const msgHex = activeRequest.params?.message;
        if (msgHex) {
          let decodedMsg = '';
          try {
            const cleanedHex = msgHex.startsWith('0x') ? msgHex.slice(2) : msgHex;
            decodedMsg = Buffer.from(cleanedHex, 'hex').toString('utf8');
          } catch (e) {
            decodedMsg = msgHex;
          }
          details.push({ label: 'Message Details', value: decodedMsg });
        }
      } else {
        details.push({ label: 'Action', value: 'Solana Transaction Signature' });
        details.push({ label: 'Estimated Fee', value: '0.000005 SOL' });
        const txHex = typeof activeRequest.params === 'string' ? activeRequest.params : activeRequest.params?.transaction;
        if (txHex) {
          details.push({ label: 'Transaction (Hex)', value: txHex.substring(0, 16) + '...' });
        }
      }
    }
    return details;
  };

  const handleSignRequestConfirm = async () => {
    if (!activeRequest) return;
    try {
      let signature: string | undefined = undefined;
      let error: string | undefined = undefined;

      if (activeRequest.provider === 'ethereum') {
        if (activeRequest.method === 'eth_sendTransaction') {
          const tx = activeRequest.params?.[0];
          const to = tx.to;
          const data = tx.data || '0x';
          const value = tx.value;
          const result = await WalletEngine.sendEVMTransactionRequest(
            evmChainId,
            to,
            data,
            value,
            transactionPin
          );
          if (result.success) {
            signature = result.signature;
            let fromAmt = '0';
            if (tx.value) {
              try {
                const decVal = parseInt(tx.value, 16);
                fromAmt = (decVal / 1e18).toFixed(5);
              } catch (e) {}
            }
            addTransaction({
              type: 'Browser Transaction',
              fromSymbol: activeNetwork.symbol || 'ETH',
              toSymbol: tx.to ? getShortAddress(tx.to) : '',
              fromAmount: fromAmt,
              toAmount: '0',
              chain: activeNetwork.name,
              status: 'Success',
              txHash: result.signature || ''
            });
          } else {
            error = result.error;
          }
        } else {
          const wallet = await WalletEngine.decryptAndLoadWallet(transactionPin);
          if (wallet) {
            const cleanedMnemonic = wallet.words.trim().toLowerCase();
            const mnemonicObj = Mnemonic.fromPhrase(cleanedMnemonic);
            const evmWallet = HDNodeWallet.fromMnemonic(mnemonicObj, "m/44'/60'/0'/0/0");
            const ethersWallet = new ethers.Wallet(evmWallet.privateKey);
            
            if (activeRequest.method === 'personal_sign') {
              let message = activeRequest.params?.[0];
              const param1 = activeRequest.params?.[0];
              const param2 = activeRequest.params?.[1];
              if (typeof param1 === 'string' && param1.length === 42 && param1.toLowerCase().startsWith('0x') && param2) {
                message = param2;
              }
              try {
                if (ethers.isHexString(message)) {
                  message = ethers.toUtf8String(message);
                }
              } catch (e) {}
              signature = await ethersWallet.signMessage(message);
              addTransaction({
                type: 'Message Signature',
                fromSymbol: '',
                toSymbol: '',
                fromAmount: '',
                toAmount: '',
                chain: activeNetwork.name,
                status: 'Success',
                txHash: signature || ''
              });
            } else if (activeRequest.method === 'eth_signTypedData' || activeRequest.method === 'eth_signTypedData_v4' || activeRequest.method === 'eth_signTypedData_v3') {
              let typedDataRaw = activeRequest.params?.[1];
              const param1 = activeRequest.params?.[0];
              const param2 = activeRequest.params?.[1];
              if (typeof param2 === 'string' && param2.length === 42 && param2.toLowerCase().startsWith('0x') && param1) {
                typedDataRaw = param1;
              }
              let typedData: any = typedDataRaw;
              if (typeof typedData === 'string') {
                try {
                  typedData = JSON.parse(typedData);
                } catch (e) {
                  throw new Error("Invalid EIP-712 JSON payload: " + (e instanceof Error ? e.message : String(e)));
                }
              }
              if (typedData && typedData.domain && typedData.types && typedData.message) {
                const types = { ...typedData.types };
                delete types.EIP712Domain;
                signature = await ethersWallet.signTypedData(
                  typedData.domain,
                  types,
                  typedData.message
                );
                addTransaction({
                  type: 'Typed Signature',
                  fromSymbol: '',
                  toSymbol: '',
                  fromAmount: '',
                  toAmount: '',
                  chain: activeNetwork.name,
                  status: 'Success',
                  txHash: signature || ''
                });
              } else {
                throw new Error("Typed data payload is missing domain, types, or message fields.");
              }
            } else {
              signature = await ethersWallet.signMessage(JSON.stringify(activeRequest.params));
              addTransaction({
                type: 'Message Signature',
                fromSymbol: '',
                toSymbol: '',
                fromAmount: '',
                toAmount: '',
                chain: activeNetwork.name,
                status: 'Success',
                txHash: signature || ''
              });
            }
          } else {
            error = "Invalid PIN. Decryption failed.";
          }
        }
      } else if (activeRequest.provider === 'solana') {
        if (activeRequest.method === 'signMessage') {
          const msgHex = activeRequest.params?.message;
          if (!msgHex) {
            throw new Error("Missing message payload.");
          }
          const result = await WalletEngine.signSolanaMessage(msgHex, transactionPin);
          if (result.success && result.signature) {
            const resObj = { signature: result.signature, publicKey: walletAddresses?.solanaAddress };
            const responseCode = `window.__numWalletReceiveResponse(${activeRequest.id}, ${JSON.stringify(resObj)}, null);`;
            webViewRef.current?.injectJavaScript(responseCode);
            addTransaction({
              type: 'Solana Message Sign',
              fromSymbol: '',
              toSymbol: '',
              fromAmount: '',
              toAmount: '',
              chain: 'Solana',
              status: 'Success',
              txHash: result.signature || ''
            });
          } else {
            throw new Error(result.error || "Signing failed");
          }
        } else if (activeRequest.method === 'signTransaction') {
          const txHex = activeRequest.params?.transaction;
          if (!txHex) {
            throw new Error("Missing transaction payload.");
          }
          const result = await WalletEngine.signSolanaTransaction(txHex, transactionPin);
          if (result.success && result.signedTxHex) {
            const resObj = { signedTx: result.signedTxHex };
            const responseCode = `window.__numWalletReceiveResponse(${activeRequest.id}, ${JSON.stringify(resObj)}, null);`;
            webViewRef.current?.injectJavaScript(responseCode);
            addTransaction({
              type: 'Solana Tx Sign',
              fromSymbol: '',
              toSymbol: '',
              fromAmount: '',
              toAmount: '',
              chain: 'Solana',
              status: 'Success',
              txHash: '0x' + Math.random().toString(16).substring(2, 18)
            });
          } else {
            throw new Error(result.error || "Transaction signing failed");
          }
        } else if (activeRequest.method === 'sendTransaction' || activeRequest.method === 'signAndSendTransaction') {
          const txHex = activeRequest.params?.transaction;
          if (!txHex) {
            throw new Error("Missing transaction payload.");
          }
          const txBase64 = Buffer.from(txHex, 'hex').toString('base64');
          const result = await WalletEngine.sendSolanaTransactionRequest(txBase64, transactionPin);
          if (result.success && result.signature) {
            const resObj = { signature: result.signature };
            const responseCode = `window.__numWalletReceiveResponse(${activeRequest.id}, ${JSON.stringify(resObj)}, null);`;
            webViewRef.current?.injectJavaScript(responseCode);
            addTransaction({
              type: 'Solana Browser Tx',
              fromSymbol: 'SOL',
              toSymbol: '',
              fromAmount: '0',
              toAmount: '0',
              chain: 'Solana',
              status: 'Success',
              txHash: result.signature || ''
            });
          } else {
            throw new Error(result.error || "Transaction execution failed");
          }
        } else {
          throw new Error("Unsupported Solana method: " + activeRequest.method);
        }
        return;
      }

      if (signature) {
        const responseCode = `window.__numWalletReceiveResponse(${activeRequest.id}, ${JSON.stringify(signature)}, null);`;
        webViewRef.current?.injectJavaScript(responseCode);
      } else {
        const responseCode = `window.__numWalletReceiveResponse(${activeRequest.id}, null, ${JSON.stringify(error || 'Execution failed')});`;
        webViewRef.current?.injectJavaScript(responseCode);
      }
    } catch (e: any) {
      const responseCode = `window.__numWalletReceiveResponse(${activeRequest.id}, null, ${JSON.stringify(e.message || 'Error occurred')});`;
      webViewRef.current?.injectJavaScript(responseCode);
    } finally {
      setActiveRequest(null);
      setShowSigningModal(false);
    }
  };

  const handleSignRequestCancel = () => {
    if (activeRequest) {
      const responseCode = `window.__numWalletReceiveResponse(${activeRequest.id}, null, "User rejected transaction signing");`;
      webViewRef.current?.injectJavaScript(responseCode);
      setActiveRequest(null);
    }
    setShowSigningModal(false);
  };

  const params = useLocalSearchParams<{ url?: string }>();

  useEffect(() => {
    if (params.url) {
      handleLaunchBrowser(params.url);
    }
  }, [params.url]);

  const handleLaunchBrowser = (url: string) => {
    setWebViewError(null);
    let formattedUrl = url.trim().toLowerCase();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      if (!formattedUrl.includes('.')) {
        formattedUrl = `google.com/search?q=${formattedUrl}`;
      } else {
        formattedUrl = `https://${formattedUrl}`;
      }
    }
    setBrowserUrl(formattedUrl);
    
    const exists = minimizedTabs.some(t => t.url.toLowerCase() === formattedUrl.toLowerCase());
    if (!exists) {
      let tabsToKeep = [...minimizedTabs];
      if (tabsToKeep.length >= 30) {
        const oldestUnstarredIndex = tabsToKeep.findIndex(t => !t.isStarred);
        if (oldestUnstarredIndex !== -1) {
          tabsToKeep.splice(oldestUnstarredIndex, 1);
        } else {
          Alert.alert(
            "Tab Limit Reached",
            "All 30 minimized tabs are starred. Please unstar or close some tabs to open a new one."
          );
          return;
        }
      }

      const cleanTabDomain = formattedUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      const isAlreadyBookmarked = bookmarkedDapps.some(b => b.url.toLowerCase() === formattedUrl.toLowerCase() || b.url.toLowerCase() === cleanTabDomain.toLowerCase());
      const newTab: MinimizedTabType = {
        url: formattedUrl,
        title: cleanTabDomain,
        favicon: `https://www.google.com/s2/favicons?domain=${cleanTabDomain}&sz=64`,
        isStarred: isAlreadyBookmarked
      };
      setMinimizedTabs([...tabsToKeep, newTab]);
    }
  };

  const handleToggleStar = (tab: MinimizedTabType) => {
    const cleanTabDomain = tab.url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    const willStar = !tab.isStarred;
    
    if (willStar) {
      if (bookmarkedDapps.length >= 30) {
        Alert.alert("Bookmark Limit Reached", "You can have a maximum of 30 bookmarked dApps.");
        return;
      }
      
      setMinimizedTabs(minimizedTabs.map(t => 
        t.url.toLowerCase() === tab.url.toLowerCase() ? { ...t, isStarred: true } : t
      ));
      addBookmark({
        name: tab.title || cleanTabDomain,
        url: tab.url
      });
    } else {
      setMinimizedTabs(minimizedTabs.map(t => 
        t.url.toLowerCase() === tab.url.toLowerCase() ? { ...t, isStarred: false } : t
      ));
      removeBookmark(tab.url);
    }
  };

  const handleCloseBrowser = () => {
    setBrowserUrl(null);
    setSearchUrl('');
    setWebViewError(null);
  };

  const handleSimulateDappAction = (dappName: string) => {
    setAlertConfig({
      visible: true,
      title: 'Wallet Interaction Requested',
      message: `dApp (${dappName}) is requesting signature authorization for gas estimation.`,
      icon: 'shield-checkmark',
      iconColor: '#10B981',
      showConfirm: true,
      confirmText: 'Approve Signature',
      onConfirm: () => {
        setTimeout(() => {
          setAlertConfig({
            visible: true,
            title: 'Success',
            message: 'Transaction signed and broadcasted successfully by Num Guard.',
            icon: 'check-circle',
            iconColor: '#10B981',
            showConfirm: false,
            confirmText: 'Confirm',
            onConfirm: undefined,
          });
        }, 350);
      }
    });
  };

  const renderErrorScreen = () => {
    if (!webViewError) return null;

    const errorUrl = webViewError.url;
    const cleanDomain = errorUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    const suggestion = checkDomainTypoAndSuggest(errorUrl);
    const textMuted = isDarkMode ? Colors.text.muted : '#6B7280';
    const cardBg = isDarkMode ? '#0F0F1E' : '#FFFFFF';
    const mainBg = isDarkMode ? '#08080F' : '#F9FAFB';

    return (
      <ScrollView 
        contentContainerStyle={[styles.errorScreenContainer, { backgroundColor: mainBg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.errorCard, { backgroundColor: cardBg, borderColor: isDarkMode ? '#C4D4E810' : '#E5E7EB' }]}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={56} color="#EF4444" />
          </View>
          
          <Text style={[styles.errorTitle, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>
            Unable to Connect
          </Text>
          
          <Text style={[styles.errorSubtitle, { color: textMuted }]}>
            We couldn't connect to <Text style={{ fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#000000' }}>{cleanDomain}</Text>. Please verify the URL structure or check your internet connection.
          </Text>

          {suggestion && (
            <View style={[styles.suggestionBox, { backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)', borderColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="sparkles" size={14} color="#10B981" />
                <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Did you mean?</Text>
              </View>
              <Text style={{ color: isDarkMode ? '#FFFFFF' : '#374151', fontSize: 12, marginBottom: 12 }}>
                We found a match for: <Text style={{ fontWeight: 'bold', textDecorationLine: 'underline', color: Colors.brand.bright }}>{suggestion.replace(/^https?:\/\//, '')}</Text>
              </Text>
              <TouchableOpacity 
                style={[styles.webActionBtn, { backgroundColor: '#10B981', height: 40 }]}
                onPress={() => {
                  setWebViewError(null);
                  handleLaunchBrowser(suggestion);
                }}
              >
                <Text style={styles.webActionText}>Go to Suggested Address</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ gap: 10, width: '100%', marginTop: 8 }}>
            <TouchableOpacity 
              style={[styles.webActionBtn, { backgroundColor: Colors.brand.bright }]}
              onPress={() => {
                const searchQ = cleanDomain || errorUrl;
                setWebViewError(null);
                handleLaunchBrowser(`google.com/search?q=${encodeURIComponent(searchQ)}`);
              }}
            >
              <Ionicons name="logo-google" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.webActionText}>Search Google for "{cleanDomain}"</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.webActionBtn, { backgroundColor: isDarkMode ? '#131326' : '#E5E7EB', borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#D1D5DB' }]}
              onPress={() => {
                setWebViewError(null);
                handleReload();
              }}
            >
              <Ionicons name="refresh" size={15} color={isDarkMode ? '#FFFFFF' : '#374151'} style={{ marginRight: 6 }} />
              <Text style={[styles.webActionText, { color: isDarkMode ? '#FFFFFF' : '#374151' }]}>Retry Connection</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.webActionBtn, { backgroundColor: 'transparent' }]}
              onPress={() => {
                setWebViewError(null);
                handleBackPress();
              }}
            >
              <Text style={{ color: Colors.brand.bright, fontWeight: '700', fontSize: Typography.size.sm }}>
                Go Back to Safety
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.errorDetailMuted, { color: textMuted }]}>
          Error Details: Code {webViewError.code} - {webViewError.description}
        </Text>
      </ScrollView>
    );
  };

  const bgStyle = isDarkMode ? styles.container : [styles.container, styles.containerLight];
  const textStyle = isDarkMode ? styles.textWhite : styles.textLightPrimary;
  const borderStyle = isDarkMode ? styles.borderDark : styles.borderLight;

  return (
    <SafeAreaView style={bgStyle} edges={['top']}>
      {browserUrl ? (
        <View style={[styles.browserContainer, { backgroundColor: isDarkMode ? '#08080F' : '#FFFFFF' }]}>
          <View style={[styles.browserHeader, { backgroundColor: isDarkMode ? '#08080F' : '#FFFFFF', borderBottomColor: isDarkMode ? '#1A1A30' : '#E5E7EB', borderBottomWidth: 1 }]}>
            <View style={styles.browserNav}>
              <TouchableOpacity onPress={handleBackPress} style={[styles.browserNavBtn, { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6' }]}>
                <Feather name="chevron-left" size={18} color={isDarkMode ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
              {canGoForward && (
                <TouchableOpacity onPress={() => webViewRef.current?.goForward()} style={[styles.browserNavBtn, { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6' }]}>
                  <Feather name="chevron-right" size={18} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleReload} style={[styles.browserNavBtn, { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6' }]}>
                <Feather name="rotate-cw" size={14} color={isDarkMode ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
            </View>

            <View style={[styles.browserAddressBox, { backgroundColor: isDarkMode ? '#0C0C1C' : '#F3F4F6', borderColor: isDarkMode ? '#C4D4E815' : '#E5E7EB' }]}>
              <Feather name="lock" size={12} color="#10B981" />
              <Text style={[styles.browserAddressText, { color: isDarkMode ? '#FFFFFF' : '#111827', flex: 1 }]} numberOfLines={1}>
                {currentUrl}
              </Text>
            </View>

            {isDapp && (
              <TouchableOpacity 
                style={[
                  styles.sandboxNetworkBadge, 
                  { 
                    marginRight: 8, 
                    backgroundColor: isDarkMode ? '#131326' : '#F3F4F6',
                    borderColor: isDarkMode ? '#C4D4E815' : '#E5E7EB',
                  }
                ]}
                onPress={handleCycleNetwork}
                activeOpacity={0.8}
              >
                <ImageWithFallback source={getLogoSource(activeNetwork.logo)} style={styles.sandboxNetworkLogo} fallbackText={activeNetwork.name} />
                <Text style={[styles.sandboxNetworkText, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}>{activeNetwork.name}</Text>
                <Feather name="chevron-down" size={10} color={isDarkMode ? "#FFFFFF" : "#111827"} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={handleCloseBrowser} style={[styles.browserCloseBtn, { backgroundColor: isDarkMode ? '#0F0F1E' : '#F3F4F6' }]}>
              <Feather name="x" size={16} color={isDarkMode ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
          </View>

          {false && isDapp && (
            <View style={[
              styles.premiumWalletBanner, 
              { 
                backgroundColor: isCurrentDomainConnected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                borderBottomColor: isCurrentDomainConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
              }
            ]}>
              <View style={styles.premiumBannerLeft}>
                <View style={styles.statusBadgeContainer}>
                  <View style={[styles.pulsingDot, { backgroundColor: isCurrentDomainConnected ? '#10B981' : '#EF4444' }]} />
                  <Text style={[styles.statusBadgeTextLabel, { color: isCurrentDomainConnected ? '#10B981' : '#EF4444' }]}>
                    {isCurrentDomainConnected ? 'CONNECTED' : 'DISCONNECTED'}
                  </Text>
                </View>
                {isCurrentDomainConnected && (
                  <View style={styles.connectedWalletDetails}>
                    <View style={styles.networkBadgeContainer}>
                      <ImageWithFallback source={getLogoSource(activeNetwork.logo)} style={styles.bannerNetworkLogo} fallbackText={activeNetwork.name} />
                      <Text style={styles.bannerNetworkName}>{activeNetwork.name}</Text>
                    </View>
                    <View style={styles.addressPill}>
                      <Ionicons name="wallet-outline" size={10} color="#8888AA" />
                      <Text style={styles.addressPillText}>{getActiveConnectedAddressText()}</Text>
                    </View>
                  </View>
                )}
                {!isCurrentDomainConnected && (
                  <Text style={styles.disconnectedAlertText}>
                    Wallet signature sandbox active
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                style={[styles.bannerActionBtn, isCurrentDomainConnected ? styles.disconnectActionBtn : styles.connectActionBtn]} 
                onPress={handleConnectionPress}
                activeOpacity={0.8}
              >
                <Text style={styles.bannerActionBtnText}>{isCurrentDomainConnected ? 'Disconnect' : 'Connect'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.browserBody, { backgroundColor: isDarkMode ? '#08080F' : '#FFFFFF' }]}>
            {webViewError ? (
              renderErrorScreen()
            ) : (
              <WebView
                ref={webViewRef}
                source={{ uri: browserUrl }}
                style={{ flex: 1, backgroundColor: isDarkMode ? '#08080F' : '#FFFFFF' }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                injectedJavaScriptBeforeContentLoaded={web3BridgeScript}
                onMessage={handleMessage}
                onNavigationStateChange={handleNavigationStateChange}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  setWebViewError({
                    code: nativeEvent.code,
                    description: nativeEvent.description,
                    url: nativeEvent.url
                  });
                }}
                renderLoading={() => (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? '#08080F' : '#FFFFFF', justifyContent: 'center', alignItems: 'center' }]}>
                    <ActivityIndicator size="large" color={Colors.brand.bright} />
                  </View>
                )}
              />
            )}
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={[styles.header, borderStyle, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
              <Image
                source={require('../../logo/logo.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={[styles.headerTitle, textStyle]}>
                <Text style={{ color: Colors.brand.bright, fontWeight: '800' }}>Num</Text> Browser
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing[2] }}>
              <TouchableOpacity 
                style={[styles.tabsBtn, !isDarkMode && styles.tabsBtnLight]} 
                onPress={() => setShowFavoritesModal(true)}
                activeOpacity={0.7}
              >
                <Feather name="star" size={18} color={isDarkMode ? "#FFFFFF" : "#111827"} />
                {bookmarkedDapps.length > 0 && (
                  <View style={styles.tabsBadge}>
                    <Text style={styles.tabsBadgeText}>{bookmarkedDapps.length}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.tabsBtn, !isDarkMode && styles.tabsBtnLight]} 
                onPress={() => setShowTabsModal(true)}
                activeOpacity={0.7}
              >
                <Feather name="layers" size={18} color={isDarkMode ? "#FFFFFF" : "#111827"} />
                {minimizedTabs.length > 0 && (
                  <View style={[styles.tabsBadge, { backgroundColor: Colors.brand.bright }]}>
                    <Text style={styles.tabsBadgeText}>{minimizedTabs.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.searchSection}>
              <Text style={styles.searchLabel}>Web3 Address Search</Text>
              <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? '#0F0F1E' : '#FFFFFF', borderColor: isDarkMode ? Colors.brand.bright + '30' : '#E5E7EB' }]}>
                <Feather name="globe" size={16} color={Colors.text.muted} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: isDarkMode ? '#FFFFFF' : '#111827' }]}
                  placeholder="Enter dApp URL (e.g. jup.ag)..."
                  placeholderTextColor={Colors.text.disabled}
                  value={searchUrl}
                  onChangeText={setSearchUrl}
                  onSubmitEditing={() => handleLaunchBrowser(searchUrl)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                />
                {searchUrl.trim().length > 0 && (
                  <TouchableOpacity onPress={() => handleLaunchBrowser(searchUrl)} style={styles.goBtn}>
                    <Text style={styles.goBtnText}>GO</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Bookmarks & Curated Discovery Space 
                Administrators control featured contents dynamically from the Admin Backend. 
                Any featured dApps, tool cards, campaigns, promotions, and gaming platforms
                will load dynamically here and not hardcoded on the frontend.
                e.g. AdminBackendService.fetchFeaturedDapps().then(...) 
                The browser homepage remains minimal and focused entirely on navigation. */}

            <View style={styles.networkSelectSection}>
              <Text style={[styles.sectionTitle, !isDarkMode && styles.textLightSecondary, { marginTop: 0 }]}>
                Network Explorer
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.networkSelectScroll}
              >
                {dynamicSupportedNetworks.map(net => {
                  const isActive = selectedNetworkFilter === net.id;
                  const activeBorderColor = isDarkMode ? '#FFFFFF' : Colors.brand.bright;
                  
                  return (
                    <TouchableOpacity
                      key={net.name}
                      style={[
                        styles.networkCircleBtn,
                        {
                          backgroundColor: isDarkMode ? '#0F0F1E' : '#FFFFFF',
                          borderColor: isActive ? activeBorderColor : (isDarkMode ? '#C4D4E810' : '#E5E7EB'),
                          borderWidth: isActive ? 2 : 1,
                        },
                      ]}
                      onPress={() => {
                        setSelectedNetworkFilter(net.id);
                        if (net.id !== null) {
                          const chainIdx = dynamicChains.findIndex(c => c.id === net.id);
                          if (chainIdx !== -1) {
                            setActiveNetworkIndex(chainIdx);
                          }
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.networkCircleIconBox, { backgroundColor: net.color + '15' }]}>
                        {net.logo ? (
                           <ImageWithFallback source={getLogoSource(net.logo)} style={styles.networkCircleLogo} fallbackText={net.name} />
                        ) : net.pack === 'Ionicons' ? (
                          <Ionicons name={net.icon} size={16} color={net.color} />
                        ) : (
                          <Feather name={net.icon} size={16} color={net.color} />
                        )}
                      </View>
                      <View style={[styles.networkLetterBadge, { backgroundColor: '#111827' }]}>
                        {net.logo ? (
                          <ImageWithFallback source={getLogoSource(net.logo)} style={{ width: '100%', height: '100%', borderRadius: 999 }} fallbackText={net.letter} />
                        ) : (
                          <Text style={styles.networkLetterBadgeText}>{net.letter}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Sandbox Security tips removed from landing page per design updates */}
            <View style={{ height: Spacing[8] }} />
          </ScrollView>
        </View>
      )}

      <Modal
        visible={showFavoritesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFavoritesModal(false)}
      >
        <SafeAreaView style={styles.modalBg} edges={['top', 'bottom']}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="star" size={16} color="#FFFFFF" />
                <Text style={styles.modalHeaderTitle}>Personal Favorites ({bookmarkedDapps.length})</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFavoritesModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {bookmarkedDapps.length === 0 ? (
              <View style={styles.emptyTabsBody}>
                <Feather name="star" size={42} color={Colors.text.muted} />
                <Text style={styles.emptyTabsTitle}>No Bookmarked Sites</Text>
                <Text style={styles.emptyTabsSubtitle}>
                  Your personal bookmarks appear here. Star any minimized tab session to bookmark it.
                </Text>
                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowFavoritesModal(false)}>
                  <Text style={styles.closeModalBtnText}>Got it</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.tabsGridScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.bookmarksGrid}>
                    {bookmarkedDapps.map((dapp) => {
                      const cleanDomain = dapp.url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
                      return (
                        <View key={dapp.url} style={styles.bookmarkCard}>
                          <TouchableOpacity 
                            style={styles.bookmarkClickable}
                            onPress={() => {
                              handleLaunchBrowser(dapp.url);
                              setShowFavoritesModal(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.bookmarkIconBox, styles.bookmarkIconBoxLight]}>
                              <Image 
                                source={{ uri: `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=64` }} 
                                style={styles.bookmarkIcon} 
                              />
                            </View>
                            <Text style={[styles.bookmarkName, { color: '#FFFFFF' }]} numberOfLines={1}>
                              {dapp.name}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.deleteBookmarkBtn}
                            onPress={() => {
                              removeBookmark(dapp.url);
                              setMinimizedTabs(minimizedTabs.map(t => 
                                t.url.toLowerCase() === dapp.url.toLowerCase() ? { ...t, isStarred: false } : t
                              ));
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Feather name="x" size={8} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={showTabsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTabsModal(false)}
      >
        <SafeAreaView style={styles.modalBg} edges={['top', 'bottom']}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="layers" size={16} color="#FFFFFF" />
                <Text style={styles.modalHeaderTitle}>Minimized Tabs ({minimizedTabs.length})</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTabsModal(false)} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {minimizedTabs.length === 0 ? (
              <View style={styles.emptyTabsBody}>
                <Feather name="layers" size={42} color={Colors.text.muted} />
                <Text style={styles.emptyTabsTitle}>No Minimized Tabs</Text>
                <Text style={styles.emptyTabsSubtitle}>
                  Tabs are automatically saved here when you close the browser dashboard, keeping your Web3 sessions intact.
                </Text>
                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowTabsModal(false)}>
                  <Text style={styles.closeModalBtnText}>Got it</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.tabsGridScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.tabsPreviewGrid}>
                    {minimizedTabs.map((tab) => {
                      const tabUrl = tab.url;
                      const cleanTabDomain = tabUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
                      const tabFavicon = tab.favicon || `https://www.google.com/s2/favicons?domain=${cleanTabDomain}&sz=64`;
                      const isActive = browserUrl === tabUrl;
                      
                      return (
                        <View 
                          key={tabUrl} 
                          style={[
                            styles.tabPreviewCard,
                            isActive && { borderColor: Colors.brand.bright, borderWidth: 1.5 }
                          ]}
                        >
                          <View style={styles.tabCardHeader}>
                            <Image source={{ uri: tabFavicon }} style={styles.tabCardFavicon} />
                            <Text style={styles.tabCardDomain} numberOfLines={1}>
                              {tab.title || cleanTabDomain}
                            </Text>
                            <TouchableOpacity
                              onPress={() => handleToggleStar(tab)}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={styles.tabCardStarBtn}
                            >
                              <Ionicons 
                                name={tab.isStarred ? "star" : "star-outline"} 
                                size={9} 
                                color={tab.isStarred ? "#F59E0B" : "rgba(255,255,255,0.4)"} 
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => {
                                const nextTabs = minimizedTabs.filter(x => x.url !== tabUrl);
                                setMinimizedTabs(nextTabs);
                                if (browserUrl === tabUrl) {
                                  setBrowserUrl(nextTabs[nextTabs.length - 1]?.url || null);
                                }
                              }}
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              style={styles.tabCardCloseBtn}
                            >
                              <Feather name="x" size={9} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity
                            style={styles.tabCardBody}
                            onPress={() => {
                              setBrowserUrl(tabUrl);
                              setShowTabsModal(false);
                            }}
                            activeOpacity={0.8}
                          >
                            {tab.previewUri ? (
                              <Image source={{ uri: tab.previewUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                            ) : (
                              <LinearGradient
                                colors={isDarkMode ? ['#1A1A2E', '#0B0B14'] : ['#FFFFFF', '#F0F0F5']}
                                style={styles.mockPreviewLayout}
                              >
                                {renderDomainPreview(tabUrl, isDarkMode)}
                              </LinearGradient>
                            )}
                          </TouchableOpacity>

                          {isActive && (
                            <View style={styles.activeTabTag}>
                              <Text style={styles.activeTabText}>ACTIVE</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.clearAllBtn}
                    onPress={() => {
                      setMinimizedTabs([]);
                      setBrowserUrl(null);
                      setShowTabsModal(false);
                      setAlertConfig({
                        visible: true,
                        title: 'Tabs Cleared',
                        message: 'All browser tabs have been closed.',
                        icon: 'trash-2',
                        iconColor: '#EF4444',
                        showConfirm: false,
                        confirmText: 'Confirm',
                        onConfirm: undefined,
                      });
                    }}
                  >
                    <Feather name="trash" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.clearAllBtnText}>Close All Tabs</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      <TransactionConfirmModal
        visible={showAuthModal}
        title="Authorize DApp Connection"
        details={[
          { label: 'dApp URL', value: currentUrl },
          { label: 'Connection Type', value: 'Sandbox Web3 Injector' },
          { label: 'Network', value: activeNetwork.name },
          { label: 'Permissions', value: 'View address & signatures' }
        ]}
        securityTips={[]}
        securitySummary={urlSecuritySummary}
        onConfirm={confirmConnection}
        onCancel={cancelConnection}
        actionLabel="Approve Connection"
      />

      <TransactionConfirmModal
        visible={showSigningModal}
        title={activeRequest?.method === 'personal_sign' ? 'Sign Message' : 'Authorize Transaction'}
        details={getTransactionDetails()}
        securityTips={[]}
        securitySummary={signingSecuritySummary}
        onConfirm={handleSignRequestConfirm}
        onCancel={handleSignRequestCancel}
        actionLabel={activeRequest?.method === 'personal_sign' ? 'Sign Message' : 'Authorize & Sign'}
      />

      <Modal
        visible={showAddChainModal}
        transparent={true}
        animationType="slide"
        onRequestClose={cancelAddChain}
      >
        <SafeAreaView style={styles.modalBg} edges={['top', 'bottom']}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="plus-circle" size={16} color="#FFFFFF" />
                <Text style={styles.modalHeaderTitle}>Import Network Request</Text>
              </View>
              <TouchableOpacity onPress={cancelAddChain} style={styles.modalCloseBtn}>
                <Feather name="x" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {addChainRequest && (() => {
              const addParams = addChainRequest.params?.[0];
              const chainIdHex = addParams?.chainId;
              const chainId = parseInt(chainIdHex, 16);
              const chainName = addParams?.chainName || `Custom Chain ${chainId}`;
              const rpcUrls = addParams?.rpcUrls || [];
              const blockExplorerUrls = addParams?.blockExplorerUrls || [];
              const nativeCurrency = addParams?.nativeCurrency;
              
              const analysis = getNetworkSecurityAnalysis(chainName, chainIdHex, rpcUrls);
              
              return (
                <ScrollView contentContainerStyle={{ paddingVertical: 20, gap: 16 }} showsVerticalScrollIndicator={false}>
                  <View style={{ backgroundColor: analysis.statusColor + '15', borderColor: analysis.statusColor + '30', borderWidth: 1, borderRadius: Radius.lg, padding: 12, gap: 6 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: analysis.statusColor, fontWeight: 'bold', fontSize: 13 }}>
                        {analysis.status} NETWORK
                      </Text>
                      <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>
                        Rating: {analysis.rating}
                      </Text>
                    </View>
                    <Text style={{ color: Colors.text.muted, fontSize: 11 }}>
                      {analysis.recommendation}
                    </Text>
                  </View>

                  <View style={{ gap: 12 }}>
                    <View style={styles.detailRowMini}>
                      <Text style={styles.detailLabelMini}>Network Name</Text>
                      <Text style={styles.detailValMini}>{chainName}</Text>
                    </View>
                    <View style={styles.detailRowMini}>
                      <Text style={styles.detailLabelMini}>Chain ID</Text>
                      <Text style={styles.detailValMini}>{chainId} ({chainIdHex})</Text>
                    </View>
                    <View style={styles.detailRowMini}>
                      <Text style={styles.detailLabelMini}>RPC Endpoint</Text>
                      <Text style={styles.detailValMini} numberOfLines={1}>{rpcUrls[0] || 'None'}</Text>
                    </View>
                    <View style={styles.detailRowMini}>
                      <Text style={styles.detailLabelMini}>Currency Symbol</Text>
                      <Text style={styles.detailValMini}>{nativeCurrency?.symbol || 'ETH'}</Text>
                    </View>
                    <View style={styles.detailRowMini}>
                      <Text style={styles.detailLabelMini}>Block Explorer</Text>
                      <Text style={styles.detailValMini} numberOfLines={1}>{blockExplorerUrls[0] || 'None'}</Text>
                    </View>
                    <View style={styles.detailRowMini}>
                      <Text style={styles.detailLabelMini}>Classification</Text>
                      <Text style={[styles.detailValMini, { color: analysis.isTestnet ? '#F59E0B' : '#10B981', fontWeight: 'bold' }]}>
                        {analysis.isTestnet ? 'Testnet (Hidden from Landing Page)' : 'Mainnet'}
                      </Text>
                    </View>
                  </View>

                  {analysis.risks.length > 0 && (
                    <View style={{ gap: 8, marginTop: 10 }}>
                      <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>Security Risks Identified</Text>
                      {analysis.risks.map((risk, index) => (
                        <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                          <Feather name="alert-triangle" size={10} color="#EF4444" style={{ marginTop: 2 }} />
                          <Text style={{ color: Colors.text.muted, fontSize: 11, flex: 1, lineHeight: 16 }}>{risk}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                    <TouchableOpacity
                      style={{ flex: 1, height: 48, borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}
                      onPress={cancelAddChain}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ flex: 2, height: 48, borderRadius: Radius.lg, backgroundColor: analysis.statusColor, alignItems: 'center', justifyContent: 'center' }}
                      onPress={confirmAddChain}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Approve & Import</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              );
            })()}
          </View>
        </SafeAreaView>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        showConfirm={alertConfig.showConfirm}
        confirmText={alertConfig.confirmText}
        onConfirm={alertConfig.onConfirm}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.base },
  containerLight: { backgroundColor: '#F3F4F6' },
  header: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  borderDark: { borderBottomColor: '#C4D4E810' },
  borderLight: { borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  headerLogo: { width: 24, height: 24, borderRadius: Radius.xs },
  tabsBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: '#0F0F1E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C4D4E810',
    position: 'relative',
  },
  tabsBtnLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  tabsBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold' },
  textWhite: { color: Colors.text.primary },
  textLightPrimary: { color: '#111827' },
  textLightSecondary: { color: '#4B5563' },
  scroll: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[4] },

  // Search Address Bar
  searchSection: { gap: 6 },
  searchLabel: {
    color: Colors.text.muted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F0F1E',
    borderWidth: 1.5,
    borderColor: Colors.brand.bright + '30',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    height: 48,
  },
  searchIcon: { marginRight: Spacing[2] },
  searchInput: { flex: 1, color: '#FFFFFF', fontSize: Typography.size.sm },
  goBtn: {
    backgroundColor: Colors.brand.bright,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  goBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },

  // Bookmarks Section
  bookmarksSection: { gap: Spacing[2], marginBottom: Spacing[1] },
  sectionTitle: { color: Colors.text.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing[2] },
  bookmarksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '2.6%',
    rowGap: Spacing[3],
    marginTop: Spacing[1],
  },
  bookmarkCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: Colors.bg.surface,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[2],
    position: 'relative',
  },
  bookmarkCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  bookmarkClickable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    gap: 6,
  },
  bookmarkIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: '#0F0F1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkIconBoxLight: {
    backgroundColor: '#F3F4F6',
  },
  bookmarkIcon: { width: 20, height: 20, borderRadius: Radius.xs },
  bookmarkName: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  deleteBookmarkBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGridCard: {
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[4],
    backgroundColor: '#08080F',
    borderWidth: 1,
    borderColor: '#C4D4E810',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  emptyGridCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  emptyGridText: { color: Colors.text.muted, fontSize: 10, textAlign: 'center', lineHeight: 15 },

  // Browser Container
  browserContainer: { flex: 1, backgroundColor: '#000000' },
  browserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F0F1E',
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E810',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  browserNav: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  browserNavBtn: { padding: 4 },
  browserAddressBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#000000',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
    marginHorizontal: Spacing[3],
  },
  browserAddressText: { color: '#FFFFFF', fontSize: Typography.size.xs, fontWeight: '600' },
  browserCloseBtn: { padding: 4 },
  
  // Wallet Connection Banner
  walletBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10B98115',
    borderBottomWidth: 1,
    borderBottomColor: '#10B98130',
    paddingHorizontal: Spacing[4],
    paddingVertical: 10,
  },
  walletBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  walletBannerText: { color: '#10B981', fontSize: 10 },
  disconnectBtn: {
    backgroundColor: '#EF444420',
    borderWidth: 1,
    borderColor: '#EF444440',
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  connectBtn: {
    backgroundColor: '#10B98120',
    borderColor: '#10B98140',
  },
  disconnectBtnText: { color: '#FFFFFF', fontSize: 9, fontWeight: 'bold' },

  // Simulated Web View
  browserBody: { flex: 1 },
  webPageLayout: { flex: 1, padding: Spacing[5], alignItems: 'center', gap: Spacing[6], paddingTop: 40 },
  webPageTitle: { color: '#FFFFFF', fontSize: Typography.size.lg, fontWeight: '900', textAlign: 'center' },
  webPageCard: {
    width: '100%',
    backgroundColor: '#0F0F1E',
    borderWidth: 1.5,
    borderColor: '#C4D4E810',
    borderRadius: Radius.xl,
    padding: Spacing[5],
    gap: Spacing[4],
  },
  webPageCardLabel: { color: Colors.brand.bright, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  webInputBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#C4D4E815',
    borderRadius: Radius.md,
    padding: 14,
  },
  webTokenLabel: { color: Colors.text.muted, fontSize: Typography.size.xs },
  webTokenVal: { color: '#FFFFFF', fontSize: Typography.size.xs, fontWeight: 'bold' },
  webActionBtn: {
    backgroundColor: Colors.brand.bright,
    height: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webActionBtnDisabled: { backgroundColor: '#374151' },
  webActionText: { color: '#FFFFFF', fontSize: Typography.size.sm, fontWeight: 'bold' },
  webPageFooter: { color: Colors.text.muted, fontSize: 9, textAlign: 'center', position: 'absolute', bottom: 20 },

  // Info Sandboxed Guide Card
  infoGuideCard: {
    backgroundColor: '#08080F',
    borderWidth: 1,
    borderColor: '#C4D4E810',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  infoGuideCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  guideTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  guideTitle: { fontSize: Typography.size.sm, fontWeight: '800' },
  guideDesc: { color: Colors.text.secondary, fontSize: Typography.size.xs, lineHeight: 18, marginBottom: 4 },
  guideBulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing[2] },
  guideBulletText: { color: Colors.text.muted, fontSize: Typography.size.xs, lineHeight: 16, flex: 1 },

  // Minimized Tabs Layers Modal Styles
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' },
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
  emptyTabsBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  emptyTabsTitle: { color: '#FFFFFF', fontSize: Typography.size.lg, fontWeight: 'bold', marginTop: Spacing[2] },
  emptyTabsSubtitle: { color: Colors.text.muted, fontSize: Typography.size.sm, textAlign: 'center', lineHeight: 22 },
  closeModalBtn: {
    backgroundColor: Colors.brand.bright,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
    marginTop: Spacing[4],
  },
  closeModalBtnText: { color: '#FFFFFF', fontSize: Typography.size.sm, fontWeight: 'bold' },
  tabsGridScroll: {
    paddingVertical: Spacing[4],
  },
  tabsPreviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '3%',
    rowGap: 16,
  },
  tabPreviewCard: {
    width: '31.3%',
    aspectRatio: 0.62,
    backgroundColor: '#0F0F1E',
    borderWidth: 1.5,
    borderColor: '#C4D4E810',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tabCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#08080F',
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#C4D4E808',
  },
  tabCardFavicon: {
    width: 8,
    height: 8,
    borderRadius: Radius.xs,
  },
  tabCardDomain: {
    color: '#FFFFFF',
    fontSize: 6.5,
    fontWeight: '700',
    flex: 1,
  },
  tabCardStarBtn: {
    padding: 1.5,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.xs,
  },
  tabCardCloseBtn: {
    padding: 1.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.xs,
  },
  tabCardBody: {
    flex: 1,
    padding: 4,
    backgroundColor: '#000000',
  },
  mockPreviewLayout: {
    flex: 1,
    borderRadius: Radius.xs,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabTag: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: Colors.brand.bright,
    borderRadius: Radius.xs,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontSize: 5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalFooter: {
    paddingVertical: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: '#C4D4E810',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: Spacing[3],
    borderRadius: Radius.lg,
  },
  clearAllBtnText: { color: '#FFFFFF', fontSize: Typography.size.sm, fontWeight: 'bold' },
  sandboxNetworkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  premiumWalletBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing[4],
    paddingVertical: 8,
  },
  premiumBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    flex: 1,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#00000030',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeTextLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  connectedWalletDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  networkBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  bannerNetworkLogo: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bannerNetworkName: {
    color: '#E5E7EB',
    fontSize: 9,
    fontWeight: '700',
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  addressPillText: {
    color: '#8888AA',
    fontSize: 9,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  disconnectedAlertText: {
    color: '#EF4444',
    fontSize: 9.5,
    fontWeight: '600',
  },
  bannerActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  connectActionBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  disconnectActionBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  bannerActionBtnText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  sandboxNetworkLogo: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  sandboxNetworkText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  networkSelectSection: {
    gap: 8,
    marginTop: Spacing[2],
    marginBottom: Spacing[1],
  },
  networkSelectScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: Spacing[5],
  },
  networkCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  networkCircleIconBox: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  networkCircleLogo: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
  },
  networkLetterBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 13,
    height: 13,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#080814',
  },
  networkLetterBadgeText: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: '900',
  },
  detailRowMini: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  detailLabelMini: {
    color: '#8888AA',
    fontSize: 11,
  },
  detailValMini: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    maxWidth: '60%',
  },
  errorScreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[6],
    paddingVertical: 40,
  },
  errorCard: {
    width: '100%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing[6],
    alignItems: 'center',
    gap: 16,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  suggestionBox: {
    width: '100%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 12,
  },
  errorDetailMuted: {
    fontSize: 10,
    marginTop: 20,
    textAlign: 'center',
  },
});
