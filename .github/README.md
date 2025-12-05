# GitHub Actions CI/CD Configuration

This directory contains GitHub Actions workflows for LitReview Pro.

## Workflows Overview

### 1. `release.yml` - Release Build Pipeline

**Trigger:** Push of tags starting with `v*` (e.g., `v1.0.0`, `v1.1.0-beta`)

**Jobs:**

1. **quality-check** - Code quality and linting
   - Rust formatting (`cargo fmt`)
   - Rust clippy analysis (`cargo clippy`)
   - TypeScript compilation check

2. **build-windows** - Windows application build
   - Runs on `windows-latest`
   - Creates MSI installer and portable executable
   - Uploads build artifacts

3. **build-macos** - macOS application build
   - Runs on `macos-latest`
   - Creates DMG installer and app bundle
   - Uploads build artifacts

4. **create-release** - GitHub release creation
   - Downloads all build artifacts
   - Creates GitHub release with attached installers
   - Generates release notes automatically

### 2. `ci.yml` - Continuous Integration Pipeline

**Trigger:** Push to main branches and pull requests

**Jobs:**

1. **frontend-checks** - Frontend validation
   - TypeScript compilation
   - ESLint (if configured)

2. **rust-checks** - Backend validation
   - Rust formatting check
   - Clippy analysis
   - Unit tests execution

3. **build-test** - Linux build verification
   - Frontend build
   - Rust compilation test
   - System dependency installation

## Required Secrets

For release builds to work properly, configure these repository secrets:

### Tauri Code Signing (Optional but Recommended)

1. **`TAURI_PRIVATE_KEY`**
   - Your Tauri private key for code signing
   - Generate with: `tauri signer generate -w ~/.tauri/myapp.key`

2. **`TAURI_KEY_PASSWORD`**
   - Password for your Tauri private key

### Setup Instructions

1. **Generate Tauri signing key:**
   ```bash
   npm install -g @tauri-apps/cli
   tauri signer generate -w ~/.tauri/litreview.key
   ```

2. **Add secrets to GitHub repository:**
   - Go to Settings → Secrets and variables → Actions
   - Add the secrets listed above

3. **Update tauri.conf.json** (if using code signing):
   ```json
   {
     "bundle": {
       "windows": {
         "certificateThumbprint": null,
         "digestAlgorithm": "sha256",
         "timestampUrl": ""
       },
       "macOS": {
         "identity": null,
         "providerShortName": null,
         "signingIdentity": null
       }
     }
   }
   ```

## Build Process

### Release Process

1. **Update version numbers:**
   ```bash
   # Update package.json
   cd litreview-desktop && npm version patch|minor|major

   # Or manually update to specific version
   npm version 1.2.3
   ```

2. **Push and create tag:**
   ```bash
   git push origin main
   git tag v1.2.3
   git push origin v1.2.3
   ```

3. **GitHub Actions will:**
   - Run code quality checks
   - Build for Windows and macOS
   - Create GitHub release
   - Attach installers to release

### Artifacts Produced

**Windows:**
- MSI installer (`LitReview Pro_1.2.3_x64_en-US.msi`)
- Portable executable (`LitReview Pro.exe`)

**macOS:**
- DMG installer (`LitReview Pro_1.2.3_x64.dmg`)
- App bundle (`LitReview Pro.app`)

## Local Testing

To test workflows locally:

1. **Install act (GitHub Actions runner):**
   ```bash
   # macOS/Linux
   curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

   # Or with Homebrew
   brew install act
   ```

2. **Run workflow locally:**
   ```bash
   # Run CI workflow
   act -j frontend-checks

   # Run release workflow (requires secrets setup)
   act -j build-windows -s TAURI_PRIVATE_KEY=$TAURI_PRIVATE_KEY
   ```

## Troubleshooting

### Common Issues

1. **Build fails on missing dependencies:**
   - Ensure Node.js 20+ and Rust 1.70+ are installed
   - Run `just install` to install npm dependencies

2. **Tauri build fails:**
   - Check system dependencies for your platform
   - Verify Tauri CLI is installed correctly

3. **Code signing issues:**
   - Ensure private key and password are correctly set as secrets
   - Verify key format matches Tauri expectations

4. **Artifact upload failures:**
   - Check file paths in upload-artifact steps
   - Verify build output directories

### Debugging Failed Builds

1. **View detailed logs:**
   - GitHub Actions → Actions → Select workflow run
   - Click on failed jobs for detailed error logs

2. **Debug locally:**
   - Replicate build commands from failed workflow steps
   - Use the same Node.js and Rust versions as CI

3. **Check dependencies:**
   ```bash
   # Frontend
   cd litreview-desktop
   npm install
   npm run build

   # Backend
   cd src-tauri
   cargo check
   cargo test
   ```

## Optimization

The workflows are optimized for speed:

- **Caching:** Node modules and Rust dependencies are cached
- **Parallel builds:** Windows and macOS build concurrently
- **Early exit:** Quality checks run first to fail fast

## Security Considerations

- All secrets are encrypted and only available to workflows
- Code signing keys are never exposed in logs
- Build artifacts are scanned for vulnerabilities
- Third-party actions are pinned to specific versions