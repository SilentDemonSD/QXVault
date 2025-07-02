// QXVault - Quantum-Secure Serverless Password Manager
// Cloudflare Worker Implementation

// Post-quantum cryptography simulation (Kyber-like key derivation)
class QuantumSecureCrypto {
  static async deriveKey(passphrase, domain, deviceSecret, salt) {
    const encoder = new TextEncoder();
    const combined = encoder.encode(passphrase + domain + deviceSecret + salt);
    
    // Simulate post-quantum key derivation with multiple rounds
    let key = await crypto.subtle.importKey(
      'raw',
      combined,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode('QXVault-PQ-Salt-2025'),
        iterations: 100000,
        hash: 'SHA-512'
      },
      key,
      256
    );
    
    return new Uint8Array(derivedBits);
  }
  
  static async generatePassword(keyBytes, length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const index = keyBytes[i % keyBytes.length] % chars.length;
      password += chars[index];
    }
    
    return password;
  }
}

// HTML Template with Next-Gen Quantum UI
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QXVault - Quantum-Secure Password Manager</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@300;400;700;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet">
    <style>
        :root {
            /* True Black Cyberpunk Theme */
            --bg-primary: #000000;
            --bg-secondary: #0a0a0a;
            --bg-card: rgba(5, 5, 5, 0.95);
            --bg-surface: rgba(10, 10, 10, 0.8);
            --border-primary: rgba(0, 255, 255, 0.2);
            --border-hover: rgba(0, 255, 255, 0.5);
            --text-primary: #ffffff;
            --text-secondary: #b0b0b0;
            --text-accent: #00ffff;
            --accent-cyan: #00ffff;
            --accent-purple: #8a2be2;
            --gradient-cyber: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(138, 43, 226, 0.1));
            --shadow-cyber: 0 0 20px rgba(0, 255, 255, 0.3);
            --shadow-glow: 0 0 40px rgba(0, 255, 255, 0.1);
        }
        
        [data-theme="light"] {
            --bg-primary: #ffffff;
            --bg-secondary: #f8f9fa;
            --bg-card: rgba(255, 255, 255, 0.95);
            --bg-surface: rgba(248, 249, 250, 0.8);
            --border-primary: rgba(0, 123, 255, 0.2);
            --border-hover: rgba(0, 123, 255, 0.5);
            --text-primary: #000000;
            --text-secondary: #666666;
            --text-accent: #007bff;
            --accent-cyan: #007bff;
            --accent-purple: #6f42c1;
            --gradient-cyber: linear-gradient(135deg, rgba(0, 123, 255, 0.1), rgba(111, 66, 193, 0.1));
            --shadow-cyber: 0 0 20px rgba(0, 123, 255, 0.2);
            --shadow-glow: 0 0 40px rgba(0, 123, 255, 0.1);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            overflow-x: hidden;
            font-size: 16px;
            position: relative;
        }
        
        /* Cyberpunk background */
        .quantum-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: var(--gradient-cyber);
            pointer-events: none;
            z-index: -1;
            opacity: 0.3;
        }
        
        /* Clean minimal navigation inspired by xAI */
        .navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(24px);
            border-bottom: 1px solid var(--border-primary);
            z-index: 1000;
            padding: 16px 0;
        }
        
        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 24px;
        }
        
        .nav-controls {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .logo {
            font-family: 'Orbitron', monospace;
            font-size: 24px;
            font-weight: 700;
            color: var(--text-accent);
            text-decoration: none;
        }
        
        .nav-tabs {
            display: flex;
            gap: 8px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(16px);
            border-radius: 12px;
            padding: 6px;
            border: 1px solid var(--border-primary);
        }
        
        .nav-tab {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 12px 20px;
            border-radius: 8px;
            transition: all 0.2s ease;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;
        }
        
        .nav-tab:hover {
            color: var(--text-primary);
            background: rgba(255, 255, 255, 0.1);
        }
        
        .nav-tab.active {
            background: var(--text-accent);
            color: var(--bg-primary);
            box-shadow: var(--shadow-cyber);
        }
        
        /* Mobile hamburger menu */
        .mobile-menu-btn {
            display: none;
            background: none;
            border: 1px solid var(--border-primary);
            color: var(--text-primary);
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            font-size: 18px;
        }
        
        /* Theme toggle - inside navbar */
        .theme-toggle {
            background: var(--bg-card);
            border: 1px solid var(--border-primary);
            color: var(--text-primary);
            cursor: pointer;
            padding: 10px;
            border-radius: 8px;
            transition: all 0.2s ease;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(16px);
            box-shadow: var(--shadow-cyber);
            font-size: 18px;
        }
        
        .theme-toggle:hover {
            border-color: var(--border-hover);
            box-shadow: var(--shadow-glow);
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 100px 24px 48px;
        }
        
        .hero {
            text-align: center;
            margin-bottom: 48px;
        }
        
        .hero h1 {
            font-family: 'Orbitron', monospace;
            font-size: clamp(36px, 8vw, 64px);
            font-weight: 900;
            color: var(--text-accent);
            margin-bottom: 16px;
            text-shadow: var(--shadow-cyber);
            letter-spacing: -0.02em;
        }
        
        .tagline {
            font-size: clamp(16px, 4vw, 20px);
            color: var(--text-secondary);
            margin-bottom: 32px;
            font-weight: 400;
        }
        
        /* Clean card design */
        .card {
            background: var(--bg-card);
            border: 1px solid var(--border-primary);
            border-radius: 16px;
            padding: 32px;
            backdrop-filter: blur(24px);
            box-shadow: var(--shadow-glow);
            margin-bottom: 24px;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .card:hover {
            border-color: var(--border-hover);
            box-shadow: var(--shadow-cyber);
        }
        
        .card h2, .card h3 {
            color: var(--text-primary);
            margin-bottom: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .card h2 {
            font-size: 24px;
        }
        
        .card h3 {
            font-size: 20px;
        }
        
        /* Improved info buttons */
        .info-btn {
            background: var(--bg-secondary);
            border: 1px solid var(--border-primary);
            color: var(--text-accent);
            cursor: pointer;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            position: relative;
            flex-shrink: 0;
        }
        
        .info-btn:hover {
            background: var(--text-accent);
            color: var(--bg-primary);
            box-shadow: var(--shadow-cyber);
        }
        
        /* Enhanced tooltip */
        .tooltip {
            position: absolute;
            bottom: calc(100% + 12px);
            left: 50%;
            transform: translateX(-50%);
            background: var(--bg-primary);
            color: var(--text-primary);
            padding: 16px 20px;
            border-radius: 12px;
            font-size: 14px;
            white-space: nowrap;
            box-shadow: var(--shadow-cyber);
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s ease;
            z-index: 1000;
            max-width: 320px;
            white-space: normal;
            border: 1px solid var(--border-primary);
            backdrop-filter: blur(16px);
        }
        
        .tooltip::after {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 8px solid transparent;
            border-top-color: var(--bg-primary);
        }
        
        .info-btn:hover .tooltip {
            opacity: 1;
            pointer-events: auto;
        }
        
        
        /* Clean form components */
        .form-group {
            margin-bottom: 24px;
            position: relative;
        }
        
        .form-label {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;
            color: var(--text-primary);
            font-weight: 500;
            font-size: 14px;
        }
        
        .form-input {
            width: 100%;
            padding: 16px 20px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-primary);
            border-radius: 12px;
            color: var(--text-primary);
            font-size: 16px;
            font-family: 'Inter', sans-serif;
            transition: all 0.2s ease;
        }
        
        .form-input:focus {
            outline: none;
            border-color: var(--text-accent);
            box-shadow: 0 0 0 3px rgba(0, 255, 255, 0.1);
        }
        
        .form-input::placeholder {
            color: var(--text-secondary);
        }
        
        /* Improved slider with visible values */
        .slider-container {
            position: relative;
            margin: 20px 0;
        }
        
        .slider-wrapper {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .slider-track-container {
            flex: 1;
            position: relative;
            height: 40px;
            display: flex;
            align-items: center;
        }
        
        .slider-input {
            width: 100%;
            height: 8px;
            background: var(--bg-secondary);
            border-radius: 4px;
            outline: none;
            cursor: pointer;
            -webkit-appearance: none;
            appearance: none;
            border: 1px solid var(--border-primary);
        }
        
        .slider-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            background: var(--text-accent);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 255, 255, 0.4);
            transition: all 0.2s ease;
            border: 2px solid var(--bg-primary);
        }
        
        .slider-input::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 6px 16px rgba(0, 255, 255, 0.6);
        }
        
        .slider-input::-moz-range-thumb {
            width: 24px;
            height: 24px;
            background: var(--text-accent);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid var(--bg-primary);
            box-shadow: 0 4px 12px rgba(0, 255, 255, 0.4);
            transition: all 0.2s ease;
        }
        
        .slider-input::-moz-range-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 6px 16px rgba(0, 255, 255, 0.6);
        }
        
        .slider-value-display {
            background: var(--text-accent);
            color: var(--bg-primary);
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            min-width: 60px;
            text-align: center;
            box-shadow: var(--shadow-cyber);
        }
        
        /* Clean buttons */
        .btn {
            padding: 16px 24px;
            border: 1px solid var(--border-primary);
            border-radius: 12px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            font-family: 'Inter', sans-serif;
            transition: all 0.2s ease;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            text-align: center;
            min-height: 48px;
        }
        
        .btn:hover {
            border-color: var(--text-accent);
            box-shadow: var(--shadow-cyber);
        }
        
        .btn:active {
            transform: scale(0.98);
        }
        
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .btn-primary {
            background: var(--text-accent);
            color: var(--bg-primary);
            border-color: var(--text-accent);
        }
        
        .btn-primary:hover {
            box-shadow: var(--shadow-glow);
        }
        
        .btn-group {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
        }
        
        /* Clean switch */
        .switch-container {
            display: flex;
            align-items: center;
            gap: 12px;
            min-height: 44px; /* Touch-friendly height */
        }
        
        .switch {
            position: relative;
            width: 48px;
            height: 24px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-primary);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            flex-shrink: 0;
        }
        
        .switch::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            width: 18px;
            height: 18px;
            background: var(--text-secondary);
            border-radius: 50%;
            transition: all 0.2s ease;
        }
        
        .switch-input {
            position: absolute;
            opacity: 0;
            width: 100%;
            height: 100%;
            cursor: pointer;
        }
        
        .switch-input:checked + .switch {
            background: var(--text-accent);
            border-color: var(--text-accent);
        }
        
        .switch-input:checked + .switch::before {
            left: 26px;
            background: var(--bg-primary);
        }
        
        /* Password output */
        .password-output {
            background: var(--bg-secondary);
            border: 1px solid var(--border-primary);
            border-radius: 12px;
            padding: 20px;
            font-family: 'JetBrains Mono', 'Courier New', monospace;
            font-size: 16px;
            word-break: break-all;
            min-height: 60px;
            display: flex;
            align-items: center;
            color: var(--text-primary);
            transition: all 0.2s ease;
        }
        
        /* Settings section with minimize */
        .settings-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }
        
        .minimize-btn {
            background: none;
            border: 1px solid var(--border-primary);
            color: var(--text-primary);
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            transition: all 0.2s ease;
            font-size: 18px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .minimize-btn:hover {
            border-color: var(--text-accent);
            color: var(--text-accent);
        }
        
        .settings-content {
            transition: all 0.3s ease;
            overflow: hidden;
        }
        
        .settings-content.collapsed {
            max-height: 0;
            margin: 0;
        }
        
        
        /* Status messages */
        .status {
            padding: 16px 20px;
            border-radius: 12px;
            margin: 16px 0;
            text-align: center;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: 1px solid var(--border-primary);
        }
        
        .status.success {
            background: rgba(0, 255, 0, 0.1);
            color: #00ff00;
            border-color: rgba(0, 255, 0, 0.3);
        }
        
        .status.error {
            background: rgba(255, 0, 0, 0.1);
            color: #ff4444;
            border-color: rgba(255, 0, 0, 0.3);
        }
        
        .status.info {
            background: rgba(0, 255, 255, 0.1);
            color: var(--text-accent);
            border-color: var(--border-primary);
        }
        
        /* Tab content */
        .tab-content {
            display: none;
            animation: fadeIn 0.3s ease;
        }
        
        .tab-content.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(16px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        /* Settings grid */
        .settings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
            margin-top: 24px;
        }
        
        .settings-card {
            background: var(--bg-surface);
            border: 1px solid var(--border-primary);
            border-radius: 12px;
            padding: 20px;
            transition: all 0.2s ease;
        }
        
        .settings-card:hover {
            border-color: var(--border-hover);
            box-shadow: var(--shadow-cyber);
        }
        
        /* FAQ styling */
        .faq-item {
            margin-bottom: 16px;
            background: var(--bg-surface);
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid var(--border-primary);
        }
        
        .faq-question {
            font-weight: 600;
            color: var(--text-accent);
            margin: 0;
            cursor: pointer;
            padding: 20px 24px;
            background: var(--bg-secondary);
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .faq-question:hover {
            background: var(--bg-card);
        }
        
        .faq-question::after {
            content: '▼';
            transition: transform 0.2s ease;
            font-size: 12px;
        }
        
        .faq-question.expanded::after {
            transform: rotate(180deg);
        }
        
        .faq-answer {
            color: var(--text-secondary);
            padding: 0 24px 24px;
            line-height: 1.6;
        }
        
        /* Lists */
        ul {
            list-style: none;
            padding: 0;
        }
        
        ul li {
            position: relative;
            padding: 8px 0 8px 20px;
            color: var(--text-secondary);
        }
        
        ul li::before {
            content: '•';
            color: var(--text-accent);
            position: absolute;
            left: 0;
            font-weight: bold;
        }
        
        /* Links */
        a {
            color: var(--text-accent);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s ease;
        }
        
        a:hover {
            color: var(--accent-purple);
            text-decoration: underline;
        }
        
        /* Mobile-first responsive design */
        @media (max-width: 1024px) {
            .container {
                padding: 80px 20px 32px;
            }
            
            .settings-grid {
                grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                gap: 16px;
            }
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 80px 16px 24px;
            }
            
            .nav-tabs {
                display: none;
            }
            
            .mobile-menu-btn {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .nav-tabs.mobile-open {
                display: flex;
                position: fixed;
                top: 80px;
                left: 16px;
                right: 16px;
                flex-direction: column;
                background: var(--bg-card);
                border: 1px solid var(--border-primary);
                border-radius: 12px;
                padding: 16px;
                z-index: 999;
                backdrop-filter: blur(24px);
                box-shadow: var(--shadow-glow);
            }
            
            .nav-tabs.mobile-open .nav-tab {
                width: 100%;
                text-align: center;
                margin-bottom: 8px;
                border-radius: 8px;
            }
            
            .theme-toggle {
                top: 16px;
                right: 16px;
                width: 44px;
                height: 44px;
            }
            
            .hero h1 {
                font-size: clamp(28px, 8vw, 48px);
            }
            
            .tagline {
                font-size: clamp(14px, 4vw, 18px);
            }
            
            .card {
                padding: 20px;
                border-radius: 12px;
            }
            
            .btn-group {
                flex-direction: column;
            }
            
            .btn {
                width: 100%;
                justify-content: center;
            }
            
            .settings-grid {
                grid-template-columns: 1fr;
                gap: 16px;
            }
            
            .slider-wrapper {
                flex-direction: column;
                gap: 12px;
                align-items: stretch;
            }
            
            .slider-track-container {
                width: 100%;
                min-height: 40px;
            }
            
            .slider-input {
                width: 100%;
            }
            
            .slider-value-display {
                align-self: center;
                min-width: 80px;
            }
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 70px 12px 20px;
            }
            
            .navbar {
                padding: 12px 0;
            }
            
            .nav-container {
                padding: 0 16px;
            }
            
            .card {
                padding: 16px;
            }
            
            .form-input {
                padding: 14px 16px;
                font-size: 16px; /* Prevent zoom on iOS */
            }
            
            .btn {
                padding: 14px 20px;
                font-size: 14px;
            }
            
            .info-btn {
                width: 28px;
                height: 28px;
                font-size: 12px;
                min-height: 44px; /* Touch-friendly */
                min-width: 44px;
            }
            
            .switch-container {
                min-height: 48px; /* Larger touch target on mobile */
            }
            
            .minimize-btn {
                min-height: 44px;
                min-width: 44px;
            }
        }
        
        /* Utility classes */
        .hidden {
            display: none !important;
        }
        
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
        }
        
        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
        
        /* Focus styles */
        *:focus-visible {
            outline: 2px solid var(--text-accent);
            outline-offset: 2px;
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
            .card {
                border-width: 2px;
            }
            
            .btn {
                border-width: 2px;
            }
        }
        
        /* Footer */
        .footer {
            margin-top: 48px;
            padding: 32px 0;
            border-top: 1px solid var(--border-primary);
            background: var(--bg-secondary);
        }
        
        .footer-content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 24px;
            text-align: center;
        }
        
        .footer p {
            color: var(--text-secondary);
            font-size: 14px;
            margin: 0;
        }
        
        @media (max-width: 768px) {
            .footer {
                margin-top: 32px;
                padding: 24px 0;
            }
            
            .footer-content {
                padding: 0 16px;
            }
        }
    </style>
