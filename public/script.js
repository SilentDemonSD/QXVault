let isWebAuthnConfigured = false;
let webAuthnCredential = null;
let generationBusy = false;

const QX_DEBUG = typeof location !== 'undefined' && location.hash === '#qx-debug';
function qxlog(...args) { if (QX_DEBUG) qxlog(...args); }

function setBusy(busy) {
    generationBusy = busy;
    for (const id of ['generateHardwareBtn', 'generateBasicBtn']) {
        const el = document.getElementById(id);
        if (el) el.disabled = busy;
    }
}

const UTF8 = new TextEncoder();

function concatBytes(...parts) {
    let total = 0;
    for (const p of parts) total += p.length;
    const out = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) { out.set(p, offset); offset += p.length; }
    return out;
}

let autoClearTimer = 0;

function armAutoClear() {
    if (autoClearTimer) { clearTimeout(autoClearTimer); autoClearTimer = 0; }
    const toggle = document.getElementById('autoClear');
    if (!toggle || !toggle.checked) return;
    autoClearTimer = setTimeout(() => {
        autoClearTimer = 0;
        document.getElementById('masterPassphrase').value = '';
        document.getElementById('passwordOutput').textContent = 'Fill the fields and hit generate.';
        document.getElementById('copyBtn').disabled = true;
        showStatus('Sensitive data automatically cleared for security', 'info');
    }, 300000); // 5 minutes
}

async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        let ok = false;
        try { ok = document.execCommand('copy'); } catch { ok = false; }
        ta.remove();
        return ok;
    }
}

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
                qxlog('Loaded credential using base64url format');
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
            qxlog('WebAuthn credential loaded from storage. Credential ID length:', rawIdArray.length);
            qxlog('Credential ID (first 16 hex):', Array.from(rawIdArray.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(''));
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
        qxlog('WebAuthn credential saved to storage with base64url encoding');
        qxlog('Credential ID (base64url):', toStore.rawIdBase64Url.substring(0, 32) + '...');
    }
}

// Update hardware button status based on auth state
function updateHardwareButtonStatus() {
    const hardwareBtn = document.getElementById('generateHardwareBtn');
    if (!hardwareBtn) return;
    if (isWebAuthnConfigured) {
        hardwareBtn.innerHTML = '<span class="material-icons-round">verified</span>Generate hardware pass';
        hardwareBtn.classList.add('is-armed');
    } else {
        hardwareBtn.innerHTML = '<span class="material-icons-round">security</span>Generate hardware pass';
        hardwareBtn.classList.remove('is-armed');
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
    const encoder = UTF8;

    const emailNorm = (email || '').trim().toLowerCase();
    const masterInput = passphrase + emailNorm + site;
    const finalSeed = encoder.encode(masterInput + deviceSecret + 'QXVault-PQC-v5');

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        finalSeed,
        { name: 'PBKDF2' },
        false,
        ['deriveBits']
    );

    const iterations = 75000 + (quantumLevel * 25000); // 100k to 200k iterations
    const salt = encoder.encode('QXVault-PostQuantum-Salt-v5-' + site);

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
    const sharedSecret = await runKyberKEM(pqcSeed, quantumLevel);

    const includeSpecial = document.getElementById('includeSpecial').checked;
    const chars = includeSpecial
        ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
        : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    return renderPassword(sharedSecret, length, site, chars);
}

// Real Post-Quantum Kyber-768 KEM (WASM), derandomized from the PBKDF2-derived seed
let kyberModulePromise = null;

function loadKyberModule() {
    if (!kyberModulePromise) {
        kyberModulePromise = import('/vendor/pqc-kyber/kyber.js').then(async (mod) => {
            await mod.initKyber();
            return mod;
        });
        kyberModulePromise.catch(() => { kyberModulePromise = null; });
    }
    return kyberModulePromise;
}

