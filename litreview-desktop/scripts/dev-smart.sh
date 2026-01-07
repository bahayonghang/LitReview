#!/bin/bash
# 智能开发服务器启动脚本
# 自动检测可用端口并启动 Tauri 开发模式

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
START_PORT=1420

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting LitReview Pro development server...${NC}"
echo ""

# 查找可用端口
AVAILABLE_PORT=$("$SCRIPT_DIR/find-port.sh" $START_PORT)

if [ -z "$AVAILABLE_PORT" ]; then
  echo -e "${RED}❌ Failed to find available port${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Found available port: $AVAILABLE_PORT${NC}"

# 如果端口不是默认的 1420，需要更新 Tauri 配置
if [ "$AVAILABLE_PORT" != "$START_PORT" ]; then
  echo -e "${YELLOW}📝 Port $START_PORT is busy, using $AVAILABLE_PORT instead${NC}"

  # 备份原始配置
  CONFIG_FILE="$PROJECT_DIR/src-tauri/tauri.conf.json"
  BACKUP_FILE="$PROJECT_DIR/src-tauri/tauri.conf.json.backup"

  if [ -f "$CONFIG_FILE" ]; then
    cp "$CONFIG_FILE" "$BACKUP_FILE"

    # 使用 Python 或 sed 更新配置（更可靠的方式）
    if command -v python3 &> /dev/null; then
      python3 - <<EOF
import json

config_path = "$CONFIG_FILE"
with open(config_path, 'r') as f:
    config = json.load(f)

config['build']['devUrl'] = f"http://localhost:{${AVAILABLE_PORT}}"

with open(config_path, 'w') as f:
    json.dump(config, f, indent=2)
EOF
    else
      # 回退到 sed（macOS 兼容）
      # macOS 的 sed -i 需要提供备份参数
      sed -i.bak "s|\"devUrl\": \"http://localhost:1420\"|\"devUrl\": \"http://localhost:${AVAILABLE_PORT}\"|g" "$CONFIG_FILE"
      rm -f "${CONFIG_FILE}.bak"
    fi

    echo -e "${GREEN}✅ Updated Tauri configuration${NC}"
  fi
fi

# 设置 Vite 端口环境变量
export VITE_PORT=$AVAILABLE_PORT

# 清理函数
cleanup() {
  echo ""
  echo -e "${YELLOW}🧹 Cleaning up...${NC}"

  # 恢复原始配置
  if [ -f "$BACKUP_FILE" ]; then
    mv "$BACKUP_FILE" "$CONFIG_FILE"
    echo -e "${GREEN}✅ Restored original Tauri configuration${NC}"
  fi
}

# 设置退出时清理
trap cleanup EXIT INT TERM

# 启动开发服务器
cd "$PROJECT_DIR"
echo -e "${GREEN}🎯 Starting Tauri dev on port $AVAILABLE_PORT...${NC}"
echo ""

bun run tauri dev
