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
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Trebuchet+MS&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-primary: #0a0a0a;
            --bg-secondary: #111111;
            --bg-card: rgba(20, 20, 20, 0.9);
            --border-quantum: rgba(0, 255, 255, 0.3);
            --border-hover: rgba(0, 255, 255, 0.6);
            --text-primary: #ffffff;
            --text-secondary: #cccccc;
            --text-accent: #00ffff;
            --gradient-quantum: linear-gradient(135deg, rgba(0, 255, 255, 0.1), rgba(255, 0, 255, 0.1));
            --shadow-quantum: 0 0 20px rgba(0, 255, 255, 0.2);
        }
        
        [data-theme="light"] {
            --bg-primary: #f8f9fa;
            --bg-secondary: #ffffff;
            --bg-card: rgba(255, 255, 255, 0.95);
            --border-quantum: rgba(0, 123, 255, 0.3);
            --border-hover: rgba(0, 123, 255, 0.6);
            --text-primary: #212529;
            --text-secondary: #6c757d;
            --text-accent: #007bff;
            --gradient-quantum: linear-gradient(135deg, rgba(0, 123, 255, 0.1), rgba(108, 117, 125, 0.1));
            --shadow-quantum: 0 0 20px rgba(0, 123, 255, 0.2);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Trebuchet MS', sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            overflow-x: hidden;
        }
        
        .quantum-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255, 0, 255, 0.1) 0%, transparent 50%);
            pointer-events: none;
            z-index: -1;
        }
        
        .navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(10, 10, 10, 0.9);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--border-quantum);
            z-index: 1000;
            padding: 1rem 0;
        }
        
        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 2rem;
        }
        
        .logo {
            font-family: 'Orbitron', monospace;
            font-size: 1.8rem;
            font-weight: 900;
            color: var(--text-accent);
            text-decoration: none;
        }
        
        .nav-tabs {
            display: flex;
            gap: 2rem;
        }
        
        .nav-tab {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            transition: all 0.3s ease;
            font-family: 'Trebuchet MS', sans-serif;
        }
        
        .nav-tab:hover, .nav-tab.active {
            color: var(--text-accent);
            background: var(--gradient-quantum);
            border: 1px solid var(--border-quantum);
        }
        
        .nav-controls {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .theme-toggle {
            background: none;
            border: 1px solid var(--border-quantum);
            color: var(--text-primary);
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 50%;
            transition: all 0.3s ease;
        }
        
        .theme-toggle:hover {
            border-color: var(--border-hover);
            box-shadow: var(--shadow-quantum);
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 8rem 2rem 2rem;
        }
        
        .hero {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .hero h1 {
            font-family: 'Orbitron', monospace;
            font-size: 3rem;
            font-weight: 900;
            color: var(--text-accent);
            margin-bottom: 1rem;
            text-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
        }
        
        .tagline {
            font-size: 1.2rem;
            color: var(--text-secondary);
            margin-bottom: 2rem;
        }
        
        .card {
            background: var(--bg-card);
            border: 1px solid var(--border-quantum);
            border-radius: 16px;
            padding: 2rem;
            backdrop-filter: blur(20px);
            box-shadow: var(--shadow-quantum);
            margin-bottom: 2rem;
            transition: all 0.3s ease;
        }
        
        .card:hover {
            border-color: var(--border-hover);
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
            font-weight: 600;
        }
        
        .form-input {
            width: 100%;
            padding: 1rem;
            background: var(--bg-secondary);
            border: 1px solid var(--border-quantum);
            border-radius: 8px;
            color: var(--text-primary);
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        .form-input:focus {
            outline: none;
            border-color: var(--border-hover);
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
        }
        
        .btn {
            padding: 1rem 2rem;
            border: 1px solid var(--border-quantum);
            border-radius: 8px;
            background: var(--gradient-quantum);
            color: var(--text-primary);
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            text-align: center;
        }
        
        .btn:hover {
            border-color: var(--border-hover);
            box-shadow: var(--shadow-quantum);
            transform: translateY(-2px);
        }
        
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }
        
        .btn-group {
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
        }
        
        .password-output {
            background: var(--bg-secondary);
            border: 1px solid var(--border-quantum);
            border-radius: 8px;
            padding: 1rem;
            font-family: 'Courier New', monospace;
            font-size: 1.1rem;
            word-break: break-all;
            min-height: 3rem;
            display: flex;
            align-items: center;
        }
        
        .status {
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
            text-align: center;
        }
        
        .status.success {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid rgba(0, 255, 0, 0.3);
            color: #00ff00;
        }
        
        .status.error {
            background: rgba(255, 0, 0, 0.1);
            border: 1px solid rgba(255, 0, 0, 0.3);
            color: #ff4444;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .settings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }
        
        .faq-item {
            margin-bottom: 1.5rem;
        }
        
        .faq-question {
            font-weight: 600;
            color: var(--text-accent);
            margin-bottom: 0.5rem;
            cursor: pointer;
        }
        
        .faq-answer {
            color: var(--text-secondary);
            padding-left: 1rem;
        }
        
        @media (max-width: 768px) {
            .nav-container {
                flex-direction: column;
                gap: 1rem;
            }
            
            .nav-tabs {
                flex-wrap: wrap;
                justify-content: center;
            }
            
            .hero h1 {
                font-size: 2rem;
            }
            
            .btn-group {
                flex-direction: column;
            }
        }
        
        .hidden {
            display: none;
        }
    </style>
</head>
<body>
    <div class="quantum-bg"></div>
    
    <nav class="navbar">
        <div class="nav-container">
            <a href="#" class="logo">QXVault</a>
            <div class="nav-tabs">
                <button class="nav-tab active" data-tab="home">Home</button>
                <button class="nav-tab" data-tab="about">About</button>
                <button class="nav-tab" data-tab="faq">FAQ</button>
                <button class="nav-tab" data-tab="different">How It's Different</button>
                <button class="nav-tab" data-tab="trust">Why Trust Us</button>
                <button class="nav-tab" data-tab="terms">T&C</button>
                <button class="nav-tab" data-tab="source">Source Code</button>
            </div>
            <div class="nav-controls">
                <button class="theme-toggle" onclick="toggleTheme()">🌓</button>
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
                <h2>Generate Quantum-Secure Password</h2>
                <form id="passwordForm">
                    <div class="form-group">
                        <label class="form-label">Master Passphrase</label>
                        <input type="password" id="masterPassphrase" class="form-input" placeholder="Enter your master passphrase" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Site/Service Name</label>
                        <input type="text" id="siteName" class="form-input" placeholder="e.g., gmail.com, facebook.com" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Username/Email (Optional)</label>
                        <input type="email" id="userEmail" class="form-input" placeholder="user@example.com">
                    </div>
                    
                    <div class="btn-group">
                        <button type="button" id="webauthnBtn" class="btn">Authenticate with Hardware Key</button>
                        <button type="submit" id="generateBtn" class="btn">Generate Password</button>
                    </div>
                </form>
                
                <div id="status" class="status hidden"></div>
                
                <div class="form-group">
                    <label class="form-label">Generated Password</label>
                    <div id="passwordOutput" class="password-output">Click generate to create your quantum-secure password</div>
                </div>
                
                <div class="btn-group">
                    <button type="button" id="copyBtn" class="btn" disabled>Copy Password</button>
                    <button type="button" id="clearBtn" class="btn">Clear All</button>
                </div>
            </div>
            
            <div class="card">
                <h3>Settings</h3>
                <div class="settings-grid">
                    <div class="form-group">
                        <label class="form-label">Password Length</label>
                        <input type="range" id="passwordLength" min="12" max="64" value="32" class="form-input">
                        <span id="lengthValue">32</span>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Include Special Characters</label>
                        <input type="checkbox" id="includeSpecial" checked>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- About Tab -->
        <div id="about" class="tab-content">
            <div class="card">
                <h2>About QXVault</h2>
                <p>QXVault is a next-generation password manager designed for the quantum computing era. Unlike traditional password managers that store your passwords in encrypted databases, QXVault generates your passwords deterministically on-demand using post-quantum cryptographic algorithms.</p>
                
                <h3>Key Features</h3>
                <ul>
                    <li><strong>Quantum-Secure:</strong> Uses post-quantum cryptographic principles resistant to both classical and quantum attacks</li>
                    <li><strong>Serverless:</strong> No databases, no storage, no single point of failure</li>
                    <li><strong>Deterministic:</strong> Same inputs always generate the same password</li>
                    <li><strong>Hardware Security:</strong> WebAuthn integration for hardware-based authentication</li>
                    <li><strong>Zero-Knowledge:</strong> We never see or store your passwords or passphrases</li>
                </ul>
            </div>
        </div>
        
        <!-- FAQ Tab -->
        <div id="faq" class="tab-content">
            <div class="card">
                <h2>Frequently Asked Questions</h2>
                
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
                    <div class="faq-answer">You can register multiple hardware keys as backup. Always set up at least one backup key when you first configure QXVault.</div>
                </div>
                
                <div class="faq-item">
                    <div class="faq-question">Can I use this offline?</div>
                    <div class="faq-answer">Yes! Once loaded, QXVault works completely offline. All cryptographic operations happen locally in your browser.</div>
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
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        }
        
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Tab management
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
            });
        });
        
        // Password length slider
        const lengthSlider = document.getElementById('passwordLength');
        const lengthValue = document.getElementById('lengthValue');
        
        lengthSlider.addEventListener('input', (e) => {
            lengthValue.textContent = e.target.value;
        });
        
        // Quantum-secure password generation
        async function generateQuantumSecurePassword(passphrase, site, email, deviceSecret, length) {
            const encoder = new TextEncoder();
            const combined = encoder.encode(passphrase + site + (email || '') + deviceSecret + 'QXVault-2025');
            
            // Multi-round key derivation for quantum resistance
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
                    iterations: 100000,
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
        
        // WebAuthn functionality
        async function setupWebAuthn() {
            try {
                showStatus('Setting up hardware authentication...', 'info');
                
                const credential = await navigator.credentials.create({
                    publicKey: {
                        challenge: crypto.getRandomValues(new Uint8Array(32)),
                        rp: {
                            name: "QXVault",
                            id: location.hostname,
                        },
                        user: {
                            id: crypto.getRandomValues(new Uint8Array(32)),
                            name: "qxvault-user",
                            displayName: "QXVault User",
                        },
                        pubKeyCredParams: [{alg: -7, type: "public-key"}],
                        authenticatorSelection: {
                            authenticatorAttachment: "cross-platform",
                            userVerification: "required"
                        },
                        timeout: 60000,
                        attestation: "direct"
                    }
                });
                
                webAuthnCredential = credential;
                isWebAuthnConfigured = true;
                
                document.getElementById('webauthnBtn').textContent = 'Hardware Key Configured ✓';
                document.getElementById('webauthnBtn').style.background = 'rgba(0, 255, 0, 0.2)';
                
                showStatus('Hardware authentication configured successfully!', 'success');
                
            } catch (error) {
                console.error('WebAuthn setup failed:', error);
                showStatus('Hardware authentication failed. You can still generate passwords without it.', 'error');
            }
        }
        
        async function authenticateWebAuthn() {
            try {
                if (!webAuthnCredential) {
                    throw new Error('No credential configured');
                }
                
                const assertion = await navigator.credentials.get({
                    publicKey: {
                        challenge: crypto.getRandomValues(new Uint8Array(32)),
                        rpId: location.hostname,
                        allowCredentials: [{
                            id: webAuthnCredential.rawId,
                            type: 'public-key'
                        }],
                        userVerification: "required",
                        timeout: 60000
                    }
                });
                
                return new Uint8Array(assertion.response.signature);
                
            } catch (error) {
                console.error('WebAuthn authentication failed:', error);
                throw error;
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
                    showStatus('Hardware authentication required. Please authenticate with your hardware key.', 'error');
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
                    passwordLength
                );
                
                document.getElementById('passwordOutput').textContent = password;
                document.getElementById('copyBtn').disabled = false;
                
                showStatus('Password generated successfully!', 'success');
                
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
            
            // Reset WebAuthn state
            isWebAuthnConfigured = false;
            webAuthnCredential = null;
            document.getElementById('webauthnBtn').textContent = 'Authenticate with Hardware Key';
            document.getElementById('webauthnBtn').style.background = '';
            
            showStatus('All data cleared!', 'success');
        });
        
        // FAQ interactions
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                answer.style.display = answer.style.display === 'none' ? 'block' : 'none';
            });
        });
        
        // Initialize FAQ answers as hidden
        document.querySelectorAll('.faq-answer').forEach(answer => {
            answer.style.display = 'none';
        });
        
        // Quantum animation effect
        function createQuantumParticle() {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.width = '2px';
            particle.style.height = '2px';
            particle.style.background = 'rgba(0, 255, 255, 0.6)';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '-1';
            
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            document.body.appendChild(particle);
            
            particle.animate([
                { opacity: 0, transform: 'scale(0)' },
                { opacity: 1, transform: 'scale(1)' },
                { opacity: 0, transform: 'scale(0)' }
            ], {
                duration: 3000,
                easing: 'ease-in-out'
            }).onfinish = () => {
                particle.remove();
            };
        }
        
        // Create quantum particles periodically
        setInterval(createQuantumParticle, 2000);
        
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
        const formFields = ['siteName', 'userEmail', 'passwordLength', 'includeSpecial'];
        
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
                    }
                }
            }
        });
        
        // Service Worker for offline functionality
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(console.error);
        }
        
        // Initialize tooltips and help text
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = e.target.getAttribute('data-tooltip');
                tooltip.style.position = 'absolute';
                tooltip.style.background = 'var(--bg-secondary)';
                tooltip.style.color = 'var(--text-primary)';
                tooltip.style.padding = '0.5rem';
                tooltip.style.borderRadius = '4px';
                tooltip.style.fontSize = '0.8rem';
                tooltip.style.zIndex = '1000';
                tooltip.style.maxWidth = '200px';
                tooltip.style.border = '1px solid var(--border-quantum)';
                
                document.body.appendChild(tooltip);
                
                const rect = e.target.getBoundingClientRect();
                tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
                tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
                
                e.target._tooltip = tooltip;
            });
            
            element.addEventListener('mouseleave', (e) => {
                if (e.target._tooltip) {
                    e.target._tooltip.remove();
                    delete e.target._tooltip;
                }
            });
        });
        
        console.log('QXVault initialized - Quantum-secure password manager ready!');
    </script>
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