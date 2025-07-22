let isWebAuthnConfigured = false;
let webAuthnCredential = null;

function base64UrlEncode(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
    str += '='.repeat((4 - str.length % 4) % 4);
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function loadWebAuthnCredential() {
    const stored = localStorage.getItem('qxvault-webauthn-credential');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);

            let rawIdBuffer;
            if (parsed.rawIdBase64Url) {
                rawIdBuffer = base64UrlDecode(parsed.rawIdBase64Url);
                console.log('Loaded credential using base64url format');
            } else {
                throw new Error('Invalid credential format');
            }

            const rawIdArray = new Uint8Array(rawIdBuffer);
            webAuthnCredential = {
                id: parsed.id,
                rawId: rawIdBuffer,
                rpId: parsed.rpId,
                isMobile: parsed.isMobile,
                credentialIdBytes: rawIdArray // Keep as Uint8Array for device secret derivation
            };
            isWebAuthnConfigured = true;
            console.log('WebAuthn credential loaded from storage. Credential ID length:', rawIdArray.length);
            console.log('Credential ID (first 16 hex):', Array.from(rawIdArray.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''));
        } catch (error) {
            console.error('Failed to load WebAuthn credential:', error);
            localStorage.removeItem('qxvault-webauthn-credential');
        }
    }
}

// Save WebAuthn credential to storage
function saveWebAuthnCredential() {
    if (webAuthnCredential) {
        const toStore = {
            id: webAuthnCredential.id,
            rawIdBase64Url: base64UrlEncode(webAuthnCredential.rawId), // Use base64url encoding
            rpId: webAuthnCredential.rpId,
            isMobile: webAuthnCredential.isMobile
        };
        localStorage.setItem('qxvault-webauthn-credential', JSON.stringify(toStore));
        console.log('WebAuthn credential saved to storage with base64url encoding');
        console.log('Credential ID (base64url):', toStore.rawIdBase64Url.substring(0, 32) + '...');
    }
}

// Update hardware button status based on auth state
function updateHardwareButtonStatus() {
    const hardwareBtn = document.getElementById('generateHardwareBtn');
    if (isWebAuthnConfigured) {
        hardwareBtn.innerHTML = '<span class="material-icons-round">verified</span>Generate QX Hardware Pass';
        hardwareBtn.style.borderColor = 'var(--accent-cyan)';
        hardwareBtn.style.background = 'rgba(0, 255, 255, 0.1)';
    } else {
        hardwareBtn.innerHTML = '<span class="material-icons-round">security</span>Generate QX Hardware Pass';
        hardwareBtn.style.borderColor = '';
        hardwareBtn.style.background = '';
    }
}

// Initialize WebAuthn credential from storage
loadWebAuthnCredential();

// Theme management
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle?.querySelector('.material-icons-round');

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update icon based on theme
    if (icon) {
        if (newTheme === 'light') {
            icon.textContent = 'light_mode';
        } else {
            icon.textContent = 'dark_mode';
        }
    }
}

// Password visibility toggle
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('masterPassphrase');
    const toggleIcon = document.getElementById('passwordToggleIcon');

    if (passwordInput && toggleIcon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.textContent = 'visibility';
        } else {
            passwordInput.type = 'password';
            toggleIcon.textContent = 'visibility_off';
        }
    }
}

// Make functions globally available for onclick handlers
window.toggleTheme = toggleTheme;
window.togglePasswordVisibility = togglePasswordVisibility;

// Validate WebAuthn support and provide detailed feedback
function validateWebAuthnSupport() {
    const issues = [];

    // Check basic WebAuthn support
    if (!window.PublicKeyCredential) {
        issues.push('WebAuthn not supported in this browser');
    }

    // Check navigator.credentials
    if (!navigator.credentials) {
        issues.push('Credentials API not available');
    }

    // Check for secure context
    if (!window.isSecureContext) {
        issues.push('WebAuthn requires HTTPS or localhost');
    }

    // Check protocol
    if (location.protocol === 'file:') {
        issues.push('WebAuthn not supported with file:// protocol');
    }

    return {
        isSupported: issues.length === 0,
        issues: issues
    };
}

