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

# Developer Guide for AI Agents

This document provides essential context, commands, and guidelines for AI agents working on the LitReview Pro codebase.

## 1. Project Structure & Tech Stack

- **Root**: Contains project-level config (`justfile`, `AGENTS.md`, `README.md`).
- **litreview-desktop/**: The main desktop application.
  - **Frontend**: React 19, TypeScript, Vite, CSS Modules.
  - **Backend**: Tauri 2.0, Rust (in `src-tauri/`).
  - **Package Manager**: `bun` is preferred (or `npm`).

## 2. Build, Run, and Test Commands

Use `just` as the primary task runner. Run these commands from the project root.

### Development
- **Start All (Recommended)**: `just dev` (Starts Tauri app + Vite dev server with smart port detection)
- **Start Frontend Only**: `just dev-web` (Useful for UI-only tasks)
- **Start with Fixed Port**: `just dev-fixed`

### Build
- **Build App**: `just build` (Production build for Tauri app)
- **Build Frontend**: `just build-web`

### Testing & Quality Checks
- **Run All Checks (CI)**: `just ci` (Runs frontend build, rust format/clippy/test)
- **Rust Tests**: `just rust-check` (Run unit tests, formatting, and clippy)
  - *Single Test*: `cd litreview-desktop/src-tauri && cargo test test_name`
- **Frontend Checks**: `just frontend-check` (Builds frontend, runs lint if configured)
  - *Note*: Currently no unit test framework (Vitest/Jest) is set up for the frontend.

### Installation
- **Install Dependencies**: `just install` (Runs `bun install` in `litreview-desktop`)

## 3. Code Style Guidelines

### General
- **Commits**: Follow Conventional Commits (e.g., `feat: add model`, `fix: resolve crash`).
- **Formatting**:
  - **Rust**: Enforced by `cargo fmt`.
  - **TS/JS**: No strict linter currently enforced, but follow standard Prettier defaults (2 spaces indent, semicolons, single quotes).

### Frontend (React + TypeScript)
- **Components**:
  - Use Functional Components with named exports.
  - PascalCase for component filenames (e.g., `ChatBox.tsx`).
  - Place components in `litreview-desktop/src/components/`.
- **Styling**:
  - Use **CSS Modules** (`.module.css`) for component-scoped styles.
  - Follow the "Glassmorphism" design aesthetic described in `README.md`.
  - Use design tokens from `src/styles/` (if available) for colors/spacing.
- **State Management**:
  - Use React Hooks (`useState`, `useEffect`) and Context API.
  - Avoid Redux unless complex global state is strictly necessary.
- **TypeScript**:
  - Use `interface` for object definitions (Props, State).
  - Avoid `any` types; use proper typing or `unknown` with narrowing.
  - No `paths` alias configured in `tsconfig.json`; use relative imports (e.g., `../../components/Button`).

### Backend (Rust + Tauri)
- **Tauri Commands**:
  - Define commands in `src-tauri/src/lib.rs` or specific modules.
  - Always annotate with `#[tauri::command]`.
  - Use `Result<T, String>` or `Result<T, AppError>` for return types to handle errors gracefully in frontend.
- **Async**: Use `async/await` for I/O bound operations.
- **Error Handling**:
  - Use `thiserror` or `anyhow` for Rust-side error handling if dependencies permit.
  - Propagate errors to the frontend rather than panicking.

## 4. Best Practices for Agents

1. **Check `justfile`**: It is the source of truth for build/run scripts.
2. **Safety First**:
   - Do not modify `bun.lockb` or `Cargo.lock` manually.
   - Run `just check` or `just quick-check` before finishing a task to ensure no regressions.
3. **Frontend Changes**:
   - Since there are no frontend tests, manually verify UI changes if possible, or ensure code compiles with `just build-web`.
4. **Rust Changes**:
   - Always run `cargo check` or `just rust-check` after modifying `.rs` files.
5. **Dependencies**:
   - Use `bun add` or `bun add -d` inside `litreview-desktop/` to add frontend packages.
   - Use `cargo add` inside `litreview-desktop/src-tauri/` to add Rust crates.

## 5. Environment
- **Platform**: Cross-platform (Windows, macOS, Linux).
- **Node**: v18+.
- **Rust**: v1.70+.
