#!/bin/bash
# 智能端口检测脚本
# 从指定起始端口开始查找可用端口

set -e

START_PORT=${1:-1420}
MAX_ATTEMPTS=${2:-10}
CURRENT_PORT=$START_PORT

# 调试信息输出到 stderr
echo "🔍 Checking available port starting from $START_PORT..." >&2

for i in $(seq 1 $MAX_ATTEMPTS); do
  # 检查端口是否被占用（macOS/BSD 兼容）
  if ! lsof -ti:$CURRENT_PORT >/dev/null 2>&1; then
    # 端口可用，只输出端口号到 stdout
    echo "$CURRENT_PORT"
    exit 0
  fi

  # 端口被占用，尝试下一个
  CURRENT_PORT=$((CURRENT_PORT + 1))
done

# 如果所有端口都被占用，输出错误到 stderr
echo "❌ No available port found after $MAX_ATTEMPTS attempts" >&2
exit 1
