import { useState, useEffect } from 'react'
import { useSorterStore, Category, Config } from '../store/useSorterStore'
// Using inline SVG icons instead of lucide-react to avoid module issues
const XIcon = (): React.JSX.Element => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
)

const PlusIcon = (): React.JSX.Element => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
)

const Trash2Icon = ({ size = 18 }: { size?: number }): React.JSX.Element => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
)

const KeyboardIcon = ({ size = 14 }: { size?: number }): React.JSX.Element => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
    <path d="m6 8h.01"></path>
    <path d="m10 8h.01"></path>
    <path d="m14 8h.01"></path>
    <path d="m18 8h.01"></path>
    <path d="m6 12h.01"></path>
    <path d="m18 12h.01"></path>
    <path d="m6 16h12"></path>
  </svg>
)

const FolderInputIcon = ({ size = 18 }: { size?: number }): React.JSX.Element => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M2 9V5c0-1 1-2 2-2h4.5L12 5h8c1 0 2 1 2 2v4"></path>
    <path d="M2 9v10c0 1 1 2 2 2h16c1 0 2-1 2-2V9"></path>
    <path d="M12 2v6"></path>
    <path d="M9 11l3 3 3-3"></path>
  </svg>
)

const SettingsIcon = ({ size = 20 }: { size?: number }): React.JSX.Element => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
)

const LayoutGridIcon = ({ size = 18 }: { size?: number }): React.JSX.Element => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
)

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

type TabType = 'general' | 'categories'

// 格式化单个按键显示
function formatSingleKey(key: string): string {
  const specialKeys: Record<string, string> = {
    ' ': 'Space',
    Enter: 'Enter',
    Tab: 'Tab',
    Escape: 'Esc',
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    Backspace: 'Backspace',
    Delete: 'Delete',
    ctrl: 'Ctrl',
    meta: '⌘',
    alt: 'Alt',
    shift: 'Shift'
  }
  return specialKeys[key] || specialKeys[key.toLowerCase()] || key.toUpperCase()
}

// 格式化快捷键显示，支持组合键（如 ctrl+z → Ctrl + Z）
function formatShortcut(shortcut: string): string {
  if (!shortcut) return '无'
  // 检查是否为组合键格式（包含 +）
  if (shortcut.includes('+')) {
    const parts = shortcut.split('+')
    return parts.map(formatSingleKey).join(' + ')
  }
  return formatSingleKey(shortcut)
}

