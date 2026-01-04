# KigImgSift MVP - 图片分类工具

这是一个用于高效图片分类的桌面应用程序，类似于PhotoSift。

## 🎯 MVP 功能

- **图片加载**: 自动扫描 `./source_images` 目录中的图片
- **快捷键分类**:
  - `1` 键: 分类为"正脸" (frontal) -> 移动到 `./output/frontal`
  - `2` 键: 分类为"侧脸" (side) -> 移动到 `./output/side`
  - `空格` 键: 跳过当前图片
- **实时状态**: 显示当前文件名和剩余图片数量

## 🏗️ 技术架构

- **前端**: Electron + React + TypeScript
- **后端**: Go + Gin (本地HTTP服务器)
- **通信**: 前端通过HTTP请求调用后端API

## 🚀 快速开始

### 前置要求

- Go 1.21+
- Node.js 16+
- pnpm 或 npm

### 启动应用

1. **克隆或下载项目**

2. **运行启动脚本**:
   ```bash
   ./start.sh
   ```

   或者手动启动：

   ```bash
   # 启动后端 (新终端)
   cd KigImgSift_Backend
   go run main.go

   # 启动前端 (另一个新终端)
   cd KigImgSift_Frontend
   pnpm install  # 首次运行需要
   pnpm run dev
   ```

3. **添加图片**:
   - 将图片文件放入 `source_images/` 目录
   - 支持格式: JPG, PNG, WebP

4. **开始分类**:
   - 前端会自动打开
   - 使用键盘快捷键进行分类

## 📁 目录结构

```
KigImgSift/
├── source_images/          # 源图片目录 (用户放置待分类图片)
├── output/
│   ├── frontal/           # 正脸分类结果
│   └── side/              # 侧脸分类结果
├── KigImgSift_Backend/    # Go后端代码
│   ├── main.go
│   └── go.mod
├── KigImgSift_Frontend/   # Electron前端代码
│   └── src/renderer/src/
│       ├── App.tsx        # 主应用组件
│       └── api/client.ts  # API客户端
└── start.sh               # 一键启动脚本
```

## 🔌 API 接口

- `GET /api/images` - 获取图片列表
- `GET /api/image?path=...` - 获取图片文件
- `POST /api/move` - 移动图片到分类文件夹

## 🎮 使用说明

1. 启动应用后，前端会显示第一张图片
2. 顶部显示当前文件名和剩余数量
3. 使用键盘操作：
   - 按 `1` 将图片分类为正脸
   - 按 `2` 将图片分类为侧脸
   - 按 `空格` 跳过当前图片
4. 图片会自动移动到对应的输出目录

## 🔧 开发说明

### 后端开发
```bash
cd KigImgSift_Backend
go mod tidy
go run main.go
```

### 前端开发
```bash
cd KigImgSift_Frontend
pnpm install
pnpm run dev
```

## 📝 注意事项

- 这是MVP版本，功能简化
- 暂不支持撤回操作
- 确保后端运行在 http://localhost:12345
- 图片文件需要放在项目根目录的 `source_images` 文件夹中

## 🚀 下一步计划

- 添加撤回功能
- 支持更多分类类型
- 添加图片预览缩略图
- 支持批量操作
- 添加设置界面