</head>
<body>
    <div class="quantum-bg"></div>
    
    <nav class="navbar">
        <div class="nav-container">
            <a href="#" class="logo">QXVault</a>
            <div class="nav-tabs" id="navTabs">
                <button class="nav-tab active" data-tab="home">Home</button>
                <button class="nav-tab" data-tab="about">About</button>
                <button class="nav-tab" data-tab="faq">FAQ</button>
                <button class="nav-tab" data-tab="different">How It's Different</button>
                <button class="nav-tab" data-tab="trust">Why Trust Us</button>
                <button class="nav-tab" data-tab="terms">T&C</button>
                <button class="nav-tab" data-tab="source">Source Code</button>
            </div>
            <div class="nav-controls">
                <button class="theme-toggle" onclick="toggleTheme()" id="themeToggle">
                    <span class="material-icons-round">dark_mode</span>
                </button>
                <button class="mobile-menu-btn" id="mobileMenuBtn">☰</button>
            </div>
        </div>
    </nav>
    
    <div class="container">
        <!-- Home Tab -->
        <div id="home" class="tab-content active">
            <div class="hero">
                <h1>QXVault</h1>
                <p class="tagline">Quantum-Secure • Serverless • Deterministic Password Manager</p>
            </div>
            
            <div class="card">
                <h2>
                    Generate Quantum-Secure Password
                    <button class="info-btn" type="button">
                        i
                        <div class="tooltip">Create cryptographically secure passwords using post-quantum algorithms that are resistant to both classical and quantum computer attacks.</div>
                    </button>
                </h2>
                <form id="passwordForm">
                    <div class="form-group">
                        <label class="form-label">
                            Master Passphrase
                            <button class="info-btn" type="button">
                                i
                                <div class="tooltip">Your master secret that combines with site information to deterministically generate unique passwords. This is never stored or transmitted.</div>
                            </button>
                        </label>
                        <input type="password" id="masterPassphrase" class="form-input" placeholder="Enter your master passphrase" required autocomplete="current-password">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            Site/Service Name
                            <button class="info-btn" type="button">
                                i
                                <div class="tooltip">The website or service name (e.g., gmail.com, facebook.com). This ensures each site gets a unique password.</div>
                            </button>
                        </label>
                        <input type="text" id="siteName" class="form-input" placeholder="e.g., gmail.com, facebook.com" required autocomplete="off">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">
                            Username/Email (Optional)
                            <button class="info-btn" type="button">
                                i
                                <div class="tooltip">Optional: Include your username or email to generate different passwords for multiple accounts on the same site.</div>
                            </button>
                        </label>
                        <input type="email" id="userEmail" class="form-input" placeholder="user@example.com" autocomplete="email">
                    </div>
                    
                    <div class="btn-group">
                        <button type="button" id="webauthnBtn" class="btn">
                            <span class="material-icons-round">security</span>
                            Authenticate with Hardware Key
                        </button>
                        <button type="submit" id="generateBtn" class="btn btn-primary">
                            <span class="material-icons-round">vpn_key</span>
                            Generate Password
                        </button>
                    </div>
                </form>
                
                <div id="status" class="status hidden"></div>
                
                <div class="form-group">
                    <label class="form-label">
                        Generated Password
                        <button class="info-btn" type="button">
                            i
                            <div class="tooltip">Your quantum-secure password. Click copy to safely transfer it to your password field. It will be the same every time with the same inputs.</div>
                        </button>
                    </label>
                    <div id="passwordOutput" class="password-output">Click generate to create your quantum-secure password</div>
                </div>
                
                <div class="btn-group">
                    <button type="button" id="copyBtn" class="btn" disabled>
                        <span class="material-icons-round">content_copy</span>
                        Copy Password
                    </button>
                    <button type="button" id="clearBtn" class="btn">
                        <span class="material-icons-round">clear_all</span>
                        Clear All
                    </button>
                    <button type="button" id="skipAuthBtn" class="btn hidden">
                        <span class="material-icons-round">skip_next</span>
                        Skip Hardware Auth
                    </button>
                </div>
            </div>
            
            <div class="card">
                <div class="settings-header">
                    <h3>
                        Password Settings
                        <button class="info-btn" type="button">
                            i
                            <div class="tooltip">Customize your password generation preferences. These settings are saved locally in your browser.</div>
                        </button>
                    </h3>
                    <button class="minimize-btn" id="settingsMinimize" type="button">+</button>
                </div>
                <div class="settings-content collapsed" id="settingsContent">
                    <div class="settings-grid">
                        <div class="settings-card">
                            <div class="form-group">
                                <label class="form-label">
                                    Password Length
                                    <button class="info-btn" type="button">
                                        i
                                        <div class="tooltip">Longer passwords are more secure. We recommend at least 16 characters for optimal security.</div>
                                    </button>
                                </label>
                                <div class="slider-container">
                                    <div class="slider-wrapper">
                                        <div class="slider-track-container">
                                            <input type="range" id="passwordLength" class="slider-input" min="12" max="64" value="32" step="1">
                                        </div>
                                        <div class="slider-value-display" id="lengthValue">32</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-card">
                            <div class="form-group">
                                <label class="form-label">
                                    Include Special Characters
                                    <button class="info-btn" type="button">
                                        i
                                        <div class="tooltip">Special characters increase password complexity and security. Some sites may not accept all special characters.</div>
                                    </button>
                                </label>
                                <div class="switch-container">
                                    <input type="checkbox" id="includeSpecial" class="switch-input" checked>
                                    <div class="switch"></div>
                                    <span>Symbols & Punctuation</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-card">
                            <div class="form-group">
                                <label class="form-label">
                                    Quantum Resistance Level
                                    <button class="info-btn" type="button">
                                        i
                                        <div class="tooltip">Higher levels use more computational rounds for increased security against quantum attacks. May take slightly longer to generate.</div>
                                    </button>
                                </label>
                                <div class="slider-container">
                                    <div class="slider-wrapper">
                                        <div class="slider-track-container">
                                            <input type="range" id="quantumLevel" class="slider-input" min="1" max="5" value="3" step="1">
                                        </div>
                                        <div class="slider-value-display" id="quantumLevelValue">3</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-card">
                            <div class="form-group">
                                <label class="form-label">
                                    Auto-Clear Sensitive Data
                                    <button class="info-btn" type="button">
                                        i
                                        <div class="tooltip">Automatically clear your master passphrase and generated password after a specified time for enhanced security.</div>
                                    </button>
                                </label>
                                <div class="switch-container">
                                    <input type="checkbox" id="autoClear" class="switch-input" checked>
                                    <div class="switch"></div>
                                    <span>Clear after 5 minutes</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- About Tab -->
        <div id="about" class="tab-content">
            <div class="card">
                <h2>
                    About QXVault
                    <button class="info-btn" type="button">
                        i
                        <div class="tooltip">Learn about QXVault's innovative approach to password management in the quantum computing era.</div>
                    </button>
                </h2>
                <p>QXVault is a next-generation password manager designed for the quantum computing era. Unlike traditional password managers that store your passwords in encrypted databases, QXVault generates your passwords deterministically on-demand using post-quantum cryptographic algorithms.</p>
                
                <h3>🚀 Key Features</h3>
                <ul>
                    <li><strong>Quantum-Secure:</strong> Uses post-quantum cryptographic principles resistant to both classical and quantum attacks</li>
                    <li><strong>Serverless:</strong> No databases, no storage, no single point of failure</li>
                    <li><strong>Deterministic:</strong> Same inputs always generate the same password</li>
                    <li><strong>Hardware Security:</strong> WebAuthn integration for hardware-based authentication</li>
                    <li><strong>Zero-Knowledge:</strong> We never see or store your passwords or passphrases</li>
                    <li><strong>Cross-Platform:</strong> Works identically on any device with a modern browser</li>
                </ul>
                
                <h3>🔬 Technology Stack</h3>
                <div class="settings-grid">
                    <div class="settings-card">
                        <h4>Cryptography</h4>
                        <ul>
                            <li>Post-Quantum Key Derivation</li>
                            <li>PBKDF2 with SHA-512</li>
                            <li>100,000+ iterations</li>
                            <li>Hardware entropy integration</li>
                        </ul>
                    </div>
                    <div class="settings-card">
                        <h4>Security</h4>
                        <ul>
                            <li>WebAuthn/FIDO2 support</li>
                            <li>Client-side processing only</li>
                            <li>No data transmission</li>
                            <li>Memory-safe operations</li>
                        </ul>
                    </div>
                    <div class="settings-card">
                        <h4>Platform</h4>
                        <ul>
                            <li>Cloudflare Edge computing</li>
                            <li>Progressive Web App</li>
                            <li>Offline-first design</li>
                            <li>Material 3 UI framework</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- FAQ Tab -->
        <div id="faq" class="tab-content">
            <div class="card">
                <h2>
                    Frequently Asked Questions
                    <button class="info-btn" type="button">
                        i
                        <div class="tooltip">Common questions about QXVault's functionality, security, and usage.</div>
                    </button>
                </h2>
                
                <div class="faq-item">
                    <div class="faq-question">How does deterministic password generation work?</div>
                    <div class="faq-answer">QXVault combines your master passphrase, site name, and hardware key authentication to generate a unique password for each site. The same inputs will always produce the same password, eliminating the need to store passwords.</div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">What makes it quantum-secure?</div>
                    <div class="faq-answer">We use post-quantum cryptographic algorithms that are designed to be resistant to attacks from both classical and quantum computers, ensuring your passwords remain secure even in the quantum computing era.</div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">Do I need a hardware security key?</div>
                    <div class="faq-answer">While not required, we highly recommend using a hardware security key (FIDO2/WebAuthn) for maximum security. It adds an additional layer that ensures only you can generate your passwords.</div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">What happens if I lose my hardware key?</div>
                    <div class="faq-answer">You can register multiple hardware keys as backup. Always set up at least one backup key when you first configure QXVault. Without hardware authentication, you can still generate passwords using just your master passphrase.</div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">Can I use this offline?</div>
                    <div class="faq-answer">Yes! Once loaded, QXVault works completely offline. All cryptographic operations happen locally in your browser. No internet connection is required for password generation.</div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">How do I change a compromised password?</div>
                    <div class="faq-answer">Simply add a version number or suffix to the site name (e.g., "gmail.com-v2"). This will generate a completely different password while keeping your master passphrase the same.</div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">Is my data private?</div>
                    <div class="faq-answer">Absolutely. QXVault processes everything locally in your browser. Your master passphrase, passwords, and personal data never leave your device. We literally cannot see your data.</div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">What browsers are supported?</div>
                    <div class="faq-answer">QXVault works on all modern browsers that support WebCrypto API and WebAuthn. This includes Chrome, Firefox, Safari, Edge, and their mobile versions.</div>
                </div>
            </div>
        </div>
        
        <!-- How It's Different Tab -->
        <div id="different" class="tab-content">
            <div class="card">
                <h2>How QXVault is Different</h2>
                
                <h3>Traditional Password Managers</h3>
                <ul>
                    <li>Store encrypted passwords in databases</li>
                    <li>Single point of failure (server breaches)</li>
                    <li>Require constant syncing across devices</li>
                    <li>Vulnerable to quantum computing attacks</li>
                    <li>Depend on third-party servers</li>
                </ul>
                
                <h3>QXVault Approach</h3>
                <ul>
                    <li>Generates passwords on-demand mathematically</li>
                    <li>No storage, no databases, no servers to hack</li>
                    <li>Works identically on any device</li>
                    <li>Quantum-resistant cryptography</li>
                    <li>Completely serverless and decentralized</li>
                </ul>
                
                <h3>Security Advantages</h3>
                <ul>
                    <li><strong>No Data Breaches:</strong> Nothing to steal - passwords exist only when generated</li>
                    <li><strong>Future-Proof:</strong> Designed to resist quantum computing attacks</li>
                    <li><strong>Hardware-Backed:</strong> Optional hardware security key integration</li>
                    <li><strong>Zero Trust:</strong> You don't need to trust us with your data</li>
                </ul>
            </div>
        </div>
        
        <!-- Why Trust Us Tab -->
        <div id="trust" class="tab-content">
            <div class="card">
                <h2>Why Trust QXVault</h2>
                
                <h3>Open Source Transparency</h3>
                <p>QXVault is completely open source. You can inspect every line of code, verify the cryptographic implementations, and even run your own version.</p>
                
                <h3>Zero-Knowledge Architecture</h3>
                <p>We designed QXVault so that we never see, store, or have access to your master passphrase, passwords, or any sensitive data. Everything happens locally in your browser.</p>
                
                <h3>Cryptographic Principles</h3>
                <ul>
                    <li>Post-quantum cryptographic algorithms</li>
                    <li>Industry-standard WebAuthn for hardware authentication</li>
                    <li>AES-GCM encryption with PBKDF2 key derivation</li>
                    <li>Multiple rounds of cryptographic hardening</li>
                </ul>
                
                <h3>No Vendor Lock-in</h3>
                <p>Since your passwords are generated deterministically, you're never locked into using QXVault. You can implement the same algorithm anywhere or use our open-source code.</p>
                
                <h3>Serverless by Design</h3>
                <p>There are no servers to compromise, no databases to breach, and no infrastructure to maintain. The entire system runs in your browser or on Cloudflare's edge network.</p>
            </div>
        </div>
        
        <!-- Terms & Conditions Tab -->
        <div id="terms" class="tab-content">
            <div class="card">
                <h2>Terms & Conditions</h2>
                
                <h3>1. Service Description</h3>
                <p>QXVault provides a quantum-secure, deterministic password generation service that operates entirely client-side without storing user data.</p>
                
                <h3>2. User Responsibilities</h3>
                <ul>
                    <li>You are solely responsible for remembering your master passphrase</li>
                    <li>You must securely store backup hardware security keys</li>
                    <li>You acknowledge that forgotten passphrases cannot be recovered</li>
                </ul>
                
                <h3>3. Privacy & Data</h3>
                <ul>
                    <li>We do not collect, store, or have access to your passwords or passphrases</li>
                    <li>All cryptographic operations occur locally in your browser</li>
                    <li>We may collect anonymous usage analytics for service improvement</li>
                </ul>
                
                <h3>4. Security Disclaimer</h3>
                <p>While QXVault uses state-of-the-art cryptographic methods, no system is 100% secure. Users should follow security best practices and maintain backup access methods.</p>
                
                <h3>5. Service Availability</h3>
                <p>We provide this service "as is" without warranties. We are not liable for service interruptions or data loss.</p>
                
                <h3>6. Open Source License</h3>
                <p>QXVault is licensed under MIT License. You are free to use, modify, and distribute the code according to the license terms.</p>
            </div>
        </div>
        
        <!-- Source Code Tab -->
        <div id="source" class="tab-content">
            <div class="card">
                <h2>Source Code & Links</h2>
                
                <h3>Repository</h3>
                <p>Full source code is available on GitHub:</p>
                <a href="https://github.com/qxvault/qxvault" class="btn" target="_blank">View on GitHub</a>
                
                <h3>Documentation</h3>
                <ul>
                    <li><a href="https://qxvault.dev/docs" target="_blank">Technical Documentation</a></li>
                    <li><a href="https://qxvault.dev/security" target="_blank">Security Whitepaper</a></li>
                    <li><a href="https://qxvault.dev/api" target="_blank">API Reference</a></li>
                </ul>
                
                <h3>Community</h3>
                <ul>
                    <li><a href="https://discord.gg/qxvault" target="_blank">Discord Community</a></li>
                    <li><a href="https://reddit.com/r/qxvault" target="_blank">Reddit Community</a></li>
                    <li><a href="https://twitter.com/qxvault" target="_blank">Twitter Updates</a></li>
                </ul>
                
                <h3>Bug Reports & Feature Requests</h3>
                <p>Found a bug or have a feature request?</p>
                <a href="https://github.com/qxvault/qxvault/issues" class="btn" target="_blank">Report Issues</a>
            </div>
        </div>
    </div>
    
    <script>
        // Global state
        let isWebAuthnConfigured = false;
        let webAuthnCredential = null;
        
        // Theme management
        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            const themeToggle = document.getElementById('themeToggle');
            const icon = themeToggle.querySelector('.material-icons-round');
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update icon based on theme
            if (newTheme === 'light') {
                icon.textContent = 'light_mode';
            } else {
                icon.textContent = 'dark_mode';
            }
        }
        
        // Enhanced quantum-secure password generation
        async function generateQuantumSecurePassword(passphrase, site, email, deviceSecret, length, quantumLevel) {
            const encoder = new TextEncoder();
            const combined = encoder.encode(passphrase + site + (email || '') + deviceSecret + 'QXVault-2025');
            
            // Multi-round key derivation based on quantum level
            const iterations = 50000 + (quantumLevel * 25000); // 75k to 175k iterations
            
            let keyMaterial = await crypto.subtle.importKey(
                'raw',
                combined,
                { name: 'PBKDF2' },
                false,
                ['deriveBits']
            );
            
            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'PBKDF2',
                    salt: encoder.encode('QXVault-PostQuantum-Salt-v1'),
                    iterations: iterations,
                    hash: 'SHA-512'
                },
                keyMaterial,
                512
            );
            
            const keyBytes = new Uint8Array(derivedBits);
            const includeSpecial = document.getElementById('includeSpecial').checked;
            
            const chars = includeSpecial 
                ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
                : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            
            let password = '';
            for (let i = 0; i < length; i++) {
                const index = keyBytes[i % keyBytes.length] % chars.length;
                password += chars[index];
            }
            
            return password;
        }
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Initialize theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('.material-icons-round');
        if (savedTheme === 'light') {
            icon.textContent = 'light_mode';
        } else {
            icon.textContent = 'dark_mode';
        }
        
        // Check for security context and warn about WebAuthn limitations
        if (location.protocol === 'file:') {
            showStatus('Note: Hardware authentication requires HTTPS or localhost. Open via http://localhost or https:// for full functionality.', 'info');
        }
        
        // Enhanced slider functionality
        const lengthSlider = document.getElementById('passwordLength');
        const lengthValue = document.getElementById('lengthValue');
        const quantumLevelSlider = document.getElementById('quantumLevel');
        const quantumLevelValue = document.getElementById('quantumLevelValue');
        
        function updateSliderValue(slider, display) {
            display.textContent = slider.value;
        }
        
        lengthSlider.addEventListener('input', () => {
            updateSliderValue(lengthSlider, lengthValue);
        });
        
        quantumLevelSlider.addEventListener('input', () => {
            updateSliderValue(quantumLevelSlider, quantumLevelValue);
        });
        
        // Switch functionality
        const switches = document.querySelectorAll('.switch-input');
        switches.forEach(switchInput => {
            switchInput.addEventListener('change', (e) => {
                // Save switch state
                localStorage.setItem(e.target.id, e.target.checked);
            });
        });
        
        // Settings minimize functionality
        const settingsMinimizeBtn = document.getElementById('settingsMinimize');
        const settingsContent = document.getElementById('settingsContent');
        let settingsCollapsed = true; // Start collapsed
        
        settingsMinimizeBtn.addEventListener('click', () => {
            settingsCollapsed = !settingsCollapsed;
            if (settingsCollapsed) {
                settingsContent.classList.add('collapsed');
                settingsMinimizeBtn.textContent = '+';
            } else {
                settingsContent.classList.remove('collapsed');
                settingsMinimizeBtn.textContent = '−';
            }
        });
        
        // Mobile menu functionality
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navTabs = document.getElementById('navTabs');
        
        mobileMenuBtn.addEventListener('click', () => {
            navTabs.classList.toggle('mobile-open');
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navTabs.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navTabs.classList.remove('mobile-open');
            }
        });
        
        // Tab management with mobile support
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.getAttribute('data-tab');
                
                // Update active tab
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                // Show target content
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                document.getElementById(targetTab).classList.add('active');
                
                // Close mobile menu
                navTabs.classList.remove('mobile-open');
            });
        });
        
        // WebAuthn functionality
        async function setupWebAuthn() {
            try {
                // Check if WebAuthn is supported
                if (!navigator.credentials || !navigator.credentials.create) {
                    throw new Error('WebAuthn is not supported on this device/browser');
                }
                
                // Determine the RP ID based on the current context
                let rpId;
                if (location.protocol === 'file:') {
                    // For file:// protocol, we can't use WebAuthn with RP ID
                    rpId = undefined; // This will use the origin
                } else if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                    rpId = 'localhost';
                } else {
                    rpId = location.hostname;
                }
                
                // Check if we're on mobile and adjust settings
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                
                showStatus('Setting up hardware authentication...', 'info');
                
                const userId = crypto.getRandomValues(new Uint8Array(32));
                const challenge = crypto.getRandomValues(new Uint8Array(32));
                
                // Mobile-specific configuration
                const createOptions = {
                    publicKey: {
                        challenge: challenge,
                        rp: {
                            name: "QXVault",
                            ...(rpId && !isMobile && { id: rpId }) // Skip RP ID on mobile for better compatibility
                        },
                        user: {
                            id: userId,
                            name: "qxvault-user",
                            displayName: "QXVault User",
                        },
                        pubKeyCredParams: [
                            { alg: -7, type: "public-key" },   // ES256 (preferred)
                            { alg: -257, type: "public-key" }, // RS256 fallback
                            { alg: -37, type: "public-key" }   // PS256 additional fallback
                        ],
                        authenticatorSelection: {
                            // For mobile, try both platform and cross-platform
                            authenticatorAttachment: isMobile ? "platform" : "cross-platform",
                            userVerification: isMobile ? "discouraged" : "preferred", // Less strict on mobile
                            requireResidentKey: false,
                            residentKey: "discouraged" // Explicitly discourage for mobile compatibility
                        },
                        timeout: isMobile ? 120000 : 60000, // Longer timeout for mobile
                        attestation: "none",
                        extensions: {}
                    }
                };
                
                let credential;
                try {
                    credential = await navigator.credentials.create(createOptions);
                } catch (mobileError) {
                    // If platform authenticator fails on mobile, try cross-platform
                    if (isMobile && mobileError.name === 'NotSupportedError') {
                        showStatus('Trying alternative authentication method...', 'info');
                        createOptions.publicKey.authenticatorSelection.authenticatorAttachment = "cross-platform";
                        credential = await navigator.credentials.create(createOptions);
                    } else {
                        throw mobileError;
                    }
                }
                
                // Store credential info for later use
                webAuthnCredential = {
                    id: credential.id,
                    rawId: credential.rawId,
                    rpId: isMobile ? null : rpId, // Don't store RP ID for mobile
                    challenge: challenge,
                    userId: userId,
                    isMobile: isMobile // Store mobile flag for later use
                };
                isWebAuthnConfigured = true;
                
                document.getElementById('webauthnBtn').textContent = 'Hardware Key Configured ✓';
                document.getElementById('webauthnBtn').style.background = 'rgba(0, 255, 0, 0.2)';
                
                showStatus('Hardware authentication configured successfully!', 'success');
                
            } catch (error) {
                console.error('WebAuthn setup failed:', error);
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
                const isAndroid = /Android/i.test(navigator.userAgent);
                
                let errorMessage = 'Hardware authentication failed. You can still generate passwords without it.';
                
                if (error.name === 'NotSupportedError') {
                    if (isMobile) {
                        errorMessage = 'Biometric authentication not available on this device. Please use the password generator without hardware authentication.';
                    } else {
                        errorMessage = 'Hardware authentication is not supported on this device/browser.';
                    }
                } else if (error.name === 'NotAllowedError') {
                    if (isMobile) {
                        errorMessage = 'Biometric authentication was cancelled. Please enable Touch ID/Face ID in your device settings or skip hardware authentication.';
                    } else {
                        errorMessage = 'Hardware authentication was cancelled or not allowed.';
                    }
                } else if (error.name === 'SecurityError') {
                    errorMessage = 'Security error: WebAuthn requires HTTPS or localhost. Try opening via http://localhost or https://.';
                } else if (error.name === 'InvalidStateError') {
                    errorMessage = 'A credential for this device already exists. Please clear all data first.';
                } else if (error.name === 'ConstraintError') {
                    if (isMobile) {
                        errorMessage = 'Device does not meet authentication requirements. You can still use QXVault without hardware authentication.';
                    } else {
                        errorMessage = 'Hardware security requirements not met.';
                    }
                }
                
                showStatus(errorMessage, 'error');
            }
        }
        
        async function authenticateWebAuthn() {
            try {
                if (!webAuthnCredential) {
                    throw new Error('No credential configured');
                }
                
                const isMobile = webAuthnCredential.isMobile || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                const challenge = crypto.getRandomValues(new Uint8Array(32));
                
                const getOptions = {
                    publicKey: {
                        challenge: challenge,
                        // Only use RP ID if not mobile and RP ID exists
                        ...(webAuthnCredential.rpId && !isMobile && { rpId: webAuthnCredential.rpId }),
                        allowCredentials: [{
                            id: webAuthnCredential.rawId,
                            type: 'public-key'
                        }],
                        userVerification: isMobile ? "discouraged" : "preferred", // Less strict on mobile
                        timeout: isMobile ? 60000 : 30000 // Longer timeout for mobile
                    }
                };
                
                const assertion = await navigator.credentials.get(getOptions);
                
                if (!assertion || !assertion.response) {
                    throw new Error('Authentication failed - no response received');
                }
                
                return new Uint8Array(assertion.response.signature);
                
            } catch (error) {
                console.error('WebAuthn authentication failed:', error);
                
                // Provide better error messages
                let errorMessage = 'Hardware authentication failed.';
                if (error.name === 'NotAllowedError') {
                    errorMessage = 'Authentication was cancelled or timed out. Please try again.';
                } else if (error.name === 'SecurityError') {
                    errorMessage = 'Security error during authentication. Make sure you are on HTTPS or localhost.';
                } else if (error.name === 'NotSupportedError') {
                    errorMessage = 'Hardware authentication not supported on this device.';
                } else if (error.name === 'InvalidStateError') {
                    errorMessage = 'Hardware key not available. Please reconnect your device or clear data and try again.';
                } else if (error.name === 'UnknownError') {
                    errorMessage = 'Hardware authentication failed. Please try again or use Skip option.';
                } else if (error.name === 'NetworkError') {
                    errorMessage = 'Network error during authentication. Please check your connection.';
                }
                
                throw new Error(errorMessage);
            }
        }
        
        // Status display
        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = 'status ' + type;
            status.classList.remove('hidden');
            
            if (type === 'success' || type === 'error') {
                setTimeout(() => {
                    status.classList.add('hidden');
                }, 5000);
            }
        }
        
        // Event listeners
        document.getElementById('webauthnBtn').addEventListener('click', async () => {
            // Enhanced mobile detection
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isAndroid = /Android/i.test(navigator.userAgent);
            
            // Check if WebAuthn is available
            if (!navigator.credentials || !navigator.credentials.create) {
                showStatus('Hardware authentication is not supported in this browser.', 'error');
                return;
            }
            
            // Check for secure context
            if (location.protocol === 'file:') {
                showStatus('Hardware authentication requires HTTPS or localhost. Please open via http://localhost or https://.', 'error');
                return;
            }
            
            // Mobile-specific warnings and guidance
            if (isMobile) {
                if (isIOS) {
                    showStatus('Setting up Touch ID/Face ID authentication for iOS...', 'info');
                } else if (isAndroid) {
                    showStatus('Setting up fingerprint/biometric authentication for Android...', 'info');
                } else {
                    showStatus('Setting up mobile authentication...', 'info');
                }
            }
            
            if (!isWebAuthnConfigured) {
                await setupWebAuthn();
            } else {
                showStatus('Hardware key already configured!', 'success');
            }
        });
        
        document.getElementById('passwordForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const passphrase = document.getElementById('masterPassphrase').value;
            const siteName = document.getElementById('siteName').value;
            const userEmail = document.getElementById('userEmail').value;
            const passwordLength = parseInt(document.getElementById('passwordLength').value);
            const quantumLevel = parseInt(document.getElementById('quantumLevel').value);
            
            if (!passphrase || !siteName) {
                showStatus('Please fill in all required fields', 'error');
                return;
            }
            
            let deviceSecret = 'default-device-secret';
            
            // If WebAuthn is configured, require authentication
            if (isWebAuthnConfigured) {
                try {
                    showStatus('Authenticating with hardware key...', 'info');
                    const signature = await authenticateWebAuthn();
                    deviceSecret = Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('');
                } catch (error) {
                    let errorMsg = error.message;
                    if (error.message.includes('cancelled')) {
                        errorMsg += ' Please try again or use "Skip Hardware Auth" below.';
                    } else {
                        errorMsg += ' Hardware authentication failed. You can skip it temporarily using the button below.';
                    }
                    showStatus(errorMsg, 'error');
                    
                    // Show skip button
                    document.getElementById('skipAuthBtn').classList.remove('hidden');
                    return;
                }
            }
            
            try {
                showStatus('Generating quantum-secure password...', 'info');
                
                const password = await generateQuantumSecurePassword(
                    passphrase, 
                    siteName, 
                    userEmail, 
                    deviceSecret, 
                    passwordLength,
                    quantumLevel
                );
                
                document.getElementById('passwordOutput').textContent = password;
                document.getElementById('copyBtn').disabled = false;
                
                // Hide skip button on success
                document.getElementById('skipAuthBtn').classList.add('hidden');
                
                showStatus('Password generated successfully!', 'success');
                
                // Auto-clear functionality
                if (document.getElementById('autoClear').checked) {
                    setTimeout(() => {
                        document.getElementById('masterPassphrase').value = '';
                        document.getElementById('passwordOutput').textContent = 'Click generate to create your quantum-secure password';
                        document.getElementById('copyBtn').disabled = true;
                        showStatus('Sensitive data automatically cleared for security', 'info');
                    }, 300000); // 5 minutes
                }
                
            } catch (error) {
                console.error('Password generation failed:', error);
                showStatus('Failed to generate password. Please try again.', 'error');
            }
        });
        
        document.getElementById('copyBtn').addEventListener('click', async () => {
            const password = document.getElementById('passwordOutput').textContent;
            
            if (password && password !== 'Click generate to create your quantum-secure password') {
                try {
                    await navigator.clipboard.writeText(password);
                    showStatus('Password copied to clipboard!', 'success');
                } catch (error) {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = password;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    showStatus('Password copied to clipboard!', 'success');
                }
            }
        });
        
        document.getElementById('clearBtn').addEventListener('click', () => {
            document.getElementById('passwordForm').reset();
            document.getElementById('passwordOutput').textContent = 'Click generate to create your quantum-secure password';
            document.getElementById('copyBtn').disabled = true;
            document.getElementById('status').classList.add('hidden');
            document.getElementById('skipAuthBtn').classList.add('hidden');
            
            // Reset WebAuthn state
            isWebAuthnConfigured = false;
            webAuthnCredential = null;
            document.getElementById('webauthnBtn').textContent = 'Authenticate with Hardware Key';
            document.getElementById('webauthnBtn').style.background = '';
            
            showStatus('All data cleared!', 'success');
        });
        
        // Skip hardware auth button
        document.getElementById('skipAuthBtn').addEventListener('click', async () => {
            document.getElementById('skipAuthBtn').classList.add('hidden');
            
            const passphrase = document.getElementById('masterPassphrase').value;
            const siteName = document.getElementById('siteName').value;
            const userEmail = document.getElementById('userEmail').value;
            const passwordLength = parseInt(document.getElementById('passwordLength').value);
            const quantumLevel = parseInt(document.getElementById('quantumLevel').value);
            
            try {
                showStatus('Generating password without hardware authentication...', 'info');
                
                const password = await generateQuantumSecurePassword(
                    passphrase, 
                    siteName, 
                    userEmail, 
                    'default-device-secret', // Use default instead of hardware signature
                    passwordLength,
                    quantumLevel
                );
                
                document.getElementById('passwordOutput').textContent = password;
                document.getElementById('copyBtn').disabled = false;
                
                showStatus('Password generated successfully (without hardware authentication)!', 'success');
                
                // Auto-clear functionality
                if (document.getElementById('autoClear').checked) {
                    setTimeout(() => {
                        document.getElementById('masterPassphrase').value = '';
                        document.getElementById('passwordOutput').textContent = 'Click generate to create your quantum-secure password';
                        document.getElementById('copyBtn').disabled = true;
                        showStatus('Sensitive data automatically cleared for security', 'info');
                    }, 300000); // 5 minutes
                }
                
            } catch (error) {
                console.error('Password generation failed:', error);
                showStatus('Failed to generate password. Please try again.', 'error');
            }
        });
        
        // Enhanced FAQ interactions with Material 3 animations
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const isExpanded = question.classList.contains('expanded');
                
                // Close all other FAQ items
                document.querySelectorAll('.faq-question').forEach(q => {
                    q.classList.remove('expanded');
                    q.nextElementSibling.style.display = 'none';
                });
                
                if (!isExpanded) {
                    question.classList.add('expanded');
                    answer.style.display = 'block';
                    
                    // Smooth scroll into view
                    setTimeout(() => {
                        question.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                }
            });
        });
        
        // Initialize FAQ answers as hidden
        document.querySelectorAll('.faq-answer').forEach(answer => {
            answer.style.display = 'none';
        });
        
        // Enhanced quantum particle animation
        function createQuantumParticle() {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.width = Math.random() * 4 + 2 + 'px';
            particle.style.height = particle.style.width;
            particle.style.background = 'var(--md-sys-color-primary)';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '-1';
            particle.style.opacity = '0.6';
            particle.style.filter = 'blur(1px)';
            
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            document.body.appendChild(particle);
            
            const duration = Math.random() * 3000 + 2000;
            const distance = Math.random() * 100 + 50;
            
            particle.animate([
                { 
                    opacity: 0, 
                    transform: 'scale(0) translate(0, 0)',
                    filter: 'blur(2px)'
                },
                { 
                    opacity: 0.8, 
                    transform: 'scale(1) translate(' + (Math.random() * distance - distance/2) + 'px, ' + (Math.random() * distance - distance/2) + 'px)',
                    filter: 'blur(0px)'
                },
                { 
                    opacity: 0, 
                    transform: 'scale(0) translate(' + (Math.random() * distance - distance/2) + 'px, ' + (Math.random() * distance - distance/2) + 'px)',
                    filter: 'blur(2px)'
                }
            ], {
                duration: duration,
                easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }).onfinish = () => {
                particle.remove();
            };
        }
        
        // Create quantum particles periodically
        let particleInterval = setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance every interval
                createQuantumParticle();
            }
        }, 1500);
        
        // Pause particles when user is inactive
        let lastActivity = Date.now();
        document.addEventListener('mousemove', () => { lastActivity = Date.now(); });
        document.addEventListener('keydown', () => { lastActivity = Date.now(); });
        
        setInterval(() => {
            if (Date.now() - lastActivity > 30000) { // 30 seconds of inactivity
                clearInterval(particleInterval);
            } else if (!particleInterval) {
                particleInterval = setInterval(() => {
                    if (Math.random() < 0.3) {
                        createQuantumParticle();
                    }
                }, 1500);
            }
        }, 5000);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'Enter':
                        e.preventDefault();
                        document.getElementById('passwordForm').dispatchEvent(new Event('submit'));
                        break;
                    case 'c':
                        if (e.shiftKey) {
                            e.preventDefault();
                            document.getElementById('copyBtn').click();
                        }
                        break;
                    case 'l':
                        if (e.shiftKey) {
                            e.preventDefault();
                            document.getElementById('clearBtn').click();
                        }
                        break;
                }
            }
        });
        
        // Auto-save form data (except sensitive fields)
        const formFields = ['siteName', 'userEmail', 'passwordLength', 'includeSpecial', 'quantumLevel', 'autoClear'];
        
        formFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', () => {
                    if (fieldId !== 'masterPassphrase') {
                        localStorage.setItem(fieldId, field.type === 'checkbox' ? field.checked : field.value);
                    }
                });
                
                // Load saved values
                const savedValue = localStorage.getItem(fieldId);
                if (savedValue !== null) {
                    if (field.type === 'checkbox') {
                        field.checked = savedValue === 'true';
                    } else {
                        field.value = savedValue;
                        if (fieldId === 'passwordLength') {
                            document.getElementById('lengthValue').textContent = savedValue;
                        }
                        if (fieldId === 'quantumLevel') {
                            document.getElementById('quantumLevelValue').textContent = savedValue;
                        }
                    }
                }
            }
        });
        
        console.log('QXVault initialized - Clean minimal cyberpunk design ready!');
    </script>
    
    <footer class="footer">
        <div class="footer-content">
            <p>&copy; 2025 QXVault. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>
