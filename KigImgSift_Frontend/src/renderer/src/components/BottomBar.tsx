import { Category } from '../store/useSorterStore'
import { cn } from '../lib/utils'

interface BottomBarProps {
  categories: Category[]
  skipShortcut: string
  onCategoryClick: (categoryId: string) => void
  onSkipClick: () => void
}

export function BottomBar({
  categories,
  skipShortcut,
  onCategoryClick,
  onSkipClick
}: BottomBarProps): React.JSX.Element {
  return (
    <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
      <div className="max-w-screen-2xl mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* 左侧：核心分类区 (支持自动换行以适应10个分类) */}
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              {categories.map((category) => (
                <ActionButton
                  key={category.id}
                  shortcut={category.shortcut}
                  label={category.name}
                  onClick={() => onCategoryClick(category.id)}
                  variant="primary"
                />
              ))}
            </div>
            {categories.length === 0 && (
              <span className="text-sm text-gray-400 italic pl-2">暂无分类，请在设置中添加</span>
            )}
          </div>

          {/* 右侧：辅助操作区 (跳过 & 撤回) */}
          <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-4 mt-2 md:mt-0 w-full md:w-auto justify-center md:justify-end">
            <ActionButton
              shortcut={skipShortcut}
              label="跳过"
              onClick={onSkipClick}
              variant="secondary"
            />

            {/* 这里的 Undo 点击事件如果 App 没传，可以留空或者只作为纯展示 */}
            <div className="flex items-center gap-2 px-3 py-2 text-gray-400 select-none">
              <KeyCap label="Ctrl + Z" />
              <span className="text-sm font-medium">撤回</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- 子组件 ---

interface ActionButtonProps {
  shortcut: string
  label: string
  onClick: () => void
  variant: 'primary' | 'secondary'
}

function ActionButton({ shortcut, label, onClick, variant }: ActionButtonProps): React.JSX.Element {
  const isPrimary = variant === 'primary'
  const displayKey = shortcut === ' ' ? 'Space' : shortcut.toUpperCase()

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-150 active:scale-95',
        isPrimary
          ? 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 shadow-sm'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'
      )}
      title={`按 [${displayKey}] 触发`}
    >
      <KeyCap label={displayKey} variant={variant} />
      <span className="font-medium text-sm truncate max-w-[120px]">{label}</span>

      {/* 底部指示条 (仅 Primary) */}
      {isPrimary && (
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform rounded-b-lg" />
      )}
    </button>
  )
}

function KeyCap({
  label,
  variant = 'neutral'
}: {
  label: string
  variant?: 'primary' | 'secondary' | 'neutral'
}): React.JSX.Element {
  return (
    <kbd
      className={cn(
        'hidden sm:inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-sans font-bold rounded border-b-2 transition-colors',
        variant === 'primary' &&
          'bg-gray-100 border-gray-300 text-gray-600 group-hover:bg-white group-hover:border-blue-200',
        variant === 'secondary' && 'bg-white border-gray-300 text-gray-500',
        variant === 'neutral' && 'bg-gray-100 border-gray-300 text-gray-500'
      )}
    >
      {label}
    </kbd>
  )
}
