# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Project Overview

LitReview Pro is a cross-platform desktop application for generating literature reviews using multiple LLM providers. It's built with Tauri 2.0 (Rust backend) + React/TypeScript (frontend).

## Development Commands

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Tauri CLI

### Common Development Tasks

**Development mode:**
```bash
just dev          # Start development server with hot reload
# or
cd litreview-desktop && npm run tauri dev
```

**Build application:**
```bash
just build        # Build for production (creates installer)
# or
cd litreview-desktop && npm run tauri build
```

**Frontend only:**
```bash
just build-web    # Build only the web part
# or
cd litreview-desktop && npm run build
```

**Install dependencies:**
```bash
just install      # Install npm dependencies
# or
cd litreview-desktop && npm install
```

## Architecture Overview

### Frontend (React + TypeScript)
Located in `litreview-desktop/src/`

**Component Structure:**
- `App.tsx` - Main application with tab-based navigation
- `components/` - UI components:
  - `Sidebar.tsx` - Navigation sidebar with tabs
  - `HomePage.tsx` - Landing page with quick actions
  - `ReviewGenerator.tsx` - Literature review generation interface
  - `LanguagePolish.tsx` - Text polishing/rewriting interface
  - `ApiConfigPage.tsx` - LLM provider configuration
  - `GlassSelect.tsx` - Custom glassmorphism select component
  - `SettingsModal.tsx` - Application settings modal

**Custom Hooks:**
- `useConfig.ts` - Manages TOML configuration persistence via Tauri
- `useLlmStream.ts` - Handles streaming LLM responses and WebSocket communication
- `useTheme.ts` - Theme switching functionality

### Backend (Tauri + Rust)
Located in `litreview-desktop/src-tauri/src/`

**Core Structure:**
- `lib.rs` - Main Tauri application with LLM streaming logic
- Supports multiple LLM providers: OpenAI, Claude, Gemini, Ollama, and custom APIs
- Configuration stored in TOML format using `tauri-plugin-store`
- HTTP client built with `reqwest` supporting streaming responses
- WebSocket-based real-time communication with frontend

**Key Features:**
- Provider abstraction supporting different API formats
- Streaming response handling for real-time output
- Connection testing and validation
- Configuration management with provider templates

## Key Design Patterns

### Configuration Management
- Uses TOML files for persistent configuration storage
- Provider-based architecture with template system for new LLM providers
- Frontend `useConfig` hook handles Rust/JS serialization conversion

### Streaming Architecture
- Rust backend handles HTTP streaming from LLM APIs
- Real-time communication to frontend via WebSocket events
- Frontend `useLlmStream` hook manages stream state and UI updates

### Multi-Provider Support
- Abstract provider interface in Rust backend
- Type-safe provider configuration with serde serialization
- Frontend templates for quick provider setup

## Important Notes

- Always test with multiple LLM providers when making changes to streaming logic
- Configuration changes require app restart to take effect
- The app uses `provider_type` vs `type` field naming convention for TOML compatibility
- WebSocket events use UUID for stream identification to handle concurrent requests