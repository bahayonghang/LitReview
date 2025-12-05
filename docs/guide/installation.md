# Installation

This guide covers installing LitReview Pro on different platforms and setting up the development environment.

## System Requirements

### Minimum Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **Memory**: 4GB RAM
- **Storage**: 500MB available disk space
- **Network**: Internet connection for AI API access

### Recommended Requirements
- **Operating System**: Windows 11, macOS 12+, or Linux (Ubuntu 22.04+)
- **Memory**: 8GB RAM or more
- **Storage**: 2GB available disk space
- **Network**: Stable broadband connection

## Installation Methods

### Method 1: Download Pre-built Binary (Recommended)

#### Windows
1. Download the latest `.exe` installer from [Releases](https://github.com/your-username/LitReview/releases)
2. Run the installer as administrator
3. Follow the installation wizard
4. Launch from Start Menu or desktop shortcut

#### macOS
1. Download the latest `.dmg` file from [Releases](https://github.com/your-username/LitReview/releases)
2. Open the downloaded file
3. Drag LitReview Pro to Applications folder
4. Right-click and open if you get a security warning
5. Launch from Applications folder

#### Linux
```bash
# Download AppImage
wget https://github.com/your-username/LitReview/releases/latest/download/LitReview.AppImage

# Make executable
chmod +x LitReview.AppImage

# Run
./LitReview.AppImage
```

### Method 2: Package Manager

#### Homebrew (macOS)
```bash
brew install --cask litreview-pro
```

#### Chocolatey (Windows)
```bash
choco install litreview-pro
```

#### Snap (Linux)
```bash
sudo snap install litreview-pro
```

### Method 3: Build from Source

#### Prerequisites
- **Node.js** 18+ and **npm** 7+
- **Rust** 1.70+ and **Cargo**
- **Tauri CLI**

```bash
# Install Node.js (using nvm recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Install Tauri CLI
cargo install tauri-cli
```

#### Build Steps
```bash
# Clone repository
git clone https://github.com/your-username/LitReview.git
cd LitReview

# Install dependencies
just install

# Start development server
just dev

# Build for production
just build
```

## Development Setup

### Prerequisites

For development, you'll need:

1. **Git** for version control
2. **Node.js** 18+ for frontend development
3. **Rust** 1.70+ for backend development
4. **VS Code** (recommended) with extensions:
   - Rust Analyzer
   - TypeScript and JavaScript Language Features
   - Prettier
   - ESLint

### Development Workflow

```bash
# Clone the repository
git clone https://github.com/your-username/LitReview.git
cd LitReview

# Install dependencies
just install

# Start development server with hot reload
just dev

# Run tests
just test

# Build for production
just build

# Create installer
just build-installer
```

### Development Commands

Using `just` (recommended):
```bash
just install     # Install dependencies
just dev         # Start development server
just build       # Build for production
just test        # Run tests
just lint        # Run linting
just format      # Format code
just clean       # Clean build artifacts
```

Using npm directly:
```bash
npm install
npm run tauri dev
npm run tauri build
npm run test
npm run lint
npm run format
npm run clean
```

## Environment Setup

### Environment Variables

Create a `.env` file in the project root:

```bash
# API Keys (recommended for development)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_claude_key_here
GOOGLE_API_KEY=your_gemini_key_here

# Development Server
VITE_DEV_SERVER_HOST=localhost
VITE_DEV_SERVER_PORT=1420

# Logging
RUST_LOG=debug
```

### IDE Configuration

#### VS Code Settings (.vscode/settings.json)
```json
{
  "rust-analyzer.cargo.features": "all",
  "rust-analyzer.checkOnSave.command": "clippy",
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  }
}
```

#### VS Code Extensions
```json
{
  "recommendations": [
    "rust-lang.rust-analyzer",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "tauri-apps.tauri-vscode",
    "ms-vscode.vscode-json"
  ]
}
```

## Troubleshooting

### Common Installation Issues

#### Windows
**"Windows protected your PC"**
- Click "More info" then "Run anyway"
- Or unblock the file in Properties

**Missing Microsoft Visual C++ Redistributable**
- Download from [Microsoft's website](https://docs.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist)
- Install both x64 and x86 versions

#### macOS
**"LitReview Pro can't be opened because Apple cannot check it for malicious software"**
- Right-click the app and select "Open"
- Or go to System Preferences > Security & Privacy and allow it

#### Linux
**"Permission denied"**
```bash
chmod +x LitReview.AppImage
```

**Missing dependencies on Ubuntu/Debian**
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
  build-essential \
  curl \
  wget \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

### Development Issues

**Node.js version not compatible**
```bash
# Use nvm to manage Node.js versions
nvm install 18
nvm use 18
```

**Rust compilation errors**
```bash
# Update Rust toolchain
rustup update
rustup component add rustfmt clippy
```

**Tauri CLI not found**
```bash
# Install Tauri CLI
cargo install tauri-cli

# Or install specific version
cargo install tauri-cli --version "^1.0"
```

## Updating LitReview Pro

### Auto-Update
LitReview Pro includes automatic update functionality. When updates are available:
1. You'll see a notification in the app
2. Click "Update Now" to download and install
3. The app will restart with the new version

### Manual Update
1. Download the latest version from [Releases](https://github.com/your-username/LitReview/releases)
2. Install over the existing version
3. Your settings and data will be preserved

### Development Update
```bash
# Pull latest changes
git pull origin main

# Update dependencies
just install

# Rebuild
just build
```

## Uninstallation

### Windows
1. Go to "Apps & features" in Settings
2. Search for "LitReview Pro"
3. Click "Uninstall"

### macOS
1. Drag the app to Trash
2. Clean up configuration files:
```bash
rm -rf ~/Library/Application\ Support/LitReview
rm -rf ~/.config/LitReview
```

### Linux
```bash
# Remove AppImage
rm LitReview.AppImage

# Clean up configuration files
rm -rf ~/.local/share/LitReview
rm -rf ~/.config/LitReview
```

## Next Steps

After installation:

1. [Configure API Keys](/guide/configuration) - Set up your LLM providers
2. [Choose Templates](/guide/templates) - Select review templates
3. [Generate First Review](/guide/literature-review) - Create your first review
4. [Explore Features](/guide/advanced) - Discover advanced features

---

Need help? Check our [FAQ](/guide/faq) or open an [issue on GitHub](https://github.com/your-username/LitReview/issues).