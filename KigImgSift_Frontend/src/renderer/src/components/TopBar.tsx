
interface TopBarProps {
  sourceDir: string;
  progress: string;
  onSettingsClick: () => void;
}

export function TopBar({ sourceDir, progress, onSettingsClick }: TopBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-sm text-gray-600">
            来源: <span className="font-medium text-gray-900">{sourceDir}</span>
          </div>
          <div className="text-sm text-gray-600">
            进度: <span className="font-medium text-gray-900">{progress}</span>
          </div>
        </div>
        <button
          onClick={onSettingsClick}
          className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <span className="text-lg">⚙️</span>
          设置
        </button>
      </div>
    </div>
  );
}
