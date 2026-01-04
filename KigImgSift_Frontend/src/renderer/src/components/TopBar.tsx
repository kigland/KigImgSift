import { Settings, FolderOpen } from 'lucide-react'

interface TopBarProps {
  sourceDir: string
  progress: string // 格式 "5 / 2000"
  onSettingsClick: () => void
}

export function TopBar({ sourceDir, progress, onSettingsClick }: TopBarProps): React.JSX.Element {
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

  return (
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
      <div className="flex flex-col items-center justify-center w-64 md:w-96">
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

      {/* 右侧：设置按钮 */}
      <div className="flex-1 flex justify-end min-w-0 ml-4">
        <button
          onClick={onSettingsClick}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Settings size={20} />
          <span className="hidden sm:inline text-sm font-medium">设置</span>
        </button>
      </div>
    </div>
  )
}
