# Num Wallet — Integrated Platforms & Architecture Guide

This document lists all the third-party platforms, APIs, databases, servers, and networks integrated into **Num Wallet** to handle global user onboarding, ownership verification, embedded wallets, blockchain communications, and security backups.

---

## 🔑 1. Authentication & Ownership Verification

### Twilio Verify API
* **Role:** Sends and verifies 6-digit SMS OTP (One-Time Password) codes.
* **Purpose:** Proves phone number ownership during registration/onboarding and when logging in from a new device (monthly security verification).
* **Integration:** REST API via HTTPS request using Twilio credentials (`Account SID`, `Auth Token`, `Verify Service SID`).

### Privy MPC SDK
* **Role:** Secure client-side embedded wallet infrastructure.
* **Purpose:** Uses Multi-Party Computation (MPC) to secure the master recovery seed phrase keys. The keys are split and stored securely on-device in the native keychain enclave so the user retains complete self-custody.
* **Integration:** React Native Provider SDK configured with `Privy App ID` and `Client ID`.

---

## 🗄️ 2. Database, Storage, & Server Hosting

### Supabase Postgres Database
* **Role:** User profile and public account registry database.
* **Purpose:** Maps phone numbers (e.g. `8039851283`) to EVM and Solana wallet addresses, display names, profile photo URLs, and `login_passcode` values.
* **Integration:** PostgreSQL connection Pooler (region `eu-west-1`) for structural schema migrations and `@supabase/supabase-js` client library for run-time mobile queries.

### Supabase Storage
* **Role:** Public content storage bucket.
* **Purpose:** Hosts the `avatars` bucket where custom profile photos uploaded by users are saved and served via public CDN URLs.
* **Integration:** Direct image file upload API.

### Vercel
* **Role:** Cloud hosting environment.
* **Purpose:** Deploys and serves the responsive HTML/Vite landing page and administrator dashboard.
* **Integration:** Git-integrated automatic deployments.

### Metro Dev Server
* **Role:** Local compilation server.
* **Purpose:** Bundles the TypeScript React Native code, assets, and routes for active development, diagnostics, and testing.

---

## ⛓️ 3. Blockchain Nodes & Web3 APIs

### Helius (Solana RPC Node)
* **Role:** Dedicated Solana transaction provider.
* **Purpose:** Fetches live SOL balances, tracks SPL tokens, and broadcasts Solana Mainnet transactions directly to prevent network timeouts.
* **Integration:** Private HTTP RPC Node endpoint.

### Ankr & QuickNode (EVM RPC Nodes)
* **Role:** Dedicated Ethereum & Base network providers.
* **Purpose:** Queries address balances, detects ERC-20 tokens, estimates gas prices, and broadcasts EVM Mainnet transactions.
* **Integration:** Custom HTTP RPC providers with silent failover support.

### LI.FI API
* **Role:** Multi-chain swap and bridging aggregator.
* **Purpose:** Dynamically fetches swap rates, quotes gas estimates, and handles cross-chain conversions between Solana and EVM chains.
* **Integration:** HTTP REST API.

### Klever & CoinGecko APIs
* **Role:** Pricing and network data feeds.
* **Purpose:** CoinGecko provides live USD conversion rates for multi-chain holdings, and Klever API queries native KLV account balances.
* **Integration:** Public HTTP endpoints.

---

## ✉️ 4. Email Security

### Resend API
* **Role:** Automated transactional email delivery engine.
* **Purpose:** Dispatches the password-locked HTML recovery document containing the user's master seed phrase to their verified Gmail backup.
* **Integration:** REST API via Bearer Token.