async function buildDeterministicPool(seed, quantumLevel, poolSize) {
    const encoder = UTF8;

    let currentSeed = seed;
    for (let round = 0; round < quantumLevel; round++) {
        const roundData = concatBytes(currentSeed, encoder.encode('round-' + round));
        currentSeed = new Uint8Array(await crypto.subtle.digest('SHA-256', roundData));
    }

    const pool = new Uint8Array(poolSize);
    let offset = 0;
    let counter = 0;
    while (offset < poolSize) {
        const blockInput = concatBytes(currentSeed, encoder.encode('kyber-drbg-' + counter));
        const block = new Uint8Array(await crypto.subtle.digest('SHA-512', blockInput));
        pool.set(block.subarray(0, Math.min(block.length, poolSize - offset)), offset);
        offset += block.length;
        counter++;
    }
    return pool;
}

let kemQueue = Promise.resolve();

function runKyberKEM(seed, quantumLevel) {
    const result = kemQueue.then(() => executeKyberKEM(seed, quantumLevel));
    kemQueue = result.catch(() => {});
    return result;
}

async function executeKyberKEM(seed, quantumLevel) {
    const kyber = await loadKyberModule();
    const pool = await buildDeterministicPool(seed, quantumLevel, 1024);

    let poolOffset = 0;
    kyber.setDeterministicRng((target) => {
        const view = target instanceof Uint8Array
            ? target
            : new Uint8Array(target.buffer, target.byteOffset, target.byteLength);
        if (poolOffset + view.length > pool.length) {
            throw new Error('Deterministic RNG pool exhausted');
        }
        view.set(pool.subarray(poolOffset, poolOffset + view.length));
        poolOffset += view.length;
    });

    try {
        const keys = kyber.keypair();
        const kex = kyber.encapsulate(keys.pubkey);
        const decapsulated = kyber.decapsulate(kex.ciphertext, keys.secret);

        const encapSecret = kex.sharedSecret;
        if (decapsulated.length !== encapSecret.length ||
            !decapsulated.every((byte, i) => byte === encapSecret[i])) {
            throw new Error('Kyber KEM round-trip verification failed');
        }

        const encoder = UTF8;
        const finalInput = concatBytes(decapsulated, encoder.encode('kyber-shared-secret'));
        return new Uint8Array(await crypto.subtle.digest('SHA-512', finalInput));
    } finally {
        kyber.setDeterministicRng(null);
    }
}

// Render a password with rejection sampling (no modulo bias) over HKDF output.
// Bytes stream from 64-byte HKDF blocks keyed by a per-block counter so any
// requested length is satisfiable deterministically.
async function renderPassword(sharedSecret, length, site, chars) {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        sharedSecret,
        { name: 'HKDF' },
        false,
        ['deriveBits']
    );

    const charsetSize = chars.length;
    const limit = 256 - (256 % charsetSize);
    let block = new Uint8Array(0);
    let pos = 0;
    let counter = 0;
    let password = '';
    while (password.length < length) {
        if (pos >= block.length) {
            const derivedBits = await crypto.subtle.deriveBits(
                {
                    name: 'HKDF',
                    hash: 'SHA-256',
                    salt: UTF8.encode('password-salt'),
                    info: UTF8.encode('QXVault-Password-v5-' + site + '#' + counter)
                },
                keyMaterial,
                512 // 64 bytes per block
            );
            block = new Uint8Array(derivedBits);
            pos = 0;
            counter++;
        }
        const byte = block[pos++];
        if (byte < limit) {
            password += chars[byte % charsetSize];
        }
    }
    return password;
}

// Device secret bound to the enrolled WebAuthn credential. Derived from the
// credential ID alone: browser metadata (user agent, screen, concurrency) is
// deliberately excluded so browser updates cannot change existing passwords.
async function deriveDeviceSecret(credentialIdBytes) {
    const combinedData = concatBytes(
        credentialIdBytes,
        UTF8.encode('qxvault-device-binding-v5')
    );

    const deviceHash = await crypto.subtle.digest('SHA-256', combinedData);
    return Array.from(new Uint8Array(deviceHash), (b) => b.toString(16).padStart(2, '0')).join('');
}