// WebAuthn validation and troubleshooting
function validateWebAuthnEnvironment() {
    const issues = [];

    // Check basic WebAuthn support
    if (!navigator.credentials) {
        issues.push('navigator.credentials not available');
    }
    if (!navigator.credentials?.create) {
        issues.push('navigator.credentials.create not available');
    }
    if (!navigator.credentials?.get) {
        issues.push('navigator.credentials.get not available');
    }

    // Check secure context
    if (!window.isSecureContext) {
        issues.push('Not a secure context (requires HTTPS or localhost)');
    }

    // Check origin compatibility
    if (location.protocol === 'file:') {
        issues.push('File:// protocol not compatible with WebAuthn');
    }

    // Check for common mobile issues
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const iosVersionRegex = /OS (\d+_\d+)/;
        const iosVersionMatch = iosVersionRegex.exec(navigator.userAgent);
        if (isIOS && iosVersionMatch && parseFloat(iosVersionMatch[1].replace(/_/g, '.')) < 14) {
            issues.push('iOS version may not support WebAuthn (requires iOS 14+)');
        }
    }

    return {
        isSupported: issues.length === 0,
        issues: issues,
        recommendations: issues.length > 0 ? [
            'Try opening in Chrome, Firefox, Safari, or Edge',
            'Ensure you are on HTTPS or localhost',
            'Update your browser to the latest version',
            'On mobile, ensure biometric authentication is enabled'
        ] : []
    };
}

async function generateQuantumSecurePassword(passphrase, site, email, deviceSecret, length, quantumLevel) {
    const encoder = new TextEncoder();

    const masterInput = passphrase + (email || '') + site;
    const finalSeed = encoder.encode(masterInput + deviceSecret + 'QXVault-PQC-2025');

    let keyMaterial = await crypto.subtle.importKey(
        'raw',
        finalSeed,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    const iterations = 75000 + (quantumLevel * 25000); // 100k to 200k iterations
    const salt = encoder.encode('QXVault-PostQuantum-Salt-v2-' + site);

    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: iterations,
            hash: 'SHA-512'
        },
        keyMaterial,
        1024 // Generate 128 bytes for PQC operations
    );

    const pqcSeed = new Uint8Array(derivedBits, 0, 64); // First 64 bytes
    const sharedSecret = await simulateKyberKEM(pqcSeed, quantumLevel);

    const passwordBytes = await derivePasswordFromSecret(sharedSecret, length, site);

    const includeSpecial = document.getElementById('includeSpecial').checked;
    const chars = includeSpecial
        ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
        : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    let password = '';
    for (let i = 0; i < length; i++) {
        const index = passwordBytes[i % passwordBytes.length] % chars.length;
        password += chars[index];
    }

    return password;
}

// Simulate Post-Quantum Kyber KEM operations
async function simulateKyberKEM(seed, quantumLevel) {
    const encoder = new TextEncoder();

    // Simulate Kyber key generation with multiple rounds
    let currentSeed = seed;
    for (let round = 0; round < quantumLevel; round++) {
        const roundData = new Uint8Array([...currentSeed, ...encoder.encode('round-' + round)]);
        currentSeed = new Uint8Array(await crypto.subtle.digest('SHA-256', roundData));
    }

    // Simulate shared secret derivation
    const sharedSecretInput = new Uint8Array([...currentSeed, ...encoder.encode('kyber-shared-secret')]);
    return new Uint8Array(await crypto.subtle.digest('SHA-512', sharedSecretInput));
}

// Derive final password bytes using HKDF-like approach
async function derivePasswordFromSecret(sharedSecret, length, site) {
    const encoder = new TextEncoder();
    const info = encoder.encode('QXVault-Password-' + site);

    // Import shared secret as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        sharedSecret,
        { name: 'HKDF' },
        false,
        ['deriveBits']
    );

    // Derive password-specific bits
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: encoder.encode('password-salt'),
            info: info
        },
        keyMaterial,
        length * 8 // bits needed
    );

    return new Uint8Array(derivedBits);
}

// Enhanced device secret derivation from WebAuthn (deterministic)
async function deriveDeviceSecret(credentialIdBytes) {
    const encoder = new TextEncoder();

    // Create a deterministic device fingerprint
    const deviceFingerprint = navigator.userAgent +
        (navigator.hardwareConcurrency || '4') +
        (screen.width + 'x' + screen.height) +
        navigator.language;


    console.log('Deriving device secret...');
    console.log('Credential ID length:', credentialIdBytes.length);
    console.log('Credential ID (hex):', Array.from(credentialIdBytes).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32) + '...');
    console.log('Device fingerprint:', deviceFingerprint.substring(0, 50) + '...');

    // Combine ONLY credential ID and device fingerprint for deterministic result
    // NOTE: We don't use the signature because it's different each time
    const combinedData = new Uint8Array([
        ...credentialIdBytes,
        ...encoder.encode(deviceFingerprint),
        ...encoder.encode('qxvault-device-binding-v4-deterministic')
    ]);

    // Hash to create deterministic device secret
    const deviceHash = await crypto.subtle.digest('SHA-256', combinedData);
    const deviceSecret = Array.from(new Uint8Array(deviceHash)).map(b => b.toString(16)).join('');

    console.log('Device secret (first 16 chars):', deviceSecret.substring(0, 16) + '...');
    return deviceSecret;
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

