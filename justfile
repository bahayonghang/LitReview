set shell := ["/bin/zsh", "-c"]

project_dir := "litreview-desktop"

default := "dev"

# 启动 LitReview Pro 桌面应用开发模式
dev:
	cd {{project_dir}} && npm run tauri dev

# 构建 LitReview Pro 桌面应用
build:
	cd {{project_dir}} && npm run tauri build

# 仅构建前端（不打包 Tauri）
build-web:
	cd {{project_dir}} && npm run build

# 安装依赖
install:
	cd {{project_dir}} && npm install
