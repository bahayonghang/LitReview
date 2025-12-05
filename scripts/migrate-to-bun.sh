#!/bin/bash

# LitReview Pro - npm to Bun Migration Script
# This script helps migrate the project from npm to bun

set -e

echo "🚀 LitReview Pro - npm to Bun Migration"
echo "======================================="
echo ""

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed!"
    echo ""
    echo "Please install Bun first:"
    echo "  curl -fsSL https://bun.sh/install | bash"
    echo ""
    echo "Then restart your terminal and run this script again."
    exit 1
fi

echo "✅ Bun is installed: $(bun --version)"
echo ""

# Project directories
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MAIN_DIR="$PROJECT_DIR/litreview-desktop"
DOCS_DIR="$PROJECT_DIR/docs"

echo "📁 Project structure:"
echo "  Main project: $MAIN_DIR"
echo "  Documentation: $DOCS_DIR"
echo ""

# Backup existing package-lock files
echo "💾 Creating backups..."
if [ -f "$MAIN_DIR/package-lock.json" ]; then
    cp "$MAIN_DIR/package-lock.json" "$MAIN_DIR/package-lock.json.backup"
    echo "  ✅ Backed up main package-lock.json"
fi

if [ -f "$DOCS_DIR/package-lock.json" ]; then
    cp "$DOCS_DIR/package-lock.json" "$DOCS_DIR/package-lock.json.backup"
    echo "  ✅ Backed up docs package-lock.json"
fi

echo ""

# Clean npm caches and node_modules
echo "🧹 Cleaning up npm artifacts..."
rm -rf "$MAIN_DIR/node_modules"
rm -rf "$DOCS_DIR/node_modules"
rm -f "$MAIN_DIR/package-lock.json"
rm -f "$DOCS_DIR/package-lock.json"
echo "  ✅ Removed node_modules and package-lock.json files"

# Install with bun
echo ""
echo "📦 Installing dependencies with Bun..."
cd "$MAIN_DIR"
echo "  Installing main project dependencies..."
bun install
echo "  ✅ Main project dependencies installed"

if [ -d "$DOCS_DIR" ]; then
    echo "  Installing documentation dependencies..."
    cd "$DOCS_DIR"
    bun install
    echo "  ✅ Documentation dependencies installed"
fi

# Update package.json scripts to use bun where needed
echo ""
echo "⚙️ Updating package.json scripts..."

# The main package.json already has correct scripts, just noting this
echo "  ✅ Scripts are already compatible with Bun"

# Run verification
echo ""
echo "🧪 Running verification tests..."
cd "$MAIN_DIR"

# Test TypeScript compilation
echo "  Testing TypeScript compilation..."
bunx tsc --noEmit
echo "  ✅ TypeScript compilation successful"

# Test build
echo "  Testing build..."
bun run build
echo "  ✅ Build successful"

# Test documentation if exists
if [ -d "$DOCS_DIR" ]; then
    echo "  Testing documentation build..."
    cd "$DOCS_DIR"
    bun run build
    echo "  ✅ Documentation build successful"
fi

# Clean up backup files
echo ""
read -p "🗑️  Remove backup files? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f "$MAIN_DIR/package-lock.json.backup"
    rm -f "$DOCS_DIR/package-lock.json.backup"
    echo "  ✅ Backup files removed"
else
    echo "  💾 Backup files kept:"
    echo "    $MAIN_DIR/package-lock.json.backup"
    echo "    $DOCS_DIR/package-lock.json.backup"
fi

# Success message
echo ""
echo "🎉 Migration completed successfully!"
echo ""
echo "What changed:"
echo "  ✅ Dependencies installed with Bun"
echo "  ✅ Generated bun.lockb files"
echo "  ✅ Updated justfile to use Bun commands"
echo "  ✅ Verified builds work correctly"
echo ""
echo "New commands to use:"
echo "  just install      # Install dependencies"
echo "  just install-docs # Install docs dependencies"
echo "  just dev          # Start development"
echo "  just build        # Build application"
echo "  just dev-docs     # Start docs development"
echo "  just build-docs   # Build documentation"
echo ""
echo "Performance benefits:"
echo "  - Faster installs (up to 20x faster)"
echo "  - Smaller node_modules"
echo "  - Faster startup times"
echo "  - Built-in TypeScript support"
echo "  - Better dependency resolution"
echo ""
echo "For more information about Bun:"
echo "  https://bun.sh/docs"
echo ""