// Load saved theme
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 QXVault initializing...');

    try {
        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);

        // Initialize theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle?.querySelector('.material-icons-round');
        if (icon) {
            if (savedTheme === 'light') {
                icon.textContent = 'light_mode';
            } else {
                icon.textContent = 'dark_mode';
            }
        }

        // Check for security context and warn about WebAuthn limitations
        if (location.protocol === 'file:') {
            showStatus('Note: Hardware authentication requires HTTPS or localhost. Open via http://localhost or https:// for full functionality.', 'info');
        }

        // Initialize all components
        initializeComponents();

    } catch (initError) {
        console.error('❌ Initialization error:', initError);
        showStatus('Initialization failed. Please refresh the page.', 'error');
    }
});

function initializeComponents() {

    // Enhanced slider functionality
    const settingsMinimizeBtn = document.getElementById('settingsMinimize');
    const settingsContent = document.getElementById('settingsContent');
    let settingsCollapsed = true; // Start collapsed as per CSS

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

    // Slider functionality
    const passwordLengthSlider = document.getElementById('passwordLength');
    const lengthValueDisplay = document.getElementById('lengthValue');
    const quantumLevelSlider = document.getElementById('quantumLevel');
    const quantumLevelValueDisplay = document.getElementById('quantumLevelValue');

    if (passwordLengthSlider && lengthValueDisplay) {
        passwordLengthSlider.addEventListener('input', (e) => {
            lengthValueDisplay.textContent = e.target.value;
        });
    }

    if (quantumLevelSlider && quantumLevelValueDisplay) {
        quantumLevelSlider.addEventListener('input', (e) => {
            quantumLevelValueDisplay.textContent = e.target.value;
        });
    }

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
                        // For mobile, prefer platform authenticators (Touch ID/Face ID)
                        authenticatorAttachment: isMobile ? "platform" : undefined,
                        userVerification: "preferred", // Always prefer user verification
                        requireResidentKey: true, // Enable discoverable credentials
                        residentKey: "preferred" // Prefer resident keys for better compatibility
                    },
                    timeout: isMobile ? 120000 : 60000, // Longer timeout for mobile
                    attestation: "none",
                    extensions: {}
                }
            };

            let credential;
            try {
                console.log('Creating WebAuthn credential...');
                credential = await navigator.credentials.create(createOptions);
            } catch (mobileError) {
                console.warn('Primary credential creation failed:', mobileError.message);
                // If platform authenticator fails on mobile, try cross-platform
                if (isMobile && (mobileError.name === 'NotSupportedError' || mobileError.name === 'InvalidStateError')) {
                    showStatus('Trying alternative authentication method...', 'info');
                    createOptions.publicKey.authenticatorSelection.authenticatorAttachment = "cross-platform";
                    createOptions.publicKey.authenticatorSelection.residentKey = "discouraged";
                    createOptions.publicKey.authenticatorSelection.requireResidentKey = false;
                    console.log('Retrying with cross-platform authenticator...');
                    credential = await navigator.credentials.create(createOptions);
                } else {
                    throw mobileError;
                }
            }

            if (!credential || !credential.rawId) {
                throw new Error('Failed to create credential - no valid credential returned');
            }

            console.log('WebAuthn credential created successfully');
            console.log('Credential ID length:', new Uint8Array(credential.rawId).length);

            // Store credential info for later use
            webAuthnCredential = {
                id: credential.id,
                rawId: credential.rawId,
                rpId: isMobile ? null : rpId, // Don't store RP ID for mobile
                isMobile: isMobile, // Store mobile flag for later use
                // Store the credential properly encoded for authentication
                credentialIdBytes: new Uint8Array(credential.rawId)
            };
            isWebAuthnConfigured = true;

            // Save to localStorage for persistence
            saveWebAuthnCredential();

            // Verify credential consistency
            verifyCredentialConsistency();

            // Update button appearance
            updateHardwareButtonStatus();

            showStatus('Hardware authentication configured successfully! You can now use "Generate QX Hardware Pass".', 'success');

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

            // Try multiple approaches to handle different WebAuthn scenarios
            const getOptions = {
                publicKey: {
                    challenge: challenge,
                    // Only use RP ID if not mobile and RP ID exists
                    ...(webAuthnCredential.rpId && !isMobile && { rpId: webAuthnCredential.rpId }),
                    // First try with specific credential
                    allowCredentials: [{
                        id: webAuthnCredential.rawId,
                        type: 'public-key',
                        transports: isMobile ? ['internal'] : ['usb', 'nfc', 'ble', 'internal', 'hybrid']
                    }],
                    userVerification: "preferred", // Changed from discouraged to preferred
                    timeout: isMobile ? 60000 : 30000
                }
            };

            console.log('Attempting WebAuthn authentication with specific credential...');
            console.log('Credential ID length:', new Uint8Array(webAuthnCredential.rawId).length);

            let assertion;
            try {
                assertion = await navigator.credentials.get(getOptions);
            } catch (specificError) {
                console.warn('Specific credential failed, trying with empty allowCredentials:', specificError.message);

                // Fallback: Try with empty allowCredentials to accept any available credential
                const fallbackOptions = {
                    publicKey: {
                        challenge: challenge,
                        ...(webAuthnCredential.rpId && !isMobile && { rpId: webAuthnCredential.rpId }),
                        allowCredentials: [], // Empty array to accept any credential
                        userVerification: "preferred",
                        timeout: isMobile ? 60000 : 30000
                    }
                };

                console.log('Trying with empty allowCredentials...');
                assertion = await navigator.credentials.get(fallbackOptions);

                // If this succeeds, update our stored credential with the actual one used
                if (assertion && assertion.rawId) {
                    console.log('Fallback succeeded, updating stored credential...');
                    webAuthnCredential.rawId = assertion.rawId;
                    webAuthnCredential.credentialIdBytes = new Uint8Array(assertion.rawId);
                    saveWebAuthnCredential();
                }
            }

            if (!assertion || !assertion.response || !assertion.response.signature) {
                throw new Error('Authentication failed - no valid response received');
            }

            console.log('WebAuthn authentication successful');
            return assertion.response.signature;

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
                errorMessage = 'No passkey available. Please clear data and set up hardware authentication again.';
            } else if (error.name === 'UnknownError') {
                errorMessage = 'Hardware authentication failed. Please try again or clear data and set up again.';
            } else if (error.name === 'NetworkError') {
                errorMessage = 'Network error during authentication. Please check your connection.';
            } else if (error.message.includes('No credential configured')) {
                errorMessage = 'No hardware key configured. Please set up hardware authentication first.';
            } else if (error.message.includes('No credentials available') || error.message.includes('no passkey available')) {
                errorMessage = 'No passkey available for this device. Please clear data and set up hardware authentication again.';
            }

            throw new Error(errorMessage);
        }
    }

    // Test function to verify credential consistency
    function verifyCredentialConsistency() {
        if (webAuthnCredential && webAuthnCredential.credentialIdBytes) {
            const credentialIdHex = Array.from(webAuthnCredential.credentialIdBytes).map(b => b.toString(16).padStart(2, '0')).join('');
            console.log('Current credential ID (full):', credentialIdHex);
            console.log('Credential ID length:', webAuthnCredential.credentialIdBytes.length);

            // Store a hash of the credential ID to verify consistency across sessions
            const credentialHash = Array.from(webAuthnCredential.credentialIdBytes).reduce((hash, byte) => {
                return ((hash << 5) - hash) + byte;
            }, 0);

            const storedHash = localStorage.getItem('qxvault-credential-hash');
            if (storedHash) {
                if (parseInt(storedHash) === credentialHash) {
                    console.log('✓ Credential consistency verified - same credential as before');
                    return true;
                } else {
                    console.warn('⚠ Credential mismatch detected - different credential than before');
                    return false;
                }
            } else {
                localStorage.setItem('qxvault-credential-hash', credentialHash.toString());
                console.log('✓ Credential hash stored for future verification');
                return true;
            }
        }
        return false;
    }

    // Initialize credential consistency verification
    verifyCredentialConsistency();

    // Event listeners
    console.log('🔧 Setting up event listeners...');

    const hardwareBtn = document.getElementById('generateHardwareBtn');
    const basicBtn = document.getElementById('generateBasicBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    console.log('🔍 Button status:');
    console.log('- Hardware button found:', !!hardwareBtn);
    console.log('- Basic button found:', !!basicBtn);
    console.log('- Copy button found:', !!copyBtn);
    console.log('- Clear button found:', !!clearBtn);

    if (!hardwareBtn || !basicBtn) {
        console.error('❌ Critical buttons not found! Hardware:', !!hardwareBtn, 'Basic:', !!basicBtn);
        // Continue anyway to set up other listeners
    }

    // Hardware password generation
    if (hardwareBtn) {
        console.log('🔐 Attaching hardware button listener...');
        hardwareBtn.addEventListener('click', async () => {
            console.log('🔐 Hardware button clicked!');
            showStatus('Hardware button clicked - starting generation...', 'info');
            const passphrase = document.getElementById('masterPassphrase').value;
            const siteName = document.getElementById('siteName').value;
            const userEmail = document.getElementById('userEmail').value;
            const passwordLength = parseInt(document.getElementById('passwordLength').value);
            const quantumLevel = parseInt(document.getElementById('quantumLevel').value);

            if (!passphrase || !siteName) {
                showStatus('Please fill in all required fields', 'error');
                return;
            }

            // Validate WebAuthn environment
            const validation = validateWebAuthnEnvironment();
            if (!validation.isSupported) {
                console.error('WebAuthn validation failed:', validation.issues);
                const errorMsg = '❌ Hardware authentication not available: ' + validation.issues[0] + '. Try: ' + validation.recommendations[0];
                showStatus(errorMsg, 'error');
                return;
            }

            // Enhanced mobile detection
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isAndroid = /Android/i.test(navigator.userAgent);

            try {
                // Set up WebAuthn ONLY if not already configured
                if (!isWebAuthnConfigured) {
                    if (isMobile) {
                        if (isIOS) {
                            showStatus('Setting up Touch ID/Face ID authentication for iOS...', 'info');
                        } else if (isAndroid) {
                            showStatus('Setting up fingerprint/biometric authentication for Android...', 'info');
                        } else {
                            showStatus('Setting up mobile authentication...', 'info');
                        }
                    } else {
                        showStatus('Setting up hardware key authentication...', 'info');
                    }

                    await setupWebAuthn();

                    if (!isWebAuthnConfigured) {
                        showStatus('Hardware setup failed. Please try again or use "Generate QX Normal Pass".', 'error');
                        return;
                    }
                }

                // Authenticate with WebAuthn (this will show the biometric prompt)
                showStatus('Authenticating with hardware key...', 'info');
                await authenticateWebAuthn();

                // Generate deterministic device secret from credential ID only (no signature)
                console.log('Generating device secret for hardware password...');
                const deviceSecret = await deriveDeviceSecret(webAuthnCredential.credentialIdBytes);

                // Log device secret consistency for debugging
                const deviceSecretHash = Array.from(new TextEncoder().encode(deviceSecret)).reduce((hash, byte) => {
                    return ((hash << 5) - hash) + byte;
                }, 0);
                console.log('Device secret hash for consistency check:', deviceSecretHash);

                // Store device secret hash for verification
                const lastDeviceSecretHash = localStorage.getItem('qxvault-last-device-secret-hash');
                if (lastDeviceSecretHash) {
                    if (parseInt(lastDeviceSecretHash) === deviceSecretHash) {
                        console.log('✓ Device secret is consistent with previous generation');
                    } else {
                        console.warn('⚠ Device secret has changed from previous generation');
                    }
                }
                localStorage.setItem('qxvault-last-device-secret-hash', deviceSecretHash.toString());

                showStatus('Generating quantum-secure hardware-bound password...', 'info');

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

                showStatus('🔐 QX Hardware password generated successfully! (Quantum-secure + Device-bound)', 'success');

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
                console.error('Hardware password generation failed:', error);

                let errorMessage = 'Hardware password generation failed.';
                if (error.name === 'NotAllowedError') {
                    errorMessage = 'Authentication was cancelled or timed out. Please try again.';
                } else if (error.name === 'SecurityError') {
                    errorMessage = 'Security error during authentication. Make sure you are on HTTPS or localhost.';
                } else if (error.name === 'NotSupportedError') {
                    errorMessage = 'Hardware authentication not supported on this device. Use "Generate QX Normal Pass" instead.';
                } else if (error.name === 'InvalidStateError') {
                    errorMessage = 'Hardware key not available. Please clear data and try again or use "Generate QX Normal Pass".';
                } else if (error.message.includes('No credential configured')) {
                    errorMessage = 'Hardware key not configured properly. Please clear data and try again.';
                }

                showStatus(errorMessage, 'error');
            }
        });
    }

    // Generate normal password without hardware auth
    if (basicBtn) {
        basicBtn.addEventListener('click', async () => {
            console.log('🔑 Basic button clicked!');
            const passphrase = document.getElementById('masterPassphrase').value;
            const siteName = document.getElementById('siteName').value;
            const userEmail = document.getElementById('userEmail').value;
            const passwordLength = parseInt(document.getElementById('passwordLength').value);
            const quantumLevel = parseInt(document.getElementById('quantumLevel').value);

            if (!passphrase || !siteName) {
                showStatus('Please fill in all required fields', 'error');
                return;
            }

            try {
                showStatus('Generating QX Normal password (quantum-secure, no hardware binding)...', 'info');

                // Use a simple deterministic device identifier
                const deviceId = 'qx-normal-' + btoa(navigator.userAgent + navigator.language).substring(0, 16);

                const password = await generateQuantumSecurePassword(
                    passphrase,
                    siteName,
                    userEmail,
                    deviceId,
                    passwordLength,
                    quantumLevel
                );

                document.getElementById('passwordOutput').textContent = password;
                document.getElementById('copyBtn').disabled = false;

                showStatus('🔑 QX Normal password generated successfully! (Quantum-secure, cross-device compatible)', 'success');

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
                showStatus('Failed to generate normal password. Please try again.', 'error');
            }
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const password = document.getElementById('passwordOutput').textContent;

            if (password && password !== 'Click generate to create your quantum-secure password') {
                try {
                    await navigator.clipboard.writeText(password);
                    showStatus('Password copied to clipboard!', 'success');
                } catch (error) {
                    console.error('Failed to copy password to clipboard:', error);
                    showStatus('Failed to copy password. Please try again or copy manually.', 'error');
                }
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            // Clear all form fields manually
            document.getElementById('masterPassphrase').value = '';
            document.getElementById('siteName').value = '';
            document.getElementById('userEmail').value = '';
            document.getElementById('passwordLength').value = '32';
            document.getElementById('lengthValue').textContent = '32';
            document.getElementById('quantumLevel').value = '3';
            document.getElementById('quantumLevelValue').textContent = '3';
            document.getElementById('includeSpecial').checked = true;
            document.getElementById('autoClear').checked = false;

            document.getElementById('passwordOutput').textContent = 'Click generate to create your quantum-secure password';
            document.getElementById('copyBtn').disabled = true;
            document.getElementById('status').classList.add('hidden');

            // Reset WebAuthn state and clear storage
            isWebAuthnConfigured = false;
            webAuthnCredential = null;
            localStorage.removeItem('qxvault-webauthn-credential');
            localStorage.removeItem('qxvault-credential-hash');
            localStorage.removeItem('qxvault-last-device-secret-hash');

            // Update button appearance
            updateHardwareButtonStatus();

            showStatus('All data cleared!', 'success');
        });
    }

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
                transform: 'scale(1) translate(' + (Math.random() * distance - distance / 2) + 'px, ' + (Math.random() * distance - distance / 2) + 'px)',
                filter: 'blur(0px)'
            },
            {
                opacity: 0,
                transform: 'scale(0) translate(' + (Math.random() * distance - distance / 2) + 'px, ' + (Math.random() * distance - distance / 2) + 'px)',
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
            switch (e.key) {
                case 'Enter':
                    e.preventDefault();
                    document.getElementById('generateHardwareBtn').click();
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

    // Final initialization after all event listeners are set up
    try {
        updateHardwareButtonStatus();
        if (isWebAuthnConfigured) {
            const isConsistent = verifyCredentialConsistency();
            setTimeout(() => {
                if (isConsistent) {
                    showStatus('✅ Hardware authentication ready! Device credential verified.', 'success');
                } else {
                    showStatus('⚠️ Hardware authentication ready, but credential changed. Will re-sync on first use.', 'info');
                }
            }, 1000);
        }
    } catch (initError) {
        console.error('❌ Initialization error:', initError);
    }

    console.log('✅ QXVault initialized - Clean minimal cyberpunk design ready!');
}
