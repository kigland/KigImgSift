import { Category, CopyTarget, useSorterStore } from '../store/useSorterStore'
import { cn } from '../lib/utils'

interface BottomBarProps {
  categories: Category[]
  copyTargets: CopyTarget[]
  skipShortcut: string
  onCategoryClick: (categoryId: string) => void
  onCopyClick: (targetPath: string) => void
  onSkipClick: () => void
}

export function BottomBar({
  categories,
  copyTargets,
  skipShortcut,
  onCategoryClick,
  onCopyClick,
  onSkipClick
}: BottomBarProps): React.JSX.Element {
  const { lastAction } = useSorterStore()
  // 获取当前激活的按钮 ID
  const activeId = lastAction?.id || null

  return (
    <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
      <div className="max-w-screen-2xl mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* 左侧：分类区 */}
          <div className="flex-1 w-full">
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              {categories.map((category) => (
                <ActionButton
                  key={category.id}
                  id={category.id}
                  shortcut={category.shortcut}
                  label={category.name}
                  onClick={() => onCategoryClick(category.id)}
                  variant="primary"
                  isActive={activeId === category.id}
                />
              ))}
              {categories.length === 0 && (
                <span className="text-sm text-gray-400 italic">暂无分类</span>
              )}

              {/* 复制目标按钮 */}
              {copyTargets.length > 0 && (
                <>
                  <div className="w-px h-6 bg-gray-200 mx-1" />
                  {copyTargets.map((target) => (
                    <ActionButton
                      key={target.id}
                      id={target.id}
                      shortcut={target.shortcut}
                      label={target.name}
                      onClick={() => onCopyClick(target.path)}
                      variant="copy"
                      isActive={activeId === target.id}
                    />
                  ))}
                </>
              )}
            </div>
          </div>

          {/* 右侧：辅助操作区 */}
          <div className="flex items-center gap-3 shrink-0 border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-4 mt-2 md:mt-0 w-full md:w-auto justify-center md:justify-end">
            <ActionButton
              id="__skip__"
              shortcut={skipShortcut}
              label="跳过"
              onClick={onSkipClick}
              variant="secondary"
              isActive={activeId === '__skip__'}
            />
            <div
              className={cn(
                'flex items-center gap-2 px-3 py-2 select-none rounded-lg transition-all',
                activeId === '__undo__'
                  ? 'bg-purple-100 text-purple-700 scale-95'
                  : 'text-gray-400'
              )}
            >
              <KeyCap label="Ctrl + Z" variant={activeId === '__undo__' ? 'undo' : 'neutral'} />
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
  id: string
  shortcut: string
  label: string
  onClick: () => void
  variant: 'primary' | 'secondary' | 'copy'
  isActive?: boolean
}

function ActionButton({
  shortcut,
  label,
  onClick,
  variant,
  isActive = false
}: ActionButtonProps): React.JSX.Element {
  const displayKey = shortcut === ' ' ? 'Space' : shortcut.toUpperCase()

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-150',
        // 激活状态：缩放 + 高亮
        isActive && 'scale-95 ring-2',
        // 正常状态
        variant === 'primary' && !isActive &&
          'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 shadow-sm active:scale-95',
        variant === 'primary' && isActive &&
          'bg-blue-100 border-blue-400 text-blue-700 ring-blue-300 shadow-md',
        variant === 'secondary' && !isActive &&
          'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600 active:scale-95',
        variant === 'secondary' && isActive &&
          'bg-gray-200 border-gray-400 text-gray-700 ring-gray-300',
        variant === 'copy' && !isActive &&
          'bg-amber-50 border-amber-200 hover:border-amber-300 hover:bg-amber-100 text-amber-700 shadow-sm active:scale-95',
        variant === 'copy' && isActive &&
          'bg-amber-200 border-amber-400 text-amber-800 ring-amber-300 shadow-md'
      )}
      title={variant === 'copy' ? `按 [${displayKey}] 复制（不跳转）` : `按 [${displayKey}] 触发`}
    >
      <KeyCap label={displayKey} variant={variant} isActive={isActive} />
      <span className="font-medium text-sm truncate max-w-[120px]">{label}</span>

      {/* 底部指示条 */}
      {variant === 'primary' && (
        <div
          className={cn(
            'absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-b-lg transition-transform',
            isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
          )}
        />
      )}
      {variant === 'copy' && (
        <div
          className={cn(
            'absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-b-lg transition-transform',
            isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
          )}
        />
      )}
    </button>
  )
}

function KeyCap({
  label,
  variant = 'neutral',
  isActive = false
}: {
  label: string
  variant?: 'primary' | 'secondary' | 'copy' | 'neutral' | 'undo'
  isActive?: boolean
}): React.JSX.Element {
  return (
    <kbd
      className={cn(
        'hidden sm:inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 text-xs font-sans font-bold rounded border-b-2 transition-colors',
        variant === 'primary' && !isActive &&
          'bg-gray-100 border-gray-300 text-gray-600 group-hover:bg-white group-hover:border-blue-200',
        variant === 'primary' && isActive && 'bg-blue-200 border-blue-400 text-blue-700',
        variant === 'secondary' && !isActive && 'bg-white border-gray-300 text-gray-500',
        variant === 'secondary' && isActive && 'bg-gray-300 border-gray-400 text-gray-700',
        variant === 'copy' && !isActive &&
          'bg-amber-100 border-amber-300 text-amber-700 group-hover:bg-white group-hover:border-amber-200',
        variant === 'copy' && isActive && 'bg-amber-300 border-amber-500 text-amber-800',
        variant === 'neutral' && 'bg-gray-100 border-gray-300 text-gray-500',
        variant === 'undo' && 'bg-purple-200 border-purple-400 text-purple-700'
      )}
    >
      {label}
    </kbd>
  )
}