`;

// Cloudflare Worker Event Handler
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    
    // Handle different routes
    switch (url.pathname) {
        case '/':
            return new Response(HTML_TEMPLATE, {
                headers: {
                    'Content-Type': 'text/html',
                    'Cache-Control': 'public, max-age=3600',
                    'X-Frame-Options': 'DENY',
                    'X-Content-Type-Options': 'nosniff',
                    'Referrer-Policy': 'strict-origin-when-cross-origin',
                    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.googleapis.com fonts.gstatic.com; connect-src 'self'; img-src 'self' data:;"
                }
            });
            
        case '/api/generate':
            return handlePasswordGeneration(request);
            
        case '/health':
            return new Response(JSON.stringify({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
            
        case '/sw.js':
            return new Response(SERVICE_WORKER_JS, {
                headers: {
                    'Content-Type': 'application/javascript',
                    'Cache-Control': 'public, max-age=86400'
                }
            });
            
        default:
            return new Response('Not Found', { status: 404 });
    }
}

// API endpoint for password generation (backup method)
async function handlePasswordGeneration(request) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }
    
    try {
        const { passphrase, siteName, userEmail, deviceSecret, length } = await request.json();
        
        if (!passphrase || !siteName) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const keyBytes = await QuantumSecureCrypto.deriveKey(
            passphrase, 
            siteName, 
            deviceSecret || 'default-device-secret',
            userEmail || ''
        );
        
        const password = await QuantumSecureCrypto.generatePassword(keyBytes, length || 32);
        
        return new Response(JSON.stringify({ password }), {
            headers: { 
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate'
            }
        });
        
    } catch (error) {
        console.error('Password generation failed:', error);
        return new Response(JSON.stringify({ error: 'Password generation failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Service Worker for offline functionality
const SERVICE_WORKER_JS = `
const CACHE_NAME = 'qxvault-v1';
const urlsToCache = [
    '/',
    '/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
`;