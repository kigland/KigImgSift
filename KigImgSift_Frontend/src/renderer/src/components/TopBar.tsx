import { useState, useEffect, useCallback } from 'react'
import { Settings, FolderOpen, RotateCcw, X } from 'lucide-react'
import { useSorterStore } from '../store/useSorterStore'

interface TopBarProps {
  sourceDir: string
  progress: string // 格式 "5 / 2000"
  onSettingsClick: () => void
}

export function TopBar({ sourceDir, progress, onSettingsClick }: TopBarProps): React.JSX.Element {
  const { effectiveCount, config, clearCounter, restoreCounter, targetReachedShown, setTargetReachedShown } = useSorterStore()

  // 清空撤回状态
  const [canUndoClear, setCanUndoClear] = useState(false)
  const [previousCount, setPreviousCount] = useState(0)
  const [undoTimeLeft, setUndoTimeLeft] = useState(0)

  // 目标达成弹窗
  const [showTargetReached, setShowTargetReached] = useState(false)

  // 检查目标是否达成 - 使用 useMemo 派生状态而不是 effect
  const shouldShowTargetReached = (() => {
    const target = config.counterTarget || 0
    return target > 0 && effectiveCount >= target && !targetReachedShown
  })()

  // 当应该显示时，更新弹窗状态
  useEffect(() => {
    if (shouldShowTargetReached) {
      // 使用 requestAnimationFrame 避免同步 setState 警告
      requestAnimationFrame(() => {
        setShowTargetReached(true)
        setTargetReachedShown(true)
      })
    }
  }, [shouldShowTargetReached, setTargetReachedShown])

  // 清空计数器
  const handleClearCounter = useCallback(() => {
    const prev = clearCounter()
    setPreviousCount(prev)
    setCanUndoClear(true)
    setUndoTimeLeft(5)
  }, [clearCounter])

  // 撤回清空
  const handleUndoClear = useCallback(() => {
    restoreCounter(previousCount)
    setCanUndoClear(false)
    setUndoTimeLeft(0)
  }, [restoreCounter, previousCount])

  // 5秒倒计时
  useEffect(() => {
    if (!canUndoClear || undoTimeLeft <= 0) {
      if (canUndoClear && undoTimeLeft <= 0) {
        // 使用 requestAnimationFrame 避免同步 setState 警告
        requestAnimationFrame(() => setCanUndoClear(false))
      }
      return
    }

    const timer = setTimeout(() => {
      setUndoTimeLeft(undoTimeLeft - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [canUndoClear, undoTimeLeft])

  // 解析进度字符串计算百分比 (防崩处理)
  const calculatePercentage = (): number => {
    try {
      const [current, total] = progress.split('/').map((s) => parseInt(s.trim()))
      if (!total || total === 0) return 0
      return Math.min(100, Math.max(0, (current / total) * 100))
    } catch {
      return 0
    }
  }

  const percentage = calculatePercentage()
  const counterTarget = config.counterTarget || 0

  return (
    <>
      <div className="bg-white border-b border-gray-200 h-16 px-4 flex items-center justify-between shadow-sm z-20 relative">
        {/* 左侧：源路径 */}
        <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <FolderOpen size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              源文件夹
            </span>
            <span
              className="text-sm text-gray-900 font-medium truncate w-full cursor-help"
              title={sourceDir}
            >
              {sourceDir || '未选择文件夹'}
            </span>
          </div>
        </div>

        {/* 中间：进度条 */}
        <div className="flex flex-col items-center justify-center w-48 md:w-64">
          <div className="flex justify-between w-full text-xs text-gray-500 mb-1.5 font-medium">
            <span>进度</span>
            <span>{progress}</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* 右侧：计数器 + 设置按钮 */}
        <div className="flex-1 flex items-center justify-end gap-3 min-w-0 ml-4">
          {/* 有效筛选计数器 */}
          <div className="flex items-center gap-2">
            {canUndoClear ? (
              // 撤回状态
              <button
                onClick={handleUndoClear}
                className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
              >
                <RotateCcw size={14} />
                <span className="text-sm font-medium">撤回 ({undoTimeLeft}s)</span>
              </button>
            ) : (
              // 正常显示计数器
              <button
                onClick={onSettingsClick}
                className="flex flex-col items-end px-3 py-1 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                title="点击打开设置"
              >
                <span className="text-[10px] text-gray-400 font-medium">已有效筛选</span>
                <span className="text-sm font-semibold text-gray-800">
                  {effectiveCount}
                  {counterTarget > 0 && (
                    <span className="text-gray-400 font-normal"> / {counterTarget}</span>
                  )}
                </span>
              </button>
            )}

            {/* 清空按钮 */}
            {!canUndoClear && effectiveCount > 0 && (
              <button
                onClick={handleClearCounter}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="清空计数器"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 设置按钮 */}
          <button
            onClick={onSettingsClick}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings size={20} />
            <span className="hidden sm:inline text-sm font-medium">设置</span>
          </button>
        </div>
      </div>

      {/* 目标达成弹窗 */}
      {showTargetReached && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm mx-4 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎉</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">目标达成！</h3>
              <p className="text-gray-600 mb-4">
                你已经完成了 {counterTarget} 张有效筛选！
                <br />
                <span className="text-sm text-gray-400">你可以继续筛选更多图片</span>
              </p>
              <button
                onClick={() => setShowTargetReached(false)}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                继续筛选
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
