# QXVault

[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](LICENSE)
[![Platform: Cloudflare Workers](https://img.shields.io/badge/platform-Cloudflare%20Workers-orange.svg)](https://workers.cloudflare.com/)
[![Stack: Vanilla JS + WebAssembly](https://img.shields.io/badge/stack-vanilla%20JS%20%2B%20WASM-yellow.svg)](#project-structure)
[![KEM: Kyber-768](https://img.shields.io/badge/KEM-Kyber--768-green.svg)](#derivation-pipeline)

Deterministic, stateless password generation with post-quantum key encapsulation and optional hardware binding.

QXVault derives passwords on demand from your inputs instead of storing them. There is no vault file, no database, and no server-side state. Given the same master passphrase, site name, and settings, it reproduces the same password every time. All cryptographic operations run locally in the browser.

- [Why stateless](#why-stateless)
- [Quickstart](#quickstart)
- [Derivation pipeline](#derivation-pipeline)
- [Security modes](#security-modes)
- [Threat model](#threat-model)
- [Project structure](#project-structure)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Browser support](#browser-support)
- [Verification](#verification)
- [Performance](#performance)
- [Password versions](#password-versions)
- [Limitations](#limitations)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

## Why stateless

Conventional password managers store encrypted vaults. That concentrates risk: breach the vault or its sync infrastructure and every credential falls at once, and most products still wrap keys with classical-only algorithms vulnerable to harvest-now-decrypt-later collection.

QXVault inverts the model. Passwords are pure functions of their inputs — recomputed when needed, kept nowhere. There is no ciphertext to steal, no sync server to compromise, and the derivation path runs through a NIST-selected post-quantum KEM.

## Quickstart

Prerequisites: [Node.js](https://nodejs.org/) and the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`).

```bash
git clone <repository-url>
cd QXVault
wrangler dev          # serves on http://127.0.0.1:8787
```

Open the printed URL, enter a master passphrase and a site name, and generate. WebAuthn features require a secure context; `localhost` and `127.0.0.1` both qualify, so Hardware Pass works in local development.

A VS Code task ("Start QXVault Development Server") is included in `.vscode/tasks.json`.

## Derivation pipeline

Implemented entirely client-side in `public/script.js`. Every stage is deterministic, so no output is ever persisted.

| # | Stage | Construction |
|---|-------|--------------|
| 1 | Combine | `passphrase + normalizedEmail + site + deviceSecret + "QXVault-PQC-v5"`, where the email is trimmed and lowercased |
| 2 | Stretch | PBKDF2-SHA512, per-site salt (`"QXVault-PostQuantum-Salt-v5-" + site`), 100k–200k iterations scaled by hardening level (`75000 + level * 25000`, level 1–5) |
| 3 | Encapsulate | First 64 bytes seed a SHA-512 counter-mode DRBG pool; the pool derandomizes a real Kyber-768 KEM round trip (keypair → encapsulate → decapsulate) executed in WebAssembly. The decapsulated secret is compared against the encapsulated one and the run aborts on mismatch |
| 4 | Expand | HKDF-SHA256 over the shared secret in 64-byte blocks, per-site info with block counter (`"QXVault-Password-v5-" + site + "#" + counter`) |
| 5 | Render | Rejection sampling over the byte stream onto a 62-symbol (`A-Za-z0-9`) or 88-symbol (plus punctuation) set at the requested length (12–64) — no modulo bias |

Device inputs are stable by design: Hardware Pass derives from `SHA-256(credentialId + "qxvault-device-binding-v5")` (credential ID only — no browser metadata, so updates can't invalidate passwords); Normal Pass uses the constant `"qxvault-normal-v5"` (identical on every device).

The Kyber-768 implementation is the [`pqc-kyber`](https://www.npmjs.com/package/pqc-kyber) WASM build (MIT, © Mitchell Berry), vendored under `public/vendor/pqc-kyber/` with an injected deterministic-RNG hook so the KEM stays reproducible. Verified module parameters: 1184-byte public key, 1088-byte ciphertext, 32-byte shared secret.

## Security modes

### Hardware Pass

Binds passwords to a specific device via WebAuthn (Touch ID, Face ID, Windows Hello, or a FIDO2 security key). The device secret is derived from the credential ID, so identical inputs reproduce a given password only on the enrolled device. Enrollment requests a discoverable credential first and automatically retries with relaxed constraints (any attachment, non-discoverable) if the authenticator rejects the first attempt. No RP ID is pinned, so enrollment works unchanged on `localhost`, `127.0.0.1`, LAN addresses, and production domains.

Losing the enrolled device makes its Hardware Pass passwords unrecoverable. This is intentional — keep Normal Pass equivalents as fallback.

### Normal Pass

Uses a portable device identifier, so the same inputs reproduce the same password on any device. No hardware requirements. Suitable for shared machines, travel, and recovery.

## Threat model

Protected against:

- **Vault/database breaches** — there is nothing stored to steal.
- **Server compromise** — the Worker serves static assets only (`src/worker.js`); generation never leaves the browser. Confirm it in the network tab: zero requests during derivation.
- **Harvest-now-decrypt-later** — the KEM stage uses Kyber-768 rather than a classical-only construction.
- **Use of a stolen device without the owner** — Hardware Pass additionally requires a live WebAuthn ceremony on the enrolled authenticator.

Not protected against:

- **A compromised endpoint** — keyloggers, malicious extensions, or devtools at generation time defeat any password tool.
- **A weak master passphrase** — PBKDF2 slows brute force but cannot fix low entropy. Use a long, unique passphrase.
- **Forgotten passphrases** — there is no recovery mechanism. This is a property of the stateless design, not an omission.

Data handling: the passphrase, generated passwords, site names, and key material are never stored or transmitted. The only persisted item is the WebAuthn credential ID in `localStorage`, which is non-secret by WebAuthn design.

## Project structure

```
src/worker.js                  Cloudflare Worker: pure static asset serving
public/index.html              Application shell (6 sections: Generate, About, FAQ,
                               Compare, Trust, Terms)
public/script.js               Derivation pipeline, WebAuthn flows, profiles, UI logic
public/style.css               Neo-brutalist quantum theme (dark + light, responsive,
                               reduced-motion and high-contrast support)
public/sw.js                   Service worker: precache + offline fallback (cache v2+)
public/manifest.json           PWA manifest; icons in public/icons/
public/_headers                Cache policy (immutable vendor bundle) + security headers
public/vendor/pqc-kyber/       Kyber-768 WASM build, JS glue, deterministic-RNG hook,
                               MIT license
public/vendor/eff/             EFF Large Wordlist (7,776 words) as a JS module
public/vendor/qr/              Dependency-free QR encoder (byte mode, V1–V5, EC L/M)
wrangler.toml                  Worker name, compatibility date, assets binding
.vscode/tasks.json             One-command local dev server
```

There is no `package.json` and no build step: what you see is what ships. The WASM module loads lazily and is warmed up during browser idle time so first use pays no compile cost.

## Configuration

All tuning lives in `public/script.js` and `public/index.html`:

- **Hardening level** (slider, 1–5): scales PBKDF2 iterations (100k–200k) and DRBG seed-hardening rounds. Higher is slower and stronger.
- **Password length** (slider, 12–64, default 32) and **character set**: Full (88 symbols), Standard (62, no punctuation), PIN (10 digits, for keypads), or Words (memorable hyphenated EFF-word phrase sized to the length setting).
- **Site profiles**: per-site presets (length, character set, hardening) saved in `localStorage`, auto-applied on site-name match. Preferences only — never secrets.
- **Helpers**: dice button rolls a random six-word master passphrase; V+1 button rotates the site suffix (`site` → `site-v2` → `site-v3`); QR button renders the output as a scannable code for device transfer.
- **Auto-clear**: wipes the passphrase, output, and QR code after the selected delay (1 / 5 / 15 min, default 5) — or immediately when the tab is hidden. A live countdown shows under the output; unchecking the switch disarms a pending wipe.
- **Offline (PWA)**: service worker precaches the shell, WASM, wordlist, and fonts on first visit; subsequent loads work offline. Bump the `CACHE` name in `public/sw.js` with every release that changes precached files.
- **Cache/security headers** (`public/_headers`): vendor bundle cached immutably for a year; app shell revalidated; `nosniff`, `no-referrer`, `DENY` framing, and camera/microphone/geolocation disabled.

## Deployment

Production runs on [Cloudflare Pages](https://pages.cloudflare.com/) at `qxvault.pages.dev`. There is no build step — the deploy directory is uploaded as-is.

### Prerequisites

- [Node.js](https://nodejs.org/) (any active LTS)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/): `npm install -g wrangler`
- A Cloudflare account: `npx wrangler login` (one-time browser OAuth)

### First deploy

```bash
git clone <repository-url>
cd QXVault

# One time: create the Pages project (production branch: main)
npx wrangler pages project create qxvault --production-branch main

# Ship it — every deploy lands on the same project
npx wrangler pages deploy public --project-name qxvault
```

The command uploads `public/` (7 files: HTML, CSS, JS, manifest, service worker, WASM, wordlist, QR encoder, icons) and prints a versioned preview URL like `https://<hash>.qxvault.pages.dev`. Deploying from the production branch promotes the build to `https://qxvault.pages.dev` automatically.

### Repeat deploys and previews

```bash
# Production release (from main)
npx wrangler pages deploy public --project-name qxvault

# Preview from any branch — production stays untouched
npx wrangler pages deploy public --project-name qxvault --branch dev

# Inspect what is live
npx wrangler pages deployment list --project-name qxvault
```

### Continuous deployment (optional)

For push-to-deploy, connect the GitHub repo in the Cloudflare dashboard (Workers & Pages → Create → Pages → Connect to Git) with framework preset `None`, empty build command, output directory `public`, and production branch `main`. CLI deploys keep working against the same project afterwards.

### What the platform provides

- **`public/_headers`** is honored natively by Pages: the Kyber WASM bundle is cached immutably for a year; app shell revalidates; `nosniff`, `no-referrer`, `DENY` framing, and camera/microphone/geolocation lockdowns apply on every response.
- **`.wasm` MIME**: Pages serves `application/wasm` out of the box, so `WebAssembly.instantiateStreaming` takes the fast path. On other static hosts, verify the MIME type — the loader falls back to `ArrayBuffer` instantiation otherwise.
- **HTTPS everywhere**, which also satisfies the secure-context requirement for WebAuthn — Hardware Pass works on the production domain with no extra setup.

### Release discipline

- Bump the `CACHE` name in `public/sw.js` with every release that changes precached files, or clients keep serving the previous bundle from Cache Storage indefinitely.
- Never change derivation parameters without a versioned migration — see [Password versions](#password-versions).

## Browser support

| Capability | Requirement |
|---|---|
| Normal Pass | Web Crypto + WebAssembly (all evergreen browsers) |
| Hardware Pass | WebAuthn, a platform or roaming authenticator, and a secure context (HTTPS, `localhost`, or `127.0.0.1`) |

Hardware authenticator availability varies across Android devices. Unsupported environments get a specific diagnostic message rather than a generic failure, and Normal Pass remains fully usable.

## Verification

Reproducibility check (no test suite ships with the repo; these are manual):

1. Generate twice with identical inputs — outputs are byte-identical.
2. Change one input character — output is unrelated.
3. Open devtools → Network during generation — zero requests.
4. Reload and regenerate — output matches (persistence-free determinism).
5. Vary email case or surrounding whitespace (`User@x.com` vs `user@x.com`) — output matches (normalized at the input boundary).

The UI reports per-output `length · charset size · ~entropy bits` under the generated password, computed as `length × log2(charset)`.

## Performance

- **First paint**: no framework, ~110 KB of app code plus fonts; blocking requests are a single Google Fonts stylesheet and the app CSS/JS.
- **WASM**: 65 KB, fetched once and cached immutably; compile is warmed during idle so first generation typically completes in ~300 ms at the default hardening level.
- **Per-generation cost** is dominated by PBKDF2 (intentional — it's the brute-force brake), followed by microseconds of Kyber math.
- **Idle footprint**: zero timers, zero observers except a single `MutationObserver` on the output field; no background network activity.

## Password versions

Derivation parameters are versioned. **v5** (current) changed every output relative to earlier builds, exactly once and deliberately:

- v1–v4 bound device secrets to browser metadata (user agent, screen size), so browser updates silently changed passwords; v5 derives Hardware secrets from the credential ID alone and Normal secrets from a portable constant.
- v1–v4 crashed on non-Latin1 user agents (`btoa` on raw UA) and encoded the device hash ambiguously (unpadded hex); both fixed in v5.
- v1–v4 mapped charset bytes with modular reduction (slight bias) and treated email case/whitespace as significant; v5 uses rejection sampling and normalizes email.

If you generated passwords with a pre-v5 build, rotate affected accounts (append `-v2` to the site name, or re-register with the fresh output). Parameters are frozen from v5 on — see [Contributing](#contributing).

## Limitations

- **No test suite or CI** currently ships; verification is manual (see above).
- **"Works offline" means after first load** — there is no service worker yet, so the initial fetch still needs connectivity.

## FAQ

**What if I forget my master passphrase?**
Passwords cannot be regenerated without it. There is no recovery path.

**How do I rotate a compromised password?**
Change the site name, e.g. `gmail.com` → `gmail.com-v2`. The output is unrelated; the passphrase stays the same.

**Does it work offline?**
Yes — a service worker precaches the app shell, cryptography, wordlist, and fonts on first visit, so later visits (including fully offline ones) work. Generation itself never needs the network.

**Why run a real KEM if the pipeline is already deterministic?**
The Kyber round trip binds derivation to a lattice-based hard problem instead of hash-only constructions, and the encapsulate/decapsulate equality check acts as an integrity self-test on the WASM module on every run.

**Can I audit the cryptography?**
Yes — `public/script.js` (pipeline), `public/vendor/pqc-kyber/kyber.js` plus `pqc_kyber_bg.js` (module loading and RNG injection). Standard primitives throughout: PBKDF2, SHA-256/512, Kyber-768, HKDF, WebAuthn.

**What data does the app keep about me?**
Only preferences: UI settings, per-site profiles (length/charset/hardening — no secrets), the WebAuthn credential ID (non-secret by design), and the PWA cache. Clear All wipes form state and credentials; profiles can be deleted individually.

## Contributing

Issues and pull requests are welcome. Please:

- Keep the zero-dependency, no-build-step property — the app must remain servable as static files.
- Never change derivation parameters (salts, constants, iteration counts, charset order) without a versioned migration: any change alters every password the app has ever produced.
- Add manual verification notes (per [Verification](#verification)) to any PR touching `script.js` or the vendor bundle.

Report security issues via a private channel to the maintainer rather than a public issue where possible.

## License

GPL-3.0 — see [LICENSE](LICENSE). Bundled third-party code:

- Kyber-768 WASM build, MIT-licensed (© Mitchell Berry); see [`public/vendor/pqc-kyber/LICENSE-MIT`](public/vendor/pqc-kyber/LICENSE-MIT).
- EFF Large Wordlist (`public/vendor/eff/words.js`), via the Electronic Frontier Foundation — see [`public/vendor/eff/ATTRIBUTION.txt`](public/vendor/eff/ATTRIBUTION.txt).