// 从键盘事件构建快捷键字符串
function buildShortcutString(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey) parts.push('ctrl')
  if (e.metaKey) parts.push('meta')
  if (e.altKey) parts.push('alt')
  if (e.shiftKey) parts.push('shift')
  parts.push(e.key.toLowerCase())
  return parts.join('+')
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps): React.JSX.Element | null {
  const { config, saveConfig, loadImages } = useSorterStore()

  // 本地暂存状态 - 使用 lazy initial state 来避免在 useEffect 中调用 setState
  const [localConfig, setLocalConfig] = useState<Config>(() => JSON.parse(JSON.stringify(config)))
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [recordingId, setRecordingId] = useState<string | null>(null) // 正在录制哪个分类的ID

  // 当 Modal 重新打开时，重置状态 - 使用 setTimeout 避免在 effect 中直接调用 setState
  useEffect(() => {
    if (isOpen) {
      // 使用 setTimeout 将状态更新推迟到下一个 tick，避免在 effect 中同步调用 setState
      const timer = setTimeout(() => {
        setLocalConfig(JSON.parse(JSON.stringify(config)))
        setActiveTab('general')
        setRecordingId(null)
      }, 0)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isOpen, config])

  // 处理全局快捷键录制
  useEffect(() => {
    if (!recordingId) return

    const handleRecordKey = (e: KeyboardEvent): void => {
      e.preventDefault()
      e.stopPropagation() // 阻止冒泡，防止触发底层的快捷键

      const key = e.key
      // 忽略单纯的修饰键按下
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return

      // 构建快捷键字符串（支持组合键）
      const hasModifier = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey
      const shortcutValue = hasModifier ? buildShortcutString(e) : key

      // 根据录制 ID 更新对应的快捷键
      if (recordingId === '__skip__') {
        setLocalConfig((prev) => ({
          ...prev,
          skipShortcut: shortcutValue
        }))
      } else if (recordingId === '__undo__') {
        setLocalConfig((prev) => ({
          ...prev,
          undoShortcut: shortcutValue
        }))
      } else if (recordingId.startsWith('copy_')) {
        // 更新复制目标快捷键
        setLocalConfig((prev) => ({
          ...prev,
          copyTargets: (prev.copyTargets || []).map((t) =>
            t.id === recordingId ? { ...t, shortcut: shortcutValue } : t
          )
        }))
      } else {
        // 更新对应的分类
        setLocalConfig((prev) => ({
          ...prev,
          categories: prev.categories.map((cat) =>
            cat.id === recordingId ? { ...cat, shortcut: shortcutValue } : cat
          )
        }))
      }

      setRecordingId(null) // 结束录制
    }

    window.addEventListener('keydown', handleRecordKey, { capture: true })
    return () => window.removeEventListener('keydown', handleRecordKey, { capture: true })
  }, [recordingId])

  if (!isOpen) return null

  const handleSave = async (): Promise<void> => {
    await saveConfig(localConfig)
    await loadImages()
    onClose()
  }

  const handleAddCategory = (): void => {
    if (localConfig.categories.length >= 10) return
    const newCategory: Category = {
      id: `cat_${Date.now()}`,
      name: `分类 ${localConfig.categories.length + 1}`,
      path: '../output/new_folder',
      shortcut: ''
    }
    setLocalConfig((prev) => ({ ...prev, categories: [...prev.categories, newCategory] }))
  }

  const updateCategory = (index: number, field: keyof Category, value: string): void => {
    const newCats = [...localConfig.categories]
    newCats[index] = { ...newCats[index], [field]: value }
    setLocalConfig((prev) => ({ ...prev, categories: newCats }))
  }

  const removeCategory = (index: number): void => {
    setLocalConfig((prev) => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }))
  }

  // 复制目标管理
  const handleAddCopyTarget = (): void => {
    const copyTargets = localConfig.copyTargets || []
    if (copyTargets.length >= 5) return
    const newTarget = {
      id: `copy_${Date.now()}`,
      name: `复制${copyTargets.length + 1}`,
      path: `../output/copy/${copyTargets.length + 1}`,
      shortcut: ''
    }
    setLocalConfig((prev) => ({
      ...prev,
      copyTargets: [...(prev.copyTargets || []), newTarget]
    }))
  }

  const updateCopyTarget = (
    index: number,
    field: 'name' | 'path' | 'shortcut',
    value: string
  ): void => {
    const newTargets = [...(localConfig.copyTargets || [])]
    newTargets[index] = { ...newTargets[index], [field]: value }
    setLocalConfig((prev) => ({ ...prev, copyTargets: newTargets }))
  }

  const removeCopyTarget = (index: number): void => {
    setLocalConfig((prev) => ({
      ...prev,
      copyTargets: (prev.copyTargets || []).filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <SettingsIcon size={20} />
            偏好设置
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
            aria-label="关闭设置"
          >
            <XIcon />
          </button>
        </div>

        {/* Body Layout: Sidebar + Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-48 bg-gray-50 border-r border-gray-100 p-4 flex flex-col gap-2">
            <TabButton
              active={activeTab === 'general'}
              onClick={() => setActiveTab('general')}
              icon={<FolderInputIcon size={18} />}
              label="通用设置"
            />
            <TabButton
              active={activeTab === 'categories'}
              onClick={() => setActiveTab('categories')}
              icon={<LayoutGridIcon size={18} />}
              label="分类管理"
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-8">
            {/* Tab: General */}
            {activeTab === 'general' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <Section title="源文件">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    图片源文件夹路径
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={localConfig.sourceDir}
                      onChange={(e) =>
                        setLocalConfig({ ...localConfig, sourceDir: e.target.value })
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-gray-800"
                      placeholder="/path/to/images"
                    />
                    <button
                      onClick={async () => {
                        const path = await window.api.selectFolder()
                        if (path) {
                          setLocalConfig({ ...localConfig, sourceDir: path })
                        }
                      }}
                      className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 text-gray-700 transition-colors flex items-center gap-2"
                    >
                      <FolderInputIcon size={16} />
                      浏览...
                    </button>
                  </div>
                </Section>

                <Section title="快捷键与行为">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        跳过当前图片
                      </label>
                      <button
                        onClick={() => setRecordingId('__skip__')}
                        className={`
                          w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                          ${
                            recordingId === '__skip__'
                              ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        {recordingId === '__skip__' ? (
                          <span>请按键...</span>
                        ) : (
                          <>
                            <KeyboardIcon size={14} />
                            <span>{formatShortcut(localConfig.skipShortcut)}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        撤回操作
                      </label>
                      <button
                        onClick={() => setRecordingId('__undo__')}
                        className={`
                          w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                          ${
                            recordingId === '__undo__'
                              ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }
                        `}
                      >
                        {recordingId === '__undo__' ? (
                          <span>请按键...</span>
                        ) : (
                          <>
                            <KeyboardIcon size={14} />
                            <span>{formatShortcut(localConfig.undoShortcut || 'ctrl+z')}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        文件操作模式
                      </label>
                      <div className="flex bg-gray-100 p-1 rounded-lg">
                        <ModeButton
                          active={!localConfig.copyMode}
                          onClick={() => setLocalConfig({ ...localConfig, copyMode: false })}
                          label="移动"
                        />
                        <ModeButton
                          active={localConfig.copyMode}
                          onClick={() => setLocalConfig({ ...localConfig, copyMode: true })}
                          label="复制"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {localConfig.copyMode
                          ? '原文件保留在源文件夹'
                          : '原文件从源文件夹移除'}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-4">
                    💡 提示：点击按钮后按下键盘即可录制快捷键，支持组合键（如 Ctrl+Z, ⌘+S）
                  </p>
                </Section>

                <Section title="筛选计数器">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        目标值 (0 表示无限制)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={localConfig.counterTarget || 0}
                        onChange={(e) =>
                          setLocalConfig({
                            ...localConfig,
                            counterTarget: Math.max(0, parseInt(e.target.value) || 0)
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        达到目标值后会弹窗提醒，但计数器可以继续增加
                      </p>
                    </div>
                  </div>
                </Section>
              </div>
            )}

            {/* Tab: Categories */}
            {activeTab === 'categories' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    分类配置 ({localConfig.categories.length}/10)
                  </h3>
                  <button
                    onClick={handleAddCategory}
                    disabled={localConfig.categories.length >= 10}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <PlusIcon />
                    <span>新增分类</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {localConfig.categories.map((cat, idx) => (
                    <div
                      key={cat.id}
                      className={`
                        p-4 rounded-xl border transition-all
                        ${recordingId === cat.id ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.01]' : 'border-gray-200 bg-white hover:border-gray-300'}
                      `}
                    >
                      <div className="grid grid-cols-12 gap-4 items-end">
                        {/* 1. Name */}
                        <div className="col-span-3">
                          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                            名称
                          </label>
                          <input
                            type="text"
                            value={cat.name}
                            onChange={(e) => updateCategory(idx, 'name', e.target.value)}
                            className="w-full bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 text-sm text-gray-800"
                            aria-label="分类名称"
                          />
                        </div>

                        {/* 2. Path */}
                        <div className="col-span-5">
                          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                            目标路径
                          </label>
                          <div className="flex">
                          <input
                            type="text"
                            value={cat.path}
                            onChange={(e) => updateCategory(idx, 'path', e.target.value)}
                              className="flex-1 min-w-0 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none py-1 text-sm font-mono text-gray-600"
                            aria-label="分类目标路径"
                          />
                            <button
                              onClick={async () => {
                                const path = await window.api.selectFolder()
                                if (path) {
                                  updateCategory(idx, 'path', path)
                                }
                              }}
                              className="ml-2 px-2 text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors whitespace-nowrap"
                              title="浏览文件夹"
                            >
                              浏览
                            </button>
                          </div>
                        </div>

                        {/* 3. Shortcut */}
                        <div className="col-span-3">
                          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                            快捷键
                          </label>
                          <button
                            onClick={() => setRecordingId(cat.id)}
                            className={`
                              w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all
                              ${
                                recordingId === cat.id
                                  ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                              }
                            `}
                          >
                            {recordingId === cat.id ? (
                              <span>请按键...</span>
                            ) : (
                              <>
                                <KeyboardIcon size={14} />
                                <span>{cat.shortcut ? formatShortcut(cat.shortcut) : '无'}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* 4. Delete */}
                        <div className="col-span-1 flex justify-end pb-1">
                          <button
                            onClick={() => removeCategory(idx)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除分类"
                          >
                            <Trash2Icon size={18} />
                          </button>
                        </div>
                      </div>

                      {/* 视为有效筛选选项 */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={cat.countsAsEffective !== false}
                            onChange={(e) => {
                              const newCats = [...localConfig.categories]
                              newCats[idx] = { ...newCats[idx], countsAsEffective: e.target.checked }
                              setLocalConfig((prev) => ({ ...prev, categories: newCats }))
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">视为有效筛选</span>
                        </label>
                      </div>
                    </div>
                  ))}

                  {localConfig.categories.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
                      暂无分类，点击上方按钮添加
                    </div>
                  )}
                </div>

                {/* 复制目标管理 */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        复制目标 ({(localConfig.copyTargets || []).length}/5)
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        复制操作不会跳到下一张图片，可用于将图片复制到多个文件夹
                      </p>
                    </div>
                    <button
                      onClick={handleAddCopyTarget}
                      disabled={(localConfig.copyTargets || []).length >= 5}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      <PlusIcon />
                      <span>新增</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(localConfig.copyTargets || []).map((target, idx) => (
                      <div
                        key={target.id}
                        className={`
                          p-4 rounded-xl border transition-all
                          ${recordingId === target.id ? 'border-amber-500 bg-amber-50 shadow-md' : 'border-amber-200 bg-amber-50/30 hover:border-amber-300'}
                        `}
                      >
                        <div className="grid grid-cols-12 gap-4 items-end">
                          <div className="col-span-3">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                              名称
                            </label>
                            <input
                              type="text"
                              value={target.name}
                              onChange={(e) => updateCopyTarget(idx, 'name', e.target.value)}
                              className="w-full bg-transparent border-b border-amber-300 focus:border-amber-500 focus:outline-none py-1 text-sm text-gray-800"
                              aria-label="复制目标名称"
                            />
                          </div>

                          <div className="col-span-5">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                              目标路径
                            </label>
                            <div className="flex">
                              <input
                                type="text"
                                value={target.path}
                                onChange={(e) => updateCopyTarget(idx, 'path', e.target.value)}
                                className="flex-1 min-w-0 bg-transparent border-b border-amber-300 focus:border-amber-500 focus:outline-none py-1 text-sm font-mono text-gray-600"
                                aria-label="复制目标路径"
                              />
                              <button
                                onClick={async () => {
                                  const path = await window.api.selectFolder()
                                  if (path) updateCopyTarget(idx, 'path', path)
                                }}
                                className="ml-2 px-2 text-xs text-amber-600 hover:text-amber-700 hover:underline"
                              >
                                浏览
                              </button>
                            </div>
                          </div>

                          <div className="col-span-3">
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                              快捷键
                            </label>
                            <button
                              onClick={() => setRecordingId(target.id)}
                              className={`
                                w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all
                                ${
                                  recordingId === target.id
                                    ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                                    : 'bg-white border-amber-200 text-gray-700 hover:bg-amber-50'
                                }
                              `}
                            >
                              {recordingId === target.id ? (
                                <span>请按键...</span>
                              ) : (
                                <>
                                  <KeyboardIcon size={14} />
                                  <span>{target.shortcut ? formatShortcut(target.shortcut) : '无'}</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="col-span-1 flex justify-end pb-1">
                            <button
                              onClick={() => removeCopyTarget(idx)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="删除"
                            >
                              <Trash2Icon size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(localConfig.copyTargets || []).length === 0 && (
                      <div className="text-center py-8 bg-amber-50/50 rounded-xl border border-dashed border-amber-200 text-gray-500">
                        暂无复制目标，点击上方按钮添加
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors active:transform active:scale-95"
          >
            保存并应用
          </button>
        </div>
      </div>
    </div>
  )
}

// --- 子组件 (为了代码整洁) ---

function TabButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
        ${
          active
            ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
            : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900'
        }
      `}
    >
      {icon}
      {label}
    </button>
  )
}

function Section({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
        {title}
      </h3>
      {children}
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  label
}: {
  active: boolean
  onClick: () => void
  label: string
}): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 py-1.5 text-sm font-medium rounded-md transition-all
        ${active ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
      `}
    >
      {label}
    </button>
  )
}