// Status display
    let statusTimer = 0;
    let statusSeq = 0;
    function showStatus(message, type) {
        const status = document.getElementById('status');
        if (!status) return;
        const seq = ++statusSeq;
        status.textContent = message;
        status.className = 'status ' + type;
        status.classList.remove('hidden');

        if (statusTimer) { clearTimeout(statusTimer); statusTimer = 0; }
        if (type === 'success' || type === 'error') {
            statusTimer = setTimeout(() => {
                if (seq === statusSeq) status.classList.add('hidden');
            }, 5000);
        }
    }

// Load saved theme
document.addEventListener('DOMContentLoaded', function () {
    qxlog('🚀 QXVault initializing...');

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

            // No explicit RP ID on purpose: it defaults to the document's effective
            // domain, which stays valid on localhost, 127.0.0.1, LAN addresses,
            // and production hosts. A hardcoded ID that mismatches the origin
            // (e.g. rpId 'localhost' while served from 127.0.0.1) throws
            // SecurityError and fails setup.
            const rpId = null;

            // Check if we're on mobile and adjust settings
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

            showStatus('Setting up hardware authentication...', 'info');

            function buildCreateOptions(relaxed) {
                return {
                    publicKey: {
                        challenge: crypto.getRandomValues(new Uint8Array(32)),
                        rp: {
                            name: "QXVault"
                        },
                        user: {
                            id: crypto.getRandomValues(new Uint8Array(32)),
                            name: "qxvault-user",
                            displayName: "QXVault User",
                        },
                        pubKeyCredParams: [
                            { alg: -7, type: "public-key" },   // ES256 (preferred)
                            { alg: -257, type: "public-key" }, // RS256 fallback
                            { alg: -37, type: "public-key" }   // PS256 additional fallback
                        ],
                        authenticatorSelection: relaxed
                            ? {
                                userVerification: "preferred",
                                requireResidentKey: false,
                                residentKey: "discouraged"
                            }
                            : {
                                // For mobile, prefer platform authenticators (Touch ID/Face ID)
                                authenticatorAttachment: isMobile ? "platform" : undefined,
                                userVerification: "preferred", // Always prefer user verification
                                requireResidentKey: true, // Enable discoverable credentials
                                residentKey: "preferred" // Prefer resident keys for better compatibility
                            },
                        timeout: 120000,
                        attestation: "none",
                        extensions: {}
                    }
                };
            }

            let createOptions = buildCreateOptions(false);

            let credential;
            try {
                qxlog('Creating WebAuthn credential...');
                credential = await navigator.credentials.create(createOptions);
            } catch (firstError) {
                console.warn('Primary credential creation failed:', firstError.name, firstError.message);
                // Retry once with minimal constraints so platform, roaming, and
                // hybrid authenticators can all answer, on any platform.
                if (firstError.name === 'NotSupportedError' || firstError.name === 'ConstraintError') {
                    showStatus('Trying alternative authentication method...', 'info');
                    createOptions = buildCreateOptions(true);
                    qxlog('Retrying with relaxed authenticator selection...');
                    credential = await navigator.credentials.create(createOptions);
                } else {
                    throw firstError;
                }
            }

            if (!credential || !credential.rawId) {
                throw new Error('Failed to create credential - no valid credential returned');
            }

            qxlog('WebAuthn credential created successfully');
            qxlog('Credential ID length:', new Uint8Array(credential.rawId).length);

            // Store credential info for later use
            webAuthnCredential = {
                id: credential.id,
                rawId: credential.rawId,
                rpId: rpId, // null: RP ID always defaults to the current domain
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

            showStatus('Hardware authentication configured successfully! You can now use "Generate hardware pass".', 'success');

        } catch (error) {
            console.error('WebAuthn setup failed:', error);
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
                errorMessage = 'Security error: the browser rejected the ceremony. Open the page over HTTPS or via localhost / 127.0.0.1 on this machine, keep the tab focused, and retry.';
            } else if (error.name === 'InvalidStateError') {
                errorMessage = 'A credential for this device already exists. Please clear all data first.';
            } else if (error.name === 'ConstraintError') {
                if (isMobile) {
                    errorMessage = 'Device does not meet authentication requirements. You can still use QXVault without hardware authentication.';
                } else {
                    errorMessage = 'No suitable authenticator found. Enable your platform authenticator (Windows Hello, Touch ID) or plug in a security key, then retry.';
                }
            }

            throw new Error(errorMessage);
        }
    }

    async function authenticateWebAuthn() {
        try {
            if (!webAuthnCredential) {
                throw new Error('No credential configured');
            }

            const isMobile = webAuthnCredential.isMobile || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            const challenge = crypto.getRandomValues(new Uint8Array(32));

            // Only replay a stored RP ID when it exactly matches the current
            // host. Stale values (e.g. saved under a different hostname) would
            // throw SecurityError; omitting it defaults to the current domain.
            const storedRpId = webAuthnCredential.rpId;
            const safeRpId = (storedRpId && storedRpId === location.hostname) ? storedRpId : undefined;

            // Try multiple approaches to handle different WebAuthn scenarios
            const getOptions = {
                publicKey: {
                    challenge: challenge,
                    ...(safeRpId ? { rpId: safeRpId } : {}),
                    // First try with specific credential
                    allowCredentials: [{
                        id: webAuthnCredential.rawId,
                        type: 'public-key',
                        transports: isMobile ? ['internal'] : ['usb', 'nfc', 'ble', 'internal', 'hybrid']
                    }],
                    userVerification: "preferred", // Changed from discouraged to preferred
                    timeout: 60000
                }
            };

            qxlog('Attempting WebAuthn authentication with specific credential...');
            qxlog('Credential ID length:', new Uint8Array(webAuthnCredential.rawId).length);

            let assertion;
            try {
                assertion = await navigator.credentials.get(getOptions);
            } catch (specificError) {
                console.warn('Specific credential failed, trying with empty allowCredentials:', specificError.message);

                // Fallback: Try with empty allowCredentials to accept any available credential
                const fallbackOptions = {
                    publicKey: {
                        challenge: challenge,
                        ...(safeRpId ? { rpId: safeRpId } : {}),
                        allowCredentials: [], // Empty array to accept any credential
                        userVerification: "preferred",
                        timeout: 60000
                    }
                };

                qxlog('Trying with empty allowCredentials...');
                assertion = await navigator.credentials.get(fallbackOptions);

                // If this succeeds, update our stored credential with the actual one used
                if (assertion && assertion.rawId) {
                    qxlog('Fallback succeeded, updating stored credential...');
                    webAuthnCredential.id = assertion.id || webAuthnCredential.id;
                    webAuthnCredential.rawId = assertion.rawId;
                    webAuthnCredential.credentialIdBytes = new Uint8Array(assertion.rawId);
                    saveWebAuthnCredential();
                }
            }

            if (!assertion || !assertion.response || !assertion.response.signature) {
                throw new Error('Authentication failed - no valid response received');
            }

            qxlog('WebAuthn authentication successful');
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
            qxlog('Current credential ID (full):', credentialIdHex);
            qxlog('Credential ID length:', webAuthnCredential.credentialIdBytes.length);

            // Store a hash of the credential ID to verify consistency across sessions
            const credentialHash = Array.from(webAuthnCredential.credentialIdBytes).reduce((hash, byte) => {
                return ((hash << 5) - hash) + byte;
            }, 0);

            const storedHash = localStorage.getItem('qxvault-credential-hash');
            if (storedHash) {
                if (parseInt(storedHash, 10) === credentialHash) {
                    qxlog('✓ Credential consistency verified - same credential as before');
                    return true;
                } else {
                    console.warn('⚠ Credential mismatch detected - different credential than before');
                    return false;
                }
            } else {
                localStorage.setItem('qxvault-credential-hash', credentialHash.toString());
                qxlog('✓ Credential hash stored for future verification');
                return true;
            }
        }
        return false;
    }

    // Initialize credential consistency verification
    verifyCredentialConsistency();

    // Event listeners
    qxlog('🔧 Setting up event listeners...');

    const hardwareBtn = document.getElementById('generateHardwareBtn');
    const basicBtn = document.getElementById('generateBasicBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');

    qxlog('🔍 Button status:');
    qxlog('- Hardware button found:', !!hardwareBtn);
    qxlog('- Basic button found:', !!basicBtn);
    qxlog('- Copy button found:', !!copyBtn);
    qxlog('- Clear button found:', !!clearBtn);

    if (!hardwareBtn || !basicBtn) {
        console.error('❌ Critical buttons not found! Hardware:', !!hardwareBtn, 'Basic:', !!basicBtn);
        // Continue anyway to set up other listeners
    }

    // Hardware password generation
    if (hardwareBtn) {
        qxlog('🔐 Attaching hardware button listener...');
        hardwareBtn.addEventListener('click', async () => {
            const passphrase = document.getElementById('masterPassphrase').value;
            const siteName = document.getElementById('siteName').value;
            const userEmail = document.getElementById('userEmail').value;
            const passwordLength = parseInt(document.getElementById('passwordLength').value, 10);
            const quantumLevel = parseInt(document.getElementById('quantumLevel').value, 10);

            if (!passphrase || !siteName) {
                showStatus('Please fill in all required fields', 'error');
                return;
            }

            if (generationBusy) return;

            // Validate WebAuthn environment
            const validation = validateWebAuthnEnvironment();
            if (!validation.isSupported) {
                console.error('WebAuthn validation failed:', validation.issues);
                const errorMsg = '❌ Hardware authentication not available: ' + validation.issues[0] + '. Try: ' + validation.recommendations[0];
                showStatus(errorMsg, 'error');
                return;
            }

            setBusy(true);

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

                    try {
                        await setupWebAuthn();
                    } catch (setupError) {
                        showStatus((setupError && setupError.message) || 'Hardware setup failed. Please try again or use "Generate QX Normal Pass".', 'error');
                        return;
                    }

                    if (!isWebAuthnConfigured) {
                        showStatus('Hardware setup failed. Please try again or use "Generate QX Normal Pass".', 'error');
                        return;
                    }
                }

                // Authenticate with WebAuthn (this will show the biometric prompt)
                showStatus('Authenticating with hardware key...', 'info');
                await authenticateWebAuthn();

                const deviceSecret = await deriveDeviceSecret(webAuthnCredential.credentialIdBytes);

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

                armAutoClear();

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
            } finally {
                setBusy(false);
            }
        });
    }

    // Generate normal password without hardware auth
    if (basicBtn) {
        basicBtn.addEventListener('click', async () => {
            qxlog('🔑 Basic button clicked!');
            const passphrase = document.getElementById('masterPassphrase').value;
            const siteName = document.getElementById('siteName').value;
            const userEmail = document.getElementById('userEmail').value;
            const passwordLength = parseInt(document.getElementById('passwordLength').value, 10);
            const quantumLevel = parseInt(document.getElementById('quantumLevel').value, 10);

            if (!passphrase || !siteName) {
                showStatus('Please fill in all required fields', 'error');
                return;
            }

            if (generationBusy) return;
            setBusy(true);

            try {
                showStatus('Generating QX Normal password (quantum-secure, no hardware binding)...', 'info');

                // Portable constant: identical on every device, stable across
                // browser updates. The site/passphrase inputs provide uniqueness.
                const deviceId = 'qxvault-normal-v5';

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

                armAutoClear();

            } catch (error) {
                console.error('Password generation failed:', error);
                showStatus('Failed to generate normal password. Please try again.', 'error');
            } finally {
                setBusy(false);
            }
        });
    }

    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const password = document.getElementById('passwordOutput').textContent;

            if (password && password !== 'Fill the fields and hit generate.') {
                try {
                    const copied = await copyText(password);
                    if (copied) {
                        showStatus('Password copied to clipboard!', 'success');
                    } else {
                        throw new Error('copy fallback rejected');
                    }
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

            document.getElementById('passwordOutput').textContent = 'Fill the fields and hit generate.';
            document.getElementById('copyBtn').disabled = true;
            document.getElementById('status').classList.add('hidden');

            if (autoClearTimer) { clearTimeout(autoClearTimer); autoClearTimer = 0; }

            // Reset WebAuthn state and clear storage
            isWebAuthnConfigured = false;
            webAuthnCredential = null;
            localStorage.removeItem('qxvault-webauthn-credential');
            localStorage.removeItem('qxvault-credential-hash');

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

    qxlog('QXVault initialized');

    // Brutalist-theme UI enhancements (output meta, footer year, CTA shortcuts, FAQ keys)
    try {
        const saveData = navigator.connection && navigator.connection.saveData;
        if (!saveData) {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => { loadKyberModule().catch(() => {}); }, { timeout: 4000 });
            } else {
                setTimeout(() => { loadKyberModule().catch(() => {}); }, 1500);
            }
        }

        ['masterPassphrase', 'siteName', 'userEmail'].forEach((id) => {
            const field = document.getElementById(id);
            if (field) {
                field.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !generationBusy) {
                        e.preventDefault();
                        document.getElementById('generateBasicBtn').click();
                    }
                });
            }
        });

        const yearEl = document.getElementById('year');
        if (yearEl) yearEl.textContent = String(new Date().getFullYear());

        const menuBtn = document.getElementById('mobileMenuBtn');
        const navTabsEl = document.getElementById('navTabs');
        if (menuBtn && navTabsEl) {
            menuBtn.addEventListener('click', () => {
                menuBtn.setAttribute('aria-expanded', navTabsEl.classList.contains('mobile-open') ? 'true' : 'false');
            });
        }

        document.querySelectorAll('[data-goto-generator]').forEach((el) => {
            el.addEventListener('click', () => {
                document.querySelectorAll('.nav-tab').forEach((t) => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));
                const homeTab = document.querySelector('.nav-tab[data-tab="home"]');
                if (homeTab) homeTab.classList.add('active');
                document.getElementById('home').classList.add('active');
                const target = document.getElementById('generator');
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                const pass = document.getElementById('masterPassphrase');
                if (pass) pass.focus({ preventScroll: true });
            });
        });

        document.querySelectorAll('[data-goto-tab]').forEach((el) => {
            el.addEventListener('click', () => {
                const tab = el.getAttribute('data-goto-tab');
                const navBtn = document.querySelector('.nav-tab[data-tab="' + tab + '"]');
                if (navBtn) navBtn.click();
            });
        });

        document.querySelectorAll('.faq-question').forEach((q) => {
            q.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    q.click();
                }
            });
        });

        const outputEl = document.getElementById('passwordOutput');
        const metaEl = document.getElementById('passwordMeta');
        const entropyEl = document.getElementById('entropyMeta');
        const placeholder = 'Fill the fields and hit generate.';
        function refreshMeta() {
            if (!outputEl) return;
            const value = outputEl.textContent || '';
            const hasValue = value && value !== placeholder;
            outputEl.classList.toggle('has-value', !!hasValue);
            if (!hasValue) {
                if (metaEl) metaEl.textContent = 'No output yet.';
                if (entropyEl) entropyEl.textContent = '';
                return;
            }
            const special = document.getElementById('includeSpecial');
            const charset = (special && special.checked) ? 88 : 62;
            const bits = Math.round(value.length * Math.log2(charset));
            if (metaEl) metaEl.textContent = value.length + ' chars · ' + charset + '-symbol set';
            if (entropyEl) entropyEl.textContent = '~' + bits + ' bits entropy';
        }
        if (outputEl && 'MutationObserver' in window) {
            new MutationObserver(refreshMeta).observe(outputEl, { childList: true, characterData: true, subtree: true });
        }
        refreshMeta();
    } catch (enhError) {
        console.error('UI enhancement init failed:', enhError);
    }
}
