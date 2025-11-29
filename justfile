set shell := ["/bin/zsh", "-c"]

project_dir := "litreview-desktop"

default := "dev"

# 启动 LitReview Pro 桌面应用开发模式
dev:
	cd {{project_dir}} && npm run tauri dev
