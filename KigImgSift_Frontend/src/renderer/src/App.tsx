import { useEffect, useState } from 'react'
import { useSorterStore } from './store/useSorterStore'
import { useAppShortcuts } from './hooks/useAppShortcuts' // 引入上面的 Hook
import { TopBar } from './components/TopBar'
import { ImageViewer } from './components/ImageViewer'
import { BottomBar } from './components/BottomBar'
import { SettingsModal } from './components/SettingsModal'

function App(): React.JSX.Element {
  // 1. 状态获取
  const {
    imageList,
    currentIndex,
    loading,
    error,
    config,
    loadImages,
    setCurrentIndex,
    moveImage,
    skipImage,
    loadConfig
  } = useSorterStore()

  // 2. 本地 UI 状态
  const [showSettings, setShowSettings] = useState(false)

  // 3. 初始化与副作用
  useEffect(() => {
    loadConfig()
    loadImages()
  }, [loadConfig, loadImages])

  // 4. 挂载快捷键逻辑 (只需这一行)
  useAppShortcuts()

  // 5. 计算衍生数据
  const currentFilename = imageList[currentIndex] || ''
  const progress = imageList.length > 0 ? `${currentIndex + 1} / ${imageList.length}` : '0 / 0'

  // 6. 渲染内容决定逻辑 (Render Content Strategy)
  const renderContent = (): React.JSX.Element => {
    // 场景 A: 加载中
    if (loading && imageList.length === 0) {
      return (
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-gray-600">正在加载图库资源...</div>
          </div>
        </div>
      )
    }

    // 场景 B: 发生错误
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <div className="text-red-600 font-medium">{error}</div>
          <button
            onClick={loadImages}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            重试连接
          </button>
        </div>
      )
    }

    // 场景 C: 列表为空 (无图片)
    if (imageList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center">
          <div className="text-gray-600">
            <p className="text-lg font-medium mb-2">暂无图片</p>
            <p className="text-sm opacity-75">源路径: {config.sourceDir}</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={loadImages}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow-sm"
            >
              刷新列表
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition shadow-sm"
            >
              修改源路径
            </button>
          </div>
        </div>
      )
    }

    // 场景 D: 正常主界面
    return (
      <>
        <TopBar
          sourceDir={config.sourceDir}
          progress={progress}
          onSettingsClick={() => setShowSettings(true)}
        />
        <ImageViewer
          filename={currentFilename}
          onJumpToIndex={setCurrentIndex}
          totalImages={imageList.length}
        />
        <BottomBar
          categories={config.categories}
          skipShortcut={config.skipShortcut}
          onCategoryClick={moveImage}
          onSkipClick={skipImage}
        />
      </>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* 主要内容区域 */}
      {renderContent()}

      {/* 全局设置弹窗 (只需渲染一次) */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  )
}

export default App
