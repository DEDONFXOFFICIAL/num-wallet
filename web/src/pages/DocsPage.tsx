import { useState } from 'react';
import { Book, Code, Shield, Key, Terminal, ArrowLeft, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Glass3DCanvas } from '../components/Glass3DCanvas';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('welcome');
  const [isLightMode] = useState(() => localStorage.getItem('theme') === 'light' || document.documentElement.classList.contains('light-theme'));

  const sections = [
    { id: 'welcome', label: 'Welcome to Num Docs', icon: Book },
    { id: 'architecture', label: 'Core Architecture', icon: Cpu },
    { id: 'provider', label: 'Web3 Provider Injection', icon: Code },
    { id: 'signing', label: 'On-Chain Signing API', icon: Key },
    { id: 'security', label: 'Webacy Threat Screening', icon: Shield },
    { id: 'integrations', label: 'Partner SDK (Client code)', icon: Terminal },
  ];

  return (
    <div className="docs-container">
      {/* Docs Header */}
      <header className="docs-header">
        <div className="docs-header-left">
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
          <div className="divider-vertical" />
          <span className="docs-title">NUM DEVELOPER CENTER</span>
        </div>
        <div className="docs-header-right">
          <span className="api-badge">API Version: v1.0.4</span>
        </div>
      </header>

      {/* Docs Layout */}
      <div className="docs-layout">
        <Glass3DCanvas type="eth" size="md" isLightMode={isLightMode} animationStyle="x" style={{ position: 'absolute', top: '100px', right: '-300px', zIndex: 1 }} className="glass-3d-coin-container canvas-eth" />
        <Glass3DCanvas type="btc" size="sm" isLightMode={isLightMode} animationStyle="diagonal" style={{ position: 'absolute', top: '600px', right: '-240px', zIndex: 1 }} className="glass-3d-coin-container canvas-btc" />

        {/* Sidebar */}
        <aside className="docs-sidebar">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                className={`sidebar-item ${activeSection === sec.id ? 'active' : ''}`}
                onClick={() => setActiveSection(sec.id)}
              >
                <Icon size={16} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Content Area */}
        <main className="docs-content">
          {activeSection === 'welcome' && (
            <div className="reveal-fade">
              <h2>Welcome to Num Wallet Developer Portal</h2>
              <p className="docs-intro">
                Num Wallet is a next-generation multi-chain smart wallet built from the ground up to solve Web3 onboarding bottlenecks, security threats, and gas friction.
              </p>

              <h3>Why Num Wallet?</h3>
              <p>
                Traditional crypto wallets present high entry barriers for Web2 users: complex seed phrases, transaction sign parameters in hex, gas token shortfalls, and zero phishing screening. Num Wallet implements:
              </p>
              <ul className="docs-bullets">
                <li><strong>Consolidated Network Fees:</strong> Swaps and conversions display a single USD-denominated fee, hiding complex platform percentages.</li>
                <li><strong>Gas Shortfall Interception:</strong> Evaluates gas requirements and assists users in depositing native gas tokens to their backing address prior to transfer failure.</li>
                <li><strong>Embedded MPC Key Storage:</strong> Uses Privy Multi-Party Computation splits to secure user keys inside device Enclaves without exposing full mnemonic phrases.</li>
                <li><strong>Webacy Phishing Shield:</strong> Real-time domain and smart-contract spender analysis to intercept malicious signatures.</li>
              </ul>

              <div className="callout-info">
                <strong>💡 Quick Start:</strong> If you are running an on-chain DeFi platform, DEX, or Social app, your interface is already compatible with Num Wallet's provider injection API. Read the sections below to customize integrations.
              </div>
            </div>
          )}

          {activeSection === 'architecture' && (
            <div className="reveal-fade">
              <h2>Core Architecture</h2>
              <p>
                Num Wallet is structured around a modular client-engine architecture that connects mobile clients directly to RPC nodes, Web3 APIs, and database registries.
              </p>

              <div className="docs-schema">
                <div className="schema-node">User Device (Privy MPC)</div>
                <div className="schema-arrow">➔</div>
                <div className="schema-node">Consolidated RPC Node Layer</div>
                <div className="schema-arrow">➔</div>
                <div className="schema-node">Supabase Registries Table</div>
              </div>

              <h3>1. Privy MPC Enclave</h3>
              <p>
                Private recovery phrases are fragmented using Multi-Party Computation (MPC). One share resides on the user's local hardware enclave (keychain/biometrics), while the second share is stored securely in Privy's distributed cloud vaults. This eliminates the vulnerability of single-point-of-failure seed phrases.
              </p>

              <h3>2. Supabase Registries Table</h3>
              <p>
                To support phone number and backup email resolution, Num Wallet checks the <code>registries</code> table on sign-up to deterministically map Evm, Solana, Ton, and Ripple addresses to a unified phone account number.
              </p>

              <h3>3. Secure Wallet Regeneration</h3>
              <p>
                In case of key compromise or device exposure, users can trigger a <strong>Wallet Regeneration</strong> flow from the settings panel. This process:
              </p>
              <ul className="docs-bullets">
                <li>Generates a fresh 24-word seed phrase locally on-device.</li>
                <li>Re-derives EVM, Solana, TON, and Ripple addresses.</li>
                <li>Wipes old key fragments from the secure hardware enclave.</li>
                <li>Updates the Supabase <code>registries</code> table with the new addresses, preserving the user's permanent phone number.</li>
                <li>Dispatches a background backup email containing the fresh PIN-encrypted HTML backup document attachment.</li>
              </ul>
            </div>
          )}

          {activeSection === 'provider' && (
            <div className="reveal-fade">
              <h2>Web3 Provider Injection API</h2>
              <p>
                When a user launches a decentralized application (dApp) inside the Num Wallet browser (powered by our Hub interface), the app automatically injects standard EIP-1193 and Solana Web3 providers:
              </p>

              <pre className="code-block">
{`// Detect EVM provider injection
if (window.ethereum) {
  console.log("Ethereum Provider Active:", window.ethereum.selectedAddress);
}

// Detect Solana provider injection
if (window.solana) {
  console.log("Solana Provider Active:", window.solana.publicKey.toString());
}`}
              </pre>

              <h3>Supported RPC Methods</h3>
              <p>
                The provider intercepts the following requests and routes them to our secure sign confirmation modal:
              </p>
              <table className="docs-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Type</th>
                    <th>Action inside Num Wallet</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>eth_requestAccounts</code></td>
                    <td>EVM</td>
                    <td>Prompts the user to authorize dApp connection and share EVM address.</td>
                  </tr>
                  <tr>
                    <td><code>personal_sign</code></td>
                    <td>EVM</td>
                    <td>Signs a plaintext message with the user's EVM private key.</td>
                  </tr>
                  <tr>
                    <td><code>eth_signTypedData_v4</code></td>
                    <td>EVM</td>
                    <td>Signs EIP-712 structured data payloads (e.g. Permit approvals).</td>
                  </tr>
                  <tr>
                    <td><code>eth_sendTransaction</code></td>
                    <td>EVM</td>
                    <td>Audits gas fees, screens recipient, and broadcasts transaction on-chain.</td>
                  </tr>
                  <tr>
                    <td><code>connect</code></td>
                    <td>Solana</td>
                    <td>Authorizes dApp connection and shares Solana address.</td>
                  </tr>
                  <tr>
                    <td><code>signMessage</code></td>
                    <td>Solana</td>
                    <td>Signs message with Solana key.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'signing' && (
            <div className="reveal-fade">
              <h2>On-Chain Signing API</h2>
              <p>
                Num Wallet handles on-chain transaction signing by routing requests to the secure device hardware. When an app requests <code>eth_sendTransaction</code>, the transaction is decrypted and processed via:
              </p>

              <pre className="code-block">
{`// EVM transaction request template
const txHash = await window.ethereum.request({
  method: 'eth_sendTransaction',
  params: [{
    from: window.ethereum.selectedAddress,
    to: '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
    value: '0x0', // No native value transfer
    data: '0xa9059cbb000000000000000000000000...' // transfer(to, amount)
  }]
});`}
              </pre>

              <div className="callout-warning">
                <strong>⚠️ Transaction Interception:</strong> If the user does not have enough native gas tokens (e.g. ETH, BNB) to cover the network fee, the transaction will be intercepted by the Gas Shortfall Interceptor Modal, helping the user acquire gas prior to signing.
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="reveal-fade">
              <h2>Webacy Threat Screening</h2>
              <p>
                Every URL loaded and transaction signed inside Num Wallet is audited in real-time by the <strong>Webacy Security Engine</strong>:
              </p>
              
              <h3>Phishing URL Scanner</h3>
              <p>
                When a connection request is made, the dApp domain is screened against Webacy's threat database. High-risk domains (phishing, drainers) are flagged with an immediate warning, and users are advised to disconnect.
              </p>

              <h3>Spender Risk Score</h3>
              <p>
                When calling <code>approve()</code> on any ERC-20 smart contract, Webacy scans the spender address. Spenders with elevated risk scores (history of hacks, malicious callbacks) are reported to the user with a warning.
              </p>

              <pre className="code-block">
{`// Security check response structure
{
  "riskLevel": "high" | "medium" | "low",
  "description": "Domain matches known wallet-draining script pattern.",
  "phishingReported": true,
  "isLive": true
}`}
              </pre>
            </div>
          )}

          {activeSection === 'integrations' && (
            <div className="reveal-fade">
              <h2>Partner SDK Integration</h2>
              <p>
                Partners can easily integrate our custom browser redirect buttons to trigger direct wallet deep-linking or embedded iframe wallet frames:
              </p>

              <h3>1. Checking for Num Wallet</h3>
              <pre className="code-block">
{`function isNumWalletInstalled() {
  return window.ethereum && window.ethereum.isNumWallet === true;
}`}
              </pre>

              <h3>2. Initiating a Connection</h3>
              <p>
                Use this simple boilerplate to connect from any decentralized application standard:
              </p>
              <pre className="code-block">
{`async function connectWallet() {
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    console.log("Connected to Num Wallet:", accounts[0]);
    return accounts[0];
  } catch (error) {
    console.error("Connection rejected:", error);
  }
}`}
              </pre>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
