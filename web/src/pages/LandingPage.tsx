import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, Key, Cpu, Zap, Download, ExternalLink, 
  Terminal, Sun, Moon, HelpCircle,
  Phone, Lock, Star,
  RefreshCw, Shuffle, Image, EyeOff,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Glass3DCanvas } from '../components/Glass3DCanvas';

const MAJOR_CHAINS = [
  { name: 'Solana', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/solana/info/logo.png' },
  { name: 'Ethereum', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/ethereum/info/logo.png' },
  { name: 'TON Network', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/ton/info/logo.png' },
  { name: 'BNB Chain', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/smartchain/info/logo.png' },
  { name: 'Bitcoin', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/bitcoin/info/logo.png' },
  { name: 'Arbitrum', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/arbitrum/info/logo.png' },
  { name: 'Polygon', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/polygon/info/logo.png' },
  { name: 'Optimism', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/optimism/info/logo.png' },
  { name: 'Avalanche', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/avalanchec/info/logo.png' },
  { name: 'Base', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/base/info/logo.png' },
  { name: 'Sui', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/sui/info/logo.png' },
  { name: 'Aptos', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/aptos/info/logo.png' },
  { name: 'Ripple', icon: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/xrp.png' },
  { name: 'Tron', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/tron/info/logo.png' },
  { name: 'Polkadot', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/polkadot/info/logo.png' },
  { name: 'Near Protocol', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/near/info/logo.png' },
  { name: 'Fantom', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/fantom/info/logo.png' },
  { name: 'Cardano', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/cardano/info/logo.png' },
  { name: 'Cosmos', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/cosmos/info/logo.png' },
  { name: 'Algorand', icon: 'https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/algorand/info/logo.png' }
];

const FLOW_STEPS = {
  onboarding: [
    {
      badge: 'STEP 01',
      title: 'Input Phone Number',
      description: 'Enter your 10-digit mobile number to begin the onboarding process. This becomes your permanent routing identity.',
      icon: Phone
    },
    {
      badge: 'STEP 02',
      title: 'Receive OTP',
      description: 'Verify your phone number instantly using the secure One-Time Password (OTP) sent directly to your device.',
      icon: Lock
    },
    {
      badge: 'STEP 03',
      title: 'Add Your Name',
      description: 'Input your name or username to complete the registration process and create your smart wallet profile.',
      icon: Shield
    }
  ],
  transacting: [
    {
      badge: 'STEP 01',
      title: 'Input Phone Number',
      description: "Enter the recipient's phone number or choose from your contacts. No need to copy or paste complex public wallet addresses.",
      icon: Phone
    },
    {
      badge: 'STEP 02',
      title: 'Enter Amount',
      description: 'Specify the exact amount of funds or value that you wish to send to the recipient.',
      icon: Zap
    },
    {
      badge: 'STEP 03',
      title: 'Select Coin or Token',
      description: 'Choose the specific cryptocurrency, asset, or token you want the transfer to be completed in.',
      icon: RefreshCw
    }
  ],
  converting: [
    {
      badge: 'STEP 01',
      title: 'Swap',
      description: 'Convert between different tokens on the same network instantly with optimal routing and minimal slippage.',
      icon: RefreshCw
    },
    {
      badge: 'STEP 02',
      title: 'Bridge',
      description: 'Move your digital assets across distinct blockchains securely using integrated top-tier bridging protocols.',
      icon: Shuffle
    },
    {
      badge: 'STEP 03',
      title: 'Multi-Chain Swap',
      description: 'Perform cross-chain swaps to convert and transfer assets between different networks in a single transaction.',
      icon: Cpu
    }
  ],
  nfts: [
    {
      badge: 'STEP 01',
      title: 'Multi-Chain Aggregation',
      description: 'Scan and view your digital collectibles across EVM, Solana, and other networks concurrently in a unified dashboard.',
      icon: Image
    },
    {
      badge: 'STEP 02',
      title: 'Spam & Airdrop Filters',
      description: 'Automatically screen out copycat tokens, scam airdrop claims, and malicious contract addresses to keep your collection safe.',
      icon: EyeOff
    }
  ]
};

export default function LandingPage() {
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [activeFlowTab, setActiveFlowTab] = useState<'onboarding' | 'transacting' | 'converting' | 'nfts'>('onboarding');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Whenever activeFlowTab changes, reset currentStepIndex to 0
  useEffect(() => {
    setCurrentStepIndex(0);
  }, [activeFlowTab]);

  // Toggle theme class on the root HTML element
  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  return (
    <div className="landing-container">
      {/* Background Grid Pattern */}
      <div className="grid-overlay" />
      <div className="radial-glow" />



      {/* Header */}
      <header className="landing-header">
        <div className="header-logo">
          <img src="/logo_icon.png?v=2" alt="Num Wallet Logo" className="header-logo-img" />
          <span>NUM WALLET</span>
        </div>
        <nav className="header-nav">
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#reviews">Reviews</a>
          <a href="#compliance">Credibility</a>
          <Link to="/docs" className="nav-docs-link">
            <Terminal size={14} />
            <span>Developer Docs</span>
          </Link>
        </nav>
        <div className="header-actions">
          {/* Light/Dark mode switcher */}
          <button 
            onClick={() => setIsLightMode(!isLightMode)} 
            className="theme-toggle-btn"
            title="Toggle theme mode"
            aria-label="Toggle Theme"
          >
            {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          <a href="#download" className="download-btn-header">
            Get Wallet
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <Glass3DCanvas type="btc" size="lg" isLightMode={isLightMode} animationStyle="y" style={{ position: 'absolute', top: '50px', left: '-350px', zIndex: 1 }} className="glass-3d-coin-container canvas-btc" />
        <Glass3DCanvas type="sol" size="lg" isLightMode={isLightMode} animationStyle="diagonal" style={{ position: 'absolute', top: '150px', right: '-350px', zIndex: 1 }} className="glass-3d-coin-container canvas-sol" />
        {/* Monument Vertical Title (Left side) */}
        <div className="hero-monument">
          <span>NUM CORE ENGINE v1.0.4 [ACTIVE]</span>
        </div>

        <div className="hero-content">
          <h1 className="hero-title">
            YOUR PHONE NUMBER. <br />
            <span className="accent-gradient">YOUR SMART WALLET.</span>
          </h1>

          <p className="hero-description">
            As simple as it is, your phone number serves as your wallet address. Send, receive, and swap assets across 100+ supported networks (including EVM, Solana, Ton, and Ripple) seamlessly.
          </p>

          {/* Hero Stats Row */}
          <div className="hero-stats-row">
            <div className="hero-stat">
              <span className="hero-stat-value">10-Digit</span>
              <span className="hero-stat-label">Permanent Routing</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">100%</span>
              <span className="hero-stat-label">Privy MPC Auth</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">100+</span>
              <span className="hero-stat-label">Chains Supported</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">0%</span>
              <span className="hero-stat-label">Phrase Anxiety</span>
            </div>
          </div>

          <div className="hero-cta-group" id="download">
            <a 
              href="/numwallet-release.apk" 
              download 
              className="cta-primary-btn"
            >
              <Download size={18} />
              <span>Direct Download APK</span>
            </a>
            
            <div className="store-badges">
              <div className="store-badge-card disabled" title="App Store release coming soon">
                <div className="store-info">
                  <span className="store-status">COMING SOON</span>
                  <span className="store-name">App Store</span>
                </div>
              </div>

              <div className="store-badge-card disabled" title="Google Play Store release coming soon">
                <div className="store-info">
                  <span className="store-status">COMING SOON</span>
                  <span className="store-name">Google Play</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Interactive Screen Preview with Orbiting Floating Badges */}
        <div className="hero-preview-container">
          {/* Orbiting Badges */}
          <div className="floating-badge badge-sol">
            <img src="https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/solana/info/logo.png" alt="SOL" className="floating-badge-icon" />
            <span>Solana</span>
          </div>
          <div className="floating-badge badge-eth">
            <img src="https://cdn.jsdelivr.net/gh/trustwallet/assets@master/blockchains/ethereum/info/logo.png" alt="ETH" className="floating-badge-icon" />
            <span>Ethereum</span>
          </div>
          <div className="floating-badge badge-privy">
            <Shield size={14} color="#00FFCC" />
            <span>Privy Auth</span>
          </div>
          <div className="floating-badge badge-webacy">
            <Shield size={14} color="#EF4444" />
            <span>Webacy Shield</span>
          </div>

          <div className="phone-mockup">
            <div className="phone-dynamic-island" />
            <div className="phone-screen screenshot-mode">
              <img 
                src={isLightMode ? "/dashboard_light.png" : "/dashboard_dark.png"} 
                alt="Num Wallet App Screen" 
                className="phone-screenshot-img" 
              />
            </div>
            <div className="phone-home-indicator" />
          </div>
        </div>
      </section>

      {/* Chains Sliding Marquee (Inspired by Raven Wallet) */}
      <section className="chains-marquee">
        <div className="marquee-track">
          <div className="marquee-content">
            {MAJOR_CHAINS.map((chain, index) => (
              <React.Fragment key={`main-${index}`}>
                <div className="marquee-item">
                  <img src={chain.icon} alt={chain.name} className="marquee-logo" />
                  <span>{chain.name}</span>
                </div>
                <span className="chain-dot" />
              </React.Fragment>
            ))}
            {/* Duplicates for seamless looping */}
            {MAJOR_CHAINS.map((chain, index) => (
              <React.Fragment key={`dup-${index}`}>
                <div className="marquee-item">
                  <img src={chain.icon} alt={chain.name} className="marquee-logo" />
                  <span>{chain.name}</span>
                </div>
                <span className="chain-dot" />
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Potential Integration Partners Trust Strip */}
      <section className="partners-strip" id="partners">
        <div className="partners-container">
          <span className="partners-label">POTENTIAL INTEGRATION INFRASTRUCTURE</span>
          <div className="partners-logos">
            <div className="partner-logo-item">
              <Key size={14} />
              <span>Privy (MPC Auth)</span>
            </div>
            <div className="partner-logo-item">
              <Shield size={14} />
              <span>Webacy (Threat Shield)</span>
            </div>
            <div className="partner-logo-item">
              <Zap size={14} />
              <span>LI.FI (Multi-Chain Swaps)</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section" id="how-it-works">
        <div className="section-header-centered">
          <span className="meta-label">[ INTERACTIVE FLOWS ]</span>
          <h2>HOW IT WORKS</h2>
          <p>A self-custody wallet that simplifies identity, transaction routing, and multi-chain assets.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flow-tabs">
          <button 
            className={`flow-tab-btn ${activeFlowTab === 'onboarding' ? 'active' : ''}`}
            onClick={() => setActiveFlowTab('onboarding')}
          >
            Onboarding
          </button>
          <button 
            className={`flow-tab-btn ${activeFlowTab === 'transacting' ? 'active' : ''}`}
            onClick={() => setActiveFlowTab('transacting')}
          >
            Send & Receive
          </button>
          <button 
            className={`flow-tab-btn ${activeFlowTab === 'converting' ? 'active' : ''}`}
            onClick={() => setActiveFlowTab('converting')}
          >
            Swap & Bridge
          </button>
          <button 
            className={`flow-tab-btn ${activeFlowTab === 'nfts' ? 'active' : ''}`}
            onClick={() => setActiveFlowTab('nfts')}
          >
            NFTs
          </button>
        </div>

        {/* Tab contents */}
        {(() => {
          const steps = FLOW_STEPS[activeFlowTab];
          const currentStep = steps[currentStepIndex] || steps[0];
          const StepIcon = currentStep.icon;
          return (
            <div className="reveal-fade" key={`${activeFlowTab}-${currentStepIndex}`}>
              <div className="centered-step-container">
                {/* Navigation Arrow Left */}
                <button 
                  className="step-nav-arrow left"
                  onClick={() => setCurrentStepIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentStepIndex === 0}
                  aria-label="Previous step"
                >
                  <ChevronLeft size={24} />
                </button>

                {/* The Big Centered Card */}
                <div className="step-card big-centered">
                  <span className="step-badge">{currentStep.badge}</span>
                  <div className="step-icon-wrap big-icon">
                    <StepIcon size={36} />
                  </div>
                  <div className="step-body centered-body">
                    <h3>{currentStep.title}</h3>
                    <p>{currentStep.description}</p>
                  </div>
                </div>

                {/* Navigation Arrow Right */}
                <button 
                  className="step-nav-arrow right"
                  onClick={() => setCurrentStepIndex(prev => Math.min(steps.length - 1, prev + 1))}
                  disabled={currentStepIndex === steps.length - 1}
                  aria-label="Next step"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              {/* Step Indicator Dots */}
              <div className="step-dots">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    className={`step-dot-btn ${idx === currentStepIndex ? 'active' : ''}`}
                    onClick={() => setCurrentStepIndex(idx)}
                    aria-label={`Go to step ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Credibility & Compliance Section */}
      <section className="credibility-strip" id="compliance">
        <div className="compliance-grid">
          <div className="compliance-card">
            <div className="comp-tag">[ REGULATORY ]</div>
            <h3>CAC Incorporation</h3>
            <p className="comp-reg">Coming Soon</p>
            <p className="comp-details">
              Num Wallet corporate registration and compliance status with the Corporate Affairs Commission (CAC): Coming Soon.
            </p>
            <div className="comp-badge-check status-pending">
              <HelpCircle size={14} color="var(--text-secondary)" />
              <span>Status: Coming Soon</span>
            </div>
          </div>

          <div className="compliance-card" id="security">
            <div className="comp-tag">[ THREAT SCANNING ]</div>
            <h3>Webacy API Shield</h3>
            <p className="comp-reg">Integration Planned</p>
            <p className="comp-details">
              Targeted integration with Webacy's threat database to analyze dApp connection request domains and block phishing spenders.
            </p>
            <div className="comp-badge-check status-pending">
              <HelpCircle size={14} color="var(--text-secondary)" />
              <span>Status: Planned</span>
            </div>
          </div>

          <div className="compliance-card">
            <div className="comp-tag">[ VERIFICATION ]</div>
            <h3>Formal Audits</h3>
            <p className="comp-reg">Coming Soon</p>
            <p className="comp-details">
              External cryptographic security audits and smart contract verification report publications: Coming Soon.
            </p>
            <div className="comp-badge-check status-pending">
              <HelpCircle size={14} color="var(--text-secondary)" />
              <span>Status: Scheduled</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="features-section" id="features">
        <Glass3DCanvas type="eth" size="lg" isLightMode={isLightMode} animationStyle="x" style={{ position: 'absolute', top: '50px', left: '-350px', zIndex: 1 }} className="glass-3d-coin-container canvas-eth" />
        <div className="section-header-centered">
          <span className="meta-label">[ ARCHITECTURE OUTLINE ]</span>
          <h2>REENGINEERING SELF-CUSTODY</h2>
          <p>We removed the technical complexities that hinder mainstream onboarding.</p>
        </div>

        <div className="bento-grid">
          {/* Card 1: Privy MPC */}
          <div className="bento-card col-2">
            <div className="bento-icon-box">
              <Key size={22} color="var(--primary)" />
            </div>
            <div className="bento-body">
              <h3>Privy Multi-Party Computation</h3>
              <p>
                Eliminate private key seed phrase vulnerability. Your recovery keys are sharded cryptographically using Privy MPC: one split is stored securely in your local device keychain/biometrics, and the other inside secure enclaves.
              </p>
            </div>
          </div>

          {/* Card 2: Gas Shortfall Interception */}
          <div className="bento-card">
            <div className="bento-icon-box">
              <Zap size={22} color="var(--primary)" />
            </div>
            <div className="bento-body">
              <h3>Gas Shortfall Interception</h3>
              <p>
                Num Wallet intercepts transactions before they fail due to "insufficient gas," alerting you to deposit native gas tokens to your backing address, preventing wasted network fee failures.
              </p>
            </div>
          </div>

          {/* Card 3: Webacy Phishing Shield */}
          <div className="bento-card">
            <div className="bento-icon-box">
              <Shield size={22} color="var(--primary)" />
            </div>
            <div className="bento-body">
              <h3>Webacy Phishing Shield</h3>
              <p>
                Browse securely inside the curated browser hub. The shield acts as a guard, warning you of phishing domains and spender risks with direct options to disconnect.
              </p>
            </div>
          </div>

          {/* Card 4: Unified Identity */}
          <div className="bento-card col-2">
            <div className="bento-icon-box">
              <Cpu size={22} color="var(--primary)" />
            </div>
            <div className="bento-body">
              <h3>Unified Address Registry</h3>
              <p>
                Manage EVM, Solana, Ton, and Ripple networks with one unified identity. Our secure registry maps traditional blockchain addresses to your phone number under the hood. Transactions execute on-chain using standard wallet addresses, while the phone number provides a Web2-friendly routing layer for effortless transfers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Reviews Section */}
      <section className="reviews-section" id="reviews">
        <Glass3DCanvas type="usd" size="md" isLightMode={isLightMode} animationStyle="y" style={{ position: 'absolute', top: '50px', right: '-250px', zIndex: 1 }} className="glass-3d-coin-container canvas-usd" />
        <div className="section-header-centered">
          <span className="meta-label">[ USER TESTIMONIALS ]</span>
          <h2>COMMUNITY REVIEWS</h2>
          <p>Here is what early adopters and Web3 developers are saying about Num Wallet.</p>
        </div>

        <div className="reviews-grid">
          <div className="review-card">
            <div className="review-header">
              <div className="review-avatar avatar-1">JD</div>
              <div className="review-user-info">
                <span className="review-username">
                  Jonathan D.
                  <span className="review-verified-badge">Verified User</span>
                </span>
                <span className="review-handle">@jondcrypto</span>
              </div>
            </div>
            <div className="review-stars">
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
            </div>
            <p className="review-text">
              "I've been in crypto since 2017 and always worried about losing my seed phrase. The offline PIN-decrypted HTML backup in my Gmail is absolute genius. Super secure, and I don't have to keep a piece of paper in a drawer."
            </p>
          </div>

          <div className="review-card">
            <div className="review-header">
              <div className="review-avatar avatar-2">AM</div>
              <div className="review-user-info">
                <span className="review-username">
                  Aisha M.
                  <span className="review-verified-badge">Verified Developer</span>
                </span>
                <span className="review-handle">@aishacodes</span>
              </div>
            </div>
            <div className="review-stars">
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
            </div>
            <p className="review-text">
              "Sending tokens to phone numbers is how Web3 onboarding should have always been. Plus, the Gas Shortfall Interception saved me twice when I forgot to top up my native gas tokens. Outstanding UX!"
            </p>
          </div>

          <div className="review-card">
            <div className="review-header">
              <div className="review-avatar avatar-3">TL</div>
              <div className="review-user-info">
                <span className="review-username">
                  Tyler L.
                  <span className="review-verified-badge">Verified Trader</span>
                </span>
                <span className="review-handle">@tyler_defi</span>
              </div>
            </div>
            <div className="review-stars">
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
            </div>
            <p className="review-text">
              "Was skeptical about phone-number self-custody at first, but Privy MPC under the hood makes it bulletproof. Deployed a transaction and received the encrypted recovery file in my Gmail instantly. Highly recommended!"
            </p>
          </div>
        </div>
      </section>

      {/* Our Vision & Mission Section */}
      <section className="about-section" id="vision-mission">
        <div className="about-grid">
          <div className="about-col">
            <span className="meta-label">[ THE VISION ]</span>
            <h2>OUR VISION</h2>
            <p className="about-text">
              We envision a world where anyone with a phone number can participate in the global crypto economy without needing to understand blockchain complexity, copy wallet addresses, or trust a custodian to do it for them.
            </p>
          </div>
          <div className="about-col">
            <span className="meta-label">[ THE MISSION ]</span>
            <h2>OUR MISSION</h2>
            <p className="about-text">
              To build a self-custodial wallet that makes this possible. By securely mapping your phone number to decentralized addresses across every blockchain possible, we provide a familiar routing layer that makes Web3 as simple as sending a text.
            </p>
          </div>
        </div>
      </section>

      {/* Developer Docs Deep Dive */}
      <section className="dev-cta-section">
        <Glass3DCanvas type="ngn" size="sm" isLightMode={isLightMode} animationStyle="diagonal" style={{ position: 'absolute', top: '-50px', left: '-200px', zIndex: 1 }} className="glass-3d-coin-container canvas-ngn" />
        <div className="dev-cta-card">
          <div className="dev-left">
            <span className="meta-label">[ INTEGRATION CENTER ]</span>
            <h2>BUILD ON NUM PROVIDER</h2>
            <p>
              Num Wallet automatically injects standard EVM and Solana providers. Detect connection requests, query RPC metadata, and request signs using our simplified developer API SDK.
            </p>
            <div className="dev-btn-group">
              <Link to="/docs" className="dev-btn-fill">
                Explore Dev Docs
              </Link>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="dev-btn-outline">
                GitHub Repository
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
          <div className="dev-right">
            <pre className="dev-code-preview">
{`// Detect Num Wallet Provider
if (window.ethereum?.isNumWallet) {
  const accounts = await window.ethereum.request({
    method: 'eth_requestAccounts'
  });
  console.log("Connected to Num:", accounts[0]);
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-top">
          <div className="footer-logo">
            <img src="/logo_icon.png?v=2" alt="Num Wallet Logo" className="header-logo-img" />
            <span>NUM WALLET</span>
          </div>
          <div className="footer-links-grid">
            <div className="links-col">
              <h4>PRODUCT</h4>
              <a href="#features">Features</a>
              <a href="#download">Downloads</a>
              <Link to="/docs">Documentation</Link>
            </div>
            <div className="links-col">
              <h4>SECURITY</h4>
              <a href="#security">Webacy Shield</a>
              <a href="#compliance">Compliance Info</a>
              <a href="#compliance">Audit Status</a>
            </div>
            <div className="links-col">
              <h4>COMPANY</h4>
              <button onClick={() => setShowAboutModal(true)} style={{ cursor: 'pointer', textAlign: 'left', background: 'none', border: 'none', color: 'inherit' }}>
                About Us
              </button>
              <span>Support (Coming Soon)</span>
              <Link to="/docs">Integrate SDK</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Num Wallet Technologies. All rights reserved. Compliance registration pending.</p>
          <div className="footer-socials">
            <a href="https://x.com/NumWallet" target="_blank" rel="noreferrer">
              Twitter / X (@NumWallet)
            </a>
            <span>Discord</span>
            <span>Telegram</span>
          </div>
        </div>
      </footer>

      {showAboutModal && (
        <div className="about-modal-overlay" onClick={() => setShowAboutModal(false)}>
          <div className="about-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>About Num Wallet</h3>
              <button className="close-modal-btn" onClick={() => setShowAboutModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p className="modal-title">Who We Are</p>
              <p>Num Wallet is a security-first financial technology project focused on simplifying self-custody. Our team is comprised of cryptography researchers, smart contract developers, and UX designers dedicated to stripping away the friction of Web3 onboarding.</p>
              
              <p className="modal-title">Our Tech Values</p>
              <p>We believe that users shouldn't have to choose between convenience and security. By leveraging Multi-Party Computation (MPC) and real-time transaction screening (Webacy), we enable users to manage their funds securely with simple phone-number recoveries.</p>
              
              <p className="modal-title">Governance & Transparency</p>
              <p>We operate with a commitment to open-source contributions. Our developer SDKs are designed to help the wider ecosystem easily integrate smart account provider injection, building a safer Web3 together.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
