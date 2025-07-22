# QXVault - Quantum-Secure Password Manager

> **Next-generation password management for the quantum computing era**

![QXVault](https://img.shields.io/badge/QXVault-v1.0-00ffff?style=for-the-badge)
![Quantum-Secure](https://img.shields.io/badge/Quantum-Secure-8a2be2?style=for-the-badge)
![Serverless](https://img.shields.io/badge/Serverless-Ready-00ff00?style=for-the-badge)

## 🚀 What is QXVault?

QXVault is a revolutionary password manager that generates your passwords deterministically using post-quantum cryptographic algorithms. Unlike traditional password managers that store encrypted passwords in vulnerable databases, QXVault creates your passwords on-demand using mathematical functions - ensuring they exist only when you need them.

## ✨ Key Features

- **🛡️ Quantum-Resistant**: Uses post-quantum cryptographic principles
- **🔐 Hardware Security**: WebAuthn integration with Touch ID, Face ID, and security keys
- **🌐 Serverless**: No databases, no storage, no single point of failure
- **🔄 Deterministic**: Same inputs always generate the same password
- **📱 Cross-Platform**: Works on any device with a modern browser
- **🎨 Modern UI**: Cyberpunk-inspired design with dark/light themes

## 🎯 Two Security Modes

### 🔒 QX Hardware Pass (Maximum Security)
- **Device-bound passwords** using hardware authentication
- Integrates with Touch ID, Face ID, Windows Hello, or security keys
- Same inputs = same password, but **only on this specific device**
- Unrecoverable if device is lost (by design for maximum security)

### 🔑 QX Normal Pass (Maximum Compatibility)
- **Cross-device compatible** passwords
- Works on any device without hardware requirements
- Same inputs = same password **on all devices**
- Perfect for shared computers or backup access

## 🚀 Quick Start

### Option 1: Use Online (Recommended)
Visit **[qxvault.com](https://qxvault.com)** - works immediately in any modern browser.

### Option 2: Deploy Your Own
1. **Cloudflare Workers** (recommended):
   ```bash
   git clone https://github.com/qxvault/qxvault
   cd qxvault
   wrangler publish
   ```

2. **Static hosting** (Netlify, Vercel, GitHub Pages):
   - Extract HTML from `worker.js`
   - Deploy to your preferred static host

3. **Local testing**:
   ```bash
   node server.js
   # Open http://localhost:8080
   ```

## 💡 How It Works

1. **Enter your master passphrase** (never stored anywhere)
2. **Add the site/service name** (e.g., "gmail.com")
3. **Choose your security level**:
   - Click "**Generate QX Hardware Pass**" for device-bound maximum security
   - Click "**Generate QX Normal Pass**" for cross-device compatibility
4. **Copy your unique password** - it will be the same every time with same inputs

## 🔬 Technology Stack

- **Cryptography**: PBKDF2-SHA512, simulated Kyber KEM, HKDF
- **Authentication**: WebAuthn/FIDO2 for hardware security
- **Platform**: Cloudflare Workers, Progressive Web App
- **UI Framework**: Custom Material 3-inspired components
- **Compatibility**: All modern browsers, mobile-optimized

## 🛡️ Security Model

### Threat Protection
- ✅ **Database breaches**: No passwords stored
- ✅ **Quantum computers**: Post-quantum resistant algorithms
- ✅ **Device theft**: Hardware-bound passwords (QX Hardware mode)
- ✅ **Server compromise**: Completely serverless architecture
- ✅ **Network surveillance**: All processing happens locally

### What We Don't Store
- ❌ Your master passphrase
- ❌ Your generated passwords
- ❌ Your personal information
- ❌ Your website/service names
- ❌ Any cryptographic keys

## 📱 Browser Support

| Platform | Browser | QX Normal Pass | QX Hardware Pass |
|----------|---------|:--------------:|:----------------:|
| **Desktop** | Chrome 67+ | ✅ | ✅ |
| | Firefox 60+ | ✅ | ✅ |
| | Safari 14+ | ✅ | ✅ |
| | Edge 79+ | ✅ | ✅ |
| **Mobile** | iOS Safari 14+ | ✅ | ✅ |
| | Chrome Mobile | ✅ | ✅ |
| | Android Browser | ✅ | ⚠️* |

*\* Hardware authentication availability varies by device*

## ❓ FAQ

**Q: What happens if I forget my master passphrase?**
A: There's no recovery mechanism by design. This ensures maximum security but requires you to remember your passphrase.

**Q: Can I use this offline?**
A: Yes! Once loaded, QXVault works completely offline. All cryptographic operations happen locally.

**Q: How do I change a compromised password?**
A: Add a version number to the site name (e.g., "gmail.com-v2") to generate a completely different password.

**Q: Is this really quantum-secure?**
A: We implement post-quantum cryptographic principles that are designed to resist both classical and quantum attacks. As standards evolve, we'll update our implementation.

## 🛠️ Development

### Local Development

```bash
git clone https://github.com/qxvault/qxvault
cd qxvault
node server.js  # Test server at localhost:8080
```

### Testing

```bash
# Run basic functionality tests
npm test

# Security audit
npm audit

# Performance testing
npm run benchmark
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

- 🐛 **Bug reports**: [GitHub Issues](https://github.com/qxvault/qxvault/issues)
- 💡 **Feature requests**: [GitHub Discussions](https://github.com/qxvault/qxvault/discussions)
- 🔒 **Security issues**: security@qxvault.com

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- **WebAuthn Community** for authentication standards
- **Post-Quantum Cryptography** research community
- **Material Design** for UI inspiration
- **Cloudflare Workers** for edge computing platform

---

**⚠️ Important Security Notice**

QXVault is designed for maximum security through zero-knowledge architecture. This means:
- We cannot recover your passwords if you forget your master passphrase
- Hardware-bound passwords are unrecoverable if you lose your device
- Always maintain backup access methods for critical accounts

**💡 Pro Tip**: Use "QX Hardware Pass" for maximum security on your personal devices, and "QX Normal Pass" for backup access or shared computers.

---

<div align="center">

**[🌐 Try QXVault Now](https://qxvault.com)** | **[📚 Documentation](https://docs.qxvault.com)** | **[💬 Community](https://discord.gg/qxvault)**

*Built with ❤️ for a quantum-secure future*

</div>
