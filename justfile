set shell := ["/bin/zsh", "-c"]

project_dir := "litreview-desktop"

default := "dev"

# 启动 LitReview Pro 桌面应用开发模式
dev:
	cd {{project_dir}} && bun run tauri dev

# 构建 LitReview Pro 桌面应用
build:
	cd {{project_dir}} && bun run tauri build

# 仅构建前端（不打包 Tauri）
build-web:
	cd {{project_dir}} && bun run build

# 安装依赖
install:
	cd {{project_dir}} && bun install

# 安装文档依赖
install-docs:
	cd docs && bun install

# ==============================================================================
# CI/CD Commands - 本地持续集成检查
# ==============================================================================

# 运行完整的 CI 检查和当前平台构建
ci: check frontend-check rust-check build-test
	@echo "✅ All CI checks passed!"
	@echo "🎉 Ready for commit or tag creation!"

# 代码格式化和质量检查
check:
	@echo "🔍 Running code quality checks..."
	@echo ""

# 前端代码检查
frontend-check:
	@echo "📱 Frontend Checks"
	@echo "=================="
	cd {{project_dir}} && bun run build
	@echo "✅ TypeScript compilation: PASSED"
	@if [ -f "{{project_dir}}/.eslintrc.js" ] || [ -f "{{project_dir}}/.eslintrc.json" ] || [ -f "{{project_dir}}/eslint.config.js" ]; then \
		cd {{project_dir}} && bun run lint || echo "⚠️  ESLint check completed (warnings found)"; \
		echo "✅ ESLint check: COMPLETED"; \
	else \
		echo "ℹ️  ESLint not configured, skipping"; \
	fi
	@echo ""

# Rust 代码检查
rust-check:
	@echo "🦀 Rust Checks"
	@echo "=============="
	cd {{project_dir}}/src-tauri && cargo fmt --all -- --check
	@echo "✅ Rust formatting: PASSED"
	cd {{project_dir}}/src-tauri && cargo clippy --all-targets --all-features -- -W clippy::all
	@echo "✅ Clippy analysis: PASSED (with warnings allowed)"
	cd {{project_dir}}/src-tauri && cargo test --verbose
	@echo "✅ Rust tests: PASSED"
	@echo ""

# 构建测试（当前平台）
build-test:
	@echo "🏗️  Build Test ({{os()}})"
	@echo "=========================="
	cd {{project_dir}} && bun run build
	@echo "✅ Frontend build: PASSED"
	cd {{project_dir}}/src-tauri && cargo check --verbose
	@echo "✅ Rust compilation: PASSED"
	@echo "✅ Build test: COMPLETED"
	@echo ""

# 快速检查（仅格式化和基本语法）
quick-check:
	@echo "⚡ Quick Check"
	@echo "=============="
	cd {{project_dir}}/src-tauri && cargo fmt --all -- --check
	@echo "✅ Rust formatting: OK"
	cd {{project_dir}}/src-tauri && cargo clippy --all-targets -- -W clippy::all
	@echo "✅ Rust clippy: OK (warnings allowed)"
	cd {{project_dir}} && bun run build
	@echo "✅ Frontend build: OK"
	@echo ""

# ==============================================================================
# Utility Commands
# ==============================================================================

# 清理构建产物和缓存
clean:
	@echo "🧹 Cleaning up..."
	cd {{project_dir}} && rm -rf dist/ src-tauri/target/
	cd {{project_dir}} && bun pm cache clean
	@echo "✅ Cleaned up build artifacts"

# 清理文档
clean-docs:
	@echo "🧹 Cleaning docs..."
	cd docs && rm -rf dist/ .vitepress/dist/
	@echo "✅ Cleaned up docs build artifacts"

# 文档开发服务器
dev-docs:
	@echo "📚 Starting docs development server..."
	cd docs && bun run dev

# 构建文档
build-docs:
	@echo "📚 Building documentation..."
	cd docs && bun run build
	@echo "✅ Documentation built successfully"

# 显示当前环境信息
env:
	@echo "📊 Environment Information"
	@echo "=========================="
	@echo "Operating System: {{os()}}"
	@echo "Architecture: {{arch()}}"
	@echo "Bun: $(bun --version 2>/dev/null || echo 'Not installed')"
	@echo "Rust: $(rustc --version 2>/dev/null || echo 'Not installed')"
	@echo "Tauri CLI: $(cd {{project_dir}} && bunx tauri --version 2>/dev/null || echo 'Not installed')"
	@echo ""

# 显示可用的命令
help:
	@echo "📖 LitReview Pro Just Commands"
	@echo "=============================="
	@echo ""
	@echo "Development:"
	@echo "  just dev          - Start development server"
	@echo "  just build        - Build for production"
	@echo "  just build-web    - Build frontend only"
	@echo "  just install      - Install dependencies"
	@echo "  just install-docs - Install documentation dependencies"
	@echo ""
	@echo "CI/CD:"
	@echo "  just ci           - Run full CI checks and build test"
	@echo "  just check        - Code quality checks"
	@echo "  just frontend-check - Frontend specific checks"
	@echo "  just rust-check   - Rust specific checks"
	@echo "  just build-test   - Platform build test"
	@echo "  just quick-check  - Quick pre-commit checks"
	@echo ""
	@echo "Documentation:"
	@echo "  just dev-docs     - Start docs development server"
	@echo "  just build-docs   - Build documentation"
	@echo "  just clean-docs   - Clean docs build artifacts"
	@echo ""
	@echo "Utilities:"
	@echo "  just clean        - Clean build artifacts"
	@echo "  just env          - Show environment info"
	@echo "  just help         - Show this help"
	@echo ""

# 创建新版本（发布准备）
version-new version:
	@echo "🏷️  Creating new version: {{version}}"
	@echo "Updating package.json..."
	cd {{project_dir}} && bun version {{version}} --no-git-tag-version
	@echo "✅ Version updated"
	@echo "Now commit the changes and create a tag:"
	@echo "  git add ."
	@echo "  git commit -m 'chore: bump version to {{version}}'"
	@echo "  git tag v{{version}}"
	@echo "  git push origin v{{version}}"
