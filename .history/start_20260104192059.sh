#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$script_dir"

echo "=== KigImgSift MVP 启动脚本 ==="
echo ""

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "[ERROR] Go is not installed. Please install Go first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if pnpm is installed (for frontend)
if ! command -v pnpm &> /dev/null; then
    echo "[WARNING] pnpm not found, trying npm..."
    if ! command -v npm &> /dev/null; then
        echo "[ERROR] Neither pnpm nor npm found. Please install a package manager."
        exit 1
    fi
    PACKAGE_MANAGER="npm"
else
    PACKAGE_MANAGER="pnpm"
fi

echo "[INFO] Starting KigImgSift Backend..."
cd KigImgSift_Backend

# Install Go dependencies
echo "[INFO] Installing Go dependencies..."
go mod tidy

# Start backend in background
echo "[INFO] Starting Go backend server..."
go run main.go &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Go back to root directory
cd "$script_dir"

echo "[INFO] Starting KigImgSift Frontend..."
cd KigImgSift_Frontend

# Install frontend dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing frontend dependencies..."
    $PACKAGE_MANAGER install
fi

# Start frontend in background
echo "[INFO] Starting Electron frontend..."
$PACKAGE_MANAGER run dev &
FRONTEND_PID=$!

echo ""
echo "=== KigImgSift MVP 已启动 ==="
echo "后端运行在: http://localhost:12345"
echo "前端应该会自动打开"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo ""

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "[INFO] 正在停止服务..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "[INFO] 服务已停止"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for processes
wait
